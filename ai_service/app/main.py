from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json

from app.services import gemini_service, analysis_service

app = FastAPI(
    title="CivicAI AI Backend Service",
    description="FastAPI service handling Gemini multimodal queries, duplicate alerts, and maintenance forecasts",
    version="1.0.0"
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "AI service is online and active"}

@app.post("/ai/analyze-complaint")
async def analyze_complaint(
    lat: float = Form(...),
    lng: float = Form(...),
    image: Optional[UploadFile] = File(None),
    voice: Optional[UploadFile] = File(None)
):
    try:
        image_bytes = None
        voice_bytes = None
        transcript = None

        if image:
            image_bytes = await image.read()
        
        if voice:
            voice_bytes = await voice.read()
            # Simple speech mock (multimodal Gemini accepts audio, or mock fallback)
            # In mock environment we return a predefined string
            transcript = "Potholes on the road causing major traffic jam."

        if not image_bytes and not voice_bytes:
            raise HTTPException(status_code=400, detail="Must provide at least one media file (image or audio)")

        # Call Gemini service
        analysis = gemini_service.analyze_complaint_image(
            image_bytes=image_bytes if image_bytes else b"",
            audio_transcript=transcript,
            image_filename=image.filename if image else None
        )

        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

class VerifyRepairRequest(BaseModel):
    imageBeforeUrl: str

@app.post("/ai/verify-repair")
async def verify_repair(
    imageBeforeUrl: str = Form(...),
    imageAfter: UploadFile = File(...)
):
    try:
        after_bytes = await imageAfter.read()
        result = gemini_service.verify_repair_comparison(imageBeforeUrl, after_bytes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Before/After verification failed: {str(e)}")

class ActiveComplaintSchema(BaseModel):
    id: str
    lat: float
    lng: float
    category: str

class DuplicateCheckRequest(BaseModel):
    lat: float
    lng: float
    category: str
    activeComplaints: List[ActiveComplaintSchema]

@app.post("/ai/check-duplicates")
def check_duplicates(request: DuplicateCheckRequest):
    try:
        active_list = [comp.model_dump() for comp in request.activeComplaints]
        result = analysis_service.check_duplicate_complaints(
            request.lat, request.lng, request.category, active_list
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Duplicate check failed: {str(e)}")

class ComplaintHistorySchema(BaseModel):
    id: str
    category: str
    lat: float
    lng: float
    createdAt: str

class PredictiveRequest(BaseModel):
    history: List[ComplaintHistorySchema]

@app.post("/ai/predictive-maintenance")
def predictive_maintenance(request: PredictiveRequest):
    try:
        history_list = [comp.model_dump() for comp in request.history]
        result = analysis_service.predict_maintenance_trends(history_list)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Predictive analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
