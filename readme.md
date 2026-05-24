# Malaware

A minimal Chrome extension (Manifest V3) that blocks websites you don't want to visit and redirects them to a warning page. Built for blocking potentially unwanted programs (PUPs), fake antivirus pages, driver updater scams, and similar.

<p align="center">
  <img src="icons/icon-128.png" alt="Malaware icon" width="96">
</p>

## Features

- **Custom block list** — paste domains, one per line, or load a `.txt` file.
- **uBlock-style syntax** — supports `||domain.com^` filter rules and `!` / `#` comments.
- **Bundled "standard" list** — one-click import of ~110 known PUP / fake-AV / scareware domains (`pup-blocklist.txt`).
- **Subdomain matching** — blocking `example.com` also covers `mail.example.com`.
- **Subresource blocking** — blocked domains are also blocked in iframes, scripts, images, XHR, etc. via `declarativeNetRequest`.
- **Disable toggle** — turn the extension off without losing your list.
- **Localized warning page** in 12 languages (English, Swedish, German, French, Spanish, Norwegian, Danish, Finnish, Polish, Dutch, Brazilian Portuguese, Italian) — picked automatically from the browser UI language.
- **IDN-safe** — internationalized domain names are normalized to punycode at import time.

## Install (unpacked)

1. Clone or download this repo.
2. Open `chrome://extensions` in Chrome (or any Chromium-based browser).
3. Toggle on **Developer mode** (top right).
4. Click **Load unpacked** and select the project folder.
5. The Malaware icon appears in the toolbar.

## Usage

Click the toolbar icon to open the popup.

### Main view

- **Disable / Enable** — turn blocking on or off. Your list is preserved.
- **Import list** — opens the import view.

### Import view

- **Choose file** — load a `.txt` filter list into the textarea (appended).
- **Import standard** — merge the bundled PUP list into the textarea.
- **Save block list** — persist whatever's in the textarea.
- **Back** — return to the main view.

Nothing is saved until you click **Save block list** (except the Disable/Enable toggle).

### Supported line formats

```
! This is a comment
# This is also a comment

evil.com
||driver-reviver.com^
https://Bad.Example.com/path?x=1
||sub.example.org^$third-party
```

Lines are normalized to a bare hostname; IDNs become punycode; wildcards, IPs, single-label hosts, and lines with whitespace are skipped.

## How blocking works

| Resource type | Mechanism | Result |
|---|---|---|
| Main frame (top-level navigation) | `chrome.webNavigation.onBeforeNavigate` → `chrome.tabs.update` | Redirected to a localized warning page showing the blocked URL |
| Sub-frames, scripts, images, XHR, fonts, media, etc. | `chrome.declarativeNetRequest` block rules | Request fails (no extra page) |

This split exists because `declarativeNetRequest` redirects to extension pages were causing `ERR_BLOCKED_BY_CLIENT` in earlier versions; the navigation listener delivers a clean warning page for top-level loads instead.

## Permissions

| Permission | Why |
|---|---|
| `storage` | Persist your block list and enabled state. |
| `webNavigation` | Detect top-level navigations to blocked domains. |
| `declarativeNetRequest` | Block subresource requests to blocked domains. |
| `host_permissions: <all_urls>` | Required so the above APIs see every site. |

The extension makes no network requests of its own.

## Project layout

```
.
├── manifest.json           Manifest V3, default_locale: "en"
├── background.js           Service worker — settings + redirect/block logic
├── popup.html / popup.js   Main + import views
├── popup.css               Popup styles
├── blocked.html / blocked.js  Warning page (localized)
├── i18n.js                 Tiny helper for data-i18n attributes
├── pup-blocklist.txt       Bundled PUP / scareware standard list
├── icons/                  Generated PNG icons (16/32/48/128) + generate.py
└── _locales/               12 languages, validated to match en/messages.json
```

## Adding a language

1. Pick a Chrome locale code from [the supported list](https://developer.chrome.com/docs/extensions/reference/api/i18n#locales).
2. Copy `_locales/en/messages.json` to `_locales/<code>/messages.json` and translate the values.
3. Keep all keys and `$PLACEHOLDER$` tokens intact.
4. (Optional) Validate with the snippet under [Development](#development).

Missing keys automatically fall back to the default locale (English).

## Regenerating icons

```
python3 icons/generate.py
```

Requires Python 3 and Pillow. Produces the four PNG sizes; edit the colors or letter in `generate.py` and re-run.

## Development

### Validate locales

```bash
node -e "
const fs=require('fs'),path=require('path');
const root='_locales';
const canon=JSON.parse(fs.readFileSync(path.join(root,'en','messages.json'),'utf8'));
const canonKeys=Object.keys(canon).sort();
const ph=e=>{const s=new Set(),r=/\\\$([A-Z]+)\\\$/g;let m;while((m=r.exec(e.message)))s.add(m[1]);return s};
let bad=0;
for(const l of fs.readdirSync(root).sort()){
  const d=JSON.parse(fs.readFileSync(path.join(root,l,'messages.json'),'utf8'));
  const k=Object.keys(d).sort();
  const miss=canonKeys.filter(x=>!k.includes(x)),ext=k.filter(x=>!canonKeys.includes(x));
  if(miss.length||ext.length){console.log('x',l,'missing',miss,'extra',ext);bad++}
  for(const key of canonKeys){if(!d[key])continue;for(const p of ph(canon[key]))if(!ph(d[key]).has(p)){console.log('x',l,key,'missing',p);bad++}}
  if(!miss.length&&!ext.length)console.log('ok',l,k.length,'keys');
}
console.log(bad?bad+' problem(s)':'OK');"
```

### Quick parser sanity check

```bash
node -e "
$(sed -n '1,40p' popup.js)
for (const c of ['||evil.com^','# comment','EVIL.COM','localhost','127.0.0.1','*.foo','räksmörgås.se','example.com:8080/x']) {
  console.log(c, '->', parseDomainLine(c));
}"
```

## Limitations

- **Public Suffix List awareness** — pasting `co.uk` or `github.io` is accepted as a "domain" and would block everything under it. Don't do that.
- **Iframe warning page** — blocked iframes silently fail (no warning page inside the iframe).
- **Pre-rendered pages** — Chrome's prerenderer may briefly start a navigation before the listener cancels it; the user never sees the page either way.
- **DNS-over-HTTPS / system-level blocking** is out of scope.

## License

MIT.
