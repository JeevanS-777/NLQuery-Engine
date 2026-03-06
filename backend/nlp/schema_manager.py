from sqlalchemy import inspect, text
from backend.database import engine

def get_table_schema_with_samples(table_name: str) -> str:
    """
    Introspects the database to generate a text representation 
    of the table schema, enriched with sample data for better context.
    """
    inspector = inspect(engine)
    
    if table_name not in inspector.get_table_names():
        return f"Table '{table_name}' does not exist."

    columns = inspector.get_columns(table_name)
    
    # Base Schema String
    schema_parts = [f"CREATE TABLE {table_name} ("]
    for c in columns:
        # Use a cleaner type representation
        col_type = str(c['type']).split('(')[0] # Turns BIGINT(10) into BIGINT
        schema_parts.append(f"  {c['name']} {col_type},")
    schema_parts.append(");")
    
    # Sample Data Enrichment
    try:
        with engine.connect() as connection:
            # Safely query the first 3 rows
            query = text(f'SELECT * FROM "{table_name}" LIMIT 3;')
            sample_result = connection.execute(query).fetchall()
            
            if sample_result:
                schema_parts.append("\n/*")
                schema_parts.append(f"3 sample rows from {table_name}:")
                # Format headers
                headers = sample_result[0].keys()
                schema_parts.append(" | ".join(headers))
                # Format rows
                for row in sample_result:
                    schema_parts.append(" | ".join(str(v) for v in row))
                schema_parts.append("*/")

    except Exception as e:
        print(f"Could not fetch sample data for {table_name}: {e}")

    return "\n".join(schema_parts)