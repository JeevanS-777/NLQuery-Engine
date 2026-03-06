from fastapi import FastAPI
from backend.ingestion import router as ingestion_router
from backend.data_routes import router as data_router
from backend.chat_routes import router as chat_router
from backend.voice_routes import router as voice_router # <--- Import

app = FastAPI(title="Data Query Assistant")

# Register routers
app.include_router(ingestion_router)
app.include_router(data_router)
app.include_router(chat_router)
app.include_router(voice_router) # <--- Connect it

@app.get("/health")
def health_check():
    return {"status": "active", "system": "backend"}
