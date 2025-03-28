from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import xml.etree.ElementTree as ET
import uuid
from typing import List, Dict, Any
import firebase_admin
from firebase_admin import credentials, firestore
import os
from pydantic import BaseModel
import json

app = FastAPI(title="Flashcard API")

# Ersetze diese URLs durch deine tatsächlichen URLs
origins = [
    "https://nanocards-client1-kd5ru.ondigitalocean.app/",  # Deine Frontend Digital Ocean URL
    "http://localhost",                                     # Für lokale Entwicklung
    "http://localhost:8000",
    "https://nanoquiz.de"                                   # Falls du eine eigene Domain nutzt
]

# CORS konfigurieren
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Firebase initialisieren
# In Produktion sollte dies über Umgebungsvariablen konfiguriert werden
try:
    cred = credentials.Certificate("./firebase-key.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
except Exception as e:
    print(f"Firebase-Fehler: {e}")
    # Fallback für Entwicklung ohne Firebase
    db = None

class Flashcard(BaseModel):
    question: str
    answer: str

class FlashcardSet(BaseModel):
    id: str
    name: str
    cards: List[Flashcard]
    
@app.get("/")
async def root():
    return {"message": "Willkommen zur Flashcard API"}

@app.post("/upload")
async def upload_flashcards(file: UploadFile = File(...)):
    if not file.filename.endswith(".xml"):
        raise HTTPException(status_code=400, detail="Nur XML-Dateien werden unterstützt")
    
    try:
        # XML-Datei parsen
        content = await file.read()
        root = ET.fromstring(content)
        
        # Flashcard-Set erstellen
        set_name = root.attrib.get("name", "Unbenanntes Set")
        set_id = str(uuid.uuid4())
        cards = []
        
        # Karten aus XML extrahieren
        for card_elem in root.findall("card"):
            question = card_elem.find("question").text if card_elem.find("question") is not None else ""
            answer = card_elem.find("answer").text if card_elem.find("answer") is not None else ""
            cards.append(Flashcard(question=question, answer=answer))
        
        flashcard_set = FlashcardSet(
            id=set_id,
            name=set_name,
            cards=cards
        )
        
        # In Firebase speichern (wenn verfügbar)
        if db:
            db.collection("flashcard_sets").document(set_id).set(
                flashcard_set.dict()
            )
            
        return JSONResponse(
            status_code=201,
            content={
                "message": "Flashcards erfolgreich hochgeladen",
                "set_id": set_id,
                "count": len(cards)
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Verarbeiten: {str(e)}")

@app.get("/sets")
async def get_sets():
    if db:
        # Sets aus Firebase abrufen
        sets_ref = db.collection("flashcard_sets").stream()
        sets = []
        for set_doc in sets_ref:
            set_data = set_doc.to_dict()
            sets.append({
                "id": set_data["id"],
                "name": set_data["name"],
                "count": len(set_data["cards"])
            })
        return sets
    else:
        # Für Entwicklung ohne Firebase
        return []

@app.get("/sets/{set_id}")
async def get_set(set_id: str):
    if db:
        set_doc = db.collection("flashcard_sets").document(set_id).get()
        if not set_doc.exists:
            raise HTTPException(status_code=404, detail="Set nicht gefunden")
        return set_doc.to_dict()
    else:
        # Für Entwicklung ohne Firebase
        raise HTTPException(status_code=501, detail="Firebase nicht konfiguriert")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)