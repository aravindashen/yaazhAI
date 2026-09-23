import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.config import settings
from backend.database.db import init_db, SessionLocal
from backend.database.seed_data import seed_database
from backend.routers import auth, corpus, search, study, research, voice, chat

# Ensure database is initialized immediately
init_db()
db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[YAAZH AI Engine] Startup completed. Corpus ready.")
    yield
    # Shutdown
    print("[YAAZH AI Engine] Shutdown.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Scalable, Secure, and Accessible Classical Tamil Knowledge Platform with Real RAG, OCR, and Voice Access.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Headers & Rate Limiting Middleware
request_counts = {}

@app.middleware("http")
async def security_and_rate_limit_middleware(request: Request, call_next):
    # 1. Rate Limiting per IP
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    
    if client_ip not in request_counts:
        request_counts[client_ip] = []
    request_counts[client_ip] = [t for t in request_counts[client_ip] if now - t < 60]
    
    if len(request_counts[client_ip]) >= settings.RATE_LIMIT_PER_MINUTE:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"error": "Rate limit exceeded. Please try again in a minute."}
        )
    request_counts[client_ip].append(now)

    # 2. Process Request
    response: Response = await call_next(request)

    # 3. Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    return response

# Health Check
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "corpus": {
            "worksCount": 41,
            "indexedVerses": 3,
            "conceptsCount": 3
        },
        "capabilities": {
            "hybridSearch": True,
            "tesseractOcr": True,
            "ragSynthesis": True,
            "voiceAccess": True,
            "pgvectorReady": True
        }
    }

# Include Routers
app.include_router(auth.router)
app.include_router(corpus.router)
app.include_router(search.router)
app.include_router(study.router)
app.include_router(research.router)
app.include_router(voice.router)
app.include_router(chat.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
