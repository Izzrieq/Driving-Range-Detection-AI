from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

latest_balls = []

@app.post("/balls")
def receive_balls(data: dict):
    global latest_balls
    latest_balls = data["balls"]
    return {"status": "ok"}

@app.get("/balls")
def get_balls():
    return {"balls": latest_balls}
