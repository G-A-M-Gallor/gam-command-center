// vClip Recorder — Screen + Face Bubble + Compress + Upload
// Loaded as module in recorder.html

// ── Config ──
const VBRAIN_API = "https://vbrain-io.vercel.app";

// ── DOM refs ──
const $ = (id) => document.getElementById(id);
const setupPhase = $("setupPhase");
const recordingPhase = $("recordingPhase");
const processingPhase = $("processingPhase");
const donePhase = $("donePhase");
const cameraPreview = $("cameraPreview");
const setupStatus = $("setupStatus");
const startRecordingBtn = $("startRecording");
const pauseBtn = $("pauseBtn");
const stopBtn = $("stopBtn");
const timerEl = $("timer");
const canvas = $("compositeCanvas");
const processingStatus = $("processingStatus");
const progressFill = $("progressFill");
const previewVideo = $("previewVideo");
const clipDuration = $("clipDuration");
const clipSize = $("clipSize");
const clipLink = $("clipLink");
const copyLink = $("copyLink");
const downloadBtn = $("downloadBtn");
const newRecording = $("newRecording");
const doneStatus = $("doneStatus");

// ── State ──
let screenStream = null;
let cameraStream = null;
let mediaRecorder = null;
let chunks = [];
let rawBlob = null;
let compressedBlob = null;
let timerInterval = null;
let startTime = 0;
let pausedTime = 0;
let isPaused = false;
let animFrameId = null;

let prefs = {
  enableCamera: true,
  enableMic: true,
  enableSystemAudio: false,
  bubblePosition: "bottom-right",
  bubbleSize: 150,
  cameraDeviceId: undefined,
  micDeviceId: undefined,
};

// ── Init ──
async function init() {
  // Load prefs
  try {
    const stored = await chrome.storage.local.get(["vclip_prefs"]);
    if (stored.vclip_prefs) prefs = { ...prefs, ...stored.vclip_prefs };
  } catch (_error) {
    // Ignore storage errors
  }

  // Start camera preview if enabled
  if (prefs.enableCamera) {
    try {
      const videoConstraints = prefs.cameraDeviceId
        ? { deviceId: { exact: prefs.cameraDeviceId }, width: 320, height: 320 }
        : { width: 320, height: 320, facingMode: "user" };
      const audioConstraints = prefs.enableMic
        ? (prefs.micDeviceId ? { deviceId: { exact: prefs.micDeviceId } } : true)
        : false;
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints,
      });
      cameraPreview.srcObject = cameraStream;
      setupStatus.textContent = "מצלמה מוכנה";
    } catch (err) {
      console.warn("[vClip] Camera not available:", err);
      setupStatus.textContent = "מצלמה לא זמינה — הקלטת מסך בלבד";
      prefs.enableCamera = false;
      cameraPreview.parentElement.style.display = "none";
    }
  } else {
    cameraPreview.parentElement.style.display = "none";
  }
}

init();

