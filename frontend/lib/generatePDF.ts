import jsPDF from "jspdf";
import toast from "react-hot-toast";

export async function generateProfessionalPDF(res: any, inspectorId: string) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297, margin = 18;
  const navy      = [10, 25, 60]    as [number, number, number];
  const purple    = [100, 60, 180]  as [number, number, number];
  const green     = [16, 185, 129]  as [number, number, number];
  const red       = [239, 68, 68]   as [number, number, number];
  const orange    = [249, 115, 22]  as [number, number, number];
  const white     = [255, 255, 255] as [number, number, number];
  const lightGray = [240, 240, 248] as [number, number, number];
  const darkGray  = [100, 100, 120] as [number, number, number];
  const textDark  = [20, 20, 40]    as [number, number, number];

  const riskScore = res.risk_score ?? Math.min(res.total_defects * 5, 100);
  const sevColor = res.severity === "Critical" ? red : res.severity === "Moderate" ? orange : green;
  const decColor = res.decision === "Reject"   ? red : res.decision === "Review"   ? orange : green;

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
  pdf.text("YOLOv8 Deep Learning  •  AI Attention Heatmap  •  Active Learning", margin, 37);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...white);
  pdf.text("INSPECTION REPORT", W - margin, 22, { align: "right" });
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(180, 180, 220);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, W - margin, 30, { align: "right" });
  pdf.text(`Inspector: ${inspectorId || "N/A"}`, W - margin, 37, { align: "right" });

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
  pdf.text(`Filename: ${res.original_filename || res.filename || "N/A"}`, margin + 4, y + 14);
  pdf.text(`Inspection ID: ${res.filename || "N/A"}`, margin + 4, y + 21);
  pdf.text(`Timestamp: ${new Date().toLocaleString()}`, W / 2, y + 14);
  pdf.text(`Total Defects: ${res.total_defects}  |  Anomaly Score: ${res.anomaly_score ?? 0}`, W / 2, y + 21);
  y += 33;

  pdf.setFillColor(...decColor);
  pdf.roundedRect(margin, y, W - 2 * margin, 18, 3, 3, "F");
  pdf.setTextColor(...white);
  pdf.setFontSize(13);
  pdf.setFont("helvetica", "bold");
  pdf.text(`DECISION: ${res.decision?.toUpperCase()}`, W / 2, y + 12, { align: "center" });
  y += 25;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...textDark);
  pdf.text("KEY METRICS", margin, y);
  y += 6;
  const metrics = [
    { label: "Main Defect Type", value: res.main_defect || "N/A",                           color: purple },
    { label: "Severity Level",   value: res.severity,                                        color: sevColor },
    { label: "Risk Score",       value: `${riskScore}%`,                                     color: riskScore > 70 ? red : riskScore > 40 ? orange : green },
    { label: "Avg. Confidence",  value: `${((res.avg_confidence || 0) * 100).toFixed(1)}%`,  color: green },
    { label: "Anomaly Score",    value: `${((res.anomaly_score   || 0) * 100).toFixed(1)}%`, color: res.is_anomaly ? red : green },
    { label: "System Decision",  value: res.decision,                                        color: decColor },
  ];
  const cW = (W - 2 * margin - 8) / 3, cH = 22;
  metrics.forEach((m, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const cx = margin + col * (cW + 4), cy = y + row * (cH + 4);
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
  pdf.roundedRect(margin, y, (W - 2 * margin) * (riskScore / 100), 6, 3, 3, "F");
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
  const lines = pdf.splitTextToSize(res.explanation || "No explanation.", W - 2 * margin - 10);
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
    pdf.text("Defect Type", margin + 4,   y + 5.5);
    pdf.text("Count",       margin + 80,  y + 5.5);
    pdf.text("% of Total",  margin + 110, y + 5.5);
    pdf.text("Risk Level",  margin + 145, y + 5.5);
    y += 8;
    const total = Object.values(res.defect_summary).reduce((a: any, b: any) => a + b, 0) as number;
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
      await new Promise((r) => { img.onload = r; img.onerror = r; setTimeout(r, 3000); });
      if (img.complete && img.naturalWidth > 0) {
        const mh = Math.min(60, H - y - 40);
        pdf.addImage(img, "JPEG", margin, y, W - 2 * margin, mh);
        y += mh + 5;
      }
    } catch {}
  }

  // PAGE 2
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
  pdf.text(`File: ${res.original_filename || res.filename}`, W - margin, 14, { align: "right" });
  y = 30;

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...textDark);
  pdf.text("AI ATTENTION HEATMAP", margin, y);
  y += 4;
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...darkGray);
  pdf.text("Shows WHERE the AI was looking when it detected defects.", margin, y);
  y += 5;
  pdf.text("Red/hot areas = high AI focus (likely defective). Blue/cool areas = AI largely ignored.", margin, y);
  y += 7;
  try {
    const gi = new Image();
    gi.crossOrigin = "anonymous";
    gi.src = res.gradcam_url;
    await new Promise((r) => { gi.onload = r; gi.onerror = r; setTimeout(r, 3000); });
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
      ? ["Immediately quarantine this wafer batch.", "Conduct full root cause analysis.", `Critical ${res.main_defect} defect requires process review.`, "Notify quality control team.", "Document in quality management system."]
      : res.decision === "Review"
        ? [`${res.main_defect} requires manual review.`, "Cross-reference recent process parameter changes.", "Consider re-inspection after equipment calibration.", "Monitor subsequent wafers."]
        : ["Wafer cleared for continued processing.", "Maintain standard monitoring protocols.", "Log result in production tracking system.", "Periodic re-inspection recommended."];
  recs.forEach((rec, i) => {
    pdf.setFillColor(...(i % 2 === 0 ? lightGray : white));
    pdf.roundedRect(margin, y, W - 2 * margin, 10, 2, 2, "F");
    pdf.setTextColor(...decColor);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text(res.decision === "Reject" ? "⚠" : res.decision === "Review" ? "→" : "✓", margin + 3, y + 7);
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
    pdf.text(`Validated by: ${res.labeled_by || "Unknown"}`, margin + 4, y + 12);
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
    pdf.text("Wafer AI — AI-Powered Semiconductor Inspection  •  Confidential  •  For Internal Use Only", W / 2, H - 9, { align: "center" });
    pdf.text(`Page ${pg} of 2  •  Generated ${new Date().toISOString()}`, W / 2, H - 4, { align: "center" });
  });

  const safe = (res.original_filename || "wafer").replace(/[^a-zA-Z0-9._-]/g, "_");
  pdf.save(`WaferAI_Report_${safe}_${Date.now()}.pdf`);
  toast.success("Professional PDF report downloaded!");
}