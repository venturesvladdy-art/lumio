import { prisma } from "@/lib/db";
import { resolveSkill } from "@/lib/skills";
import { buildPlanForUser } from "@/lib/planGen";
import type { OnboardingAnswers, PlanTier } from "@/lib/types";

/**
 * When a learner upgrades to a paid tier, rebuild their curricula with the
 * Opus-tier model their plan now deserves. Best-effort and bounded: each skill
 * is regenerated from the onboarding answers we stored on its latest
 * curriculum, and a fresh curriculum is written (the immutable design means the
 * newest one wins on the dashboard). Failures are swallowed so an upgrade is
 * never blocked by regeneration.
 */
export async function regenerateCurriculaForUser(
  userId: string,
  tier: PlanTier,
  maxSkills = 8
): Promise<number> {
  if (!prisma || !process.env.ANTHROPIC_API_KEY) return 0;

  // Latest curriculum per skill.
  const curricula = await prisma.curriculum.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { skillId: true, skillName: true, answers: true, model: true },
  });

  const seen = new Set<string>();
  const latest = curricula.filter((c) => {
    if (seen.has(c.skillId)) return false;
    seen.add(c.skillId);
    return true;
  });

  let regenerated = 0;
  for (const c of latest.slice(0, maxSkills)) {
    const answers = (c.answers ?? null) as OnboardingAnswers | null;
    if (!answers) continue; // can't faithfully rebuild without the answers
    try {
      const skill = resolveSkill(c.skillId, c.skillName);
      await buildPlanForUser({ userId, tier, skill, answers });
      regenerated += 1;
    } catch (e) {
      console.error("[regenerate] failed for skill", c.skillId, e);
    }
  }

  if (regenerated > 0) {
    await prisma.auditEvent
      .create({
        data: {
          userId,
          type: "curricula.regenerated",
          data: { tier, count: regenerated },
        },
      })
      .catch(() => {});
  }

  return regenerated;
}
