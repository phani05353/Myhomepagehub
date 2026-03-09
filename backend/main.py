import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# 1. Load environment variables (for local NASA_API_KEY)
load_dotenv()

app = FastAPI(title="Daily Space Odyssey API")

# 2. CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Secure API Key handling
NASA_API_KEY = os.getenv("NASA_API_KEY", "DEMO_KEY")

# --- PATH LOGIC START ---
# We calculate the absolute path to ensure Render finds the files regardless of start command
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Mount assets (CSS/JS) if the folder exists
assets_path = os.path.join(STATIC_DIR, "assets")
if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")
# --- PATH LOGIC END ---

@app.get("/api/apod")
async def get_apod():
    """Fetches the Astronomy Picture of the Day from NASA"""
    url = f"https://api.nasa.gov/planetary/apod?api_key={NASA_API_KEY}"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=10.0)
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"NASA API Error: {str(e)}")

@app.get("/api/mars")
async def get_mars_photos():
    """Fetches recent Mars Rover photos"""
    url = f"https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=1000&api_key={NASA_API_KEY}"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=10.0)
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Mars API Error: {str(e)}")

# 4. Catch-all route to serve the React Frontend
@app.get("/{catchall:path}")
async def serve_frontend(catchall: str):
    index_path = os.path.join(STATIC_DIR, "index.html")
    
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    # DEBUG RESPONSE: If the frontend is missing, this tells us exactly why
    return {
        "error": "Frontend build files not found",
        "debug_info": {
            "resolved_static_path": index_path,
            "base_dir": BASE_DIR,
            "cwd": os.getcwd(),
            "contents_of_base_dir": os.listdir(BASE_DIR) if os.path.exists(BASE_DIR) else "Not found"
        }
    }