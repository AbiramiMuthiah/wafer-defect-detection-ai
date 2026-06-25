from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["wafer_ai"]

inspection_collection = db["inspections"]
user_collection       = db["users"]
feedback_collection   = db["feedback"]