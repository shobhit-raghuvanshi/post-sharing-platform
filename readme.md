# Postly - Post sharing platform

A full-stack media-sharing web application with a **FastAPI** backend and a **Next.js** frontend. Users can register, log in, and create posts that contain an image or video with an optional caption.

<video src="fastapi_nextjs_post_sharing_app.mp4" controls width="100%"></video>

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.14, FastAPI 0.141, Uvicorn |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Database | SQLite via SQLAlchemy 2.0 |
| Validation | Pydantic 2 |
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |

---

## Project Structure

```
fastapi_crud_app/
├── backend/
│   ├── app/
│   │   ├── app.py          # FastAPI app factory, CORS, static mount
│   │   ├── database.py     # SQLAlchemy engine & session
│   │   ├── models.py       # ORM models: User, Post
│   │   ├── schemas.py      # Pydantic request/response schemas
│   │   └── routers/
│   │       ├── auth.py     # /auth/* endpoints (register, login, logout, me)
│   │       └── posts.py    # /posts/* endpoints (CRUD)
│   ├── uploads/            # Saved media files (git-ignored)
│   ├── users.db            # SQLite database (git-ignored)
│   ├── main.py             # Uvicorn entry point
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/
    │   ├── page.js             # Home / post feed
    │   ├── layout.js           # Root layout
    │   ├── login/              # Login page
    │   ├── register/           # Register page
    │   ├── create-post/        # New post form
    │   ├── my-posts/           # Authenticated user's posts
    │   ├── posts/              # Single post view
    │   ├── components/         # Shared UI components
    │   └── context/            # React context (auth state)
    ├── package.json
    └── .env.example
```

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd fastapi_crud_app
```

### 2. Backend setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv env
# Windows
env\Scripts\activate
# macOS / Linux
source env/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env        # Windows
cp .env.example .env           # macOS / Linux
```

Edit [`backend/.env`](backend/.env.example) and set a strong `SECRET_KEY`:

```env
SECRET_KEY=your-secret-key-change-this
```

Start the development server:

```bash
python main.py
```

The API will be available at **http://127.0.0.1:8000**.  
Interactive docs: **http://127.0.0.1:8000/docs**

---

### 3. Frontend setup

```bash
cd frontend

npm install

# Configure environment variables
copy .env.example .env.local   # Windows
cp .env.example .env.local      # macOS / Linux
```

Edit [`frontend/.env.local`](frontend/.env.example):

```env
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
```

Start the development server:

```bash
npm run dev
```

The app will be available at **http://localhost:3000**.

---

## API Reference

### Authentication — `/auth`

| Method | Endpoint | Auth required | Description |
|--------|----------|:---:|---|
| `POST` | `/auth/register` | No | Create a new account |
| `POST` | `/auth/login` | No | Get a JWT bearer token |
| `POST` | `/auth/logout` | Yes | Invalidate session (client-side) |
| `GET` | `/auth/me` | Yes | Get the current user's profile |

**Register request body:**
```json
{ "fullname": "Jane Doe", "email": "jane@example.com", "password": "secret" }
```

**Login** uses OAuth2 form fields (`username` = email, `password`).  
Returns `{ "access_token": "...", "token_type": "bearer" }`.

---

### Posts — `/posts`

| Method | Endpoint | Auth required | Description |
|--------|----------|:---:|---|
| `GET` | `/posts/` | No | List all posts (newest first) |
| `POST` | `/posts/` | Yes | Create a post (multipart form) |
| `GET` | `/posts/myposts` | Yes | List the current user's posts |
| `GET` | `/posts/{id}` | No | Get a single post by ID |
| `PUT` | `/posts/{id}` | Yes | Update caption and/or media (owner only) |
| `DELETE` | `/posts/{id}` | Yes | Delete a post (owner only) |

**Create / update post form fields:**
- `media` — image (`jpeg`, `png`, `gif`, `webp`) or video (`mp4`, `mov`, `webm`)
- `caption` *(optional)* — plain text

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `SECRET_KEY` | Secret used to sign JWT tokens. **Must be changed before deploying.** |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Base URL of the FastAPI backend. |

---

## Security Notes

- Passwords are **SHA-256 pre-hashed** then run through **bcrypt** to handle bcrypt's 72-byte input limit safely.
- JWTs expire after **60 minutes**.
- Logout is stateless — the client discards the token. For production, add a token blocklist or use short-lived tokens with refresh tokens.
- SQLite is used for development convenience. For production, swap `DATABASE_URL` in [`backend/app/database.py`](backend/app/database.py) for PostgreSQL or MySQL.

---

## Available Scripts

### Backend
```bash
python main.py          # Start with hot-reload (development)
uvicorn app.app:app     # Start without auto-reload
```

### Frontend
```bash
npm run dev     # Start Next.js dev server
npm run build   # Production build
npm run start   # Serve production build
npm run lint    # Run ESLint
```
