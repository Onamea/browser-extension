# Onamea Browser Extension

Build using WXT. Targeting Chrome, Firefox.

## Build for Firefox reviewers

With Node.js and pnpm installed, run these commands from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm zip:firefox
```

The Firefox extension package is written to `.output/onameabrowser-extension-0.1.0-firefox.zip`. To load the unpacked build in Firefox, use `.output/firefox-mv2/manifest.json` in `about:debugging` > **This Firefox** > **Load Temporary Add-on**.
