import os
import httpx
from fastapi import APIRouter

router = APIRouter()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

FALLBACK_RESPONSES = {
    "gradcam":   "The AI Attention Heatmap highlights the image regions that most influenced the AI model prediction. Red/hot areas = high AI focus. Blue/cool = largely ignored.",
    "heatmap":   "The AI Attention Heatmap shows WHERE the AI was looking when it detected defects. Red areas = defect-prone regions the AI focused on most.",
    "scratch":   "Scratch defects are critical wafer surface damages caused by mechanical contact during handling or transport. Immediate quarantine is recommended.",
    "edge-loc":  "Edge-Loc defects appear near wafer edges and are commonly caused by chuck contamination or edge ring issues.",
    "donut":     "Donut defects form circular ring patterns often linked to spin coating non-uniformity during the baking step.",
    "critical":  "Critical severity means high-risk wafer damage. The wafer should be rejected and a root cause analysis initiated.",
    "moderate":  "Moderate defects require manual engineer verification before the wafer can be approved for continued processing.",
    "low":       "Low severity defects are minor localized anomalies with lower production risk. Monitor but usually acceptable.",
    "anomaly":   "The anomaly score identifies unusual wafer patterns not seen during AI training. Scores above 50% trigger an alert.",
    "patchcore": "PatchCore-style anomaly detection compares wafer image statistics against normal patterns to detect unknown defect types.",
    "yolo":      "YOLOv8 performs real-time object detection by predicting both the location (bounding box) and type (class) of each defect.",
    "risk":      "Risk score is calculated from defect severity, count, confidence, and anomaly score combined into a 0-100% indicator.",
    "reject":    "Rejected wafers contain critical defects that risk semiconductor yield. Quarantine and root cause analysis are required.",
    "accept":    "Accepted wafers meet quality thresholds with minimal manufacturing risk and can continue to the next production step.",
    "spc":       "Statistical Process Control (SPC) monitors whether manufacturing processes are stable. Anomaly scores above 50% signal process drift.",
    "yield":     "Predicted yield estimates what percentage of chips on this wafer will function correctly based on defect severity and count.",
}

_NO_KEY_MSG = (
    "AI assistant is not configured. Set the GEMINI_API_KEY environment variable on the server.\n\n"
    "Fix: In your terminal, run:\n"
    "  Windows CMD:   set GEMINI_API_KEY=your_key_here\n"
    "  PowerShell:    $env:GEMINI_API_KEY=\"your_key_here\"\n"
    "  Mac/Linux:     export GEMINI_API_KEY=your_key_here\n\n"
    "Then restart uvicorn. Get a free key at: aistudio.google.com/app/apikey"
)


@router.post("/ai-chat")
async def ai_chat(data: dict):
    if not GEMINI_API_KEY:
        return {"text": _NO_KEY_MSG}

    try:
        system_text = data.get("system", "You are a wafer inspection AI assistant.")
        messages    = data.get("messages", [])
        contents    = []

        for i, msg in enumerate(messages):
            role    = "user" if msg.get("role") == "user" else "model"
            content = msg.get("content", "")
            if i == 0 and role == "user":
                content = f"{system_text}\n\n{content}"
            contents.append({"role": role, "parts": [{"text": content}]})

        url     = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        payload = {"contents": contents, "generationConfig": {"maxOutputTokens": 1000, "temperature": 0.7}}

        async with httpx.AsyncClient(timeout=30.0) as http:
            resp = await http.post(url, headers={"Content-Type": "application/json"}, json=payload)

        resp_data = resp.json()

        if resp.status_code == 200:
            ai_text = (
                resp_data.get("candidates", [{}])[0]
                .get("content", {}).get("parts", [{}])[0]
                .get("text", "No response from AI.")
            )
            return {"text": ai_text}

        # Gemini failed — local keyword fallback
        user_message = messages[-1].get("content", "").lower() if messages else ""
        for keyword, response in FALLBACK_RESPONSES.items():
            if keyword in user_message:
                return {"text": f"[Local AI Assistant]\n\n{response}"}

        error_msg = resp_data.get("error", {}).get("message", "Unknown error")
        return {"text": f"AI API error: {error_msg}\n\nTip: Make sure your GEMINI_API_KEY is valid and gemini-1.5-flash is enabled in your Google AI Studio account."}

    except httpx.TimeoutException:
        return {"text": "AI request timed out. Please try again."}
    except Exception as e:
        print("AI CHAT ERROR:", e)
        return {"text": f"AI service error: {str(e)}"}