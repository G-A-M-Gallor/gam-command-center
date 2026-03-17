// vClip Popup — controls for starting a recording session

const startBtn = document.getElementById("startBtn");
const statusEl = document.getElementById("status");
const enableCamera = document.getElementById("enableCamera");
const enableMic = document.getElementById("enableMic");
const enableSystemAudio = document.getElementById("enableSystemAudio");
const bubbleSize = document.getElementById("bubbleSize");
const bubbleOptions = document.getElementById("bubbleOptions");
const cameraSelect = document.getElementById("cameraSelect");
const micSelect = document.getElementById("micSelect");
const cameraRow = document.getElementById("cameraRow");
const micRow = document.getElementById("micRow");

let bubblePosition = "bottom-right";

// --- Enumerate devices ---
async function loadDevices() {
  try {
    // Need to request permission first to get device labels
    const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    tempStream.getTracks().forEach((t) => t.stop());

    const devices = await navigator.mediaDevices.enumerateDevices();

    // Cameras
    const cameras = devices.filter((d) => d.kind === "videoinput");
    cameraSelect.innerHTML = "";
    cameras.forEach((cam, i) => {
      const opt = document.createElement("option");
      opt.value = cam.deviceId;
      opt.textContent = cam.label || `מצלמה ${i + 1}`;
      cameraSelect.appendChild(opt);
    });
    if (cameras.length === 0) {
      cameraSelect.innerHTML = '<option value="">אין מצלמה</option>';
    }

    // Microphones
    const mics = devices.filter((d) => d.kind === "audioinput");
    micSelect.innerHTML = "";
    mics.forEach((mic, i) => {
      const opt = document.createElement("option");
      opt.value = mic.deviceId;
      opt.textContent = mic.label || `מיקרופון ${i + 1}`;
      micSelect.appendChild(opt);
    });
    if (mics.length === 0) {
      micSelect.innerHTML = '<option value="">אין מיקרופון</option>';
    }

    // Restore saved selections
    const stored = await chrome.storage.local.get(["vclip_prefs"]);
    const prefs = stored.vclip_prefs || {};
    if (prefs.cameraDeviceId) cameraSelect.value = prefs.cameraDeviceId;
    if (prefs.micDeviceId) micSelect.value = prefs.micDeviceId;

  } catch (err) {
    console.warn("[vClip] Device enumeration failed:", err);
    cameraSelect.innerHTML = '<option value="">לא ניתן לטעון</option>';
    micSelect.innerHTML = '<option value="">לא ניתן לטעון</option>';
  }
}

loadDevices();

// --- Position buttons ---
document.querySelectorAll(".pos-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".pos-btn").forEach((b) => b.setAttribute("aria-pressed", "false"));
    btn.setAttribute("aria-pressed", "true");
    bubblePosition = btn.dataset.pos;
  });
});

// --- Toggle visibility based on checkboxes ---
enableCamera.addEventListener("change", () => {
  bubbleOptions.style.display = enableCamera.checked ? "flex" : "none";
  cameraRow.style.display = enableCamera.checked ? "flex" : "none";
});

enableMic.addEventListener("change", () => {
  micRow.style.display = enableMic.checked ? "flex" : "none";
});

// --- Load saved prefs ---
chrome.storage.local.get(["vclip_prefs"], (result) => {
  const prefs = result.vclip_prefs || {};
  if (prefs.enableCamera === false) {
    enableCamera.checked = false;
    bubbleOptions.style.display = "none";
    cameraRow.style.display = "none";
  }
  if (prefs.enableMic === false) {
    enableMic.checked = false;
    micRow.style.display = "none";
  }
  if (prefs.enableSystemAudio === true) enableSystemAudio.checked = true;
  if (prefs.bubblePosition) {
    bubblePosition = prefs.bubblePosition;
    document.querySelectorAll(".pos-btn").forEach((b) => {
      b.setAttribute("aria-pressed", b.dataset.pos === bubblePosition ? "true" : "false");
    });
  }
  if (prefs.bubbleSize) bubbleSize.value = prefs.bubbleSize;
});

// --- Start recording ---
startBtn.addEventListener("click", async () => {
  const prefs = {
    enableCamera: enableCamera.checked,
    enableMic: enableMic.checked,
    enableSystemAudio: enableSystemAudio.checked,
    bubblePosition,
    bubbleSize: parseInt(bubbleSize.value, 10),
    cameraDeviceId: cameraSelect.value || undefined,
    micDeviceId: micSelect.value || undefined,
  };

  // Save prefs
  await chrome.storage.local.set({ vclip_prefs: prefs });

  // Open recorder tab
  statusEl.textContent = "פותח חלון הקלטה...";

  chrome.tabs.create({
    url: chrome.runtime.getURL("recorder.html"),
    active: true,
  });

  // Close popup after a short delay
  setTimeout(() => window.close(), 300);
});
