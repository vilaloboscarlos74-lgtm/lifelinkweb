import cloudinary
import cloudinary.uploader
from app.config import get_settings

_configured = False


def _configure():
    global _configured
    if _configured:
        return
    settings = get_settings()
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )
    _configured = True


def upload_image(content: bytes, folder: str) -> str:
    _configure()
    result = cloudinary.uploader.upload(content, folder=folder, resource_type="image")
    return result["secure_url"]


def delete_image(url: str) -> None:
    if not url or not url.startswith("http"):
        return
    _configure()
    try:
        # URL: https://res.cloudinary.com/{cloud}/image/upload/v{ver}/{public_id}.{ext}
        parts = url.split("/upload/")
        if len(parts) != 2:
            return
        public_id_part = parts[1]
        # Strip version prefix (v1234567890/)
        if public_id_part.startswith("v") and "/" in public_id_part:
            public_id_part = public_id_part.split("/", 1)[1]
        public_id = public_id_part.rsplit(".", 1)[0]
        cloudinary.uploader.destroy(public_id)
    except Exception:
        pass
