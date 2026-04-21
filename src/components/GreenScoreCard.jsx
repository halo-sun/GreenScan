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

/**
 * Animated circular progress ring showing the Green Score.
 *
 * @param {Object} props
 * @param {number} props.score - Green Score 0-100
 * @param {string} props.label - e.g. "Excellent", "Good"
 * @param {Object} [props.metrics] - Breakdown metrics to display in a grid
 */
export default function GreenScoreCard({ score = 0, label = "", metrics }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const { stroke, glow } = scoreToColor(score);
  const offset = CIRCUMFERENCE - (animatedScore / 100) * CIRCUMFERENCE;

  useEffect(() => {
    let frame;
    const duration = 1200;
    const start = performance.now();
    const from = 0;
    const to = score;

    function animate(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(from + (to - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      {/* Ring */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-40 h-40">
          <svg
            className="w-full h-full -rotate-90"
            viewBox="0 0 120 120"
          >
            {/* Background track */}
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="10"
            />
            {/* Animated progress */}
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke={stroke}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              style={{
                transition: "stroke-dashoffset 0.1s linear",
                filter: `drop-shadow(0 0 8px ${glow})`,
              }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-4xl font-extrabold tabular-nums"
              style={{ color: stroke }}
            >
              {animatedScore}
            </span>
            <span className="text-xs text-gray-400 font-medium tracking-wider uppercase mt-1">
              {label}
            </span>
          </div>
        </div>

        {/* Metrics grid */}
        {metrics && (
          <div className="w-full grid grid-cols-2 gap-3 mt-2">
            {Object.entries(metrics).map(([key, value]) => (
              <div
                key={key}
                className="bg-white/5 rounded-xl px-4 py-3 text-center border border-white/5"
              >
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  {key}
                </p>
                <p className="text-sm font-semibold text-gray-200">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
