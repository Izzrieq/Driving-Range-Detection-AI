import cv2
import requests
from ultralytics import YOLO

MODEL_PATH = "models/best.pt"
BACKEND_URL = "http://localhost:8000/balls"

model = YOLO(MODEL_PATH, verbose=False)
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    h, w, _ = frame.shape

    results = model(frame, conf=0.05, device="cpu", verbose=False)

    balls = []

    for r in results:
        for box in r.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cx = int((x1 + x2) / 2)
            cy = int((y1 + y2) / 2)

            balls.append({
                "x": cx,
                "y": cy,
                "w": w,
                "h": h
            })

            cv2.circle(frame, (cx, cy), 2, (255, 255, 255), -1)

    # Send to backend
    requests.post(BACKEND_URL, json={"balls": balls})

    cv2.imshow("Detection", frame)
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
