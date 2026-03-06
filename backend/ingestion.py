import shutil
import os
from fastapi import APIRouter, UploadFile, File, HTTPException

# Create a Router
# Concept: A "mini-app" that handles specific paths (e.g., /ingest/...)
# This keeps our code modular.
router = APIRouter(prefix="/ingest", tags=["Ingestion"])

UPLOAD_DIR = "backend/uploads"

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Receives a file stream and saves it to disk.
    """
    # Sanitize filename to prevent path traversal attacks (basic security)
    # We use os.path.basename to ensure the file is saved ONLY in our directory
    filename = os.path.basename(file.filename)
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    try:
        # Open the destination file in 'write binary' (wb) mode
        with open(file_path, "wb") as buffer:
            # shutil.copyfileobj efficiently copies the file stream object 
            # to the file on disk without loading the whole file into RAM.
            shutil.copyfileobj(file.file, buffer)
            
        return {
            "filename": filename, 
            "saved_path": file_path, 
            "message": "File uploaded successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")