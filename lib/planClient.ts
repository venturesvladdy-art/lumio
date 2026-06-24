import type { OnboardingAnswers, SkillDef } from "@/lib/types";
import { generatePlan, type PlanResult } from "@/lib/agent";

/**
 * Ask the server to build a learning plan. The route uses the real Claude API
 * when ANTHROPIC_API_KEY is configured, and falls back to the curated bank
 * otherwise. If the route itself is unreachable, we fall back locally so the
 * onboarding flow never dead-ends.
 */
export async function requestPlan({
  skill,
  answers,
  area,
}: {
  skill: SkillDef;
  answers: OnboardingAnswers;
  area?: { id: string; name: string };
}): Promise<PlanResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 75_000);
    const res = await fetch("/api/generate-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        skillId: skill.id,
        skillName: skill.name.en,
        topicsEn: skill.topics.en,
        topicsPl: skill.topics.pl,
        answers,
        areaId: area?.id,
        areaName: area?.name,
      }),
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as Partial<PlanResult>;
    if (!data?.plan) throw new Error("malformed plan response");
    return { plan: data.plan, items: data.items ?? [] };
  } catch {
    const plan = await generatePlan({ skill, answers });
    return { plan, items: [] };
  }
}
