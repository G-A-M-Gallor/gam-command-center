// vClip Service Worker — minimal coordinator for Manifest V3

chrome.runtime.onInstalled.addListener(() => {
  console.log("[vClip] Extension installed");
});

// Listen for messages from recorder/popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_PREFS") {
    chrome.storage.local.get(["vclip_prefs"], (result) => {
      sendResponse(result.vclip_prefs || {});
    });
    return true; // async
  }

  if (message.type === "SAVE_CLIP_META") {
    // Store recent clip info for quick access
    chrome.storage.local.get(["vclip_recent"], (result) => {
      const recent = result.vclip_recent || [];
      recent.unshift(message.clip);
      // Keep last 20
      if (recent.length > 20) recent.length = 20;
      chrome.storage.local.set({ vclip_recent: recent }, () => {
        sendResponse({ ok: true });
      });
    });
    return true;
  }
});