// ── Start Recording ──
startRecordingBtn.addEventListener("click", async () => {
  try {
    setupStatus.textContent = "בוחר מסך...";

    // Request screen capture
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: "always" },
      audio: prefs.enableSystemAudio,
    });

    // If user cancelled the picker
    if (!screenStream) {
      setupStatus.textContent = "ההקלטה בוטלה";
      return;
    }

    // Get screen dimensions
    const videoTrack = screenStream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    const screenW = settings.width || 1920;
    const screenH = settings.height || 1080;

    // Setup canvas for compositing
    canvas.width = screenW;
    canvas.height = screenH;
    const ctx = canvas.getContext("2d");

    // Create off-screen video elements
    const screenVideo = document.createElement("video");
    screenVideo.srcObject = screenStream;
    screenVideo.muted = true;
    await screenVideo.play();

    let cameraVideo = null;
    if (prefs.enableCamera && cameraStream) {
      cameraVideo = document.createElement("video");
      cameraVideo.srcObject = cameraStream;
      cameraVideo.muted = true;
      await cameraVideo.play();
    }

    // Composite loop: draw screen + face bubble on canvas
    const bubbleSize = prefs.bubbleSize || 150;
    const bubblePad = 24;

    function getBubblePos() {
      const pos = prefs.bubblePosition || "bottom-right";
      switch (pos) {
        case "bottom-left": return { x: bubblePad + bubbleSize / 2, y: screenH - bubblePad - bubbleSize / 2 };
        case "bottom-right": return { x: screenW - bubblePad - bubbleSize / 2, y: screenH - bubblePad - bubbleSize / 2 };
        case "top-left": return { x: bubblePad + bubbleSize / 2, y: bubblePad + bubbleSize / 2 };
        case "top-right": return { x: screenW - bubblePad - bubbleSize / 2, y: bubblePad + bubbleSize / 2 };
        default: return { x: screenW - bubblePad - bubbleSize / 2, y: screenH - bubblePad - bubbleSize / 2 };
      }
    }

    function drawFrame() {
      // Draw screen
      ctx.drawImage(screenVideo, 0, 0, screenW, screenH);

      // Draw face bubble
      if (cameraVideo && prefs.enableCamera) {
        const { x, y } = getBubblePos();
        const r = bubbleSize / 2;

        ctx.save();
        // Clip to circle
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw camera feed (mirrored)
        ctx.translate(x + r, y - r);
        ctx.scale(-1, 1);
        ctx.drawImage(cameraVideo, 0, 0, bubbleSize, bubbleSize);
        ctx.restore();

        // Draw border
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = "#7c3aed";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      animFrameId = requestAnimationFrame(drawFrame);
    }

    drawFrame();

    // Create composite stream from canvas
    const canvasStream = canvas.captureStream(30);

    // Mix audio tracks
    const audioCtx = new AudioContext();
    const dest = audioCtx.createMediaStreamDestination();

    if (prefs.enableMic && cameraStream) {
      const micSource = audioCtx.createMediaStreamSource(
        new MediaStream(cameraStream.getAudioTracks())
      );
      micSource.connect(dest);
    }

    if (prefs.enableSystemAudio && screenStream.getAudioTracks().length > 0) {
      const sysSource = audioCtx.createMediaStreamSource(
        new MediaStream(screenStream.getAudioTracks())
      );
      sysSource.connect(dest);
    }

    // Combine video + audio into final stream
    const finalStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ]);

    // Start MediaRecorder
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm;codecs=vp8,opus";

    mediaRecorder = new MediaRecorder(finalStream, {
      mimeType,
      videoBitsPerSecond: 2_500_000, // 2.5 Mbps — decent quality, reasonable size
    });

    chunks = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      cancelAnimationFrame(animFrameId);
      rawBlob = new Blob(chunks, { type: mimeType });
      onRecordingStopped();
    };

    mediaRecorder.start(1000); // Chunk every second

    // Handle screen share ending (user clicks "Stop sharing" in Chrome)
    screenStream.getVideoTracks()[0].addEventListener("ended", () => {
      stopRecording();
    });

    // Switch to recording phase
    showPhase("recording");
    startTimer();

  } catch (err) {
    console.error("[vClip] Recording error:", err);
    setupStatus.textContent = `שגיאה: ${err.message}`;
  }
});

// ── Timer ──
function startTimer() {
  startTime = Date.now();
  pausedTime = 0;
  timerInterval = setInterval(updateTimer, 500);
}

function updateTimer() {
  if (isPaused) return;
  const elapsed = Date.now() - startTime - pausedTime;
  const secs = Math.floor(elapsed / 1000);
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  timerEl.textContent = `${m}:${s}`;
}

// ── Pause / Resume ──
let pauseStart = 0;
pauseBtn.addEventListener("click", () => {
  if (!mediaRecorder) return;
  if (isPaused) {
    mediaRecorder.resume();
    pausedTime += Date.now() - pauseStart;
    isPaused = false;
    pauseBtn.textContent = "השהה";
  } else {
    mediaRecorder.pause();
    pauseStart = Date.now();
    isPaused = true;
    pauseBtn.textContent = "המשך";
  }
});

// ── Stop ──
stopBtn.addEventListener("click", stopRecording);

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  clearInterval(timerInterval);

  // Stop all tracks
  if (screenStream) screenStream.getTracks().forEach((t) => t.stop());
  if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
}

// ── After recording stops → process ──
async function onRecordingStopped() {
  showPhase("processing");

  const rawSizeMB = (rawBlob.size / (1024 * 1024)).toFixed(1);
  processingStatus.textContent = `סרטון גולמי: ${rawSizeMB} MB — מכווץ...`;
  progressFill.style.width = "10%";

  try {
    // Try ffmpeg.wasm compression
    compressedBlob = await compressWithFFmpeg(rawBlob, (progress) => {
      progressFill.style.width = `${10 + progress * 60}%`;
      processingStatus.textContent = `מכווץ... ${Math.round(progress * 100)}%`;
    });
  } catch (err) {
    console.warn("[vClip] ffmpeg compression failed, using raw:", err);
    compressedBlob = rawBlob;
  }

  const finalSizeMB = (compressedBlob.size / (1024 * 1024)).toFixed(1);
  processingStatus.textContent = `גודל סופי: ${finalSizeMB} MB — מעלה...`;
  progressFill.style.width = "75%";

  // Upload
  try {
    const result = await uploadToR2(compressedBlob);
    progressFill.style.width = "100%";
    showDone(result);
  } catch (err) {
    console.error("[vClip] Upload error:", err);
    processingStatus.textContent = `שגיאת העלאה: ${err.message}`;
    // Still allow download
    showDone({ url: null, id: null });
  }
}

