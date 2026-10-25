import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

def _get_master_key() -> bytes:
    """Decode and validate 32-byte master encryption key"""
    raw_key = base64.b64decode(settings.APP_MASTER_ENCRYPTION_KEY)
    if len(raw_key) != 32:
        raise ValueError(f"Master encryption key must be exactly 32 bytes (256-bit). Got {len(raw_key)} bytes.")
    return raw_key

def encrypt_api_key(plain_key: str) -> dict:
    """
    Encrypts API key using AES-256-GCM.
    Returns base64-encoded ciphertext and 12-byte initialization vector (nonce).
    """
    key = _get_master_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # Cryptographically secure 12-byte random IV
    
    # Authenticated encryption (ciphertext + 16-byte MAC auth tag)
    ciphertext = aesgcm.encrypt(nonce, plain_key.encode('utf-8'), None)
    
    return {
        "encrypted_secret": base64.b64encode(ciphertext).decode('utf-8'),
        "nonce": base64.b64encode(nonce).decode('utf-8')
    }

def decrypt_api_key(encrypted_secret_b64: str, nonce_b64: str) -> str:
    """
    Decrypts API key in-memory only when sending outbound verification requests.
    Raises InvalidTag exception if data was tampered with in MongoDB.
    """
    key = _get_master_key()
    aesgcm = AESGCM(key)
    nonce = base64.b64decode(nonce_b64)
    ciphertext = base64.b64decode(encrypted_secret_b64)
    
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode('utf-8')

def mask_api_key(key: str) -> str:
    """Mask key safely for frontend dashboard displays"""
    clean = key.strip()
    if len(clean) <= 10:
        return clean[:3] + "••••" + clean[-2:]
    return clean[:7] + "••••••••" + clean[-4:]
