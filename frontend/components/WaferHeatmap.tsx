"use client";

const C = 210; // SVG centre
const R = 170; // wafer radius

const DOT_COLOR: Record<string, string> = {
  Critical: "#ef4444",
  Moderate: "#f97316",
  Low: "#facc15",
};

// ── Orthogonal regression for scratch ────────────────────────────────────────
// Standard y-on-x regression fails for near-vertical lines.
// Orthogonal (total least squares) regression handles all orientations correctly.
function fitLine(pts: any[]) {
  const mxs = pts.map((p) => C + (p.x - 0.5) * 2 * R);
  const mys = pts.map((p) => C + (p.y - 0.5) * 2 * R);
  const n = pts.length;
  const cx = mxs.reduce((a, b) => a + b, 0) / n;
  const cy = mys.reduce((a, b) => a + b, 0) / n;

  // Covariance matrix elements
  const sxx = mxs.reduce((s, x) => s + (x - cx) ** 2, 0) / n;
  const syy = mys.reduce((s, y) => s + (y - cy) ** 2, 0) / n;
  const sxy = mxs.reduce((s, x, i) => s + (x - cx) * (mys[i] - cy), 0) / n;

  // Principal direction via eigenvalue of covariance matrix
  const diff = sxx - syy;
  const angle = Math.atan2(2 * sxy, diff) / 2;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  // Project all points onto the principal axis to find extent
  const projections = mxs.map((x, i) => (x - cx) * dx + (mys[i] - cy) * dy);
  const minT = Math.min(...projections);
  const maxT = Math.max(...projections);

  return {
    x1: cx + minT * dx,
    y1: cy + minT * dy,
    x2: cx + maxT * dx,
    y2: cy + maxT * dy,
  };
}

// ── Detect if points are linear (for scratch) ─────────────────────────────────
function isLinear(pts: any[]) {
  if (pts.length < 6) return false;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  return Math.max(spanX, spanY) / (Math.min(spanX, spanY) + 0.001) > 2.5;
}

// ── Clamp SVG coords inside wafer circle ─────────────────────────────────────
function inWafer(mx: number, my: number) {
  return Math.sqrt((mx - C) ** 2 + (my - C) ** 2) <= R;
}

// ── Render helpers per defect type ───────────────────────────────────────────

function renderScratch(pts: any[], color: string) {
  if (pts.length < 2) return null;
  const lc = fitLine(pts);
  return (
    <g key="scratch" clipPath="url(#waferClip)">
      <line
        x1={lc.x1}
        y1={lc.y1}
        x2={lc.x2}
        y2={lc.y2}
        stroke={color}
        strokeWidth="14"
        opacity="0.2"
        strokeLinecap="round"
      />
      <line
        x1={lc.x1}
        y1={lc.y1}
        x2={lc.x2}
        y2={lc.y2}
        stroke={color}
        strokeWidth="3.5"
        opacity="0.95"
        strokeLinecap="round"
        strokeDasharray="10 5"
      />
      <circle cx={lc.x1} cy={lc.y1} r="6" fill={color} opacity="0.9" />
      <circle cx={lc.x2} cy={lc.y2} r="6" fill={color} opacity="0.9" />
    </g>
  );
}

function renderEdgeRing(color: string) {
  return (
    <g key="edge-ring">
      <circle
        cx={C}
        cy={C}
        r={R - 10}
        fill="none"
        stroke={color}
        strokeWidth="18"
        opacity="0.35"
      />
      <circle
        cx={C}
        cy={C}
        r={R - 10}
        fill="none"
        stroke={color}
        strokeWidth="5"
        opacity="0.9"
        strokeDasharray="18 8"
      />
    </g>
  );
}

function renderDonut(color: string) {
  const mid = R * 0.55;
  return (
    <g key="donut">
      <circle
        cx={C}
        cy={C}
        r={mid}
        fill="none"
        stroke={color}
        strokeWidth="22"
        opacity="0.3"
      />
      <circle
        cx={C}
        cy={C}
        r={mid}
        fill="none"
        stroke={color}
        strokeWidth="5"
        opacity="0.85"
        strokeDasharray="16 8"
      />
    </g>
  );
}

function renderCenter(pts: any[], color: string) {
  // Plot actual centre-zone points, fallback to a central cluster
  const centralPts =
    pts.length > 0
      ? pts
      : [
          { x: 0.5, y: 0.5 },
          { x: 0.45, y: 0.48 },
          { x: 0.52, y: 0.53 },
          { x: 0.48, y: 0.44 },
          { x: 0.54, y: 0.47 },
        ];
  return (
    <g key="center">
      <circle cx={C} cy={C} r="55" fill={color} opacity="0.12" />
      <circle
        cx={C}
        cy={C}
        r="55"
        fill="none"
        stroke={color}
        strokeWidth="3"
        opacity="0.5"
        strokeDasharray="8 4"
      />
      {centralPts.slice(0, 20).map((p: any, i: number) => {
        const mx = C + (p.x - 0.5) * 2 * R;
        const my = C + (p.y - 0.5) * 2 * R;
        if (!inWafer(mx, my)) return null;
        return (
          <g key={i}>
            <circle cx={mx} cy={my} r="10" fill={color} opacity="0.2" />
            <circle cx={mx} cy={my} r="5" fill={color} opacity="1" />
          </g>
        );
      })}
    </g>
  );
}

