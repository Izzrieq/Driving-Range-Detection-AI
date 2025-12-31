from ultralytics import YOLO

model = YOLO("yolov8n.pt")  # lightweight, good for small objects

model.train(
    data="golfball-dataset/data.yaml",
    epochs=80,
    imgsz=1280,
    batch=8,
    conf=0.25,
    device="cpu"   # ✅ FIX
)

