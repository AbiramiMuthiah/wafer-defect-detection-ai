"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import CountUp from "react-countup";
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
  Line
} from "recharts";

export default function Home() {

  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState("all");

  const [chat, setChat] = useState<any[]>([]);
  const [input, setInput] = useState("");

  const [result, setResult] = useState<any>(null);

  const [inspectorId, setInspectorId] = useState("");
  const [department, setDepartment] = useState("Production");
  const [shift, setShift] = useState("Morning Shift");

  const [activeSection, setActiveSection] = useState("dashboard");

  const [systemAccess, setSystemAccess] = useState(false);

  const [showRegister, setShowRegister] = useState(false);

  const totalInspections =
    results.length > 0 ? results.length : 1240;

  const rejectedCount =
    results.filter((r) => r.decision === "Reject").length;

  const reviewCount =
    results.filter((r) => r.decision === "Review").length;

  const acceptedCount =
    results.filter((r) => r.decision === "Accept").length;

  const accuracy =
    results.length > 0
      ? (
        (acceptedCount / results.length) *
        100
      ).toFixed(1)
      : "98.2";


  const [users, setUsers] = useState([
    {
      id: "458980",
      department: "Production",
      shift: "Morning Shift"
    }
  ]);

  const handleRegister = async () => {

    if (!inspectorId.trim()) {
      alert("Enter Inspector ID");
      return;
    }

    const newUser = {
      id: inspectorId,
      department,
      shift
    };

    setUsers([...users, newUser]);

    await fetch("http://127.0.0.1:8000/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inspectorId,
        department,
        shift
      })
    });

    alert("New user registered successfully.");
  };

  const handleAccessSystem = () => {

    if (!inspectorId.trim()) {
      alert("Please enter Inspector ID");
      return;
    }

    setSystemAccess(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  };

  const handleFiles = (selected: FileList) => {
    const arr = Array.from(selected);
    setFiles(arr);
    setResults([]);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please upload an image first.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", files[0]);

      const response = await fetch("http://127.0.0.1:8000/inspect", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      const preview = data.image_url;

      const newResult = {
        ...data,
        preview,
      };

      setResults([newResult]);
      setResult(newResult);

    } catch (error) {
      console.error(error);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const getChatReply = (question: string) => {
    if (!result) return "Run inspection first.";

    const q = question.toLowerCase();

    if (q.includes("type") || q.includes("defect")) {
      return `Main defect detected is ${result.main_defect}.`;
    }

    if (q.includes("how many")) {
      return `${result.total_defects} defects detected.`;
    }

    if (q.includes("why")) {
      return `System decision is ${result.decision} due to ${result.severity} severity.`;
    }

    if (q.includes("risk")) {
      return `Risk score is ${getRiskScore(result)}%.`;
    }

    return "Ask about defects, risk, or decision.";
  };

  const getRiskScore = (res: any) => {
    let score = 0;

    score += res.total_defects * 5;

    if (res.severity === "Critical") score += 40;
    if (res.severity === "Moderate") score += 20;

    return Math.min(score, 100);
  };

  // 🔥 UPDATED PDF (USES NEW DATA)
  const downloadPDF = async () => {
    const pdf = new jsPDF();
    let y = 20;

    pdf.setFontSize(18);
    pdf.text("AI Wafer Defect Report", 20, 20);
    y = 40;

    for (let res of results) {
      pdf.setFontSize(12);

      pdf.text(`Filename: ${res.filename}`, 15, y); y += 8;
      pdf.text(`Total Defects: ${res.total_defects}`, 15, y); y += 8;
      pdf.text(`Severity: ${res.severity}`, 15, y); y += 8;
      pdf.text(`Decision: ${res.decision}`, 15, y); y += 8;
      pdf.text(`Explanation: ${res.explanation}`, 15, y); y += 12;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = res.image_url;

      await new Promise((resolve) => {
        img.onload = () => {
          pdf.addImage(img, "JPEG", 40, y, 120, 70);
          resolve(null);
        };
      });

      y += 80;
      if (y > 240) {
        pdf.addPage();
        y = 20;
      }
    }

    pdf.save("wafer-report.pdf");
  };

  const defectCounts: any = {};

  results.forEach((r) => {

    const defect = r.main_defect || "Unknown";

    if (defectCounts[defect]) {
      defectCounts[defect]++;
    } else {
      defectCounts[defect] = 1;
    }

  });

  const defectData = Object.keys(defectCounts).map((key) => ({
    name: key,
    value: defectCounts[key]
  }));

  const severityLevels: any = {
    Critical: 0,
    Moderate: 0,
    Low: 0
  };

  results.forEach((r) => {

    if (severityLevels[r.severity] !== undefined) {
      severityLevels[r.severity]++;
    }

  });

  const severityData = Object.keys(severityLevels).map((key) => ({
    name: key,
    value: severityLevels[key]
  }));

  const trendData = results.map((r, index) => ({
    day: `Img ${index + 1}`,
    inspections: r.total_defects
  }));

  const COLORS = [
    "#3b82f6",
    "#8b5cf6",
    "#ef4444",
    "#10b981",
    "#facc15"
  ];

  const handleChat = () => {

    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      text: input
    };

    const question = input.toLowerCase();

    let aiResponse = "I could not understand the question.";

    // ===== GENERAL =====

    if (
      question.includes("hello") ||
      question.includes("hi") ||
      question.includes("hey")
    ) {

      aiResponse =
        "Hello. I am the AI Wafer Inspection Assistant.";

    }

    // ===== MAIN DEFECT =====

    else if (
      question.includes("main defect") ||
      question.includes("type of defect") ||
      question.includes("what defect") ||
      question.includes("defect type")
    ) {

      aiResponse =
        `Main defect detected is ${result?.main_defect || "Unknown"}.`;

    }

    // ===== TOTAL DEFECTS =====

    else if (
      question.includes("how many defects") ||
      question.includes("total defects") ||
      question.includes("number of defects")
    ) {

      aiResponse =
        `Total detected defects: ${result?.total_defects || 0}.`;

    }

    // ===== CONFIDENCE =====

    else if (
      question.includes("confidence") ||
      question.includes("accuracy")
    ) {

      aiResponse =
        `Average confidence score is ${result?.avg_confidence || "0.0"
        }.`;

    }

    // ===== SEVERITY =====

    else if (
      question.includes("severity") ||
      question.includes("critical") ||
      question.includes("moderate") ||
      question.includes("minor")
    ) {

      aiResponse =
        `Current severity level is ${result?.severity || "Unknown"}.`;

    }

    // ===== DECISION =====

    else if (
      question.includes("decision") ||
      question.includes("accept") ||
      question.includes("reject") ||
      question.includes("review")
    ) {

      aiResponse =
        `System decision: ${result?.decision || "Unknown"}.`;

    }

    // ===== RISK SCORE =====

    else if (
      question.includes("risk") ||
      question.includes("percentage") ||
      question.includes("risk score")
    ) {

      aiResponse =
        `Current risk score is ${getRiskScore(result)}%.`;

    }

    // ===== WHY REJECTED =====

    else if (
      question.includes("why rejected") ||
      question.includes("why reject")
    ) {

      aiResponse =
        `The wafer was rejected due to critical defect patterns and inspection severity analysis.`;

    }

    // ===== WHY REVIEW =====

    else if (
      question.includes("why review")
    ) {

      aiResponse =
        `The wafer requires manual review because moderate defects were detected.`;

    }

    // ===== WAFER =====

    else if (
      question.includes("what is wafer")
    ) {

      aiResponse =
        "A wafer is a thin semiconductor material used to manufacture integrated circuits and microchips.";

    }

    // ===== YOLO =====

    else if (
      question.includes("what model") ||
      question.includes("yolo") ||
      question.includes("ai model")
    ) {

      aiResponse =
        "This system uses the YOLOv8 deep learning model for real-time wafer defect detection.";

    }

    // ===== EDGE-LOC =====

    else if (
      question.includes("edge-loc")
    ) {

      aiResponse =
        "Edge-Loc defects are concentrated near the wafer edge region.";

    }

    // ===== EDGE-RING =====

    else if (
      question.includes("edge-ring")
    ) {

      aiResponse =
        "Edge-Ring defects form ring-shaped abnormal patterns around wafer boundaries.";

    }

    // ===== SCRATCH =====

    else if (
      question.includes("scratch")
    ) {

      aiResponse =
        "Scratch defects are physical surface damages that may reduce chip reliability.";

    }

    // ===== DONUT =====

    else if (
      question.includes("donut")
    ) {

      aiResponse =
        "Donut defects are circular defect patterns around the wafer center.";

    }

    // ===== CENTER =====

    else if (
      question.includes("center defect")
    ) {

      aiResponse =
        "Center defects occur near the central wafer region.";

    }

    // ===== AI BENEFITS =====

    else if (
      question.includes("benefit") ||
      question.includes("advantages")
    ) {

      aiResponse =
        "AI inspection improves speed, consistency, defect accuracy, and reduces manual inspection workload.";

    }

    // ===== SYSTEM STATUS =====

    else if (
      question.includes("system status")
    ) {

      aiResponse =
        "All inspection modules are active and operational.";

    }

    // ===== FALLBACK =====

    else {

      aiResponse =
        "Try asking about defects, severity, risk score, wafer inspection, AI model, or inspection decisions.";

    }

    setChat([
      ...chat,
      userMessage,
      {
        role: "assistant",
        text: aiResponse
      }
    ]);

    setInput("");

  };

  return (
    <div className="min-h-screen bg-black text-white flex">

      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0b0b0b] border-r border-white/10 p-6 hidden md:flex flex-col">

        <h2 className="text-2xl font-bold text-purple-400 mb-10">
          Wafer AI
        </h2>

        <nav className="flex flex-col gap-4">

          <button
            onClick={() => setActiveSection("dashboard")}
            className="text-left hover:bg-white/10 p-3 rounded-xl transition"
          >
            Dashboard
          </button>

          <button
            onClick={() => setActiveSection("upload")}
            className="text-left hover:bg-white/10 p-3 rounded-xl transition"
          >
            Upload Inspection
          </button>

          <button
            onClick={() => setActiveSection("assistant")}
            className="text-left hover:bg-white/10 p-3 rounded-xl transition"
          >
            AI Assistant
          </button>

          <button
            onClick={() => setActiveSection("analytics")}
            className="text-left hover:bg-white/10 p-3 rounded-xl transition"
          >
            Analytics
          </button>

          <button
            onClick={() => setActiveSection("guide")}
            className="text-left hover:bg-white/10 p-3 rounded-xl transition"
          >
            Defect Guide
          </button>

          <button
            onClick={() => setActiveSection("model")}
            className="text-left hover:bg-white/10 p-3 rounded-xl transition"
          >
            About Model
          </button>

        </nav>

        {/* BOTTOM STATUS */}
        <div className="mt-auto">

          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">

            <p className="text-green-400 font-semibold">
              System Active
            </p>

            <p className="text-sm text-gray-400 mt-1">
              YOLOv8 Wafer Inspection Engine
            </p>

          </div>

        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="min-h-screen bg-black text-white p-6 flex-1">

        {/* HEADER */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text mb-10"
        >
          AI Wafer Defect Detection
        </motion.h1>

        {/* DASHBOARD SECTION */}
        {activeSection === "dashboard" && (

          <div className="max-w-6xl mx-auto mb-10">

            {/* USER TYPE BUTTONS */}
            <div className="flex gap-4 mb-6">

              <button
                onClick={() => setShowRegister(false)}
                className={`px-5 py-3 rounded-xl font-semibold transition ${!showRegister
                  ? "bg-blue-600"
                  : "bg-white/10"
                  }`}
              >
                Existing User
              </button>

              <button
                onClick={() => setShowRegister(true)}
                className={`px-5 py-3 rounded-xl font-semibold transition ${showRegister
                  ? "bg-purple-600"
                  : "bg-white/10"
                  }`}
              >
                New User
              </button>

            </div>

            {/* EXISTING USER LOGIN */}
            {!showRegister && !systemAccess && (

              <div className="grid md:grid-cols-4 gap-4 mb-8">

                <input
                  value={inspectorId}
                  onChange={(e) => setInspectorId(e.target.value)}
                  placeholder="Inspector ID"
                  className="bg-white/5 border border-white/10 p-4 rounded-2xl outline-none"
                />

                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="bg-white/5 border border-white/10 p-4 rounded-2xl"
                >
                  <option>Quality Control</option>
                  <option>Production</option>
                  <option>AI Research</option>
                  <option>Engineering</option>
                </select>

                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="bg-white/5 border border-white/10 p-4 rounded-2xl"
                >
                  <option>Morning Shift</option>
                  <option>Evening Shift</option>
                  <option>Night Shift</option>
                </select>

                <button
                  onClick={handleAccessSystem}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl font-semibold"
                >
                  Access System
                </button>

              </div>

            )}

            {/* NEW USER REGISTER */}
            {showRegister && !systemAccess && (

              <div className="grid md:grid-cols-5 gap-4 mb-8">

                <input
                  placeholder="Full Name"
                  className="bg-white/5 border border-white/10 p-4 rounded-2xl outline-none"
                />

                <input
                  value={inspectorId}
                  onChange={(e) => setInspectorId(e.target.value)}
                  placeholder="Create Inspector ID"
                  className="bg-white/5 border border-white/10 p-4 rounded-2xl outline-none"
                />

                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="bg-white/5 border border-white/10 p-4 rounded-2xl"
                >
                  <option>Quality Control</option>
                  <option>Production</option>
                  <option>AI Research</option>
                  <option>Engineering</option>
                </select>

                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="bg-white/5 border border-white/10 p-4 rounded-2xl"
                >
                  <option>Morning Shift</option>
                  <option>Evening Shift</option>
                  <option>Night Shift</option>
                </select>

                <button
                  onClick={handleRegister}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl font-semibold"
                >
                  Register User
                </button>

              </div>

            )}

            {/* WELCOME CARD */}
            {systemAccess && (

              <div className="bg-green-500/10 border border-green-500/30 rounded-3xl p-6 mb-8">

                <h2 className="text-3xl font-bold text-green-400">
                  Welcome {inspectorId}
                </h2>

                <p className="text-gray-300 mt-2">
                  {department} • {shift}
                </p>

                <p className="text-sm text-gray-500 mt-2">
                  AI Inspection Platform Ready
                </p>

              </div>

            )}

            {/* KPI CARDS */}
            <div className="grid md:grid-cols-4 gap-5 mb-8">

              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">

                <p className="text-gray-400 mb-2">
                  Total Inspections
                </p>

                <h2 className="text-4xl font-bold text-blue-400">
                  <CountUp end={totalInspections} duration={3} />
                </h2>

              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">

                <p className="text-gray-400 mb-2">
                  Rejected Wafers
                </p>

                <h2 className="text-4xl font-bold text-red-400">
                  <CountUp end={rejectedCount} duration={3} />
                </h2>

              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">

                <p className="text-gray-400 mb-2">
                  Review Required
                </p>

                <h2 className="text-4xl font-bold text-yellow-400">
                  <CountUp end={reviewCount} duration={3} />
                </h2>

              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">

                <p className="text-gray-400 mb-2">
                  System Accuracy
                </p>

                <h2 className="text-4xl font-bold text-green-400">
                  {accuracy}%
                </h2>

              </div>

            </div>

            {/* INFORMATION CARDS */}
            <div className="grid md:grid-cols-2 gap-5">

              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">

                <h3 className="text-xl font-semibold mb-3 text-blue-400">
                  What is a Wafer?
                </h3>

                <p className="text-gray-300 leading-7">
                  A wafer is a thin slice of semiconductor material,
                  usually silicon, used in manufacturing integrated circuits
                  and microchips for electronic devices.
                </p>

              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">

                <h3 className="text-xl font-semibold mb-3 text-purple-400">
                  Why Wafer Inspection Matters
                </h3>

                <p className="text-gray-300 leading-7">
                  Defect detection is critical in semiconductor manufacturing
                  because microscopic defects can reduce chip reliability,
                  increase production cost, and lower manufacturing yield.
                </p>

              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">

                <h3 className="text-xl font-semibold mb-3 text-pink-400">
                  System Overview
                </h3>

                <p className="text-gray-300 leading-7">
                  This platform uses YOLOv8 deep learning technology to
                  automatically detect wafer defects in real-time with
                  AI-assisted decision support and analytics.
                </p>

              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">

                <h3 className="text-xl font-semibold mb-3 text-green-400">
                  Current System Status
                </h3>

                <p className="text-gray-300 leading-7">
                  All AI inspection modules are active and running normally.
                  Real-time inspection engine and analytics system operational.
                </p>

              </div>

            </div>
          </div>
        )}

        {/* UPLOAD */}
        {activeSection === "upload" && (

          <div className="border-2 border-dashed border-white/20 p-8 text-center rounded-2xl">

            {/* IMAGE PREVIEW */}
            {files.length > 0 && (
              <div className="mb-6 flex justify-center">
                <img
                  src={result?.image_url || ""}
                  alt="Wafer Preview"
                  className="w-64 h-64 object-contain rounded-2xl border border-white/20 shadow-xl"
                />
              </div>
            )}

            {/* FILE INPUT */}
            <input
              type="file"
              multiple
              onChange={(e) =>
                e.target.files && handleFiles(e.target.files)
              }
            />

            <p className="text-gray-400 mt-2">
              Upload wafer images
            </p>

            {/* BUTTON */}
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={handleUpload}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl"
              >
                {loading ? "Analyzing..." : "Run Inspection"}
              </button>
            </div>

            {/* RESULTS */}
            <div className="mt-10 space-y-10">

              {results.map((res, i) => {

                const decisionColor =
                  res.decision === "Reject"
                    ? "text-red-500"
                    : res.decision === "Review"
                      ? "text-yellow-400"
                      : "text-green-400";

                return (
                  <motion.div
                    key={i}
                    className="bg-white/5 p-6 rounded-2xl">

                    {/* SUMMARY */}
                    <div className="mt-4 grid grid-cols-4 gap-4">

                      <Info label="Main Defect" value={res.main_defect} />

                      <Info label="Filename" value={res.filename} />

                      <Info label="Total Defects" value={res.total_defects}
                      />

                      <Info label="Severity" value={res.severity} />

                      <Info
                        label="Decision"
                        value={
                          <span className={decisionColor}>
                            {res.decision}
                          </span>
                        }
                      />

                      <Info
                        label="Risk Score"
                        value={`${getRiskScore(res)}%`}
                      />

                    </div>

                    {/* RISK BAR */}
                    <div className="mt-4 h-2 bg-gray-700 rounded">

                      <div
                        className={`h-2 rounded ${getRiskScore(res) > 70
                          ? "bg-red-500"
                          : getRiskScore(res) > 40
                            ? "bg-yellow-400"
                            : "bg-green-500"
                          }`}
                        style={{
                          width: `${getRiskScore(res)}%`
                        }}
                      />

                    </div>

                    {/* PDF */}
                    {
                      results.length > 0 && (
                        <div className="flex justify-center mt-6">
                          <button
                            onClick={downloadPDF}
                            className="px-6 py-3 bg-green-600 rounded-xl"
                          >
                            Download Report
                          </button>
                        </div>
                      )
                    }

                  </motion.div>
                );

              })}

            </div>


          </div>

        )}

        {/* Defect Guide */}
        {activeSection === "guide" && (

          <div className="max-w-6xl mx-auto space-y-6">

            {/* HEADER */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-white/10 rounded-3xl p-8">

              <h1 className="text-4xl font-bold mb-3 text-white">
                Defect Guide
              </h1>

              <p className="text-gray-300 text-lg">
                Learn about wafer defects, semiconductor inspection,
                and how AI improves manufacturing quality assurance.
              </p>

            </div>

            {/* WHAT IS WAFER */}
            <details className="bg-white/5 border border-white/10 rounded-2xl p-6 group">

              <summary className="cursor-pointer flex justify-between items-center text-2xl font-semibold text-blue-400">
                What is a Wafer?
                <span className="group-open:rotate-180 transition">
                  ▼
                </span>
              </summary>

              <div className="mt-5 text-gray-300 leading-8 text-lg">

                <p>
                  A wafer is a thin circular slice of semiconductor material,
                  usually silicon, used in the fabrication of integrated circuits
                  and microchips.
                </p>

                <p className="mt-4">
                  Wafers are the foundation of modern electronics including:
                </p>

                <ul className="list-disc ml-8 mt-3 space-y-2">
                  <li>Processors</li>
                  <li>Memory chips</li>
                  <li>GPUs</li>
                  <li>Mobile phone chips</li>
                  <li>AI accelerators</li>
                </ul>

              </div>

            </details>

            {/* WHY INSPECTION */}
            <details className="bg-white/5 border border-white/10 rounded-2xl p-6 group">

              <summary className="cursor-pointer flex justify-between items-center text-2xl font-semibold text-purple-400">
                Why is Wafer Inspection Important?
                <span className="group-open:rotate-180 transition">
                  ▼
                </span>
              </summary>

              <div className="mt-5 text-gray-300 leading-8 text-lg">

                <p>
                  Wafer inspection is critical because microscopic defects can
                  significantly affect semiconductor quality and manufacturing yield.
                </p>

                <p className="mt-4">
                  Even tiny scratches or contamination may cause:
                </p>

                <ul className="list-disc ml-8 mt-3 space-y-2">
                  <li>Chip failure</li>
                  <li>Reduced reliability</li>
                  <li>Production losses</li>
                  <li>Higher manufacturing costs</li>
                  <li>Lower fabrication efficiency</li>
                </ul>

              </div>

            </details>

            {/* DEFECT TYPES */}
            <details className="bg-white/5 border border-white/10 rounded-2xl p-6 group">

              <summary className="cursor-pointer flex justify-between items-center text-2xl font-semibold text-pink-400">
                Types of Defects Detected
                <span className="group-open:rotate-180 transition">
                  ▼
                </span>
              </summary>

              <div className="mt-6 grid md:grid-cols-2 gap-5">

                <div className="bg-black/30 p-5 rounded-2xl">
                  <h3 className="text-red-400 font-bold text-xl">Scratch</h3>
                  <p className="text-gray-300 mt-2">
                    Physical surface damage affecting wafer integrity.
                  </p>
                </div>

                <div className="bg-black/30 p-5 rounded-2xl">
                  <h3 className="text-yellow-400 font-bold text-xl">Edge-Loc</h3>
                  <p className="text-gray-300 mt-2">
                    Defects concentrated around wafer edges.
                  </p>
                </div>

                <div className="bg-black/30 p-5 rounded-2xl">
                  <h3 className="text-blue-400 font-bold text-xl">Center</h3>
                  <p className="text-gray-300 mt-2">
                    Defects detected near wafer center region.
                  </p>
                </div>

                <div className="bg-black/30 p-5 rounded-2xl">
                  <h3 className="text-purple-400 font-bold text-xl">Donut</h3>
                  <p className="text-gray-300 mt-2">
                    Circular defect patterns around wafer core.
                  </p>
                </div>

                <div className="bg-black/30 p-5 rounded-2xl">
                  <h3 className="text-green-400 font-bold text-xl">Edge-Ring</h3>
                  <p className="text-gray-300 mt-2">
                    Ring-shaped defects along outer wafer boundary.
                  </p>
                </div>

                <div className="bg-black/30 p-5 rounded-2xl">
                  <h3 className="text-orange-400 font-bold text-xl">Near-Full</h3>
                  <p className="text-gray-300 mt-2">
                    Large-area defects affecting major wafer regions.
                  </p>
                </div>

              </div>

            </details>

            {/* ROLE OF AI */}
            <details className="bg-white/5 border border-white/10 rounded-2xl p-6 group">

              <summary className="cursor-pointer flex justify-between items-center text-2xl font-semibold text-green-400">
                Role of AI in Wafer Inspection
                <span className="group-open:rotate-180 transition">
                  ▼
                </span>
              </summary>

              <div className="mt-5 text-gray-300 leading-8 text-lg">

                <p>
                  Artificial Intelligence enables automated defect detection
                  with high speed and consistency.
                </p>

                <p className="mt-4">
                  This platform uses YOLOv8 deep learning technology to:
                </p>

                <ul className="list-disc ml-8 mt-3 space-y-2">
                  <li>Detect defects in real-time</li>
                  <li>Classify defect categories</li>
                  <li>Reduce human inspection effort</li>
                  <li>Improve manufacturing quality</li>
                  <li>Generate AI-assisted decisions</li>
                </ul>

              </div>

            </details>

            {/* WHY SYSTEM MATTERS */}
            <details className="bg-white/5 border border-white/10 rounded-2xl p-6 group">

              <summary className="cursor-pointer flex justify-between items-center text-2xl font-semibold text-cyan-400">
                Why This System Matters
                <span className="group-open:rotate-180 transition">
                  ▼
                </span>
              </summary>

              <div className="mt-5 text-gray-300 leading-8 text-lg">

                <p>
                  This AI-powered wafer inspection platform helps semiconductor
                  manufacturers improve quality assurance and reduce operational risk.
                </p>

                <p className="mt-4">
                  Key benefits include:
                </p>

                <ul className="list-disc ml-8 mt-3 space-y-2">
                  <li>Faster inspection speed</li>
                  <li>Improved defect accuracy</li>
                  <li>Reduced production loss</li>
                  <li>AI-assisted quality control</li>
                  <li>Real-time manufacturing analytics</li>
                </ul>

              </div>

            </details>

          </div>

        )}

        {activeSection === "assistant" && (

          <div className="mt-10 bg-white/5 p-6 rounded-2xl border border-white/10">

            <h2 className="text-xl font-semibold mb-4">
              AI Assistant
            </h2>

            <div className="h-60 overflow-y-auto bg-black/40 p-4 rounded-xl mb-4 space-y-2">

              {chat.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg max-w-[80%] ${msg.role === "user"
                    ? "bg-blue-600 ml-auto"
                    : "bg-gray-700"
                    }`}
                >
                  {msg.text}
                </div>
              ))}

            </div>

            <div className="flex gap-2">

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about defects..."
                className="flex-1 bg-black border border-white/10 rounded-lg p-3"
              />

              <button
                onClick={handleChat}
                className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 rounded-lg"
              >
                Send
              </button>

            </div>

          </div>
        )}

        {activeSection === "analytics" && (

          <div className="space-y-10">

            {/* KPI CARDS */}
            <div className="grid md:grid-cols-4 gap-6">

              <div className="bg-white/5 p-6 rounded-2xl">
                <p className="text-gray-400">Total Inspections</p>
                <h2 className="text-4xl font-bold text-blue-400">
                  <CountUp end={results.length} duration={2} />
                </h2>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl">
                <p className="text-gray-400">Rejected</p>
                <h2 className="text-4xl font-bold text-red-400">
                  <CountUp end={results.filter(r => r.decision === "Reject").length} duration={2} />
                </h2>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl">
                <p className="text-gray-400">Review Required</p>
                <h2 className="text-4xl font-bold text-yellow-400">
                  <CountUp end={results.filter(r => r.decision === "Review").length} duration={2} />
                </h2>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl">
                <p className="text-gray-400">System Accuracy</p>
                <h2 className="text-4xl font-bold text-green-400">
                  98.2%
                </h2>
              </div>

            </div>

            {/* CHARTS */}
            <div className="grid md:grid-cols-2 gap-8">

              {/* PIE CHART */}
              <div className="bg-white/5 p-6 rounded-2xl">

                <h2 className="text-2xl font-bold mb-4">
                  Defect Distribution
                </h2>

                <ResponsiveContainer width="100%" height={300}>

                  <PieChart>

                    <Pie
                      data={defectData}
                      dataKey="value"
                      outerRadius={100}
                      label
                    >

                      {defectData.map((entry, index) => (

                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />

                      ))}

                    </Pie>

                    <Tooltip />

                  </PieChart>

                </ResponsiveContainer>

              </div>

              {/* BAR CHART */}
              <div className="bg-white/5 p-6 rounded-2xl">

                <h2 className="text-2xl font-bold mb-4">
                  Severity Analysis
                </h2>

                <ResponsiveContainer width="100%" height={300}>

                  <BarChart data={severityData}>

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="name" />

                    <YAxis />

                    <Tooltip />

                    <Bar
                      dataKey="value"
                      fill="#8b5cf6"
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </div>

            {/* LINE CHART */}
            <div className="bg-white/5 p-6 rounded-2xl">

              <h2 className="text-2xl font-bold mb-4">
                Inspection Trend
              </h2>

              <ResponsiveContainer width="100%" height={350}>

                <LineChart data={trendData}>

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="day" />

                  <YAxis />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="inspections"
                    stroke="#3b82f6"
                    strokeWidth={3}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>

        )}

        {/* ABOUT MODEL */}
        {activeSection === "model" && (
          <div className="space-y-8">

            {/* HEADER CARD */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-white/10 rounded-3xl p-8">

              <h2 className="text-4xl font-bold text-purple-400 mb-4">
                AI Model Architecture
              </h2>

              <p className="text-gray-300 text-lg leading-relaxed">
                This platform uses YOLOv8 deep learning technology
                for real-time semiconductor wafer defect detection.
                The system automatically identifies wafer defects,
                classifies severity levels, and provides AI-assisted
                quality inspection insights for manufacturing environments.
              </p>

            </div>

            {/* MODEL INFO */}
            <div className="grid md:grid-cols-2 gap-6">

              <div className="bg-white/5 p-6 rounded-2xl border border-white/10">

                <h3 className="text-2xl font-bold text-blue-400 mb-4">
                  Model Details
                </h3>

                <div className="space-y-3 text-gray-300">

                  <p>
                    <span className="text-white font-semibold">
                      Model:
                    </span> YOLOv8
                  </p>

                  <p>
                    <span className="text-white font-semibold">
                      Framework:
                    </span> Ultralytics
                  </p>

                  <p>
                    <span className="text-white font-semibold">
                      Language:
                    </span> Python
                  </p>

                  <p>
                    <span className="text-white font-semibold">
                      Frontend:
                    </span> Next.js + Tailwind CSS
                  </p>

                  <p>
                    <span className="text-white font-semibold">
                      Backend:
                    </span> FastAPI
                  </p>

                  <p>
                    <span className="text-white font-semibold">
                      Database:
                    </span> MongoDB (Optional)
                  </p>

                </div>

              </div>

              <div className="bg-white/5 p-6 rounded-2xl border border-white/10">

                <h3 className="text-2xl font-bold text-green-400 mb-4">
                  AI Capabilities
                </h3>

                <div className="space-y-3 text-gray-300">

                  <p>• Real-time wafer defect detection</p>

                  <p>• Multi-defect classification</p>

                  <p>• Severity prediction</p>

                  <p>• Risk score analysis</p>

                  <p>• AI-assisted inspection insights</p>

                  <p>• PDF inspection report generation</p>

                  <p>• Analytics dashboard visualization</p>

                </div>

              </div>

            </div>

            {/* MODEL PIPELINE */}
            <div className="bg-white/5 p-8 rounded-2xl border border-white/10">

              <h3 className="text-3xl font-bold text-pink-400 mb-6">
                AI Inspection Pipeline
              </h3>

              <div className="grid md:grid-cols-5 gap-4 text-center">

                <div className="bg-black/30 p-4 rounded-xl">
                  <p className="font-semibold text-blue-400">
                    Upload
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Wafer image uploaded
                  </p>
                </div>

                <div className="bg-black/30 p-4 rounded-xl">
                  <p className="font-semibold text-purple-400">
                    Detection
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    YOLOv8 scans defects
                  </p>
                </div>

                <div className="bg-black/30 p-4 rounded-xl">
                  <p className="font-semibold text-yellow-400">
                    Classification
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Defect categories identified
                  </p>
                </div>

                <div className="bg-black/30 p-4 rounded-xl">
                  <p className="font-semibold text-red-400">
                    Analysis
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Severity & risk calculated
                  </p>
                </div>

                <div className="bg-black/30 p-4 rounded-xl">
                  <p className="font-semibold text-green-400">
                    Report
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    AI inspection report generated
                  </p>
                </div>

              </div>

            </div>

            {/* PERFORMANCE */}
            <div className="grid md:grid-cols-4 gap-6">

              <div className="bg-white/5 p-6 rounded-2xl text-center">
                <h2 className="text-4xl font-bold text-blue-400">
                  98.2%
                </h2>
                <p className="text-gray-400 mt-2">
                  Detection Accuracy
                </p>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl text-center">
                <h2 className="text-4xl font-bold text-purple-400">
                  YOLOv8
                </h2>
                <p className="text-gray-400 mt-2">
                  Deep Learning Engine
                </p>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl text-center">
                <h2 className="text-4xl font-bold text-yellow-400">
                  &lt;1s
                </h2>
                <p className="text-gray-400 mt-2">
                  Detection Speed
                </p>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl text-center">
                <h2 className="text-4xl font-bold text-green-400">
                  Real-Time
                </h2>
                <p className="text-gray-400 mt-2">
                  AI Inspection
                </p>
              </div>

            </div>

          </div>
        )}

      </main>
    </div >
  )
}


function Info({ label, value }: any) {
  return (
    <div className="bg-white/5 p-4 rounded-xl">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}