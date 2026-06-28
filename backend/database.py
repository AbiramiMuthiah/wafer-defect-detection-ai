import os
from pymongo import MongoClient

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(
    MONGO_URI,
    tls=True,
    tlsAllowInvalidCertificates=True
)
db = client["wafer_ai"]

inspection_collection = db["inspections"]
user_collection       = db["users"]
feedback_collection   = db["feedback"]