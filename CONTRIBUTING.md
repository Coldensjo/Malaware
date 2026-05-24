# Contributing to Malaware

Thanks for contributing.

## Development Setup

1. Clone the repository.
2. Load the extension as unpacked in `chrome://extensions`.
3. Make your changes.
4. Reload the extension in the extensions page before testing.

## Coding Guidelines

- Keep behavior changes explicit and minimal.
- Prefer readable code over clever shortcuts.
- Preserve localization keys and placeholder names.
- Add error handling for async Chrome API calls.

## Manual Test Checklist

- Toggle enable/disable from popup.
- Import a local `.txt` list.
- Save block list and reopen popup (state should persist).
- Visit a blocked domain and verify warning page appears.
- Ensure normal sites still load.

## Pull Requests

- Keep PRs focused and reviewable.
- Include a short "what changed" and "why".
- Describe manual test steps and outcomes.