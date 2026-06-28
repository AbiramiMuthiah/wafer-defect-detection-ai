"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Send,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";
import WaferHeatmap from "@/components/WaferHeatmap";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import CountUp from "react-countup";
import toast, { Toaster } from "react-hot-toast";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ReferenceLine,
} from "recharts";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const ITEMS_PER = 5;
const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#10b981",
  "#facc15",
  "#f97316",
  "#06b6d4",
  "#ec4899",
];

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/10 rounded-xl ${className}`} />
  );
}

// ─── IMAGE COMPARISON PANEL ───────────────────────────────────────────────────
// FIX: "GradCAM" renamed to "AI Attention Heatmap"
// FIX: heatmap explanation box added when in heatmap mode
// FIX: opacity slider added for heatmap mode
function ImageComparisonPanel({
  result,
  viewMode,
  setViewMode,
}: {
  result: any;
  viewMode: string;
  setViewMode: (m: any) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [sideBySide, setSideBySide] = useState(false);
  const [opacity, setOpacity] = useState(0.85);

  const modes = [
    "Original",
    "Image of Detection",
    "AI Attention Heatmap",
  ] as const;
  const modeColors: Record<string, string> = {
    Original: "bg-blue-500",
    "Image of Detection": "bg-pink-500",
    "AI Attention Heatmap": "bg-green-500",
  };
  const getUrl = (mode: string) =>
    !result
      ? ""
      : mode === "Image of Detection"
        ? result.annotated_image_url
        : mode === "AI Attention Heatmap"
          ? result.gradcam_url
          : result.image_url;

  return (
    <div className="bg-black/30 border border-white/10 rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-blue-400 font-bold">AI Inspection Visualization</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSideBySide((s) => !s)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${sideBySide ? "bg-purple-500" : "bg-white/10 hover:bg-white/20"}`}
          >
            Side-by-Side
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-3 flex-wrap">
        {modes.map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode as any)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === mode ? modeColors[mode] : "bg-white/10 hover:bg-white/20"}`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Plain-English heatmap explanation */}
      {viewMode === "AI Attention Heatmap" && (
        <div className="mb-3 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
          <p className="text-green-400 font-semibold text-xs mb-1">
            🔍 What is the AI Attention Heatmap?
          </p>
          <p className="text-gray-300 text-xs leading-5">
            Shows{" "}
            <strong className="text-white">where the AI was looking</strong>{" "}
            when it detected defects.{" "}
            <span style={{ color: "#ef4444" }}>Red/hot areas</span> = regions
            the AI focused on most (likely defective).{" "}
            <span className="text-blue-300">Blue/cool areas</span> = regions the
            AI largely ignored. Helps engineers verify AI decisions.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-gray-400 text-xs whitespace-nowrap">
              Heatmap Intensity
            </span>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="flex-1 h-1.5 accent-green-400"
            />
            <span className="text-green-400 text-xs w-8 text-right">
              {Math.round(opacity * 100)}%
            </span>
          </div>
        </div>
      )}

      {sideBySide ? (
        <div className="grid grid-cols-3 gap-3">
          {modes.map((mode) => (
            <div
              key={mode}
              className={`rounded-xl overflow-hidden border-2 transition-all ${viewMode === mode ? "border-purple-500" : "border-white/10"}`}
            >
              <div
                className={`text-center text-xs font-bold py-1.5 ${modeColors[mode]}`}
              >
                {mode}
              </div>
              <div className="overflow-auto max-h-56 bg-black flex items-center justify-center">
                <img
                  src={getUrl(mode)}
                  alt={mode}
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "center",
                    transition: "transform 0.2s",
                    opacity: mode === "AI Attention Heatmap" ? opacity : 1,
                  }}
                  className="w-full object-contain"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="relative overflow-hidden rounded-xl bg-black"
          style={{ maxHeight: "320px" }}
        >
          <div
            className="overflow-auto flex items-center justify-center"
            style={{ minHeight: "220px" }}
          >
            <img
              src={getUrl(viewMode)}
              alt={viewMode}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center",
                transition: "transform 0.2s",
                opacity: viewMode === "AI Attention Heatmap" ? opacity : 1,
              }}
              className="max-w-full max-h-72 object-contain"
              onError={(e) => {
                e.currentTarget.alt = "Image unavailable";
              }}
            />
          </div>
          <div
            className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${modeColors[viewMode]}`}
          >
            {viewMode}
          </div>
        </div>
      )}

      {viewMode === "Detection" && result?.boxes?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {[...new Set(result.boxes.map((b: any) => b.label))].map(
            (lbl: any) => (
              <span
                key={String(lbl)}
                className="px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs"
              >
                {lbl}: {result.boxes.filter((b: any) => b.label === lbl).length}
                x
              </span>
            ),
          )}
        </div>
      )}
    </div>
  );
}

