from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from backend.processing import process_file # <--- Changed import
from backend.database import get_db_connection
import os

router = APIRouter(prefix="/data", tags=["Data Processing"])
UPLOAD_DIR = "backend/uploads"

# Request Model for Querying
class SQLQuery(BaseModel):
    query: str

@router.get("/preview/{filename}")
def preview_data(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    try:
        # Now returns {preview, table_name, columns}
        result = process_file(file_path, filename)
        return {"filename": filename, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute_sql")
def execute_sql(request: SQLQuery):
    """
    Executes a raw SQL query on our database.
    WARNING: Only for internal use/learning. Unsafe for public production.
    """
    try:
        with get_db_connection() as conn:
            # text(query) prepares the statement safely
            result = conn.execute(text(request.query))
            # Convert rows to list of dicts
            keys = result.keys()
            data = [dict(zip(keys, row)) for row in result.fetchall()]
            return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SQL Error: {str(e)}")