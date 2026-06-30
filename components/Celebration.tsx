"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * App-wide celebration layer: a confetti burst plus an optional centered card,
 * fired on level-ups, badge unlocks, and claimed quests. Mounted once in
 * Providers; trigger it anywhere via useCelebration().
 */
interface CelebrateOpts {
  title: string;
  subtitle?: string;
  icon?: string;
}

interface CelebrationApi {
  /** Confetti + a centered reveal card. */
  celebrate: (opts: CelebrateOpts) => void;
  /** Confetti only (for smaller wins). */
  burst: () => void;
}

const CelebrationContext = createContext<CelebrationApi | null>(null);

const COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
  "#a855f7",
];

interface Piece {
  id: string;
  left: number;
  delay: number;
  duration: number;
  color: string;
  drift: number;
  size: number;
  rounded: boolean;
}

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [card, setCard] = useState<CelebrateOpts | null>(null);
  const seq = useRef(0);

  const fire = useCallback(() => {
    const batchId = ++seq.current;
    const batch: Piece[] = Array.from({ length: 90 }, (_, i) => ({
      id: `${batchId}:${i}`,
      left: Math.random() * 100,
      delay: Math.random() * 0.25,
      duration: 1.1 + Math.random() * 1.1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      drift: (Math.random() - 0.5) * 260,
      size: 6 + Math.random() * 7,
      rounded: Math.random() > 0.5,
    }));
    setPieces(batch);
    window.setTimeout(() => {
      // Only clear if no newer burst replaced this one.
      setPieces((cur) => (cur[0]?.id.startsWith(`${batchId}:`) ? [] : cur));
    }, 2400);
  }, []);

  const burst = useCallback(() => fire(), [fire]);

  const celebrate = useCallback(
    (opts: CelebrateOpts) => {
      fire();
      setCard(opts);
      window.setTimeout(() => setCard(null), 2600);
    },
    [fire]
  );

  return (
    <CelebrationContext.Provider value={{ celebrate, burst }}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
        {pieces.map((p) => (
          <span
            key={p.id}
            className="absolute top-0 block"
            style={
              {
                left: `${p.left}%`,
                width: p.size,
                height: p.size,
                background: p.color,
                borderRadius: p.rounded ? "9999px" : "2px",
                "--drift": `${p.drift}px`,
                animation: `ss-confetti ${p.duration}s cubic-bezier(0.2,0.6,0.4,1) ${p.delay}s forwards`,
              } as CSSProperties
            }
          />
        ))}

        {card && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="ss-celebrate-pop flex flex-col items-center gap-2 rounded-3xl border border-amber-200 bg-white/95 px-8 py-6 text-center shadow-lift backdrop-blur">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                <Icon name={card.icon ?? "PartyPopper"} className="h-7 w-7" />
              </span>
              <div className="font-display text-xl font-bold text-ink">
                {card.title}
              </div>
              {card.subtitle && (
                <div className="text-sm text-slate-500">{card.subtitle}</div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes ss-confetti {
          0% { transform: translate(0, -10vh) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--drift), 110vh) rotate(720deg); opacity: 0.85; }
        }
        @keyframes ss-celebrate-pop {
          0% { transform: scale(0.7); opacity: 0; }
          45% { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .ss-celebrate-pop { animation: ss-celebrate-pop 0.5s cubic-bezier(0.2,0.8,0.3,1.2) both; }
      `}</style>
    </CelebrationContext.Provider>
  );
}

export function useCelebration(): CelebrationApi {
  const ctx = useContext(CelebrationContext);
  // No-op fallback so components can call it even if the provider is absent.
  return ctx ?? { celebrate: () => {}, burst: () => {} };
}
