import os
import ssl
from pymongo import MongoClient

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")

if "mongodb+srv" in MONGO_URI:
    client = MongoClient(
        MONGO_URI,
        ssl=True,
        ssl_cert_reqs=ssl.CERT_NONE,
        serverSelectionTimeoutMS=30000
    )
else:
    client = MongoClient(MONGO_URI)

db = client["wafer_ai"]

inspection_collection = db["inspections"]
user_collection       = db["users"]
feedback_collection   = db["feedback"]