function renderEdgeLoc(pts: any[], color: string) {
  // Plot actual points but also add edge-zone highlight arc
  return (
    <g key="edge-loc">
      {/* Highlight outer zone */}
      <circle
        cx={C}
        cy={C}
        r={R - 15}
        fill="none"
        stroke={color}
        strokeWidth="28"
        opacity="0.12"
      />
      {pts.slice(0, 80).map((p: any, i: number) => {
        const mx = C + (p.x - 0.5) * 2 * R;
        const my = C + (p.y - 0.5) * 2 * R;
        if (!inWafer(mx, my)) return null;
        return (
          <g key={i} filter="url(#glow)">
            <circle cx={mx} cy={my} r="10" fill={color} opacity="0.2" />
            <circle cx={mx} cy={my} r="5" fill={color} opacity="1" />
          </g>
        );
      })}
    </g>
  );
}

function renderNearFull(pts: any[], color: string) {
  return (
    <g key="near-full">
      <circle cx={C} cy={C} r={R - 5} fill={color} opacity="0.15" />
      {pts.slice(0, 60).map((p: any, i: number) => {
        const mx = C + (p.x - 0.5) * 2 * R;
        const my = C + (p.y - 0.5) * 2 * R;
        if (!inWafer(mx, my)) return null;
        return (
          <g key={i}>
            <circle cx={mx} cy={my} r="8" fill={color} opacity="0.3" />
            <circle cx={mx} cy={my} r="4" fill={color} opacity="0.9" />
          </g>
        );
      })}
    </g>
  );
}

function renderLoc(pts: any[], color: string) {
  // Group nearby points into clusters, highlight each cluster zone
  return (
    <g key="loc">
      {pts.slice(0, 60).map((p: any, i: number) => {
        const mx = C + (p.x - 0.5) * 2 * R;
        const my = C + (p.y - 0.5) * 2 * R;
        if (!inWafer(mx, my)) return null;
        return (
          <g key={i} filter="url(#glow)">
            <circle cx={mx} cy={my} r="16" fill={color} opacity="0.15" />
            <circle cx={mx} cy={my} r="6" fill={color} opacity="1" />
          </g>
        );
      })}
    </g>
  );
}

function renderRandom(pts: any[], color: string) {
  return (
    <g key="random">
      {pts.map((p: any, i: number) => {
        const mx = C + (p.x - 0.5) * 2 * R;
        const my = C + (p.y - 0.5) * 2 * R;
        if (!inWafer(mx, my)) return null;
        return (
          <g key={i} filter="url(#glow)">
            <circle cx={mx} cy={my} r="12" fill={color} opacity="0.2" />
            <circle cx={mx} cy={my} r="5" fill={color} opacity="1" />
          </g>
        );
      })}
    </g>
  );
}

// ── Descriptions per defect type ─────────────────────────────────────────────
const DEFECT_DESC: Record<string, string> = {
  scratch:
    "A diagonal/linear scratch line is drawn across the wafer showing the scratch path.",
  "edge-ring":
    "A ring around the outer wafer edge indicates edge-ring contamination.",
  donut: "A mid-radius ring pattern shows donut-shaped coating non-uniformity.",
  center:
    "Defects concentrated near the wafer centre indicate CMP or chuck issues.",
  "edge-loc":
    "Defect dots near the wafer edge indicate localised edge contamination.",
  "near-full":
    "Defects cover most of the wafer surface — severe process failure.",
  random:
    "Randomly distributed dots across the wafer — particle contamination.",
  loc: "Localised defect cluster in a specific wafer zone.",
};

