from sqlalchemy import create_engine, text

# Create a file-based SQLite database
# "sqlite:///./project.db" means "Create a file named project.db in the current folder"
DB_URL = "sqlite:///./project.db"

# The Engine is the factory that creates connections
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})

def get_db_connection():
    """Returns a raw connection to execute SQL"""
    return engine.connect()