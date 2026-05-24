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
  document.getElementById("blocked-url").textContent = display;
  document.getElementById("blocked-row").hidden = false;
}