// ── FFmpeg.wasm compression ──
async function compressWithFFmpeg(blob, onProgress) {
  const { FFmpeg } = await import(
    "https://esm.sh/@ffmpeg/ffmpeg@0.12.10"
  );
  const { fetchFile } = await import(
    "https://esm.sh/@ffmpeg/util@0.12.1"
  );

  const ffmpeg = new FFmpeg();

  ffmpeg.on("progress", ({ progress }) => {
    if (onProgress) onProgress(Math.min(progress, 1));
  });

  await ffmpeg.load({
    coreURL: "https://esm.sh/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js",
    wasmURL: "https://esm.sh/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm",
  });

  await ffmpeg.writeFile("input.webm", await fetchFile(blob));

  // Compress: scale to 1280 max width, CRF 28, fast preset
  await ffmpeg.exec([
    "-i", "input.webm",
    "-vf", "scale='min(1280,iw)':-2",
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "28",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    "-y", "output.mp4",
  ]);

  const data = await ffmpeg.readFile("output.mp4");
  return new Blob([data.buffer], { type: "video/mp4" });
}

// ── Upload via vBrain API (Vercel Blob) ──
async function uploadToR2(blob) {
  const elapsed = Date.now() - startTime - pausedTime;
  const durationSec = Math.floor(elapsed / 1000);

  // Single request — server handles Vercel Blob upload + Supabase record
  const formData = new FormData();
  formData.append("file", blob, `vclip-${Date.now()}.mp4`);
  formData.append("duration_seconds", String(durationSec));

  const res = await fetch(`${VBRAIN_API}/api/vclip/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed: ${res.status} — ${err}`);
  }

  const { clip_id, watch_url } = await res.json();

  // Save to extension storage
  chrome.runtime.sendMessage({
    type: "SAVE_CLIP_META",
    clip: { id: clip_id, url: watch_url, created: Date.now(), duration: durationSec },
  });

  return { url: watch_url, id: clip_id };
}

// ── Show Done ──
function showDone(result) {
  showPhase("done");

  // Preview
  const url = URL.createObjectURL(compressedBlob || rawBlob);
  previewVideo.src = url;

  // Info
  const elapsed = Date.now() - startTime - pausedTime;
  const secs = Math.floor(elapsed / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  clipDuration.textContent = `${m}:${String(s).padStart(2, "0")}`;
  clipSize.textContent = `${((compressedBlob || rawBlob).size / (1024 * 1024)).toFixed(1)} MB`;

  if (result.url) {
    clipLink.value = result.url;
    clipLink.parentElement.style.display = "flex";
    doneStatus.textContent = "הלינק מוכן!";
  } else {
    clipLink.parentElement.style.display = "none";
    doneStatus.textContent = "ההעלאה נכשלה — אפשר להוריד את הקובץ";
  }
}

// ── Copy link ──
copyLink.addEventListener("click", () => {
  clipLink.select();
  navigator.clipboard.writeText(clipLink.value);
  copyLink.textContent = "הועתק!";
  setTimeout(() => { copyLink.textContent = "העתק"; }, 2000);
});

// ── Download ──
downloadBtn.addEventListener("click", () => {
  const blob = compressedBlob || rawBlob;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `vclip-${Date.now()}.${blob.type.includes("mp4") ? "mp4" : "webm"}`;
  a.click();
});

// ── New recording ──
newRecording.addEventListener("click", () => {
  location.reload();
});

// ── Phase management ──
function showPhase(phase) {
  [setupPhase, recordingPhase, processingPhase, donePhase].forEach((el) => el.classList.add("hidden"));
  switch (phase) {
    case "setup": setupPhase.classList.remove("hidden"); break;
    case "recording": recordingPhase.classList.remove("hidden"); break;
    case "processing": processingPhase.classList.remove("hidden"); break;
    case "done": donePhase.classList.remove("hidden"); break;
  }
}
