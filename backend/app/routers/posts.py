import os, uuid, shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import Post, User
from app.schemas import PostResponse
from app.routers.auth import get_current_user

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_IMAGE = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_VIDEO = {"video/mp4", "video/quicktime", "video/webm"}

router = APIRouter(prefix="/posts", tags=["posts"])

@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    caption: str | None = Form(None),
    media:   UploadFile  = File(...),
    db:      Session     = Depends(get_db),
    current_user: User   = Depends(get_current_user),
):
    if media.content_type in ALLOWED_IMAGE:
        media_type = "image"
    elif media.content_type in ALLOWED_VIDEO:
        media_type = "video"
    else:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {media.content_type}",
        )

    ext      = os.path.splitext(media.filename or "file")[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        shutil.copyfileobj(media.file, f)

    post = Post(
        media_url  = filepath,
        media_type = media_type,
        caption    = caption,
        author_id  = current_user.id,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

@router.get("/myposts", response_model=list[PostResponse])
def my_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Post)
        .filter(Post.author_id == current_user.id)
        .order_by(Post.created_at.desc())
        .all()
    )

@router.get("/", response_model=list[PostResponse])
def list_posts(db: Session = Depends(get_db)):
    return db.query(Post).order_by(Post.created_at.desc()).all()

@router.get("/{post_id}", response_model=PostResponse)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.put("/{post_id}", response_model=PostResponse)
def edit_post(
    post_id: int,
    caption: Optional[str] = Form(None),
    media: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your post")

    if caption is not None:
        post.caption = caption

    if media is not None:
        if media.content_type in ALLOWED_IMAGE:
            new_media_type = "image"
        elif media.content_type in ALLOWED_VIDEO:
            new_media_type = "video"
        else:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported file type: {media.content_type}",
            )

        if os.path.exists(str(post.media_url)):
            os.remove(str(post.media_url))

        ext = os.path.splitext(media.filename or "file")[1]
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            shutil.copyfileobj(media.file, f)

        post.media_url = filepath
        post.media_type = new_media_type

    db.commit()
    db.refresh(post)
    return post

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your post")

    if os.path.exists(str(post.media_url)):
        os.remove(str(post.media_url))

    db.delete(post)
    db.commit()