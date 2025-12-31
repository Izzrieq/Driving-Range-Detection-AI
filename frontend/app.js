const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d");

canvas.width = 1200;
canvas.height = 600;

const ROWS = 3;
const COLS = 4;

const DIST_TH = 20; // px, same ball threshold
const MAX_MISSES = 10; // frames before ball disappears
const BALL_LIFETIME = 10000; // 10 seconds (IMPORTANT)

const LOW_TH = 5;
const MID_TH = 15;

let ballsTracked = [];
let nextId = 1;

function zoneColor(count) {
  if (count >= MID_TH) return "rgba(255,0,0,0.6)";
  if (count >= LOW_TH) return "rgba(255,215,0,0.6)";
  return "rgba(0,128,0,0.6)";
}

function drawGrid() {
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;

  for (let i = 1; i < COLS; i++) {
    ctx.beginPath();
    ctx.moveTo((i * canvas.width) / COLS, 0);
    ctx.lineTo((i * canvas.width) / COLS, canvas.height);
    ctx.stroke();
  }

  for (let i = 1; i < ROWS; i++) {
    ctx.beginPath();
    ctx.moveTo(0, (i * canvas.height) / ROWS);
    ctx.lineTo(canvas.width, (i * canvas.height) / ROWS);
    ctx.stroke();
  }
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

async function update() {
  const res = await fetch("http://localhost:8000/balls");
  const data = await res.json();
  const now = Date.now();

  // Mark all tracked balls as missed
  ballsTracked.forEach((b) => b.missed++);

  // Match detections to tracked balls
  data.balls.forEach((det) => {
    const x = (det.x / det.w) * canvas.width;
    const y = (det.y / det.h) * canvas.height;

    let matched = null;

    for (let b of ballsTracked) {
      if (distance(b, { x, y }) < DIST_TH) {
        matched = b;
        break;
      }
    }

    if (matched) {
      matched.x = x;
      matched.y = y;
      matched.missed = 0;
    } else {
      // New ball (COUNT ONCE)
      ballsTracked.push({
        id: nextId++,
        x,
        y,
        createdAt: now,
        missed: 0,
      });
    }
  });

  // Remove expired or lost balls
  ballsTracked = ballsTracked.filter(
    (b) => b.missed < MAX_MISSES && now - b.createdAt < BALL_LIFETIME
  );

  // ---------- Compute zone density from ACTIVE balls ----------
  const zoneCount = Array(ROWS * COLS).fill(0);

  ballsTracked.forEach((b) => {
    const col = Math.floor(b.x / (canvas.width / COLS));
    const row = Math.floor(b.y / (canvas.height / ROWS));
    const idx = row * COLS + col;

    if (idx >= 0 && idx < zoneCount.length) {
      zoneCount[idx]++;
    }
  });

  // ---------- Draw ----------
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Heatmap
  zoneCount.forEach((count, i) => {
    const x = (i % COLS) * (canvas.width / COLS);
    const y = Math.floor(i / COLS) * (canvas.height / ROWS);
    ctx.fillStyle = zoneColor(count);
    ctx.fillRect(x, y, canvas.width / COLS, canvas.height / ROWS);

    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(count, x + 10, y + 25);
  });

  // Ball dots (ONE per physical ball)
  ctx.fillStyle = "white";
  ballsTracked.forEach((b) => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  drawGrid();
}

setInterval(update, 200);
