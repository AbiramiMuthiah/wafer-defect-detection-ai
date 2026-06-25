from datetime import datetime
from fastapi import APIRouter

from database import inspection_collection, user_collection, feedback_collection

router = APIRouter()


@router.post("/feedback")
async def submit_feedback(data: dict):
    try:
        inspection_collection.update_one(
            {"filename": data.get("filename")},
            {"$set": {
                "inspector_label": data.get("inspector_label"),
                "labeled_by":      data.get("labeled_by"),
                "labeled_at":      datetime.utcnow(),
            }},
        )
        feedback_collection.insert_one({
            "filename":        data.get("filename"),
            "inspector_label": data.get("inspector_label"),
            "labeled_by":      data.get("labeled_by"),
            "created_at":      datetime.utcnow(),
        })
        labeled_count = inspection_collection.count_documents({"inspector_label": {"$ne": None}})
        return {
            "message":       "Feedback saved successfully",
            "labeled_count": labeled_count,
            "retrain_ready": labeled_count > 0 and labeled_count % 20 == 0,
        }
    except Exception as e:
        return {"error": str(e)}


@router.post("/register")
async def register_user(data: dict):
    try:
        if user_collection.find_one({"inspectorId": data.get("inspectorId")}):
            return {"message": "User already exists"}
        data["created_at"] = datetime.utcnow()
        user_collection.insert_one(data)
        return {"message": "User registered successfully"}
    except Exception as e:
        return {"error": str(e)}