import pandas as pd
import os
import re
from backend.database import engine
from pypdf import PdfReader

def sanitize_table_name(filename: str) -> str:
    """
    Converts filenames like 'My Data (2023).csv' into safe SQL names 'my_data_2023'.
    """
    name = os.path.splitext(filename)[0]
    name = re.sub(r'\W+', '_', name)
    return name.lower()

def read_pdf_text(file_path: str):
    """
    Extracts raw text from PDF for unstructured context.
    """
    try:
        reader = PdfReader(file_path)
        # Extract text from the first page as a sample
        if len(reader.pages) > 0:
            text = reader.pages[0].extract_text()
            return [{"Page": 1, "Content": text[:1000] + "..."}]
        return [{"Page": 1, "Content": "Empty PDF"}]
    except Exception as e:
        raise ValueError(f"Could not read PDF: {str(e)}")

def process_file(file_path: str, filename: str):
    """
    Ingests raw file -> Standardizes Dates -> Saves to SQLite -> Returns Preview.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    # 1. Load Data
    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    elif file_path.endswith(".xlsx"):
        df = pd.read_excel(file_path)
    elif file_path.endswith(".pdf"):
        return read_pdf_text(file_path)
    else:
        raise ValueError("Unsupported format")

    # 2. Date Standardization (Critical for SQL comparisons)
    # We attempt to convert every object column to datetime.
    # If successful, we force it to 'YYYY-MM-DD' string format.
    for col in df.columns:
        if df[col].dtype == 'object':
            try:
                df[col] = pd.to_datetime(df[col])
                df[col] = df[col].dt.strftime('%Y-%m-%d')
            except (ValueError, TypeError):
                # Keep original data if it's not a date
                continue

    # 3. Handle Missing Values (JSON compliance)
    df = df.fillna("")

    # 4. Save to Database
    table_name = sanitize_table_name(filename)
    df.to_sql(table_name, engine, if_exists='replace', index=False)

    return {
        "preview": df.head(100).to_dict(orient="records"), # Increased preview limit
        "table_name": table_name,
        "columns": list(df.columns)
    }
