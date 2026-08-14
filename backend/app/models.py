from datetime import datetime, timezone
from sqlalchemy import ForeignKey, String, Integer, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.database import Base

# Users table — stores account credentials and profile info
class User(Base):
    __tablename__ = "users"

    id:         Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    fullname:   Mapped[str]      = mapped_column(String, nullable=False)
    email:      Mapped[str]      = mapped_column(String, unique=True, index=True, nullable=False)
    password:   Mapped[str]      = mapped_column(String, nullable=False)  # bcrypt hash
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

# Posts table — each post belongs to a user and holds one media file
class Post(Base):
    __tablename__ = "posts"

    id:         Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    media_url:  Mapped[str]      = mapped_column(String, nullable=False)   # path to saved file
    media_type: Mapped[str]      = mapped_column(String, nullable=False)   # "image" or "video"
    caption:    Mapped[str]      = mapped_column(String, nullable=False)
    author_id:  Mapped[int]      = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # ORM relationship — lets post.author load the related User row
    author: Mapped["User"] = relationship("User", backref="posts")
