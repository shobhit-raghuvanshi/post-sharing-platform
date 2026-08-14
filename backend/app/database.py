from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# SQLite file-based database stored at ./users.db
DATABASE_URL = "sqlite:///./users.db"

# check_same_thread=False lets SQLite work across FastAPI's async threads
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Session factory — autocommit/autoflush off so we control transactions manually
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class all ORM models inherit from
class Base(DeclarativeBase):
    pass

# Dependency that yields a DB session per request, then closes it
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
