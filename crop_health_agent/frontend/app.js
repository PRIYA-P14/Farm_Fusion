/* app.js — Crop Health Agent Frontend */

const API_BASE = "http://127.0.0.1:8005";

const fileInput     = document.getElementById("fileInput");
const uploadZone    = document.getElementById("uploadZone");
const uploadInner   = document.getElementById("uploadInner");
const preview       = document.getElementById("preview");
const cropSelect    = document.getElementById("cropSelect");
const predictBtn    = document.getElementById("predictBtn");
const backBtn       = document.getElementById("backBtn");
const errorBox      = document.getElementById("errorBox");
const emptyState    = document.getElementById("emptyState");
const resultsEl     = document.getElementById("results");
const loaderOverlay = document.getElementById("loaderOverlay");

let selectedFile = null;

// ── Upload zone interactions ──────────────────────────────────────────────
uploadZone.addEventListener("click", () => fileInput.click());

uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("drag-over");
});
uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("drag-over"));
uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

function handleFile(file) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    showError("Invalid file type. Please upload a JPEG, PNG, or WEBP image.");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showError("File too large. Maximum size is 10 MB.");
    return;
  }
  clearError();
  selectedFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    preview.src = e.target.result;
    preview.style.display = "block";
    uploadInner.style.display = "none";
  };
  reader.readAsDataURL(file);
  predictBtn.disabled = false;
}

// ── Error helpers ─────────────────────────────────────────────────────────
function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = "block";
}
function clearError() {
  errorBox.textContent = "";
  errorBox.style.display = "none";
}

// ── Loader ────────────────────────────────────────────────────────────────
function showLoader() { loaderOverlay.classList.add("active"); }
function hideLoader() { loaderOverlay.classList.remove("active"); }

// ── Back / Reset ──────────────────────────────────────────────────────────
backBtn.addEventListener("click", () => {
  selectedFile = null;
  fileInput.value = "";
  preview.src = "";
  preview.style.display = "none";
  uploadInner.style.display = "block";

  resultsEl.style.display = "none";
  resultsEl.innerHTML = "";
  emptyState.style.display = "flex";

  predictBtn.style.display = "block";
  predictBtn.disabled = true;
  backBtn.style.display = "none";

  clearError();
});

// ── Predict ───────────────────────────────────────────────────────────────
predictBtn.addEventListener("click", async () => {
  if (!selectedFile) { showError("Please upload a leaf image first."); return; }
  clearError();
  showLoader();
  predictBtn.disabled = true;

  const formData = new FormData();
  formData.append("file", selectedFile);
  formData.append("crop", cropSelect.value);

  try {
    const res = await fetch(`${API_BASE}/predict`, { method: "POST", body: formData });

    if (res.status === 503) {
      const err = await res.json();
      throw new Error(err.detail || "Model not ready. Run train_model.py first.");
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed." }));
      throw new Error(err.detail || "Request failed.");
    }

    const data = await res.json();
    renderResults(data);
    predictBtn.style.display = "none";
    backBtn.style.display = "block";
  } catch (e) {
    showError(e.message || "Could not reach the API. Make sure the backend is running.");
  } finally {
    hideLoader();
    predictBtn.disabled = false;
  }
});

// ── Render results ────────────────────────────────────────────────────────
function renderResults(d) {
  emptyState.style.display = "none";
  resultsEl.style.display = "block";

  const isHealthy = d.disease === "Healthy";
  const riskClass = `risk-${d.spread_risk}`;

  const preventionHtml = Array.isArray(d.prevention)
    ? `<ul>${d.prevention.map(p => `<li>${p}</li>`).join("")}</ul>`
    : `<p>${d.prevention}</p>`;

  const symptomsHtml = Array.isArray(d.symptoms) && d.symptoms.length
    ? `<ul>${d.symptoms.map(s => `<li>${s}</li>`).join("")}</ul>`
    : "<p>No symptoms data.</p>";

  resultsEl.innerHTML = `
    <div class="result-header">
      <div class="result-crop">${d.crop}</div>
      <div class="confidence-badge">Confidence: ${d.confidence}%</div>
    </div>

    <div class="disease-hero">
      <div class="disease-name">${d.disease}</div>
      <div class="scientific-name">${d.scientific_name !== "N/A" ? `<em>${d.scientific_name}</em>` : ""}</div>
      <div class="risk-pill ${riskClass}">Spread Risk: ${d.spread_risk}</div>
    </div>

    ${!isHealthy ? `
    <div class="urgency-banner">
      <strong>Urgency</strong>
      ${d.urgency}
    </div>` : ""}

    <div class="info-grid">
      <div class="info-card">
        <h4>Symptoms</h4>
        ${symptomsHtml}
      </div>
      <div class="info-card">
        <h4>Nutrient Deficiency</h4>
        <p>${d.nutrient_deficiency}</p>
      </div>
      <div class="info-card">
        <h4>Treatment</h4>
        <p>${d.treatment}</p>
        ${d.organic_treatment ? `<p style="margin-top:8px;color:var(--green-light);font-size:12px;">🌿 Organic: ${d.organic_treatment}</p>` : ""}
        ${d.chemical_treatment ? `<p style="margin-top:4px;color:var(--rust-light);font-size:12px;">⚗️ Chemical: ${d.chemical_treatment}</p>` : ""}
      </div>
      <div class="info-card">
        <h4>Fertilizer & Pesticide</h4>
        <p><strong style="color:var(--chalk-dim);font-size:11px;">FERTILIZER</strong><br>${d.fertilizer}</p>
        <p style="margin-top:8px;"><strong style="color:var(--chalk-dim);font-size:11px;">PESTICIDE</strong><br>${d.pesticide}</p>
      </div>
      <div class="info-card" style="grid-column: span 2;">
        <h4>Prevention Tips</h4>
        ${preventionHtml}
      </div>
    </div>

    ${d.recovery_time_days > 0 ? `
    <div class="urgency-banner" style="border-color:var(--green-light);">
      <strong>Recovery Estimate</strong>
      Approximately ${d.recovery_time_days} days with proper treatment.
    </div>` : ""}
  `;
}