// ─── PDF REPORT ────────────────────────────────────────────────────────────────
// FIX: Page 2 heading changed to "AI ATTENTION HEATMAP" with plain-English description
async function generateProfessionalPDF(res: any, inspectorId: string) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210,
    H = 297,
    margin = 18;
  const navy = [10, 25, 60] as [number, number, number];
  const purple = [100, 60, 180] as [number, number, number];
  const green = [16, 185, 129] as [number, number, number];
  const red = [239, 68, 68] as [number, number, number];
  const orange = [249, 115, 22] as [number, number, number];
  const white = [255, 255, 255] as [number, number, number];
  const lightGray = [240, 240, 248] as [number, number, number];
  const darkGray = [100, 100, 120] as [number, number, number];
  const textDark = [20, 20, 40] as [number, number, number];
  const riskScore = res.risk_score ?? Math.min(res.total_defects * 5, 100);
  const sevColor =
    res.severity === "Critical"
      ? red
      : res.severity === "Moderate"
        ? orange
        : green;
  const decColor =
    res.decision === "Reject"
      ? red
      : res.decision === "Review"
        ? orange
        : green;

  pdf.setFillColor(...navy);
  pdf.rect(0, 0, W, 48, "F");
  pdf.setFillColor(...purple);
  pdf.rect(0, 48, W, 3, "F");
  pdf.setTextColor(...white);
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.text("WAFER AI", margin, 22);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(180, 180, 220);
  pdf.text("AI-Powered Semiconductor Inspection Platform", margin, 30);
  pdf.text(
    "YOLOv8 Deep Learning  •  AI Attention Heatmap  •  Active Learning",
    margin,
    37,
  );
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...white);
  pdf.text("INSPECTION REPORT", W - margin, 22, { align: "right" });
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(180, 180, 220);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, W - margin, 30, {
    align: "right",
  });
  pdf.text(`Inspector: ${inspectorId || "N/A"}`, W - margin, 37, {
    align: "right",
  });

  let y = 58;
  pdf.setFillColor(...lightGray);
  pdf.roundedRect(margin, y, W - 2 * margin, 26, 3, 3, "F");
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...textDark);
  pdf.text("FILE INFORMATION", margin + 4, y + 7);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...darkGray);
  pdf.text(
    `Filename: ${res.original_filename || res.filename || "N/A"}`,
    margin + 4,
    y + 14,
  );
  pdf.text(`Inspection ID: ${res.filename || "N/A"}`, margin + 4, y + 21);
  pdf.text(`Timestamp: ${new Date().toLocaleString()}`, W / 2, y + 14);
  pdf.text(
    `Total Defects: ${res.total_defects}  |  Anomaly Score: ${res.anomaly_score ?? 0}`,
    W / 2,
    y + 21,
  );
  y += 33;

  pdf.setFillColor(...decColor);
  pdf.roundedRect(margin, y, W - 2 * margin, 18, 3, 3, "F");
  pdf.setTextColor(...white);
  pdf.setFontSize(13);
  pdf.setFont("helvetica", "bold");
  pdf.text(`DECISION: ${res.decision?.toUpperCase()}`, W / 2, y + 12, {
    align: "center",
  });
  y += 25;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...textDark);
  pdf.text("KEY METRICS", margin, y);
  y += 6;
  const metrics = [
    {
      label: "Main Defect Type",
      value: res.main_defect || "N/A",
      color: purple,
    },
    { label: "Severity Level", value: res.severity, color: sevColor },
    {
      label: "Risk Score",
      value: `${riskScore}%`,
      color: riskScore > 70 ? red : riskScore > 40 ? orange : green,
    },
    {
      label: "Avg. Confidence",
      value: `${((res.avg_confidence || 0) * 100).toFixed(1)}%`,
      color: green,
    },
    {
      label: "Anomaly Score",
      value: `${((res.anomaly_score || 0) * 100).toFixed(1)}%`,
      color: res.is_anomaly ? red : green,
    },
    { label: "System Decision", value: res.decision, color: decColor },
  ];
  const cW = (W - 2 * margin - 8) / 3,
    cH = 22;
  metrics.forEach((m, i) => {
    const col = i % 3,
      row = Math.floor(i / 3);
    const cx = margin + col * (cW + 4),
      cy = y + row * (cH + 4);
    pdf.setFillColor(...lightGray);
    pdf.roundedRect(cx, cy, cW, cH, 2, 2, "F");
    pdf.setDrawColor(...(m.color as [number, number, number]));
    pdf.setLineWidth(0.8);
    pdf.roundedRect(cx, cy, cW, cH, 2, 2, "S");
    pdf.setLineWidth(0.2);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...darkGray);
    pdf.text(m.label, cx + 4, cy + 7);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...(m.color as [number, number, number]));
    pdf.text(m.value, cx + 4, cy + 17);
  });
  y += 2 * cH + 12;

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...textDark);
  pdf.text("RISK LEVEL INDICATOR", margin, y);
  y += 5;
  pdf.setFillColor(220, 220, 230);
  pdf.roundedRect(margin, y, W - 2 * margin, 6, 3, 3, "F");
  const bc = riskScore > 70 ? red : riskScore > 40 ? orange : green;
  pdf.setFillColor(...bc);
  pdf.roundedRect(
    margin,
    y,
    (W - 2 * margin) * (riskScore / 100),
    6,
    3,
    3,
    "F",
  );
  pdf.setFontSize(8);
  pdf.setTextColor(...darkGray);
  pdf.text(`${riskScore}%`, W - margin + 2, y + 5);
  y += 14;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...textDark);
  pdf.text("AI ANALYSIS & EXPLANATION", margin, y);
  y += 5;
  pdf.setFillColor(245, 243, 255);
  pdf.roundedRect(margin, y, W - 2 * margin, 26, 3, 3, "F");
  pdf.setDrawColor(...purple);
  pdf.setLineWidth(0.5);
  pdf.line(margin + 1, y, margin + 1, y + 26);
  pdf.setLineWidth(0.2);
  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...textDark);
  const lines = pdf.splitTextToSize(
    res.explanation || "No explanation.",
    W - 2 * margin - 10,
  );
  pdf.text(lines.slice(0, 4), margin + 6, y + 8);
  y += 34;

  if (res.defect_summary && Object.keys(res.defect_summary).length > 0) {
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...textDark);
    pdf.text("DEFECT BREAKDOWN", margin, y);
    y += 5;
    pdf.setFillColor(...navy);
    pdf.rect(margin, y, W - 2 * margin, 8, "F");
    pdf.setTextColor(...white);
    pdf.setFontSize(8);
    pdf.text("Defect Type", margin + 4, y + 5.5);
    pdf.text("Count", margin + 80, y + 5.5);
    pdf.text("% of Total", margin + 110, y + 5.5);
    pdf.text("Risk Level", margin + 145, y + 5.5);
    y += 8;
    const total = Object.values(res.defect_summary).reduce(
      (a: any, b: any) => a + b,
      0,
    ) as number;
    Object.entries(res.defect_summary).forEach(([dtype, count]: any, idx) => {
      pdf.setFillColor(...(idx % 2 === 0 ? lightGray : white));
      pdf.rect(margin, y, W - 2 * margin, 7, "F");
      pdf.setTextColor(...textDark);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(dtype, margin + 4, y + 5);
      pdf.text(String(count), margin + 80, y + 5);
      pdf.text(`${((count / total) * 100).toFixed(1)}%`, margin + 110, y + 5);
      const rl = count > 50 ? "High" : count > 20 ? "Medium" : "Low";
      const rc = rl === "High" ? red : rl === "Medium" ? orange : green;
      pdf.setTextColor(...rc);
      pdf.setFont("helvetica", "bold");
      pdf.text(rl, margin + 145, y + 5);
      y += 7;
    });
    y += 8;
  }

  if (y < H - 80) {
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...textDark);
    pdf.text("ANNOTATED INSPECTION IMAGE", margin, y);
    y += 4;
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = res.annotated_image_url;
      await new Promise((r) => {
        img.onload = r;
        img.onerror = r;
        setTimeout(r, 3000);
      });
      if (img.complete && img.naturalWidth > 0) {
        const mh = Math.min(60, H - y - 40);
        pdf.addImage(img, "JPEG", margin, y, W - 2 * margin, mh);
        y += mh + 5;
      }
    } catch {}
  }

  // PAGE 2 — FIX: heading renamed to AI Attention Heatmap with plain-English description
  pdf.addPage();
  pdf.setFillColor(...navy);
  pdf.rect(0, 0, W, 20, "F");
  pdf.setFillColor(...purple);
  pdf.rect(0, 20, W, 2, "F");
  pdf.setTextColor(...white);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("WAFER AI — INSPECTION REPORT (Continued)", margin, 14);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(180, 180, 220);
  pdf.text(`File: ${res.original_filename || res.filename}`, W - margin, 14, {
    align: "right",
  });
  y = 30;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...textDark);
  pdf.text("AI ATTENTION HEATMAP", margin, y);
  y += 4;
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...darkGray);
  pdf.text(
    "Shows WHERE the AI was looking when it detected defects.",
    margin,
    y,
  );
  y += 5;
  pdf.text(
    "Red/hot areas = high AI focus (likely defective). Blue/cool areas = AI largely ignored.",
    margin,
    y,
  );
  y += 7;
  try {
    const gi = new Image();
    gi.crossOrigin = "anonymous";
    gi.src = res.gradcam_url;
    await new Promise((r) => {
      gi.onload = r;
      gi.onerror = r;
      setTimeout(r, 3000);
    });
    if (gi.complete && gi.naturalWidth > 0) {
      pdf.addImage(gi, "JPEG", margin, y, W - 2 * margin, 65);
      y += 70;
    }
  } catch {}

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...textDark);
  pdf.text("RECOMMENDATIONS", margin, y);
  y += 5;
  const recs =
    res.decision === "Reject"
      ? [
          "Immediately quarantine this wafer batch.",
          "Conduct full root cause analysis.",
          `Critical ${res.main_defect} defect requires process review.`,
          "Notify quality control team.",
          "Document in quality management system.",
        ]
      : res.decision === "Review"
        ? [
            `${res.main_defect} requires manual review.`,
            "Cross-reference recent process parameter changes.",
            "Consider re-inspection after equipment calibration.",
            "Monitor subsequent wafers.",
          ]
        : [
            "Wafer cleared for continued processing.",
            "Maintain standard monitoring protocols.",
            "Log result in production tracking system.",
            "Periodic re-inspection recommended.",
          ];
  recs.forEach((rec, i) => {
    pdf.setFillColor(...(i % 2 === 0 ? lightGray : white));
    pdf.roundedRect(margin, y, W - 2 * margin, 10, 2, 2, "F");
    pdf.setTextColor(...decColor);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text(
      res.decision === "Reject" ? "⚠" : res.decision === "Review" ? "→" : "✓",
      margin + 3,
      y + 7,
    );
    pdf.setTextColor(...textDark);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.text(rec, margin + 10, y + 7);
    y += 12;
  });
  y += 6;

  if (res.inspector_label) {
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...textDark);
    pdf.text("INSPECTOR VALIDATION", margin, y);
    y += 5;
    pdf.setFillColor(...lightGray);
    pdf.roundedRect(margin, y, W - 2 * margin, 14, 3, 3, "F");
    pdf.setFontSize(8.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...darkGray);
    pdf.text(`Feedback: ${res.inspector_label}`, margin + 4, y + 6);
    pdf.text(
      `Validated by: ${res.labeled_by || "Unknown"}`,
      margin + 4,
      y + 12,
    );
    y += 20;
  }

  y = Math.max(y, H - 65);
  pdf.setDrawColor(200, 200, 220);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, W - margin, y);
  y += 8;
  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...darkGray);
  pdf.text("Inspector Signature:", margin, y);
  pdf.line(margin + 40, y, margin + 130, y + 0.3);
  pdf.text("Date:", margin + 140, y);
  pdf.line(margin + 155, y, W - margin, y + 0.3);
  y += 12;
  pdf.text("Inspector ID:", margin, y);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...textDark);
  pdf.text(inspectorId || "______________________", margin + 30, y);

  [1, 2].forEach((pg) => {
    pdf.setPage(pg);
    pdf.setFillColor(...navy);
    pdf.rect(0, H - 16, W, 16, "F");
    pdf.setTextColor(150, 150, 200);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      "Wafer AI — AI-Powered Semiconductor Inspection  •  Confidential  •  For Internal Use Only",
      W / 2,
      H - 9,
      { align: "center" },
    );
    pdf.text(
      `Page ${pg} of 2  •  Generated ${new Date().toISOString()}`,
      W / 2,
      H - 4,
      { align: "center" },
    );
  });

  const safe = (res.original_filename || "wafer").replace(
    /[^a-zA-Z0-9._-]/g,
    "_",
  );
  pdf.save(`WaferAI_Report_${safe}_${Date.now()}.pdf`);
  toast.success("Professional PDF report downloaded!");
}

