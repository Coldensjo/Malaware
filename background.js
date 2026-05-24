const BLOCKED_PAGE = chrome.runtime.getURL("blocked.html");
const RULE_ID_START = 1;
const MAX_DOMAINS_PER_RULE = 1000;

const BLOCKED_SUBRESOURCE_TYPES = [
  "sub_frame",
  "script",
  "image",
  "stylesheet",
  "xmlhttprequest",
  "font",
  "media",
  "object",
  "ping",
  "websocket",
  "webtransport",
  "webbundle",
  "other",
];

let blockedDomains = new Set();
let extensionEnabled = true;
let settingsReady;

async function syncDnrRules(domains, enabled) {
  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existing.map((rule) => rule.id);

    const addRules = [];
    if (enabled && domains.length > 0) {
      let id = RULE_ID_START;
      for (let i = 0; i < domains.length; i += MAX_DOMAINS_PER_RULE) {
        const chunk = domains.slice(i, i + MAX_DOMAINS_PER_RULE);
        addRules.push({
          id: id++,
          priority: 1,
          action: { type: "block" },
          condition: {
            requestDomains: chunk,
            resourceTypes: BLOCKED_SUBRESOURCE_TYPES,
          },
        });
      }
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules,
    });
  } catch (err) {
    console.error("Malaware: failed to update dynamic rules", err);
  }
}

async function loadSettings() {
  const { domains = [], enabled = true } = await chrome.storage.local.get([
    "domains",
    "enabled",
  ]);
  blockedDomains = new Set(domains);
  extensionEnabled = enabled;
  await syncDnrRules(domains, enabled);
}

function hostnameMatches(hostname, domain) {
  return hostname === domain || hostname.endsWith("." + domain);
}

function isBlockedHostname(hostname) {
  if (!extensionEnabled || blockedDomains.size === 0) {
    return false;
  }
  const lower = hostname.toLowerCase();
  for (const domain of blockedDomains) {
    if (hostnameMatches(lower, domain)) {
      return true;
    }
  }
  return false;
}

function parseHttpUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

settingsReady = loadSettings();

chrome.runtime.onInstalled.addListener(() => {
  settingsReady = loadSettings();
});
chrome.runtime.onStartup.addListener(() => {
  settingsReady = loadSettings();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.domains || changes.enabled)) {
    settingsReady = loadSettings();
  }
});

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) {
    return;
  }
  if (details.url.startsWith(BLOCKED_PAGE)) {
    return;
  }

  await settingsReady;

  const parsed = parseHttpUrl(details.url);
  if (!parsed) {
    return;
  }
  if (!isBlockedHostname(parsed.hostname)) {
    return;
  }

  const target = `${BLOCKED_PAGE}?u=${encodeURIComponent(details.url)}`;
  chrome.tabs.update(details.tabId, { url: target }).catch(() => {});
});
