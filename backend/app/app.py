from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, posts

# Create all DB tables on startup if they don't exist yet
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow the React dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded media files as static assets at /uploads/<filename>
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register route groups
app.include_router(auth.router)
app.include_router(posts.router)

# Root redirect — go straight to the posts listing
@app.get("/")
def home():
    return RedirectResponse(url="/posts/")
