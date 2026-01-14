function formatClock(date) {
  return date.toLocaleTimeString("en-GB", { hour12: false });
}

function updateClock() {
  const el = document.getElementById("clock");
  if (!el) return;
  el.textContent = formatClock(new Date());
}

function mapToGauge(value, min, max) {
  const clamped = Math.min(Math.max(value, min), max);
  const ratio = (clamped - min) / (max - min);
  const maxDash = 180;
  return `${maxDash * ratio} ${maxDash}`;
}

function updateGauge(id, value, min, max) {
  const path = document.getElementById(id);
  if (!path) return;
  path.setAttribute("stroke-dasharray", mapToGauge(value, min, max));
}

function setTrend(elId, diff) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (diff > 0) {
    el.textContent = `+${diff.toFixed(1)} from last`;
    el.style.color = "#16a34a";
  } else if (diff < 0) {
    el.textContent = `${diff.toFixed(1)} from last`;
    el.style.color = "#ef4444";
  } else {
    el.textContent = "no change";
    el.style.color = "#6b7280";
  }
}

function setStatusBadge(elId, status) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = status;
  if (status === "NORMAL") {
    el.className = "metric-badge metric-normal";
  } else {
    el.className = "metric-badge";
    el.style.background = "rgba(248, 113, 113, 0.12)";
    el.style.color = "#ef4444";
  }
}

function secondsDiff(a, b) {
  return (a.getTime() - b.getTime()) / 1000;
}

let lastReadingTime = null;
let firstReadingTime = null;

async function fetchSensorHistory() {
  try {
    const res = await fetch("/api/iot/history");
    if (!res.ok) throw new Error("Network error");
    const body = await res.json();
    const items = Array.isArray(body.data) ? body.data : [];
    if (!items.length) return;

    const last = items[items.length - 1];
    const prev = items.length > 1 ? items[items.length - 2] : null;

    const suhu = Number(last.suhu ?? 0);
    const kelembaban = Number(last.kelembaban ?? 0);

    const tempValueEl = document.getElementById("temp-value");
    const humValueEl = document.getElementById("hum-value");
    if (tempValueEl) tempValueEl.textContent = suhu.toFixed(1);
    if (humValueEl) humValueEl.textContent = kelembaban.toFixed(1);

    updateGauge("temp-gauge", suhu, 0, 50);
    updateGauge("hum-gauge", kelembaban, 0, 100);

    if (prev) {
      const diffTemp = suhu - Number(prev.suhu ?? 0);
      const diffHum = kelembaban - Number(prev.kelembaban ?? 0);
      setTrend("temp-trend", diffTemp);
      setTrend("hum-trend", diffHum);
    }

    const tempStatus = suhu > 32 || suhu < 15 ? "ALERT" : "NORMAL";
    const humStatus = kelembaban > 80 || kelembaban < 30 ? "ALERT" : "NORMAL";
    setStatusBadge("temp-status", tempStatus);
    setStatusBadge("hum-status", humStatus);

    const createdAt = last.createdAt ? new Date(last.createdAt) : new Date();
    lastReadingTime = createdAt;
    if (!firstReadingTime) firstReadingTime = createdAt;

    const lastEl = document.getElementById("last-reading");
    if (lastEl) {
      lastEl.textContent = createdAt.toLocaleTimeString("en-GB", {
        hour12: false,
      });
    }

    const uptimeEl = document.getElementById("uptime-value");
    if (uptimeEl && firstReadingTime) {
      const seconds = Math.max(0, secondsDiff(createdAt, firstReadingTime));
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      uptimeEl.textContent = `${hours}h ${minutes}m`;
    }

    const grid = document.getElementById("realtime-grid");
    if (grid) {
      const motion = last.motion ? "Detected" : "No motion";
      const cahaya = Number(last.cahaya ?? 0);
      grid.innerHTML = "";
      const pills = [
        { label: "Temperature", value: `${suhu.toFixed(1)} °C` },
        { label: "Humidity", value: `${kelembaban.toFixed(1)} %` },
        { label: "Light", value: `${cahaya} lx` },
        { label: "Motion", value: motion },
      ];
      for (const pill of pills) {
        const div = document.createElement("div");
        div.className = "realtime-pill";
        const label = document.createElement("span");
        label.className = "realtime-pill-label";
        label.textContent = pill.label;
        const value = document.createElement("span");
        value.className = "realtime-pill-value";
        value.textContent = pill.value;
        div.appendChild(label);
        div.appendChild(value);
        grid.appendChild(div);
      }
    }
  } catch (err) {
    console.error("Failed to load sensor history", err);
  }
}

function init() {
  updateClock();
  setInterval(updateClock, 1000);
  fetchSensorHistory();
  setInterval(fetchSensorHistory, 5000);
}

window.addEventListener("DOMContentLoaded", init);