export default function Home() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [systemAccess, setSystemAccess] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [inspectorId, setInspectorId] = useState("");
  const [department, setDepartment] = useState("Production");
  const [shift, setShift] = useState("Morning Shift");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  // FIX: viewMode type updated to include "AI Attention Heatmap"
  const [viewMode, setViewMode] = useState<
    "Original" | "Detection" | "AI Attention Heatmap"
  >("Original");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historySearch, setHistorySearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [decisionFilter, setDecisionFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsTimeFilter, setAnalyticsTimeFilter] = useState("all");
  const [evalMetrics, setEvalMetrics] = useState<any>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [chat, setChat] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStats();
    fetchHistory();
    fetchAnalytics();
  }, []);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);
  useEffect(() => {
    fetchHistory();
  }, [page, severityFilter, decisionFilter, historySearch]);
  useEffect(() => {
    fetchAnalytics();
  }, [analyticsTimeFilter]);
  useEffect(() => {
    if (activeSection === "evaluation") fetchEvalMetrics();
  }, [activeSection]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const r = await fetch(`${BASE_URL}/dashboard-stats`);
      setStats(await r.json());
    } catch {
      toast.error("Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  };
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ITEMS_PER),
        ...(severityFilter !== "All" && { severity: severityFilter }),
        ...(decisionFilter !== "All" && { decision: decisionFilter }),
        ...(historySearch && { search: historySearch }),
      });
      const r = await fetch(`${BASE_URL}/history?${params}`);
      const data = await r.json();
      setHistory(data.data || []);
      setTotalPages(data.pages || 1);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  };
  const fetchAnalytics = async () => {
    try {
      const r = await fetch(
        `${BASE_URL}/analytics?time_filter=${analyticsTimeFilter}`,
      );
      setAnalyticsData(await r.json());
    } catch {
      console.error("Analytics fetch failed");
    }
  };
  const fetchEvalMetrics = async () => {
    setEvalLoading(true);
    try {
      const r = await fetch(`${BASE_URL}/evaluation-metrics`);
      setEvalMetrics(await r.json());
    } catch {
      toast.error("Failed to load evaluation metrics");
    } finally {
      setEvalLoading(false);
    }
  };
  const handleFiles = (sel: FileList) => {
    setFiles(Array.from(sel));
    setResult(null);
  };
  const handleUpload = async () => {
    if (!files.length) {
      toast.error("Please select an image first.");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", files[0]);
      const r = await fetch(`${BASE_URL}/inspect`, {
        method: "POST",
        body: form,
      });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setViewMode("Original");
      toast.success("Inspection complete!");
      if (data.severity === "Critical")
        toast(`⚠ Critical defect: ${data.main_defect}`, {
          icon: "🚨",
          duration: 5000,
        });
      if (data.is_anomaly)
        toast(
          `🔍 Anomaly detected: ${((data.anomaly_score || 0) * 100).toFixed(0)}%`,
          { icon: "⚠️", duration: 5000 },
        );
      fetchStats();
      fetchHistory();
      fetchAnalytics();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };
  const handleFeedback = async (label: string) => {
    if (!result) return;
    try {
      const r = await fetch(`${BASE_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: result.filename,
          inspector_label: label,
          labeled_by: inspectorId || "anonymous",
        }),
      });
      const d = await r.json();
      if (d.retrain_ready)
        toast.success("🎉 20 labels reached — model retraining triggered!");
      else
        toast.success(
          `Feedback "${label}" submitted! (${d.labeled_count} total)`,
        );
      fetchEvalMetrics();
    } catch {
      toast.error("Feedback failed");
    }
  };
  const handleCSVExport = async () => {
    try {
      const r = await fetch(`${BASE_URL}/export-history`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "inspection-history.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported!");
    } catch {
      toast.error("CSV export failed");
    }
  };
  const getRiskScore = (res: any) => {
    if (!res) return 0;
    if (res.risk_score !== undefined) return res.risk_score;
    let s = res.total_defects * 5;
    if (res.severity === "Critical") s += 40;
    else if (res.severity === "Moderate") s += 20;
    return Math.min(s, 100);
  };
  const handleDownloadPDF = async (res: any) => {
    setPdfLoading(true);
    try {
      const { generateProfessionalPDF } = await import("@/lib/generatePDF");
      await generateProfessionalPDF(res, inspectorId);
    } catch (e) {
      toast.error("PDF generation failed");
      console.error(e);
    } finally {
      setPdfLoading(false);
    }
  };
  const handleChat = async () => {
    if (!input.trim()) return;
    const cur = input;
    setChat((p) => [...p, { role: "user", text: cur }]);
    setInput("");
    setChatLoading(true);
    const context = result
      ? `Current inspection — Main defect: ${result.main_defect}, Severity: ${result.severity}, Decision: ${result.decision}, Total defects: ${result.total_defects}, Risk score: ${getRiskScore(result)}%, Anomaly score: ${result.anomaly_score}. Explanation: ${result.explanation}`
      : "No inspection has been run yet.";
    const messages = [
      ...chat.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: cur },
    ];
    try {
      const r = await fetch(`${BASE_URL}/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: `You are an expert AI assistant for semiconductor wafer defect inspection. Help engineers understand YOLOv8 detection results, AI attention heatmaps, anomaly scores, defect types (Scratch, Edge-Loc, Edge-Ring, Donut, Center, Near-full, Random, Loc), severity levels, and quality decisions. Be concise and professional. Inspector: ${inspectorId || "unknown"}. ${context}`,
          messages,
        }),
      });
      const data = await r.json();
      setChat((p) => [
        ...p,
        { role: "assistant", text: data.text || "Sorry, I could not respond." },
      ]);
    } catch {
      setChat((p) => [
        ...p,
        {
          role: "assistant",
          text: "AI service unavailable. Make sure the backend is running and GEMINI_API_KEY is set.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };
  const handleRegister = async () => {
    if (!inspectorId.trim()) {
      toast.error("Enter Inspector ID");
      return;
    }
    try {
      await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspectorId, department, shift }),
      });
      toast.success("User registered!");
    } catch {
      toast.error("Registration failed");
    }
  };
  const handleAccessSystem = () => {
    if (!inspectorId.trim()) {
      toast.error("Please enter Inspector ID");
      return;
    }
    setSystemAccess(true);
    toast.success(`Welcome, Inspector ${inspectorId}!`);
  };

  const defectData = analyticsData?.defect_distribution || [];
  const severityData = analyticsData?.severity_distribution || [];
  const trendData = (analyticsData?.trend || []).map((r: any, i: number) => ({
    day: `#${i + 1}`,
    defects: r.total_defects,
    risk: r.risk_score || 0,
  }));
  const anomalyTrend = (analyticsData?.anomaly_trend || []).map(
    (r: any, i: number) => ({
      day: `#${i + 1}`,
      anomaly: Math.round((r.anomaly_score || 0) * 100),
    }),
  );
  const radarData = evalMetrics
    ? [
        {
          metric: "Precision",
          value: Math.round((evalMetrics.precision || 0) * 100),
        },
        {
          metric: "Recall",
          value: Math.round((evalMetrics.recall || 0) * 100),
        },
        {
          metric: "F1-Score",
          value: Math.round((evalMetrics.f1_score || 0) * 100),
        },
        { metric: "Accuracy", value: Math.round(evalMetrics.accuracy || 0) },
      ]
    : [];

  // FIX: "About Model" renamed to "How It Works" in sidebar
  const navItems = [
    ["dashboard", "Dashboard"],
    ["upload", "Upload Inspection"],
    ["assistant", "AI Assistant"],
    ["analytics", "Analytics"],
    ["evaluation", "Model Evaluation"],
    ["guide", "Defect Guide"],
    ["model", "How It Works"],
    ["history", "Inspection History"],
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-white flex">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#111",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />

      {/* SIDEBAR */}
      <aside className="w-56 bg-[#050505] border-r border-white/10 p-5 hidden md:flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        <h2 className="text-3xl font-black mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Wafer AI
        </h2>
        <nav className="flex flex-col gap-1.5">
          {navItems.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${activeSection === key ? "bg-gradient-to-r from-blue-600 to-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.3)] text-white" : "bg-white/[0.03] hover:bg-white/10 text-gray-400 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-4">
          {inspectorId && (
            <div className="mb-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <p className="text-blue-400 text-xs font-bold">Inspector</p>
              <p className="text-white text-sm font-semibold truncate">
                {inspectorId}
              </p>
              <p className="text-gray-500 text-xs">{department}</p>
            </div>
          )}
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <div>
                <p className="text-green-400 font-bold text-sm">
                  System Online
                </p>
                <p className="text-gray-500 text-xs">YOLOv8 active</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6 overflow-y-auto min-w-0">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-3xl xl:text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-8"
        >
          AI Wafer Defect Detection
        </motion.h1>

        {/* ══ DASHBOARD ══ */}
        {activeSection === "dashboard" && (
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="relative overflow-hidden bg-[#070707] border border-white/10 rounded-[28px] p-6 shadow-2xl">
              <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
                  <div>
                    <h1 className="text-3xl font-black text-white">
                      Inspection Access Portal
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                      Secure semiconductor wafer inspection environment
                    </p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
                      <div>
                        <p className="text-green-400 text-xs font-bold">
                          System Online
                        </p>
                        <p className="text-gray-500 text-xs">
                          AI modules operational
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mb-6">
                  {["Existing User", "New User"].map((label, i) => (
                    <button
                      key={label}
                      onClick={() => setShowRegister(i === 1)}
                      className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all ${showRegister === (i === 1) ? "bg-gradient-to-r from-blue-600 to-purple-600" : "bg-white/10 text-gray-400"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {!showRegister && !systemAccess && (
                  <div className="grid xl:grid-cols-4 gap-3">
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                      <p className="text-gray-400 text-xs mb-2">Inspector ID</p>
                      <input
                        type="text"
                        value={inspectorId}
                        onChange={(e) => setInspectorId(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAccessSystem()
                        }
                        placeholder="Enter Inspector ID"
                        className="w-full bg-transparent text-white font-semibold outline-none placeholder:text-gray-600 text-sm"
                      />
                    </div>
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                      <p className="text-gray-400 text-xs mb-2">Department</p>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full bg-[#101010] border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white outline-none"
                      >
                        {[
                          "Quality Control",
                          "Production",
                          "AI Research",
                          "Engineering",
                        ].map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                      <p className="text-gray-400 text-xs mb-2">Shift</p>
                      <select
                        value={shift}
                        onChange={(e) => setShift(e.target.value)}
                        className="w-full bg-[#101010] border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white outline-none"
                      >
                        {["Morning Shift", "Evening Shift", "Night Shift"].map(
                          (s) => (
                            <option key={s}>{s}</option>
                          ),
                        )}
                      </select>
                    </div>
                    <button
                      onClick={handleAccessSystem}
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-bold hover:scale-[1.02] transition-all shadow-lg"
                    >
                      Access System
                    </button>
                  </div>
                )}
                {showRegister && (
                  <div className="grid xl:grid-cols-4 gap-3">
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                      <p className="text-gray-400 text-xs mb-2">
                        New Inspector ID
                      </p>
                      <input
                        type="text"
                        value={inspectorId}
                        onChange={(e) => setInspectorId(e.target.value)}
                        placeholder="Enter ID"
                        className="w-full bg-transparent text-white font-semibold outline-none placeholder:text-gray-600 text-sm"
                      />
                    </div>
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                      <p className="text-gray-400 text-xs mb-2">Department</p>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full bg-[#101010] border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white outline-none"
                      >
                        {[
                          "Quality Control",
                          "Production",
                          "AI Research",
                          "Engineering",
                        ].map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                      <p className="text-gray-400 text-xs mb-2">Shift</p>
                      <select
                        value={shift}
                        onChange={(e) => setShift(e.target.value)}
                        className="w-full bg-[#101010] border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white outline-none"
                      >
                        {["Morning Shift", "Evening Shift", "Night Shift"].map(
                          (s) => (
                            <option key={s}>{s}</option>
                          ),
                        )}
                      </select>
                    </div>
                    <button
                      onClick={handleRegister}
                      className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-sm font-bold hover:scale-[1.02] transition-all shadow-lg"
                    >
                      Register User
                    </button>
                  </div>
                )}
                {systemAccess && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <p className="text-green-400 font-semibold">
                      ✓ Access granted — Inspector {inspectorId} ({department},{" "}
                      {shift})
                    </p>
                  </div>
                )}
              </div>
              <div className="grid md:grid-cols-4 gap-3 mt-6">
                {statsLoading
                  ? Array(4)
                      .fill(0)
                      .map((_, i) => <Skeleton key={i} className="h-24" />)
                  : [
                      {
                        label: "Total Inspections",
                        val: stats?.total || 0,
                        color: "text-blue-400",
                      },
                      {
                        label: "Detection Accuracy",
                        val: stats?.accuracy || 0,
                        color: "text-green-400",
                        decimals: 1,
                        suffix: "%",
                      },
                      {
                        label: "Critical Defects",
                        val: stats?.critical || 0,
                        color: "text-red-400",
                      },
                      {
                        label: "Anomalies Found",
                        val: stats?.anomaly_count || 0,
                        color: "text-orange-400",
                      },
                    ].map(({ label, val, color, decimals, suffix }) => (
                      <div
                        key={label}
                        className="bg-white/[0.03] border border-white/10 rounded-xl p-4"
                      >
                        <p className="text-gray-400 text-xs">{label}</p>
                        <h2 className={`text-4xl font-bold ${color} mt-1`}>
                          <CountUp
                            end={val}
                            duration={2}
                            decimals={decimals || 0}
                            suffix={suffix || ""}
                          />
                        </h2>
                      </div>
                    ))}
              </div>
              <div className="grid xl:grid-cols-2 gap-3 mt-4">
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                  <h2 className="text-lg font-bold text-white mb-3">
                    AI Inspection Overview
                  </h2>
                  <p className="text-gray-400 leading-7 text-sm">
                    This AI-powered platform uses YOLOv8 deep learning with AI
                    attention heatmaps and active learning to detect wafer
                    defects in real-time, improving semiconductor manufacturing
                    quality assurance.
                  </p>
                  <div className="grid grid-cols-3 gap-3 mt-5">
                    {[
                      ["YOLOv8", "AI Engine", "text-blue-400"],
                      ["98.2%", "Accuracy", "text-green-400"],
                      ["<1s", "Detection", "text-purple-400"],
                    ].map(([v, l, c]) => (
                      <div
                        key={l}
                        className="bg-black/30 rounded-xl p-3 text-center"
                      >
                        <h2 className={`${c} text-lg font-bold`}>{v}</h2>
                        <p className="text-gray-500 text-xs mt-1">{l}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                  <h2 className="text-lg font-bold text-white mb-4">
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        s: "upload",
                        l: "Start Inspection",
                        d: "Upload wafer image",
                        g: true,
                      },
                      {
                        s: "analytics",
                        l: "View Analytics",
                        d: "Monitor metrics",
                        g: false,
                      },
                      {
                        s: "evaluation",
                        l: "Model Evaluation",
                        d: "Metrics & performance",
                        g: false,
                      },
                      {
                        s: "history",
                        l: "History",
                        d: "Previous inspections",
                        g: false,
                      },
                    ].map(({ s, l, d, g }) => (
                      <button
                        key={s}
                        onClick={() => setActiveSection(s)}
                        className={`rounded-xl p-4 text-left hover:scale-[1.02] transition-all ${g ? "bg-gradient-to-r from-blue-600 to-purple-600" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}
                      >
                        <p className="font-bold text-sm">{l}</p>
                        <p
                          className={`text-xs mt-1 ${g ? "text-white/70" : "text-gray-400"}`}
                        >
                          {d}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ UPLOAD ══ */}
        {activeSection === "upload" && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div
              className={`border-2 border-dashed transition-all duration-300 rounded-3xl p-6 text-center ${dragging ? "border-purple-400 bg-purple-500/10 scale-[1.01]" : "border-purple-500/30 hover:border-purple-500 bg-white/5"}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
              }}
            >
              {result && (
                <ImageComparisonPanel
                  result={result}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                />
              )}
              <input
                id="fileUpload"
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                className="hidden"
              />
              <label
                htmlFor="fileUpload"
                className="cursor-pointer flex flex-col items-center justify-center py-8"
              >
                <UploadCloud className="w-12 h-12 text-purple-400 mb-3" />
                <p className="text-base font-bold text-white">
                  Choose Wafer Images for Wafer Inspection
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Drag & drop or click to upload
                </p>
              </label>
              {files.length > 0 && (
                <div className="mt-2 text-center">
                  <p className="text-green-400 text-sm font-semibold">
                    ✓ {files[0].name}
                  </p>
                </div>
              )}
              <div className="flex justify-center mt-5">
                <button
                  onClick={handleUpload}
                  disabled={!files.length || loading}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${!files.length ? "bg-gray-700 cursor-not-allowed opacity-50" : loading ? "bg-gray-600 cursor-wait" : "bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105"}`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      Analyzing...
                    </span>
                  ) : (
                    "Run Inspection"
                  )}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 p-6 rounded-3xl border border-white/10"
                >
                  {result.is_anomaly && (
                    <div className="mb-4 bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-orange-400 font-bold text-sm">
                          Unknown Anomaly Detected
                        </p>
                        <p className="text-gray-400 text-xs">
                          Anomaly score:{" "}
                          {((result.anomaly_score || 0) * 100).toFixed(1)}% —
                          This wafer shows unusual patterns the AI has not seen
                          before.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveSection("guide")}
                        className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-semibold hover:bg-orange-500/30 transition-all whitespace-nowrap"
                      >
                        What is this? →
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                      {
                        label: "Main Defect",
                        value: result.main_defect,
                        color: "text-blue-400",
                        border: "border-blue-500/30",
                      },
                      {
                        label: "Filename",
                        value:
                          (result.original_filename || result.filename)?.slice(
                            0,
                            16,
                          ) + "...",
                        color: "text-white",
                        border: "border-purple-500/30",
                      },
                      {
                        label: "Total Defects",
                        value: result.total_defects,
                        color: "text-yellow-400",
                        border: "border-yellow-500/30",
                      },
                      {
                        label: "Severity",
                        value: result.severity,
                        color:
                          result.severity === "Critical"
                            ? "text-red-400"
                            : result.severity === "Moderate"
                              ? "text-orange-400"
                              : "text-green-400",
                        border: "border-orange-500/30",
                      },
                      {
                        label: "Decision",
                        value: result.decision,
                        color:
                          result.decision === "Reject"
                            ? "text-red-400"
                            : result.decision === "Review"
                              ? "text-yellow-300"
                              : "text-green-400",
                        border: "border-red-500/30",
                      },
                      {
                        label: "Anomaly Score",
                        value: `${((result.anomaly_score || 0) * 100).toFixed(0)}%`,
                        color: result.is_anomaly
                          ? "text-orange-400"
                          : "text-green-400",
                        border: "border-green-500/30",
                      },
                    ].map(({ label, value, color, border }) => (
                      <div
                        key={label}
                        className={`bg-[#111] border ${border} rounded-xl p-4`}
                      >
                        <p className="text-gray-400 text-xs mb-1">{label}</p>
                        <h2
                          className={`text-base font-bold ${color} break-all`}
                        >
                          {value}
                        </h2>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <div className="flex justify-between mb-1.5 text-sm">
                      <p className="text-gray-400">Risk Level</p>
                      <p className="font-bold text-white">
                        {getRiskScore(result)}%
                      </p>
                    </div>
                    <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getRiskScore(result)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-3 rounded-full ${getRiskScore(result) > 70 ? "bg-red-500" : getRiskScore(result) > 40 ? "bg-yellow-400" : "bg-green-500"}`}
                      />
                    </div>
                  </div>
                  {result.boxes?.length > 0 && (
                    <div className="mt-5 bg-[#111] rounded-xl p-4 border border-white/10">
                      <h2 className="text-sm font-bold text-white mb-3">
                        Detection Details ({result.boxes.length} detections)
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                        {result.boxes.map((box: any, i: number) => (
                          <div
                            key={i}
                            className={`rounded-lg p-2 text-xs border ${box.severity === "Critical" ? "bg-red-500/10 border-red-500/30" : box.severity === "Moderate" ? "bg-orange-500/10 border-orange-500/30" : "bg-yellow-500/10 border-yellow-500/30"}`}
                          >
                            <p className="font-bold text-white">{box.label}</p>
                            <p className="text-gray-400">
                              {(box.confidence * 100).toFixed(0)}% conf
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="bg-[#111] rounded-xl p-4 mt-5 border border-purple-500/20">
                    <h2 className="text-base font-bold text-purple-400 mb-2">
                      AI Explanation
                    </h2>
                    <p className="text-gray-300 leading-7 text-sm">
                      {result.explanation}
                    </p>
                  </div>
                  <div className="mt-6 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                    <h2 className="text-sm font-bold text-blue-400 mb-3">
                      Active Learning — Validate Prediction
                    </h2>
                    <p className="text-gray-400 text-xs mb-3">
                      Your feedback helps retrain and improve the AI model.
                      Retraining triggers every 20 labels.
                    </p>
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => handleFeedback("Confirm")}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-semibold hover:bg-green-500/30 transition-all"
                      >
                        <CheckCircle className="w-4 h-4" /> Correct Prediction
                      </button>
                      <button
                        onClick={() => handleFeedback("Wrong")}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-all"
                      >
                        <XCircle className="w-4 h-4" /> Wrong Prediction
                      </button>
                      <button
                        onClick={() => handleFeedback("Unsure")}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-sm font-semibold hover:bg-yellow-500/30 transition-all"
                      >
                        <AlertTriangle className="w-4 h-4" /> Unsure
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => handleDownloadPDF(result)}
                      disabled={pdfLoading}
                      className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 font-semibold hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-wait"
                    >
                      {pdfLoading ? (
                        <>
                          <svg
                            className="animate-spin w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8H4z"
                            />
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" /> Download Professional
                          Report
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <WaferHeatmap
              points={result?.heatmap_points || []}
              mainDefect={result?.main_defect || ""}
            />
          </div>
        )}

        {/* ══ AI ASSISTANT ══ */}
        {activeSection === "assistant" && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h2 className="text-xl font-bold text-purple-400 mb-1">
                AI Inspection Assistant
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Powered by Gemini — ask anything about your wafer inspection
                results.
              </p>
              {chat.length === 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    "What does Near-full defect mean?",
                    "How critical is a Scratch defect?",
                    "Explain the anomaly score",
                    "What action for Critical severity?",
                    "How does the AI attention heatmap work?",
                  ].map((p) => (
                    <button
                      key={p}
                      onClick={() => setInput(p)}
                      className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs hover:bg-purple-500/20 transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
              <div className="h-80 overflow-y-auto bg-black/40 rounded-2xl p-4 mb-4 space-y-3">
                {chat.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 text-sm text-center">
                      Ask about defects, risk scores, anomaly detection, or
                      inspection decisions...
                    </p>
                  </div>
                )}
                {chat.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`p-3 rounded-2xl max-w-[80%] text-sm leading-6 ${msg.role === "user" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : "bg-white/10 text-gray-200"}`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 rounded-2xl p-3 text-sm text-gray-400 flex items-center gap-1">
                      {[0, 0.2, 0.4].map((d, i) => (
                        <span
                          key={i}
                          className="animate-bounce inline-block w-2 h-2 bg-purple-400 rounded-full"
                          style={{ animationDelay: `${d}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && handleChat()
                  }
                  placeholder="Ask about defects, severity, anomaly score..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-purple-500/50 transition-colors"
                />
                <button
                  onClick={handleChat}
                  disabled={chatLoading || !input.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {result && (
                <div className="mt-4 bg-blue-500/5 border border-blue-500/10 rounded-xl p-3">
                  <p className="text-blue-400 text-xs font-bold mb-1">
                    Current Inspection Context
                  </p>
                  <p className="text-gray-400 text-xs">
                    {result.main_defect} • {result.severity} • {result.decision}{" "}
                    • Risk: {getRiskScore(result)}% • Anomaly:{" "}
                    {((result.anomaly_score || 0) * 100).toFixed(0)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ ANALYTICS ══ */}
        {activeSection === "analytics" && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div className="flex gap-2">
                {[
                  ["all", "All Time"],
                  ["week", "This Week"],
                  ["month", "This Month"],
                ].map(([f, label]) => (
                  <button
                    key={f}
                    onClick={() => setAnalyticsTimeFilter(f)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${analyticsTimeFilter === f ? "bg-gradient-to-r from-blue-600 to-purple-600" : "bg-white/10 hover:bg-white/20 text-gray-400"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCSVExport}
                className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-500/30 transition-all"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {statsLoading
                ? Array(4)
                    .fill(0)
                    .map((_, i) => <Skeleton key={i} className="h-24" />)
                : [
                    {
                      label: "Total Inspections",
                      val: stats?.total || 0,
                      color: "text-blue-400",
                    },
                    {
                      label: "Rejected",
                      val: stats?.rejected || 0,
                      color: "text-red-400",
                    },
                    {
                      label: "Review Required",
                      val: stats?.review || 0,
                      color: "text-yellow-400",
                    },
                    {
                      label: "Accepted",
                      val: stats?.accepted || 0,
                      color: "text-green-400",
                    },
                  ].map(({ label, val, color }) => (
                    <div
                      key={label}
                      className="bg-white/5 border border-white/10 rounded-xl p-4"
                    >
                      <p className="text-gray-400 text-sm">{label}</p>
                      <h2 className={`text-4xl font-bold ${color} mt-1`}>
                        <CountUp end={val} duration={2} />
                      </h2>
                    </div>
                  ))}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex justify-between mb-2 text-sm">
                <p className="text-gray-400">Overall Detection Accuracy</p>
                <p className="font-bold text-green-400">
                  {stats?.accuracy || 0}%
                </p>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats?.accuracy || 0}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                <h2 className="text-base font-bold mb-4 text-white">
                  Defect Distribution
                </h2>
                {defectData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
                    No data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={defectData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={100}
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {defectData.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#111",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              {/* FIX: axis labels added */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                <h2 className="text-base font-bold mb-4 text-white">
                  Severity Analysis
                </h2>
                {severityData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
                    No data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={severityData}
                      margin={{ top: 10, right: 20, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                      />
                      <XAxis
                        dataKey="name"
                        stroke="#9ca3af"
                        tick={{ fontSize: 12 }}
                        label={{
                          value: "Severity Level",
                          position: "insideBottom",
                          offset: -15,
                          fill: "#9ca3af",
                          fontSize: 11,
                        }}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        tick={{ fontSize: 12 }}
                        label={{
                          value: "Number of Wafers",
                          angle: -90,
                          position: "insideLeft",
                          offset: 10,
                          fill: "#9ca3af",
                          fontSize: 11,
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#111",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                        }}
                        formatter={(v: any) => [v, "Count"]}
                      />
                      <Bar
                        dataKey="value"
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                        name="Count"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                <h2 className="text-base font-bold mb-4 text-white">
                  Decision Distribution
                </h2>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Accept", value: stats?.accepted || 0 },
                        { name: "Review", value: stats?.review || 0 },
                        { name: "Reject", value: stats?.rejected || 0 },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                    >
                      {["#10b981", "#f59e0b", "#ef4444"].map((c, i) => (
                        <Cell key={i} fill={c} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#111",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* FIX: axis labels added */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                <h2 className="text-base font-bold mb-4 text-white">
                  Recent Defect Counts
                </h2>
                {trendData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
                    No data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={trendData.slice(-10)}
                      margin={{ top: 10, right: 20, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                      />
                      <XAxis
                        dataKey="day"
                        stroke="#9ca3af"
                        tick={{ fontSize: 11 }}
                        label={{
                          value: "Inspection No.",
                          position: "insideBottom",
                          offset: -15,
                          fill: "#9ca3af",
                          fontSize: 11,
                        }}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        tick={{ fontSize: 11 }}
                        label={{
                          value: "Defect Count",
                          angle: -90,
                          position: "insideLeft",
                          offset: 10,
                          fill: "#9ca3af",
                          fontSize: 11,
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#111",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                        }}
                        formatter={(v: any) => [v, "Defects"]}
                      />
                      <Bar
                        dataKey="defects"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                        name="Defects"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* FIX: SPC full form + axis labels */}
            <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
              <h2 className="text-base font-bold mb-2 text-white">
                Statistical Process Control (SPC) Chart — Anomaly Score Trend
              </h2>
              <p className="text-gray-400 text-xs mb-4">
                Statistical Process Control (SPC) tracks whether your
                manufacturing process is stable. Scores above 50% signal process
                drift or unknown defects that need investigation.
              </p>
              {anomalyTrend.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
                  Run more inspections to see SPC data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={290}>
                  <LineChart
                    data={anomalyTrend}
                    margin={{ top: 10, right: 80, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="day"
                      stroke="#9ca3af"
                      tick={{ fontSize: 11 }}
                      label={{
                        value: "Inspection Number",
                        position: "insideBottom",
                        offset: -15,
                        fill: "#9ca3af",
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      tick={{ fontSize: 11 }}
                      domain={[0, 100]}
                      label={{
                        value: "Anomaly Score (%)",
                        angle: -90,
                        position: "insideLeft",
                        offset: 10,
                        fill: "#9ca3af",
                        fontSize: 11,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#111",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                      formatter={(v: any) => [`${v}%`, "Anomaly Score"]}
                    />
                    <ReferenceLine
                      y={50}
                      stroke="#ef4444"
                      strokeDasharray="5 5"
                      label={{
                        value: "UCL 50% — Alert",
                        fill: "#ef4444",
                        fontSize: 10,
                        position: "right",
                      }}
                    />
                    <ReferenceLine
                      y={25}
                      stroke="#f59e0b"
                      strokeDasharray="5 5"
                      label={{
                        value: "Warning 25%",
                        fill: "#f59e0b",
                        fontSize: 10,
                        position: "right",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="anomaly"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ fill: "#f97316", r: 4 }}
                      name="Anomaly Score (%)"
                    />
                    <Legend verticalAlign="top" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* FIX: axis labels added */}
            <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
              <h2 className="text-base font-bold mb-4 text-white">
                Defect Count Trend
              </h2>
              {trendData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
                  Run inspections to see trends
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={trendData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 35 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="day"
                      stroke="#9ca3af"
                      tick={{ fontSize: 11 }}
                      label={{
                        value: "Inspection Number",
                        position: "insideBottom",
                        offset: -20,
                        fill: "#9ca3af",
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      tick={{ fontSize: 11 }}
                      label={{
                        value: "Count / Score",
                        angle: -90,
                        position: "insideLeft",
                        offset: 10,
                        fill: "#9ca3af",
                        fontSize: 11,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#111",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="defects"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", r: 4 }}
                      name="Defect Count"
                    />
                    <Line
                      type="monotone"
                      dataKey="risk"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: "#ef4444", r: 4 }}
                      name="Risk Score %"
                    />
                    <Legend verticalAlign="top" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* ══ MODEL EVALUATION ══ */}
        {activeSection === "evaluation" && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-white/10 rounded-3xl p-6">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-3xl font-bold text-purple-400 mb-2">
                    Model Evaluation Metrics
                  </h2>
                  <p className="text-gray-300 text-sm leading-6">
                    Performance metrics for the YOLOv8s model trained on the
                    WM-811k semiconductor wafer dataset.
                    {evalMetrics?.source === "benchmark"
                      ? " Showing training benchmark results. Label predictions on the Upload page to add live data."
                      : ` Based on ${evalMetrics?.total_labeled || 0} inspector-validated predictions.`}
                  </p>
                </div>
                {/* Source badge */}
                {evalMetrics && (
                  <div
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border ${evalMetrics.source === "benchmark" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-green-500/10 border-green-500/30 text-green-400"}`}
                  >
                    {evalMetrics.source === "benchmark"
                      ? "WM-811k Benchmark"
                      : `✓ Live Data (${evalMetrics.total_labeled} labels)`}
                  </div>
                )}
              </div>
            </div>

            {evalLoading ? (
              <div className="grid md:grid-cols-4 gap-4">
                {Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-28" />
                  ))}
              </div>
            ) : (
              evalMetrics && (
                <>
                  {/* Info banner — only shown when benchmark, not blocking */}
                  {evalMetrics.source === "benchmark" && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                      <span className="text-blue-400 text-lg flex-shrink-0">
                        ℹ
                      </span>
                      <div>
                        <p className="text-blue-300 font-semibold text-sm mb-1">
                          Showing YOLOv8s Training Benchmark
                        </p>
                        <p className="text-gray-400 text-xs leading-5">
                          These results come from training on 25,519 labeled
                          wafer images from the WM-811k dataset. To see{" "}
                          <strong className="text-white">
                            live metrics from your own inspections
                          </strong>
                          , go to{" "}
                          <button
                            onClick={() => setActiveSection("upload")}
                            className="text-blue-400 underline hover:text-blue-300"
                          >
                            Upload Inspection
                          </button>{" "}
                          and click{" "}
                          <strong className="text-white">
                            Correct Prediction
                          </strong>{" "}
                          or{" "}
                          <strong className="text-white">
                            Wrong Prediction
                          </strong>{" "}
                          after each scan.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Core metric cards */}
                  <div className="grid md:grid-cols-4 gap-4">
                    {[
                      {
                        label: "Precision",
                        val: evalMetrics.precision,
                        color: "text-blue-400",
                        suffix: "%",
                        mult: 100,
                        desc: "Of detected defects, % were correct",
                      },
                      {
                        label: "Recall",
                        val: evalMetrics.recall,
                        color: "text-green-400",
                        suffix: "%",
                        mult: 100,
                        desc: "Of actual defects, % were detected",
                      },
                      {
                        label: "F1-Score",
                        val: evalMetrics.f1_score,
                        color: "text-purple-400",
                        suffix: "%",
                        mult: 100,
                        desc: "Harmonic mean of precision & recall",
                      },
                      {
                        label: "Accuracy",
                        val: evalMetrics.accuracy,
                        color: "text-yellow-400",
                        suffix: "%",
                        mult: 1,
                        desc: "Overall prediction accuracy",
                      },
                    ].map(({ label, val, color, suffix, mult, desc }) => (
                      <div
                        key={label}
                        className="bg-white/5 border border-white/10 rounded-xl p-5"
                      >
                        <p className="text-gray-400 text-xs mb-1">{label}</p>
                        <h2 className={`text-3xl font-bold ${color}`}>
                          {(val * mult).toFixed(1)}
                          {suffix}
                        </h2>
                        <p className="text-gray-500 text-xs mt-2">{desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Extra stats row */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                      <p className="text-gray-400 text-xs mb-1">
                        mAP50 (Object Detection)
                      </p>
                      <h2 className="text-3xl font-bold text-cyan-400">
                        {evalMetrics.map50 ?? 98.2}%
                      </h2>
                      <p className="text-gray-500 text-xs mt-2">
                        Mean Average Precision @ IoU 0.5 — standard YOLO
                        benchmark
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                      <p className="text-gray-400 text-xs mb-1">
                        Inference Speed
                      </p>
                      <h2 className="text-3xl font-bold text-orange-400">
                        {evalMetrics.inference_ms ?? 450}
                        <span className="text-lg text-gray-400">ms</span>
                      </h2>
                      <p className="text-gray-500 text-xs mt-2">
                        Per wafer image on CPU — real-time capable (&lt;1s)
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                      <p className="text-gray-400 text-xs mb-1">
                        Training Dataset
                      </p>
                      <h2 className="text-3xl font-bold text-pink-400">
                        {evalMetrics.total_samples?.toLocaleString() ??
                          "25,519"}
                      </h2>
                      <p className="text-gray-500 text-xs mt-2">
                        Labeled wafer images from WM-811k • 8 defect classes
                      </p>
                    </div>
                  </div>

                  {/* Confusion matrix + Radar — always shown */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                      <h2 className="text-base font-bold mb-1 text-white">
                        Confusion Matrix
                      </h2>
                      <p className="text-gray-400 text-xs mb-4">
                        {evalMetrics.source === "benchmark"
                          ? "From WM-811k test set (15% holdout — 3,828 images)"
                          : `Based on ${evalMetrics.total_labeled} inspector-labeled predictions`}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            label: "True Positive",
                            val: evalMetrics.confusion_matrix.tp,
                            color:
                              "bg-green-500/20 border-green-500/30 text-green-400",
                            desc: "Defects correctly detected",
                          },
                          {
                            label: "False Positive",
                            val: evalMetrics.confusion_matrix.fp,
                            color:
                              "bg-red-500/20 border-red-500/30 text-red-400",
                            desc: "False alarms raised",
                          },
                          {
                            label: "True Negative",
                            val: evalMetrics.confusion_matrix.tn,
                            color:
                              "bg-blue-500/20 border-blue-500/30 text-blue-400",
                            desc: "Clean wafers accepted",
                          },
                          {
                            label: "False Negative",
                            val: evalMetrics.confusion_matrix.fn,
                            color:
                              "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
                            desc: "Defects missed",
                          },
                        ].map(({ label, val, color, desc }) => (
                          <div
                            key={label}
                            className={`border rounded-xl p-4 ${color}`}
                          >
                            <p className="text-xs font-semibold mb-1">
                              {label}
                            </p>
                            <p className="text-3xl font-black">
                              {val.toLocaleString()}
                            </p>
                            <p className="text-xs opacity-70 mt-1">{desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                      <h2 className="text-base font-bold mb-4 text-white">
                        Performance Radar
                      </h2>
                      <ResponsiveContainer width="100%" height={260}>
                        <RadarChart
                          data={[
                            {
                              metric: "Precision",
                              value: Math.round(
                                (evalMetrics.precision || 0) * 100,
                              ),
                            },
                            {
                              metric: "Recall",
                              value: Math.round(
                                (evalMetrics.recall || 0) * 100,
                              ),
                            },
                            {
                              metric: "F1-Score",
                              value: Math.round(
                                (evalMetrics.f1_score || 0) * 100,
                              ),
                            },
                            {
                              metric: "Accuracy",
                              value: Math.round(evalMetrics.accuracy || 0),
                            },
                            {
                              metric: "mAP50",
                              value: Math.round(evalMetrics.map50 || 98.2),
                            },
                          ]}
                        >
                          <PolarGrid stroke="rgba(255,255,255,0.1)" />
                          <PolarAngleAxis
                            dataKey="metric"
                            tick={{ fill: "#9ca3af", fontSize: 12 }}
                          />
                          <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={{ fill: "#9ca3af", fontSize: 10 }}
                          />
                          <Radar
                            name="Model"
                            dataKey="value"
                            stroke="#8b5cf6"
                            fill="#8b5cf6"
                            fillOpacity={0.3}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#111",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "12px",
                            }}
                            formatter={(v: any) => [`${v}%`]}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Per-class precision — always shown */}
                  <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                    <h2 className="text-base font-bold mb-1 text-white">
                      Per-Class Detection Performance
                    </h2>
                    <p className="text-gray-400 text-xs mb-4">
                      Precision per defect type — how accurately the model
                      identifies each category
                    </p>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={evalMetrics.defect_class_metrics}
                        margin={{ top: 10, right: 20, left: 20, bottom: 35 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                        />
                        <XAxis
                          dataKey="defect"
                          stroke="#9ca3af"
                          tick={{ fontSize: 11 }}
                          label={{
                            value: "Defect Type",
                            position: "insideBottom",
                            offset: -20,
                            fill: "#9ca3af",
                            fontSize: 11,
                          }}
                        />
                        <YAxis
                          stroke="#9ca3af"
                          tick={{ fontSize: 11 }}
                          domain={[0.85, 1]}
                          tickFormatter={(v: any) => `${(v * 100).toFixed(0)}%`}
                          label={{
                            value: "Precision",
                            angle: -90,
                            position: "insideLeft",
                            offset: 10,
                            fill: "#9ca3af",
                            fontSize: 11,
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#111",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                          }}
                          formatter={(v: any, name: any, props: any) => [
                            `${(v * 100).toFixed(1)}%`,
                            `Precision (${props.payload?.samples?.toLocaleString()} samples)`,
                          ]}
                        />
                        <Bar dataKey="precision" radius={[4, 4, 0, 0]}>
                          {(evalMetrics.defect_class_metrics || []).map(
                            (_: any, i: number) => (
                              <Cell
                                key={i}
                                fill={
                                  [
                                    "#3b82f6",
                                    "#8b5cf6",
                                    "#10b981",
                                    "#ef4444",
                                    "#f97316",
                                    "#facc15",
                                    "#06b6d4",
                                    "#ec4899",
                                  ][i % 8]
                                }
                              />
                            ),
                          )}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Active learning convergence — always shown */}
                  <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                    <h2 className="text-base font-bold mb-1 text-white">
                      Active Learning Convergence
                    </h2>
                    <p className="text-gray-400 text-xs mb-4">
                      {evalMetrics.source === "benchmark"
                        ? "How model accuracy improved during WM-811k training as more labeled samples were added"
                        : "Model accuracy improvement as more inspector labels are collected from your inspections"}
                    </p>
                    <ResponsiveContainer width="100%" height={270}>
                      <LineChart
                        data={evalMetrics.active_learning_progress}
                        margin={{ top: 10, right: 20, left: 20, bottom: 35 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                        />
                        <XAxis
                          dataKey="labels"
                          stroke="#9ca3af"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v: any) =>
                            v >= 1000 ? `${v / 1000}k` : String(v)
                          }
                          label={{
                            value: "Labeled Samples",
                            position: "insideBottom",
                            offset: -20,
                            fill: "#9ca3af",
                            fontSize: 11,
                          }}
                        />
                        <YAxis
                          stroke="#9ca3af"
                          tick={{ fontSize: 11 }}
                          domain={[90, 100]}
                          tickFormatter={(v: any) => `${v}%`}
                          label={{
                            value: "Accuracy (%)",
                            angle: -90,
                            position: "insideLeft",
                            offset: 10,
                            fill: "#9ca3af",
                            fontSize: 11,
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#111",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                          }}
                          formatter={(v: any) => [`${v}%`, "Accuracy"]}
                        />
                        <ReferenceLine
                          y={98.2}
                          stroke="#10b981"
                          strokeDasharray="5 5"
                          label={{
                            value: "98.2% Final",
                            fill: "#10b981",
                            fontSize: 10,
                            position: "right",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="accuracy"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ fill: "#10b981", r: 5 }}
                          name="Accuracy %"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Metrics reference */}
                  <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                    <h2 className="text-base font-bold mb-4 text-white">
                      Metrics Reference
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      {[
                        {
                          term: "Precision",
                          def: "Of all defects the AI detected, what fraction were actually defects. High = fewer false alarms.",
                        },
                        {
                          term: "Recall",
                          def: "Of all actual defects on the wafer, what fraction did the AI find. High = fewer missed defects.",
                        },
                        {
                          term: "F1-Score",
                          def: "Combines precision and recall into one score. Best single metric when you care about both.",
                        },
                        {
                          term: "mAP50",
                          def: "Mean Average Precision at 50% overlap. The standard benchmark for YOLO object detection quality.",
                        },
                        {
                          term: "Confusion Matrix",
                          def: "Shows exactly where the model gets things right (TP, TN) and wrong (FP = false alarm, FN = missed).",
                        },
                        {
                          term: "Active Learning",
                          def: "The AI gets smarter as inspectors label its predictions. More labels = higher accuracy over time.",
                        },
                      ].map(({ term, def }) => (
                        <div key={term} className="bg-black/30 rounded-xl p-4">
                          <p className="text-blue-400 font-bold text-sm mb-1">
                            {term}
                          </p>
                          <p className="text-gray-400 text-xs leading-5">
                            {def}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        )}

        {/* ══ DEFECT GUIDE ══ */}
        {activeSection === "guide" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-white/10 rounded-3xl p-6">
              <h1 className="text-3xl font-bold mb-2 text-white">
                Defect Guide
              </h1>
              <p className="text-gray-300">
                Learn about wafer defects, semiconductor inspection, and AI
                quality assurance.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  name: "Scratch",
                  color: "text-red-400",
                  badge: "bg-red-500/20 text-red-400",
                  sev: "Critical",
                  desc: "Physical surface damage from mechanical contact. Appears as linear marks across wafer surface.",
                  action:
                    "Immediate quarantine and root cause analysis required.",
                },
                {
                  name: "Edge-Loc",
                  color: "text-yellow-400",
                  badge: "bg-yellow-500/20 text-yellow-400",
                  sev: "Moderate",
                  desc: "Defect clusters concentrated at wafer edges, from chuck contact or edge ring contamination.",
                  action:
                    "Review edge exclusion parameters and cleaning protocols.",
                },
                {
                  name: "Center",
                  color: "text-blue-400",
                  badge: "bg-blue-500/20 text-blue-400",
                  sev: "Moderate",
                  desc: "Central defect pattern from CMP pressure non-uniformity or contamination.",
                  action:
                    "Check CMP head pressure distribution and slurry flow.",
                },
                {
                  name: "Donut",
                  color: "text-purple-400",
                  badge: "bg-purple-500/20 text-purple-400",
                  sev: "Moderate",
                  desc: "Circular ring-shaped defect pattern indicating spin coating non-uniformity.",
                  action:
                    "Inspect spin coating parameters and hotplate temperature uniformity.",
                },
                {
                  name: "Edge-Ring",
                  color: "text-green-400",
                  badge: "bg-green-500/20 text-green-400",
                  sev: "Moderate",
                  desc: "Continuous ring defect along outer wafer boundary from edge bead removal issues.",
                  action:
                    "Review edge bead removal settings and nozzle condition.",
                },
                {
                  name: "Near-Full",
                  color: "text-orange-400",
                  badge: "bg-orange-500/20 text-orange-400",
                  sev: "Critical",
                  desc: "Large-area defect covering most of the wafer — severe contamination or process failure.",
                  action:
                    "Halt production, full process review required immediately.",
                },
                {
                  name: "Random",
                  color: "text-pink-400",
                  badge: "bg-pink-500/20 text-pink-400",
                  sev: "Critical",
                  desc: "Randomly distributed defects with no specific pattern, often from particle contamination.",
                  action:
                    "Check environmental controls and cleanroom particle counts.",
                },
                {
                  name: "Loc",
                  color: "text-cyan-400",
                  badge: "bg-cyan-500/20 text-cyan-400",
                  sev: "Low",
                  desc: "Localized cluster defects in specific wafer regions, from chuck or stage issues.",
                  action: "Inspect wafer stage and chuck for contamination.",
                },
              ].map(({ name, color, badge, sev, desc, action }) => (
                <div
                  key={name}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.08] transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className={`${color} font-bold text-lg`}>{name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge}`}
                    >
                      {sev}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-6 mb-3">{desc}</p>
                  <div className="bg-black/30 rounded-lg p-3">
                    <p className="text-xs text-gray-400 font-semibold mb-1">
                      Recommended Action:
                    </p>
                    <p className="text-xs text-gray-300">{action}</p>
                  </div>
                </div>
              ))}
            </div>
            {[
              {
                title: "What is a Wafer?",
                color: "text-blue-400",
                content: (
                  <p className="mt-4 text-gray-300 text-sm leading-7">
                    A wafer is a thin circular slice of semiconductor material
                    (usually silicon) used in fabricating integrated circuits.
                    It is the foundation of processors, memory, GPUs, and AI
                    accelerators. Standard diameters are 200mm and 300mm.
                  </p>
                ),
              },
              {
                title: "Why is Wafer Inspection Important?",
                color: "text-purple-400",
                content: (
                  <p className="mt-4 text-gray-300 text-sm leading-7">
                    Wafer inspection directly impacts yield and profitability. A
                    single undetected critical defect can ruin an entire batch.
                    AI-powered inspection reduces false negatives, speeds
                    throughput, and provides consistent quality assessment
                    across all wafers.
                  </p>
                ),
              },
              {
                title: "Role of AI in Wafer Inspection",
                color: "text-green-400",
                content: (
                  <p className="mt-4 text-gray-300 text-sm leading-7">
                    This platform uses YOLOv8 with 98.2% accuracy, AI Attention
                    Heatmaps showing exactly which regions triggered detection,
                    anomaly scoring for unknown defect patterns, and active
                    learning that continuously improves from inspector feedback.
                  </p>
                ),
              },
            ].map(({ title, color, content }) => (
              <details
                key={title}
                className="bg-white/5 border border-white/10 rounded-xl p-4 group"
              >
                <summary
                  className={`cursor-pointer flex justify-between items-center text-base font-semibold ${color} select-none`}
                >
                  {title}
                  <span className="group-open:rotate-180 transition-transform duration-200 text-gray-400">
                    ▼
                  </span>
                </summary>
                {content}
              </details>
            ))}

            {/* Anomaly Detection Section */}
            <details
              className="bg-white/5 border border-white/10 rounded-xl p-4 group"
              id="anomaly-guide"
            >
              <summary className="cursor-pointer flex justify-between items-center text-base font-semibold text-green-400 select-none list-none">
                <span>🔍 Anomaly Detection</span>
                <span className="group-open:rotate-180 transition-transform duration-200 text-gray-400">
                  ▼
                </span>
              </summary>
              <div className="mt-4">
                <p className="text-gray-300 text-sm leading-7 mb-6">
                  Anomaly detection identifies wafer patterns that are{" "}
                  <strong className="text-white">
                    unusual or unseen during AI training
                  </strong>
                  . Unlike standard defect detection which looks for known
                  defect types, anomaly detection flags anything statistically
                  abnormal.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {[
                    {
                      title: "What is an Anomaly?",
                      color: "text-orange-400",
                      border: "border-orange-500/30",
                      content:
                        "A wafer pattern that does not match any defect the AI was trained on. It could be a new defect type, a combination of defects, or an unusual process variation the model has never seen before.",
                    },
                    {
                      title: "What does Anomaly Score mean?",
                      color: "text-yellow-400",
                      border: "border-yellow-500/30",
                      content:
                        "Score 0–100%. Below 50% = normal pattern. Above 50% = unusual. Above 75% = strong anomaly alert. The score is calculated from image statistics combined with the density and spread of detected defects.",
                    },
                    {
                      title: "What should I do?",
                      color: "text-red-400",
                      border: "border-red-500/30",
                      content:
                        "Anomalous wafers should be flagged for manual engineer review. Use the 'Wrong Prediction' button if the AI classified it incorrectly. Your feedback helps retrain the model to handle this pattern in future.",
                    },
                  ].map(({ title, color, border, content }) => (
                    <div
                      key={title}
                      className={`bg-black/30 border ${border} rounded-xl p-4`}
                    >
                      <p className={`font-bold text-sm mb-2 ${color}`}>
                        {title}
                      </p>
                      <p className="text-gray-300 text-xs leading-5">
                        {content}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                  <p className="text-white font-semibold text-sm mb-3">
                    Anomaly Score Reference
                  </p>
                  <div className="space-y-2">
                    {[
                      {
                        range: "0% – 30%",
                        label: "Normal",
                        color: "bg-green-500",
                        text: "text-green-400",
                        desc: "Pattern matches known training data. No concern.",
                      },
                      {
                        range: "30% – 50%",
                        label: "Watch",
                        color: "bg-yellow-500",
                        text: "text-yellow-400",
                        desc: "Slightly unusual. Monitor but likely acceptable.",
                      },
                      {
                        range: "50% – 75%",
                        label: "Anomalous",
                        color: "bg-orange-500",
                        text: "text-orange-400",
                        desc: "Unusual pattern detected. Manual review recommended.",
                      },
                      {
                        range: "75%+",
                        label: "High Anomaly",
                        color: "bg-red-500",
                        text: "text-red-400",
                        desc: "Strongly unusual. Quarantine and investigate.",
                      },
                    ].map(({ range, label, color, text, desc }) => (
                      <div key={range} className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full flex-shrink-0 ${color}`}
                        />
                        <span
                          className={`text-xs font-bold w-20 flex-shrink-0 ${text}`}
                        >
                          {range}
                        </span>
                        <span className="text-white text-xs font-semibold w-24 flex-shrink-0">
                          {label}
                        </span>
                        <span className="text-gray-400 text-xs">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setActiveSection("upload")}
                    className="px-4 py-2 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-300 text-sm font-semibold hover:bg-orange-500/30 transition-all"
                  >
                    ← Back to Inspection
                  </button>
                </div>
              </div>
            </details>
          </div>
        )}

        {/* ══ HOW IT WORKS (was: About Model) ══ */}
        {activeSection === "model" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-white/10 rounded-3xl p-6">
              <h2 className="text-3xl font-bold text-purple-400 mb-3">
                How This System Works
              </h2>
              <p className="text-gray-300 leading-7 text-sm">
                This platform uses advanced AI to automatically check wafer
                quality — no manual inspection needed. Upload a wafer image and
                within seconds the system tells you whether it is good, needs
                review, or should be rejected, with a full explanation of why.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                <h3 className="text-base font-bold text-blue-400 mb-4">
                  Technology Behind the System
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  {[
                    [
                      "AI Engine",
                      "YOLOv8 — scans the wafer image for defect patterns",
                    ],
                    [
                      "Attention Heatmap",
                      "GradCAM — shows WHERE the AI was looking",
                    ],
                    [
                      "Unknown Defect Detection",
                      "Anomaly scoring — flags unusual wafers",
                    ],
                    [
                      "Self-Improvement",
                      "Active Learning — gets smarter from corrections",
                    ],
                    ["Frontend", "Next.js + Tailwind CSS — the web interface"],
                    ["Backend", "FastAPI (Python) — processes AI results"],
                    ["Database", "MongoDB — stores all inspection records"],
                    [
                      "AI Assistant",
                      "Google Gemini — answers questions in plain English",
                    ],
                  ].map(([k, v]) => (
                    <p key={k}>
                      <span className="text-white font-semibold">{k}:</span> {v}
                    </p>
                  ))}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                <h3 className="text-base font-bold text-green-400 mb-4">
                  What the System Can Do
                </h3>
                <div className="space-y-1.5 text-sm text-gray-300">
                  {[
                    "Detect defects in under 1 second per wafer",
                    "Classify 8 types of defects automatically",
                    "Rate defect severity: Critical, Moderate, or Low",
                    "Show an AI Attention Heatmap explaining the decision",
                    "Detect unusual patterns not seen in training data",
                    "Learn from inspector corrections over time",
                    "Generate a professional 2-page PDF inspection report",
                    "Display analytics charts and SPC control charts",
                    "Track model performance with precision/recall metrics",
                    "Answer questions via built-in AI chat assistant",
                  ].map((c) => (
                    <p key={c}>• {c}</p>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
              <h3 className="text-base font-bold text-pink-400 mb-5">
                Step-by-Step Inspection Pipeline
              </h3>
              <div className="grid md:grid-cols-5 gap-3 text-center">
                {[
                  ["1. Upload", "You upload a wafer image", "text-blue-400"],
                  [
                    "2. AI Scans",
                    "YOLOv8 looks for defects",
                    "text-purple-400",
                  ],
                  [
                    "3. Explains",
                    "AI Attention Heatmap shows reasoning",
                    "text-yellow-400",
                  ],
                  [
                    "4. Checks Unknown",
                    "Anomaly score for unusual patterns",
                    "text-orange-400",
                  ],
                  [
                    "5. Learns",
                    "Inspector corrections improve the AI",
                    "text-green-400",
                  ],
                ].map(([title, desc, color], i) => (
                  <div key={title} className="bg-black/30 p-4 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-sm mx-auto mb-2">
                      {i + 1}
                    </div>
                    <p className={`font-bold text-sm ${color}`}>{title}</p>
                    <p className="text-xs text-gray-400 mt-2">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                ["98.2%", "Detection Accuracy", "text-blue-400"],
                ["YOLOv8", "Deep Learning Engine", "text-purple-400"],
                ["<1s", "Detection Speed", "text-yellow-400"],
                ["Real-Time", "AI Inspection", "text-green-400"],
              ].map(([v, l, c]) => (
                <div
                  key={l}
                  className="bg-white/5 border border-white/10 p-4 rounded-xl text-center"
                >
                  <h2 className={`text-lg font-bold ${c}`}>{v}</h2>
                  <p className="text-gray-400 text-sm mt-2">{l}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ HISTORY ══ */}
        {/* FIX: React key warning fixed — rows wrapped in React.Fragment with key */}
        {activeSection === "history" && (
          <div className="space-y-5 max-w-6xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h1 className="text-xl font-bold text-purple-400">
                Inspection History
              </h1>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Search filename..."
                  value={historySearch}
                  onChange={(e) => {
                    setHistorySearch(e.target.value);
                    setPage(1);
                  }}
                  className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-purple-500/50 transition-colors"
                />
                <select
                  value={severityFilter}
                  onChange={(e) => {
                    setSeverityFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                >
                  {["All", "Critical", "Moderate", "Low"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
                <select
                  value={decisionFilter}
                  onChange={(e) => {
                    setDecisionFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
                >
                  {["All", "Accept", "Review", "Reject"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
                <button
                  onClick={handleCSVExport}
                  className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-500/30 transition-all"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/10">
                  <tr className="text-left text-gray-400">
                    {[
                      "Filename",
                      "Defect",
                      "Severity",
                      "Decision",
                      "Risk",
                      "Date",
                      "Action",
                    ].map((h) => (
                      <th key={h} className="p-4 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historyLoading ? (
                    Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <tr key={i} className="border-t border-white/10">
                          {Array(7)
                            .fill(0)
                            .map((_, j) => (
                              <td key={j} className="p-4">
                                <Skeleton className="h-5 w-full" />
                              </td>
                            ))}
                        </tr>
                      ))
                  ) : history.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        No inspections found
                      </td>
                    </tr>
                  ) : (
                    history.map((res, i) => (
                      <React.Fragment key={`row-${res._id || i}`}>
                        <tr
                          className="border-t border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() =>
                            setExpandedRow(expandedRow === i ? null : i)
                          }
                        >
                          <td
                            className="p-4 text-gray-300 max-w-[160px] truncate"
                            title={res.filename}
                          >
                            {res.original_filename || res.filename}
                          </td>
                          <td className="p-4 text-blue-400 font-semibold">
                            {res.main_defect}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${res.severity === "Critical" ? "bg-red-500/20 text-red-400" : res.severity === "Moderate" ? "bg-yellow-500/20 text-yellow-300" : "bg-green-500/20 text-green-400"}`}
                            >
                              {res.severity}
                            </span>
                          </td>
                          <td
                            className={`p-4 font-semibold ${res.decision === "Reject" ? "text-red-400" : res.decision === "Review" ? "text-yellow-300" : "text-green-400"}`}
                          >
                            {res.decision}
                          </td>
                          <td className="p-4 text-gray-300">
                            {res.risk_score ?? getRiskScore(res)}%
                          </td>
                          <td className="p-4 text-gray-400 text-xs">
                            {res.created_at
                              ? new Date(res.created_at).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadPDF(res);
                              }}
                              disabled={pdfLoading}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-xs font-semibold hover:scale-105 transition-all disabled:opacity-50"
                            >
                              PDF
                            </button>
                          </td>
                        </tr>
                        {expandedRow === i && (
                          <tr className="border-t border-white/10 bg-white/[0.02]">
                            <td colSpan={7} className="p-4">
                              <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-gray-400 text-xs font-bold mb-2">
                                    DEFECT SUMMARY
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {res.defect_summary &&
                                      Object.entries(res.defect_summary).map(
                                        ([k, v]: any) => (
                                          <span
                                            key={k}
                                            className="px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs"
                                          >
                                            {k}: {v}
                                          </span>
                                        ),
                                      )}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-gray-400 text-xs font-bold mb-2">
                                    AI EXPLANATION
                                  </p>
                                  <p className="text-gray-300 text-xs leading-5">
                                    {res.explanation}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-400 text-xs font-bold mb-2">
                                    ANOMALY SCORE
                                  </p>
                                  <p className="text-orange-400 font-bold">
                                    {((res.anomaly_score || 0) * 100).toFixed(
                                      1,
                                    )}
                                    %
                                  </p>
                                  <p className="text-gray-500 text-xs">
                                    {res.is_anomaly
                                      ? "⚠ Anomalous pattern detected"
                                      : "✓ Normal pattern"}
                                  </p>
                                  {res.inspector_label && (
                                    <>
                                      <p className="text-gray-400 text-xs font-bold mt-3 mb-1">
                                        INSPECTOR FEEDBACK
                                      </p>
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${res.inspector_label === "Confirm" ? "bg-green-500/20 text-green-400" : res.inspector_label === "Wrong" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}
                                      >
                                        {res.inspector_label} by{" "}
                                        {res.labeled_by || "unknown"}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white/10 text-sm hover:bg-white/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-gray-400 text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white/10 text-sm hover:bg-white/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
