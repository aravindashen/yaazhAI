import re
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.config import settings

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security_bearer = HTTPBearer(auto_error=False)

# Prompt Injection Patterns (multi-lingual security filter)
SUSPICIOUS_PROMPT_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"you\s+are\s+now\s+(unrestricted|DAN|jailbroken)",
    r"disregard\s+the\s+above",
    r"bypass\s+(safety|filter|guardrail)",
    r"system\s+prompt\s+override",
    r"reveal\s+(api\s+key|password|credentials|secret)",
    r"drop\s+table",
    r"union\s+select",
    r"<script[\s\S]*?>",
]

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def sanitize_input(text: str) -> str:
    """Sanitize input text and detect prompt injection attempts."""
    if not text:
        return ""
    
    clean_text = text.strip()
    
    # Check for prompt injection attempts
    for pattern in SUSPICIOUS_PROMPT_PATTERNS:
        if re.search(pattern, clean_text, re.IGNORECASE):
            # Cleanly neutralize the attack vector rather than crashing
            clean_text = re.sub(pattern, "[FILTERED_SECURITY_FLAG]", clean_text, flags=re.IGNORECASE)
            
    # Limit max length to prevent DOS
    if len(clean_text) > 10000:
        clean_text = clean_text[:10000]
        
    return clean_text

def validate_uploaded_file(file_content: bytes, content_type: str, filename: str) -> None:
    """Validate uploaded image or document against size, MIME, and magic bytes."""
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(file_content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds limit of {settings.MAX_UPLOAD_SIZE_MB}MB"
        )
    
    if content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{content_type}'. Allowed types: {', '.join(settings.ALLOWED_IMAGE_TYPES)}"
        )
    
    # Magic bytes check for security
    if content_type == "image/jpeg" and not file_content.startswith(b"\xff\xd8\xff"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Corrupted or invalid JPEG file header")
    elif content_type == "image/png" and not file_content.startswith(b"\x89PNG\r\n\x1a\n"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Corrupted or invalid PNG file header")
    elif content_type == "application/pdf" and not file_content.startswith(b"%PDF-"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Corrupted or invalid PDF file header")

async def get_current_user_optional(auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Optional[Dict[str, Any]]:
    if not auth:
        return None
    payload = decode_access_token(auth.credentials)
    return payload
