from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO
import os
import uuid
import shutil
import cv2
from collections import Counter
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")

db = client["wafer_ai"]

inspection_collection = db["inspections"]

user_collection = db["users"]

app = FastAPI()

# ✅ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Folders
UPLOAD_DIR = "uploads"
RESULT_DIR = "results"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)

# ✅ Load model
model = YOLO("model/best.pt")

# ✅ Serve images
app.mount("/results", StaticFiles(directory="results"), name="results")

@app.get("/")
def root():
    return {"message": "Backend is working"}


@app.post("/inspect")
async def inspect_image(file: UploadFile = File(...)):
    try:
        # 🔹 Save file
        file_ext = os.path.splitext(file.filename)[1]
        unique_name = f"{uuid.uuid4()}{file_ext}"
        upload_path = os.path.join(UPLOAD_DIR, unique_name)

        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 🔹 Run YOLO
        results = model(upload_path)
        result = results[0]

        image = cv2.imread(upload_path)

        boxes_data = []
        defect_list = []

        critical_defects = ["scratch", "near-full"]
        moderate_defects = ["edge-loc", "edge-ring", "center", "donut", "loc", "random"]

        critical_count = 0
        moderate_count = 0

        if result.boxes is not None:
            for box in result.boxes:
                class_id = int(box.cls[0].item())
                confidence = float(box.conf[0].item())
                label = model.names[class_id]
                label_lower = label.lower()

                x1 = int(box.xyxy[0][0])
                y1 = int(box.xyxy[0][1])
                x2 = int(box.xyxy[0][2])
                y2 = int(box.xyxy[0][3])

                # 🎨 Color
                if label_lower in critical_defects:
                    color = (0, 0, 255)
                    if confidence >= 0.7:
                        critical_count += 1
                elif label_lower in moderate_defects:
                    color = (0, 165, 255)
                    if confidence >= 0.6:
                        moderate_count += 1
                else:
                    color = (0, 255, 0)

                # Draw box
                cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)

                # Label
                text = f"{label} {confidence:.2f}"
                (w, h), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)

                cv2.rectangle(image, (x1, y1 - h - 5), (x1 + w, y1), color, -1)
                cv2.putText(
                    image,
                    text,
                    (x1, y1 - 3),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (255, 255, 255),
                    1,
                    cv2.LINE_AA,
                )

                boxes_data.append({
                    "class": label,
                    "confidence": round(confidence, 2),
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2
                })

                defect_list.append(label)

        # 🔹 Save image
        result_path = os.path.join(RESULT_DIR, unique_name)
        cv2.imwrite(result_path, image)

        total_defects = len(boxes_data)

        # 🔹 No defects
        if total_defects == 0:
            return {
                "filename": file.filename,
                "total_defects": 0,
                "boxes": [],
                "main_defect": None,
                "defect_summary": {},
                "severity": "Minor",
                "decision": "Accept",
                "explanation": "No defects detected",
                "image_url": f"http://127.0.0.1:8000/results/{unique_name}"
            }

        # 🔥 DEFECT SUMMARY (FIXED)
        defect_counts = dict(Counter(defect_list))
        main_defect = max(defect_counts, key=defect_counts.get)

        avg_conf = sum(b["confidence"] for b in boxes_data) / total_defects

        # 🔥 Decision logic
        if critical_count >= 1:
            severity = "Critical"
            decision = "Reject"
        elif moderate_count >= 5:
            severity = "Moderate"
            decision = "Review"
        elif avg_conf < 0.5:
            severity = "Minor"
            decision = "Accept"
        else:
            severity = "Moderate"
            decision = "Review"

        explanation = (
            f"{total_defects} defects detected. "
            f"Most common defect: {main_defect}. "
            f"Average confidence: {round(avg_conf, 2)}. "
            f"System recommends {decision}."
        )

        risk_score = round(avg_conf * 100, 2)

        # ✅ Save inspection to MongoDB
        inspection_data = {
            "filename": file.filename,
            "main_defect": main_defect,
            "total_defects": total_defects,
            "severity": severity,
            "decision": decision,
            "risk_score": risk_score
        }

        inspection_collection.insert_one(inspection_data)

        return {
            "filename": file.filename,
            "total_defects": total_defects,
            "boxes": boxes_data,
            "main_defect": main_defect,
            "defect_summary": defect_counts,
            "severity": severity,
            "decision": decision,
            "risk_score": risk_score,
            "explanation": explanation,
            "image_url": f"http://127.0.0.1:8000/results/{unique_name}"
        }

    except Exception as e:
        print("ERROR:", e)
        return {"error": str(e)}


# ✅ Register New User
@app.post("/register")
async def register_user(data: dict):

    user_collection.insert_one(data)

    return {
        "message": "User registered successfully"
    }
    