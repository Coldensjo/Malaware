const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;
const ASCII_HOSTNAME_RE = /^[a-z0-9.-]+$/;

function parseDomainLine(line) {
  line = line.trim();
  if (!line || line.startsWith("!") || line.startsWith("#")) {
    return null;
  }

  if (line.startsWith("||")) {
    line = line.slice(2);
    const caret = line.indexOf("^");
    if (caret >= 0) {
      line = line.slice(0, caret);
    }
  }

  line = line.replace(/^https?:\/\//i, "");
  line = line.split("/")[0].split("?")[0].split("#")[0].split(":")[0];
  line = line.replace(/^\.+|\.+$/g, "");

  if (!line || /[\s*?]/.test(line)) {
    return null;
  }

  let hostname;
  try {
    hostname = new URL("http://" + line).hostname;
  } catch {
    return null;
  }

  if (!hostname || hostname.length > 253) return null;
  if (!hostname.includes(".")) return null;
  if (IPV4_RE.test(hostname)) return null;
  if (hostname.startsWith("[")) return null;
  if (!ASCII_HOSTNAME_RE.test(hostname)) return null;

  return hostname;
}

function parseDomainsDetailed(text) {
  const seen = new Set();
  const domains = [];
  let invalid = 0;

  for (const raw of text.split("\n")) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("!") || trimmed.startsWith("#")) continue;

    const d = parseDomainLine(trimmed);
    if (!d) {
      invalid++;
      continue;
    }
    if (seen.has(d)) continue;
    seen.add(d);
    domains.push(d);
  }

  return { domains, invalid };
}

function parseDomains(text) {
  return parseDomainsDetailed(text).domains;
}

const mainView = document.getElementById("main-view");
const importView = document.getElementById("import-view");
const toggleBtn = document.getElementById("toggle");
const importBtn = document.getElementById("import");
const backBtn = document.getElementById("back");
const textarea = document.getElementById("domains");
const saveBtn = document.getElementById("save");
const loadFileBtn = document.getElementById("load-file");
const importStandardBtn = document.getElementById("import-standard");
const fileInput = document.getElementById("file");
const status = document.getElementById("status");
const enabledStatus = document.getElementById("enabled-status");

applyI18n();

function showStatus(message, isError = false) {
  status.className = isError ? "error" : "";
  status.textContent = message;
}

function showMain() {
  mainView.hidden = false;
  importView.hidden = true;
}

function showImport() {
  mainView.hidden = true;
  importView.hidden = false;
}

function updateToggleUI(enabled) {
  toggleBtn.textContent = t(enabled ? "popupBtnDisable" : "popupBtnEnable");
  toggleBtn.setAttribute("aria-pressed", String(enabled));
  enabledStatus.textContent = t(
    enabled ? "popupStatusActive" : "popupStatusInactive",
  );
  enabledStatus.className = enabled
    ? "status-line active"
    : "status-line inactive";
}

importBtn.addEventListener("click", showImport);
backBtn.addEventListener("click", showMain);

loadFileBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    textarea.value = textarea.value ? `${textarea.value}\n${text}` : text;
    showStatus(t("msgFileAdded", [file.name]));
  } catch {
    showStatus(t("msgFileFailed"), true);
  }
  fileInput.value = "";
});

async function loadStandardBlocklist() {
  const url = chrome.runtime.getURL("pup-blocklist.txt");
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("fetch failed");
  }
  return parseDomains(await response.text());
}

importStandardBtn.addEventListener("click", async () => {
  try {
    const standard = await loadStandardBlocklist();
    const existing = parseDomains(textarea.value);
    const merged = [...new Set([...existing, ...standard])];

    textarea.value = merged.join("\n");

    const added = merged.length - existing.length;
    showStatus(
      added === 0
        ? t("msgStandardAlreadyPresent", [String(merged.length)])
        : t("msgStandardAdded", [String(added), String(merged.length)]),
    );
  } catch {
    showStatus(t("msgStandardFailed"), true);
  }
});

toggleBtn.addEventListener("click", async () => {
  const { enabled = true } = await chrome.storage.local.get("enabled");
  await chrome.storage.local.set({ enabled: !enabled });
  updateToggleUI(!enabled);
});

saveBtn.addEventListener("click", async () => {
  const { domains, invalid } = parseDomainsDetailed(textarea.value);

  if (domains.length === 0) {
    const { domains: stored = [] } = await chrome.storage.local.get("domains");
    if (stored.length > 0) {
      const ok = confirm(t("msgConfirmClear"));
      if (!ok) {
        showStatus(t("msgNothingSaved"), true);
        return;
      }
    }
  }

  try {
    await chrome.storage.local.set({ domains });

    const parts = [];
    if (domains.length === 0) {
      parts.push(t("msgBlocklistEmpty"));
    } else {
      parts.push(t("msgBlocking", [String(domains.length)]));
    }
    if (invalid > 0) {
      parts.push(t("msgSkipped", [String(invalid)]));
    }
    showStatus(parts.join(" "));
  } catch {
    showStatus(t("msgSaveFailed"), true);
  }
});

chrome.storage.local.get(["enabled", "domains"], ({ enabled = true, domains = [] }) => {
  updateToggleUI(enabled);
  textarea.value = domains.join("\n");
});
