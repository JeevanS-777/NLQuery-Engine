import re
from sqlalchemy import text
from backend.database import get_db_connection
from backend.nlp.llm_client import llm_client

class SQLGenerator:
    def __init__(self):
        pass

    def validate_sql(self, query: str) -> bool:
        """
        Safety Check: Ensure the query is Read-Only.
        We strictly block any command that could alter the database.
        """
        forbidden_keywords = ["DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "TRUNCATE"]
        upper_query = query.upper()
        
        # 1. Check for forbidden keywords
        for keyword in forbidden_keywords:
            if keyword in upper_query:
                return False
        
        # 2. Ensure it starts with SELECT or WITH (for CTEs)
        # Regex looks for SELECT/WITH at the start, ignoring whitespace
        if not re.match(r'^\s*(SELECT|WITH)', upper_query):
            return False
            
        return True

    def generate_sql(self, question: str, schema_context: str) -> str:
        """
        Asks the LLM to convert a question into a SQLite query.
        """
        system_prompt = (
            "You are a SQLite Expert. Convert the user's question into a valid SQL query based on the schema provided.\n"
            "RULES:\n"
            "1. Output ONLY the raw SQL query. Do not use Markdown blocks (```sql). Do not add explanations.\n"
            "2. Use the exact table names and column names from the schema.\n"
            "3. The query must be a valid SQLite SELECT statement.\n"
            "4. If the question cannot be answered with SQL, return the string 'NO_QUERY'."
        )
        
        full_prompt = f"{schema_context}\n\nUser Question: {question}"
        
        response = llm_client.generate_response(prompt=full_prompt, system_role=system_prompt)
        
        # Clean up: Remove markdown if the LLM disobeyed
        clean_sql = response.strip().replace("```sql", "").replace("```", "")
        return clean_sql

    def execute_query(self, sql: str):
        """
        Runs the SQL against the database and returns the rows.
        """
        if not self.validate_sql(sql):
            return {"error": "Safety Alert: Query blocked because it may modify data."}
            
        try:
            with get_db_connection() as conn:
                result = conn.execute(text(sql))
                keys = result.keys()
                # Convert rows to list of dicts for JSON serialization
                data = [dict(zip(keys, row)) for row in result.fetchall()]
                return {"columns": list(keys), "data": data}
        except Exception as e:
            return {"error": f"Database Error: {str(e)}"}

sql_engine = SQLGenerator()