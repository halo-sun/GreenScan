import { useEffect, useState } from "react";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreToColor(score) {
  if (score >= 80) return { stroke: "#10b981", glow: "rgba(16,185,129,0.3)" };
  if (score >= 60) return { stroke: "#22c55e", glow: "rgba(34,197,94,0.25)" };
  if (score >= 40) return { stroke: "#eab308", glow: "rgba(234,179,8,0.25)" };
  if (score >= 20) return { stroke: "#f97316", glow: "rgba(249,115,22,0.25)" };
  return { stroke: "#ef4444", glow: "rgba(239,68,68,0.25)" };
}

export default function GreenScoreCard({ score = 0, label = "", metrics }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [strokeDashoffset, setStrokeDashoffset] = useState(CIRCUMFERENCE);
  const { stroke, glow } = scoreToColor(score);
  const targetOffset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  useEffect(() => {
    let initialFrame = requestAnimationFrame(() => {
      setStrokeDashoffset(CIRCUMFERENCE);

      initialFrame = requestAnimationFrame(() => {
        setStrokeDashoffset(targetOffset);
      });
    });

    return () => cancelAnimationFrame(initialFrame);
  }, [targetOffset]);

  useEffect(() => {
    const duration = 1500;
    const intervalMs = 30;
    const totalSteps = Math.max(1, Math.floor(duration / intervalMs));
    let currentStep = 0;
    let resetFrame = requestAnimationFrame(() => {
      setAnimatedScore(0);
    });

    const interval = window.setInterval(() => {
      currentStep += 1;
      const progress = Math.min(currentStep / totalSteps, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * eased));

      if (progress >= 1) {
        window.clearInterval(interval);
      }
    }, intervalMs);

    return () => {
      window.clearInterval(interval);
      cancelAnimationFrame(resetFrame);
    };
  }, [score]);

  return (
    <div className="rounded-2xl p-6 backdrop-blur-sm border border-[color:var(--border-soft)] bg-[color:var(--surface-card)]/85">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke={stroke}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: "stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1)",
                filter: `drop-shadow(0 0 8px ${glow})`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold tabular-nums" style={{ color: stroke }}>
              {animatedScore}
            </span>
            <span className="mt-1 text-xs font-medium tracking-wider uppercase text-[color:var(--text-muted)]">
              {label}
            </span>
          </div>
        </div>

        {metrics && (
          <div className="w-full grid grid-cols-2 gap-3 mt-2">
            {Object.entries(metrics).map(([key, value]) => (
              <div
                key={key}
                className="rounded-xl px-4 py-3 text-center border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)]/30"
              >
                <p className="mb-1 text-xs uppercase tracking-wider text-[color:var(--text-muted)]">
                  {key}
                </p>
                <p className="text-sm font-semibold text-[color:var(--text-primary)]">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
