"use client";

import { useState } from "react";
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react";

export default function ImageComparisonPanel({
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

  const modes = ["Original", "Detection", "AI Attention Heatmap"] as const;
  const modeColors: Record<string, string> = {
    Original: "bg-blue-500",
    Detection: "bg-pink-500",
    "AI Attention Heatmap": "bg-green-500",
  };
  const getUrl = (mode: string) =>
    !result
      ? ""
      : mode === "Detection"
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