// ── Main component ────────────────────────────────────────────────────────────
export default function WaferHeatmap({
  points = [],
  mainDefect = "",
}: {
  points: any[];
  mainDefect?: string;
}) {
  const defect = mainDefect?.toLowerCase() ?? "";
  const severity = points[0]?.severity ?? "Moderate";
  const color = DOT_COLOR[severity] ?? "#f97316";
  const desc =
    DEFECT_DESC[defect] ?? "Each dot represents a detected defect cluster.";

  // ── Pick renderer based on defect type ──
  let defectViz: React.ReactNode = null;

  if (defect === "scratch" || (defect === "" && isLinear(points))) {
    defectViz = renderScratch(points, "#ef4444");
  } else if (defect === "edge-ring") {
    defectViz = renderEdgeRing(color);
  } else if (defect === "donut") {
    defectViz = renderDonut(color);
  } else if (defect === "center") {
    defectViz = renderCenter(points, color);
  } else if (defect === "edge-loc") {
    defectViz = renderEdgeLoc(points, color);
  } else if (defect === "near-full") {
    defectViz = renderNearFull(points, color);
  } else if (defect === "loc") {
    defectViz = renderLoc(points, color);
  } else {
    // random or unknown
    defectViz = renderRandom(points, color);
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mt-8">
      <h2 className="text-2xl font-bold text-pink-400">
        Wafer Defect Location Map
      </h2>

      {/* Defect type badge */}
      {mainDefect && (
        <div className="inline-flex items-center gap-2 mt-2 mb-3 px-3 py-1 rounded-full bg-white/10 border border-white/20">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-white text-xs font-semibold capitalize">
            {mainDefect} Defect
          </span>
        </div>
      )}

      <p className="text-gray-400 text-sm mt-1 mb-6">
        {desc} For precise locations, refer to the{" "}
        <span className="text-pink-400 font-semibold">Detection image</span>{" "}
        above.{" "}
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
            <clipPath id="waferClip">
              <circle cx={C} cy={C} r={R} />
            </clipPath>
          </defs>

          {/* Wafer body */}
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="url(#wg)"
            stroke="#475569"
            strokeWidth="3"
          />

          {/* Guide rings */}
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

          {/* Crosshairs */}
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

          {/* Defect visualisation */}
          {defectViz}
        </svg>

        {/* ── Legend ── */}
        <div className="space-y-5 min-w-[230px]">
          <p className="text-gray-300 text-xs font-semibold uppercase tracking-widest">
            Colour Legend
          </p>
          {[
            {
              hex: "#ef4444",
              label: "Critical — Serious damage",
              desc: "Wafer should be rejected.",
            },
            {
              hex: "#f97316",
              label: "Moderate — Needs review",
              desc: "Requires engineer check.",
            },
            {
              hex: "#facc15",
              label: "Low — Minor defect",
              desc: "Monitor but usually acceptable.",
            },
          ].map(({ hex, label, desc: ldesc }) => (
            <div key={label} className="flex items-start gap-3">
              <div
                className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 shadow-lg"
                style={{ backgroundColor: hex }}
              />
              <div>
                <p className="text-white font-semibold text-sm">{label}</p>
                <p className="text-gray-400 text-xs leading-5">{ldesc}</p>
              </div>
            </div>
          ))}

          {/* Pattern key */}
          <div className="bg-black/20 rounded-xl p-3 border border-white/10">
            <p className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wide">
              Pattern Key
            </p>
            {[
              { shape: "line", label: "Scratch", hint: "Linear line" },
              { shape: "ring", label: "Edge-Ring", hint: "Outer ring" },
              { shape: "mring", label: "Donut", hint: "Mid ring" },
              { shape: "dot", label: "Others", hint: "Dot cluster" },
            ].map(({ shape, label, hint }) => (
              <div key={label} className="flex items-center gap-2 mb-1.5">
                <svg width="24" height="14">
                  {shape === "line" && (
                    <line
                      x1="2"
                      y1="7"
                      x2="22"
                      y2="7"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeDasharray="5 3"
                    />
                  )}
                  {shape === "ring" && (
                    <circle
                      cx="12"
                      cy="7"
                      r="5"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="2.5"
                    />
                  )}
                  {shape === "mring" && (
                    <circle
                      cx="12"
                      cy="7"
                      r="4"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="2"
                      strokeDasharray="3 2"
                    />
                  )}
                  {shape === "dot" && (
                    <circle cx="12" cy="7" r="4" fill="#facc15" opacity="0.9" />
                  )}
                </svg>
                <span className="text-white text-xs font-semibold w-16">
                  {label}
                </span>
                <span className="text-gray-400 text-xs">{hint}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10 space-y-1.5">
            <p className="text-gray-400 text-xs">
              Total defects:{" "}
              <span className="text-white font-bold">{points.length}</span>
            </p>
            <p className="text-gray-400 text-xs">
              Critical:{" "}
              <span className="font-bold" style={{ color: "#ef4444" }}>
                {points.filter((p: any) => p.severity === "Critical").length}
              </span>
            </p>
            <p className="text-gray-400 text-xs">
              Moderate:{" "}
              <span className="font-bold" style={{ color: "#f97316" }}>
                {points.filter((p: any) => p.severity === "Moderate").length}
              </span>
            </p>
            <p className="text-gray-400 text-xs">
              Low:{" "}
              <span className="font-bold" style={{ color: "#facc15" }}>
                {points.filter((p: any) => p.severity === "Low").length}
              </span>
            </p>
          </div>
          <p className="text-gray-500 text-xs italic">
            ⚠ Positions are approximate. See Detection image for precise
            locations.
          </p>
        </div>
      </div>
    </div>
  );
}
