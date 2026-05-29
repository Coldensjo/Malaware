# Malaware

Malaware is a lightweight Manifest V3 browser extension that blocks known-malicious or unwanted domains and redirects top-level visits to a warning page.

## Who is this for?

It's for your grandma who isn't comfortable using a computer—and for anyone helping her avoid “driver download” scams and malware.

## Google Extensions

Malaware exists on the Chrome Web Store]([LICENSE](https://chromewebstore.google.com/detail/Malaware/mhploefhkffionelolhjdogjofbcbjeh)).

## Features

- Domain block list with one entry per line
- Import from plain-text files
- Support for common filter-list syntax (for example `||example.com^`)
- Optional bundled baseline list from `pup-blocklist.txt`
- Domain + subdomain matching
- Top-level warning page + subresource blocking
- Localization support through `_locales`

## Installation

### Load unpacked (Chrome/Chromium)

1. Clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the project directory.

## Configuration

You can configure the extension from the popup UI:

- Toggle extension on/off
- Paste/import domains
- Save the list to extension storage

Example block list input is provided in `examples/blocklist.txt`.

Accepted examples:

```text
evil.com
||driver-reviver.com^
https://bad.example.com/path
```

Ignored examples:

```text
# comments
! adblock comment format
127.0.0.1
localhost
*.wildcards.not.supported
```

## Architecture

- `background.js`: service worker, storage sync, request blocking, redirect handling
- `popup.html` + `popup.js`: extension popup UI and import/save logic
- `blocked.html` + `blocked.js`: warning page shown for blocked top-level navigations
- `i18n.js`: localization helpers
- `_locales/`: translation files

## Permissions

- `storage`: persist settings
- `webNavigation`: detect top-level navigations
- `declarativeNetRequest`: block network requests by domain
- `host_permissions: <all_urls>`: allow checking all navigations/requests

## Development

There is no build step. Source files are loaded directly by the browser extension runtime.

Recommended checks:

```bash
node --check background.js
node --check popup.js
node --check blocked.js
node --check i18n.js
```

Locale key consistency check:

```bash
node -e "const fs=require('fs');const path=require('path');const root='_locales';const en=JSON.parse(fs.readFileSync(path.join(root,'en','messages.json'),'utf8'));const enKeys=Object.keys(en).sort();let bad=0;for(const locale of fs.readdirSync(root)){const data=JSON.parse(fs.readFileSync(path.join(root,locale,'messages.json'),'utf8'));const keys=Object.keys(data).sort();const missing=enKeys.filter(k=>!keys.includes(k));const extra=keys.filter(k=>!enKeys.includes(k));if(missing.length||extra.length){console.log(locale,'missing',missing.length,'extra',extra.length);bad++;}}console.log(bad?`Problems: ${bad}`:'OK');"
```

## Security Notes

- Block-list quality matters; avoid broad suffixes that can overblock.
- Only HTTP/HTTPS navigations are evaluated for warning-page redirects.
- The extension does not send telemetry or external analytics by default.

## Contributing

See `CONTRIBUTING.md`.

## License

This project is licensed under the [MIT License](LICENSE).
