"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const ITEMS_PER = 5;

export function useDefectSight() {
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

  return {
    // nav
    activeSection,
    setActiveSection,
    navItems,
    // auth
    systemAccess,
    setSystemAccess,
    showRegister,
    setShowRegister,
    inspectorId,
    setInspectorId,
    department,
    setDepartment,
    shift,
    setShift,
    handleAccessSystem,
    handleRegister,
    // upload
    files,
    dragging,
    setDragging,
    loading,
    result,
    viewMode,
    setViewMode,
    pdfLoading,
    handleFiles,
    handleUpload,
    handleFeedback,
    handleDownloadPDF,
    // stats
    stats,
    statsLoading,
    // history
    history,
    historyLoading,
    historySearch,
    setHistorySearch,
    severityFilter,
    setSeverityFilter,
    decisionFilter,
    setDecisionFilter,
    page,
    setPage,
    totalPages,
    expandedRow,
    setExpandedRow,
    handleCSVExport,
    getRiskScore,
    // analytics
    analyticsTimeFilter,
    setAnalyticsTimeFilter,
    defectData,
    severityData,
    trendData,
    anomalyTrend,
    // evaluation
    evalMetrics,
    evalLoading,
    radarData,
    // chat
    chat,
    input,
    setInput,
    chatLoading,
    chatEndRef,
    handleChat,
  };
}
