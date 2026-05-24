function getBlockedDisplay() {
  const raw = new URLSearchParams(location.search).get("u");
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.hostname + (url.pathname && url.pathname !== "/" ? url.pathname : "");
  } catch {
    return null;
  }
}

applyI18n();

const display = getBlockedDisplay();
if (display) {
  const blockedUrl = document.getElementById("blocked-url");
  const blockedRow = document.getElementById("blocked-row");
  if (blockedUrl && blockedRow) {
    blockedUrl.textContent = display;
    blockedRow.hidden = false;
  } else {
    console.error("Malaware: blocked page elements are missing");
  }
}
