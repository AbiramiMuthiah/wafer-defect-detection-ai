"use client";

export default function WaferHeatmap({ points = [] }: { points: any[] }) {
  const C = 210,
    R = 170;
  const DOT_COLOR: Record<string, string> = {
    Critical: "#ef4444",
    Moderate: "#f97316",
    Low: "#facc15",
  };
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mt-8">
      <h2 className="text-2xl font-bold text-pink-400">
        Wafer Defect Location Map
      </h2>
      <p className="text-gray-400 text-sm mt-1 mb-6">
        This map shows{" "}
        <span className="text-white font-semibold">
          where defects were found
        </span>{" "}
        on the wafer surface. Each dot is a detected defect.{" "}
        <span style={{ color: "#ef4444" }} className="font-semibold">
          Red = serious
        </span>
        ,{" "}
        <span style={{ color: "#f97316" }} className="font-semibold">
          orange = moderate
        </span>
        ,{" "}
        <span style={{ color: "#facc15" }} className="font-semibold">
          yellow = minor
        </span>
        .
      </p>
      <div className="flex flex-col xl:flex-row items-center justify-center gap-12">
        <svg width="420" height="420">
          <defs>
            <radialGradient id="wg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#081226" stopOpacity="1" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="url(#wg)"
            stroke="#475569"
            strokeWidth="3"
          />
          <circle
            cx={C}
            cy={C}
            r="130"
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <circle
            cx={C}
            cy={C}
            r="90"
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <circle
            cx={C}
            cy={C}
            r="50"
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line
            x1={C}
            y1="40"
            x2={C}
            y2="380"
            stroke="#1e293b"
            strokeWidth="1"
          />
          <line
            x1="40"
            y1={C}
            x2="380"
            y2={C}
            stroke="#1e293b"
            strokeWidth="1"
          />
          <circle cx={C} cy={C} r="5" fill="#94a3b8" />
          {points.map((pt: any, i: number) => {
            const mx = C + (pt.x - 0.5) * 2 * R;
            const my = C + (pt.y - 0.5) * 2 * R;
            if (Math.sqrt((mx - C) ** 2 + (my - C) ** 2) > R) return null;
            const dotColor = DOT_COLOR[pt.severity] ?? "#facc15";
            return (
              <g key={`dot-${i}`} filter="url(#glow)">
                <circle cx={mx} cy={my} r="14" fill={dotColor} opacity="0.25" />
                <circle cx={mx} cy={my} r="6" fill={dotColor} opacity="1" />
              </g>
            );
          })}
        </svg>
        <div className="space-y-5 min-w-[230px]">
          <p className="text-gray-300 text-xs font-semibold uppercase tracking-widest">
            Colour Legend
          </p>
          {[
            {
              hex: "#ef4444",
              label: "Critical — Serious damage",
              desc: "Wafer should be rejected. Large or severe defect area.",
            },
            {
              hex: "#f97316",
              label: "Moderate — Needs review",
              desc: "Requires engineer check before continuing production.",
            },
            {
              hex: "#facc15",
              label: "Low — Minor defect",
              desc: "Small isolated defect. Monitor but usually acceptable.",
            },
          ].map(({ hex, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div
                className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 shadow-lg"
                style={{ backgroundColor: hex }}
              />
              <div>
                <p className="text-white font-semibold text-sm">{label}</p>
                <p className="text-gray-400 text-xs leading-5">{desc}</p>
              </div>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-white/10 space-y-1.5">
            <p className="text-gray-400 text-xs">
              Total defects:{" "}
              <span className="text-white font-bold">{points.length}</span>
            </p>
            <p className="text-gray-400 text-xs">
              Critical (red):{" "}
              <span className="font-bold" style={{ color: "#ef4444" }}>
                {points.filter((p: any) => p.severity === "Critical").length}
              </span>
            </p>
            <p className="text-gray-400 text-xs">
              Moderate (orange):{" "}
              <span className="font-bold" style={{ color: "#f97316" }}>
                {points.filter((p: any) => p.severity === "Moderate").length}
              </span>
            </p>
            <p className="text-gray-400 text-xs">
              Low (yellow):{" "}
              <span className="font-bold" style={{ color: "#facc15" }}>
                {points.filter((p: any) => p.severity === "Low").length}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
