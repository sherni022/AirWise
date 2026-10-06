let port = null;
let reader = null;
let keepReading = false;
let buffer = "";

const temperatureEl = document.getElementById("temperature");
const humidityEl = document.getElementById("humidity");
const lightEl = document.getElementById("light");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const scoreMessageEl = document.getElementById("scoreMessage");
const recommendationsEl = document.getElementById("recommendations");
const connectBtn = document.getElementById("connectBtn");
const connectionStatus = document.getElementById("connectionStatus");

function analyze(temperature, humidity, light) {
  let score = 100;
  const recommendations = [];

  if (temperature > 32) {
    score -= 20;
    recommendations.push("Temperature is high. Improve ventilation or cooling.");
  } else if (temperature > 30) {
    score -= 10;
    recommendations.push("Temperature is slightly high. Improve airflow if possible.");
  }

  if (humidity > 70) {
    score -= 20;
    recommendations.push("Humidity is high. Improve room ventilation.");
  } else if (humidity > 60) {
    score -= 10;
    recommendations.push("Humidity is slightly high. Consider improving ventilation.");
  }

  if (light < 300) {
    score -= 5;
    recommendations.push("Light intensity is low. Consider improving room lighting.");
  }

  let status;
  if (score >= 80) status = "GOOD";
  else if (score >= 60) status = "MODERATE";
  else status = "POOR";

  if (recommendations.length === 0) {
    recommendations.push("Indoor environmental conditions are currently comfortable.");
  }

  updateDashboard(temperature, humidity, light, score, status, recommendations);
}

function updateDashboard(temperature, humidity, light, score, status, recommendations) {
  temperatureEl.textContent = Number(temperature).toFixed(1);
  humidityEl.textContent = Number(humidity).toFixed(1);
  lightEl.textContent = light;
  scoreEl.textContent = score;

  statusEl.textContent = status;
  statusEl.className = "status-pill " + status.toLowerCase();

  if (status === "GOOD") {
    scoreMessageEl.textContent = "Current conditions are within the prototype's comfortable range.";
  } else if (status === "MODERATE") {
    scoreMessageEl.textContent = "Some environmental conditions may need attention.";
  } else {
    scoreMessageEl.textContent = "One or more environmental parameters need attention.";
  }

  recommendationsEl.innerHTML = "";
  recommendations.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    recommendationsEl.appendChild(li);
  });
}

function setConnectedUI(connected) {
  if (connected) {
    connectionStatus.className = "status-card connected";
    connectionStatus.querySelector("strong").textContent = "Arduino connected";
    connectionStatus.querySelector("small").textContent = "Receiving live sensor data";
    connectBtn.textContent = "Disconnect";
  } else {
    connectionStatus.className = "status-card disconnected";
    connectionStatus.querySelector("strong").textContent = "Arduino disconnected";
    connectionStatus.querySelector("small").textContent = "Click Connect Arduino to begin";
    connectBtn.textContent = "Connect Arduino";
  }
}

async function connectArduino() {
  if (!("serial" in navigator)) {
    alert("Web Serial is not supported in this browser. Use Google Chrome or Microsoft Edge.");
    return;
  }

  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    setConnectedUI(true);
    keepReading = true;
    readSerial();
  } catch (error) {
    console.error(error);
    alert("Could not connect to the Arduino. Make sure the Serial Monitor is closed and try again.");
  }
}

async function disconnectArduino() {
  keepReading = false;

  try {
    if (reader) {
      await reader.cancel();
      reader.releaseLock();
      reader = null;
    }
  } catch (error) {
    console.error(error);
  }

  try {
    if (port) await port.close();
  } catch (error) {
    console.error(error);
  }

  port = null;
  setConnectedUI(false);
}

async function readSerial() {
  const decoder = new TextDecoderStream();
  const readableStreamClosed = port.readable.pipeTo(decoder.writable);
  reader = decoder.readable.getReader();

  try {
    while (keepReading) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        buffer += value;
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop();

        for (const line of lines) {
          parseLine(line.trim());
        }
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    try {
      reader.releaseLock();
    } catch (e) {}
    reader = null;
    try {
      await readableStreamClosed;
    } catch (e) {}
  }
}

function parseLine(line) {
  if (!line) return;

  // Expected Arduino format:
  // Temperature: 24.5 °C | Humidity: 52.3 % | Light: 650
  const match = line.match(
    /Temperature:\s*(-?\d+(?:\.\d+)?)\s*.*Humidity:\s*(-?\d+(?:\.\d+)?)\s*.*Light:\s*(\d+)/
  );

  if (match) {
    const temperature = parseFloat(match[1]);
    const humidity = parseFloat(match[2]);
    const light = parseInt(match[3], 10);

    if (
      Number.isFinite(temperature) &&
      Number.isFinite(humidity) &&
      Number.isFinite(light)
    ) {
      analyze(temperature, humidity, light);
    }
  }
}

connectBtn.addEventListener("click", () => {
  if (port) disconnectArduino();
  else connectArduino();
});

document.getElementById("manualBtn").addEventListener("click", () => {
  const temperature = parseFloat(document.getElementById("manualTemp").value);
  const humidity = parseFloat(document.getElementById("manualHumidity").value);
  const light = parseInt(document.getElementById("manualLight").value, 10);

  if (
    Number.isFinite(temperature) &&
    Number.isFinite(humidity) &&
    Number.isFinite(light)
  ) {
    analyze(temperature, humidity, light);
  }
});

if ("serial" in navigator) {
  navigator.serial.addEventListener("disconnect", () => {
    disconnectArduino();
  });
}
