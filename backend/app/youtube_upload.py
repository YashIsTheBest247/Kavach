"""
YouTube auto-publish for the Awareness-Reel agent (optional, local).

Uploads a rendered reel to YouTube via the Data API v3. Requires a one-time
OAuth consent that produces a stored token, plus the Google client libraries:

    pip install google-api-python-client google-auth-oauthlib google-auth-httplib2

One-time setup (local):
  1. Create an OAuth "Desktop app" client in Google Cloud → download client_secret.json
     into backend/  (or set YOUTUBE_CLIENT_SECRET to its path).
  2. Run:  python -m app.youtube_upload   → opens a browser, writes youtube_token.json.
  3. Set ENABLE_YOUTUBE_UPLOAD=1 to let the cron/pipeline publish automatically.

Everything degrades gracefully: if the libs/token aren't present, is_configured()
returns False and the pipeline simply skips publishing.
"""
from __future__ import annotations

import os
from typing import Dict

_HERE = os.path.dirname(os.path.dirname(__file__))          # backend/


def _resolve(p: str) -> str:
    return p if os.path.isabs(p) else os.path.join(_HERE, p)


CLIENT_SECRET = _resolve(os.getenv("YOUTUBE_CLIENT_SECRET", "secrets/youtube_client_secret.json"))
TOKEN_PATH = _resolve(os.getenv("YOUTUBE_TOKEN", "secrets/youtube_token.json"))
SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]


def is_configured() -> bool:
    if not os.path.exists(TOKEN_PATH):
        return False
    try:
        import googleapiclient  # noqa: F401
        import google.oauth2.credentials  # noqa: F401
        return True
    except Exception:
        return False


def _service():
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    if not creds.valid and creds.refresh_token:
        creds.refresh(Request())
        with open(TOKEN_PATH, "w") as f:
            f.write(creds.to_json())
    return build("youtube", "v3", credentials=creds)


def upload(mp4_path: str, title: str, description: str, tags=None,
           privacy: str = "public") -> Dict:
    """Upload a video. Returns {url} or {error}."""
    if not is_configured():
        return {"ok": False, "error": "YouTube not configured (missing token or libraries)"}
    if not os.path.exists(mp4_path):
        return {"ok": False, "error": f"file not found: {mp4_path}"}
    try:
        from googleapiclient.http import MediaFileUpload
        yt = _service()
        body = {
            "snippet": {"title": title[:100], "description": description[:4900],
                        "tags": tags or ["scam awareness", "cyber fraud", "Kavach AI"],
                        "categoryId": "25"},          # News & Politics
            "status": {"privacyStatus": privacy, "selfDeclaredMadeForKids": False},
        }
        media = MediaFileUpload(mp4_path, chunksize=-1, resumable=True, mimetype="video/mp4")
        req = yt.videos().insert(part="snippet,status", body=body, media_body=media)
        resp = req.execute()
        vid = resp.get("id")
        return {"ok": True, "video_id": vid, "url": f"https://youtu.be/{vid}"}
    except Exception as e:  # pragma: no cover
        return {"ok": False, "error": str(e)}


def _run_oauth():
    import os as _os
    from google_auth_oauthlib.flow import InstalledAppFlow
    _os.makedirs(_os.path.dirname(TOKEN_PATH), exist_ok=True)
    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET, SCOPES)
    # access_type=offline + prompt=consent guarantee a refresh token is issued.
    creds = flow.run_local_server(port=0, access_type="offline", prompt="consent")
    with open(TOKEN_PATH, "w") as f:
        f.write(creds.to_json())
    print("Saved fresh token ->", TOKEN_PATH)


if __name__ == "__main__":
    _run_oauth()
