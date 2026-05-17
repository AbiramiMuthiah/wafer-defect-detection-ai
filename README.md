Wafer Defect Detection AI

AI-powered semiconductor wafer defect detection system using YOLO, OpenCV, FastAPI, and Next.js for real-time industrial inspection analytics.

Overview

Wafer Defect Detection AI is an intelligent inspection platform designed to automate semiconductor wafer quality analysis using computer vision and deep learning.

The system detects wafer defects in real time using a YOLO-based object detection model, provides severity analysis, and delivers an interactive AI-powered inspection dashboard for industrial monitoring workflows.

This project combines:

Deep Learning
Computer Vision
Real-Time Analytics
Industrial AI
Modern Full-Stack Development
Features
AI Defect Detection
YOLOv8-based wafer defect detection
Real-time image analysis
Bounding box predictions
Confidence scoring
Industrial Inspection Dashboard
Interactive modern UI
Upload wafer images
Detection summaries
Severity indicators
Inspection analytics
AI Analytics
Defect classification
Defect count analysis
Risk severity estimation
Smart inspection reporting
Full-Stack Architecture
FastAPI backend
Next.js frontend
REST API integration
Responsive UI design
Tech Stack
AI / Machine Learning
Python
YOLOv8
OpenCV
NumPy
Ultralytics
Backend
FastAPI
Uvicorn
Frontend
Next.js
React
TypeScript
TailwindCSS
Deployment & Tools
GitHub
Vercel
VS Code

Project Architecture
Frontend (Next.js)
       ↓
FastAPI Backend
       ↓
YOLOv8 Detection Engine
       ↓
Defect Analysis & Results
       ↓
Inspection Dashboard
System Workflow
User uploads wafer image
Image sent to FastAPI backend
YOLO model performs defect detection
Defects are classified and analyzed
Detection results returned to frontend
Dashboard displays:
Defect type
Severity
Detection confidence
Inspection analytics

## Screenshots

### Dashboard

![Dashboard](assets/dashboard.png)

### Ai Assistant

![Ai Assistant](assets/aiassistant.png)

### YOLO Detection

![Detection](assets/detection.png)

### Analytics

![Analytics](assets/analytics.png)

### About Model

![About Model](assets/aboutmodel.png)

Folder Structure
wafer-defect-detection-ai/
│
├── backend/
│   ├── main.py
│   ├── model/
│   ├── uploads/
│   ├── results/
│
├── frontend/
│   ├── app/
│   ├── public/
│   ├── components/
│
├── README.md
├── package.json
└── .gitignore
Installation
Clone Repository
git clone https://github.com/AbiramiMuthiah/wafer-defect-detection-ai.git
cd wafer-defect-detection-ai
Backend Setup
cd backend

Create virtual environment:

python -m venv venv

Activate environment:

Windows
venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Run backend:

uvicorn main:app --reload

Backend runs on:

http://127.0.0.1:8000
Frontend Setup

Open another terminal:

cd frontend

Install dependencies:

npm install

Run frontend:

npm run dev

Frontend runs on:

http://localhost:3000
API Endpoint
Inspect Wafer Image
POST /inspect-image
Input
Wafer image file
Output
{
  "main_defect": "Scratch",
  "severity": "High",
  "confidence": 0.94,
  "total_defects": 3
}
Future Improvements
Real-time webcam inspection
Edge AI deployment
Factory integration system
Explainable AI module
Multi-defect segmentation
Cloud-based analytics
Automated report generation
Use Cases
Semiconductor manufacturing
Industrial quality inspection
Smart factory automation
AI-based defect analysis
Production monitoring systems

Author:
Abirami Muthiah

Applied AI Engineer & Data Science Developer

AI Systems
Computer Vision
NLP
Industrial AI
Deep Learning

GitHub:

https://github.com/AbiramiMuthiah

License:

This project is licensed under the MIT License.

Project Status:

Actively under development and continuously improving with new AI inspection capabilities and advanced analytics features.