function t(key, substitutions) {
  return chrome.i18n.getMessage(key, substitutions) || key;
}

function applyI18n(root = document) {
  for (const el of root.querySelectorAll("[data-i18n]")) {
    const key = el.getAttribute("data-i18n");
    const message = t(key);
    if (message) el.textContent = message;
  }
  for (const el of root.querySelectorAll("[data-i18n-attr]")) {
    const spec = el.getAttribute("data-i18n-attr");
    for (const pair of spec.split(",")) {
      const [attr, key] = pair.split(":").map((s) => s.trim());
      if (!attr || !key) continue;
      const message = t(key);
      if (message) el.setAttribute(attr, message);
    }
  }
  for (const el of root.querySelectorAll("[data-i18n-title]")) {
    const key = el.getAttribute("data-i18n-title");
    const message = t(key);
    if (message) document.title = message;
  }
}

document.documentElement.lang = chrome.i18n.getUILanguage();
