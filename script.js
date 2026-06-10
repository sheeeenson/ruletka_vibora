const MAX_SECTORS = 10;
const BASE_COLORS = ["#ff6fb5", "#ff3b4f", "#3d73ff"];
const PEARL = "#f5edf8";

const canvas = document.querySelector("#wheel");
const ctx = canvas.getContext("2d");
const spinButton = document.querySelector("#spinButton");
const result = document.querySelector("#result");
const sectorInputs = document.querySelector("#sectorInputs");
const counter = document.querySelector("#counter");

const state = {
  sectors: [],
  rotation: 0,
  isSpinning: false,
};

function normalizeAngle(angle) {
  const fullCircle = Math.PI * 2;
  return ((angle % fullCircle) + fullCircle) % fullCircle;
}

function getSectorColors(count) {
  return Array.from({ length: count }, (_, index) => {
    if (count % 2 === 1 && index === count - 1) {
      return PEARL;
    }

    return BASE_COLORS[index % BASE_COLORS.length];
  });
}

function drawWheel() {
  const { width, height } = canvas;
  const center = width / 2;
  const radius = center - 22;

  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(state.rotation);

  const sectors = state.sectors.length > 0 ? state.sectors : ["Добавьте", "секторы"];
  const colors = getSectorColors(sectors.length);
  const slice = (Math.PI * 2) / sectors.length;

  sectors.forEach((label, index) => {
    const start = index * slice - Math.PI / 2;
    const end = start + slice;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = colors[index];
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
    ctx.lineWidth = 7;
    ctx.stroke();

    ctx.save();
    ctx.rotate(start + slice / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = colors[index] === PEARL ? "#251728" : "#ffffff";
    ctx.font = "800 30px Arial, sans-serif";
    ctx.shadowColor = colors[index] === PEARL ? "transparent" : "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 7;
    wrapSectorText(label, radius - 34, 0, radius * 0.48, 31);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.lineWidth = 14;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
  ctx.stroke();

  ctx.restore();
}

function wrapSectorText(text, x, y, maxWidth, lineHeight) {
  const words = text.trim().split(/\s+/);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;

    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });

  lines.push(line);

  const visibleLines = lines.slice(0, 2);
  if (lines.length > 2) {
    visibleLines[1] = `${visibleLines[1].slice(0, 13)}...`;
  }

  const startY = y - ((visibleLines.length - 1) * lineHeight) / 2;
  visibleLines.forEach((lineText, index) => {
    ctx.fillText(lineText, x, startY + index * lineHeight);
  });
}

function renderInputs() {
  sectorInputs.innerHTML = "";

  state.sectors.forEach((sector, index) => {
    sectorInputs.appendChild(createInputRow(sector, index, true));
  });

  if (state.sectors.length < MAX_SECTORS) {
    sectorInputs.appendChild(createInputRow("", state.sectors.length, false));
  }

  counter.textContent = `${state.sectors.length} / ${MAX_SECTORS}`;
  spinButton.disabled = state.sectors.length < 2 || state.isSpinning;
}

function createInputRow(value, index, isLocked) {
  const row = document.createElement("div");
  row.className = "input-row";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = `Сектор ${index + 1}`;
  input.maxLength = 30;
  input.value = value;
  input.disabled = isLocked || state.isSpinning;
  input.setAttribute("aria-label", `Название сектора ${index + 1}`);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "confirm-button";
  button.textContent = isLocked ? "✓" : "＋";
  button.disabled = isLocked || state.isSpinning;
  button.setAttribute("aria-label", "Добавить сектор");

  function addSector() {
    const text = input.value.trim();
    if (!text || state.sectors.length >= MAX_SECTORS) return;

    state.sectors.push(text);
    result.textContent = state.sectors.length < 2 ? "Добавьте минимум 2 сектора" : "Нажмите кнопку в центре колеса";
    renderInputs();
    drawWheel();

    const nextInput = sectorInputs.querySelector("input:not(:disabled)");
    nextInput?.focus();
  }

  button.addEventListener("click", addSector);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSector();
    }
  });

  row.append(input, button);
  return row;
}

function getWinningIndex() {
  const slice = (Math.PI * 2) / state.sectors.length;
  const pointerAngle = normalizeAngle(-Math.PI / 2 - state.rotation);
  return Math.floor(pointerAngle / slice) % state.sectors.length;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function spinWheel() {
  if (state.isSpinning || state.sectors.length < 2) return;

  state.isSpinning = true;
  spinButton.disabled = true;
  result.textContent = "Крутим...";
  renderInputs();

  const duration = 3000 + Math.random() * 9000;
  const startRotation = state.rotation;
  const fullTurns = 10 + Math.random() * 18;
  const randomStop = Math.random() * Math.PI * 2;
  const totalRotation = fullTurns * Math.PI * 2 + randomStop;
  const startTime = performance.now();

  function animate(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = easeOutCubic(progress);

    state.rotation = startRotation + totalRotation * eased;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
      return;
    }

    state.rotation = normalizeAngle(state.rotation);
    state.isSpinning = false;

    const winner = state.sectors[getWinningIndex()];
    result.textContent = `Выпало: ${winner}`;
    renderInputs();
    drawWheel();
  }

  requestAnimationFrame(animate);
}

spinButton.addEventListener("click", spinWheel);

renderInputs();
drawWheel();
