import { defineConfig } from "wxt"

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Onamea",
    permissions: ["storage", "offscreen"],
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["inject.js"],
        run_at: "document_start"
      }
    ],
    web_accessible_resources: [
      {
        resources: ["inpage-api.js"],
        matches: ["<all_urls>"]
      }
    ],
    browser_specific_settings: {
      gecko: {
        id: "{f3c4c0ff-5f2c-4b4a-9e83-6f7f48acbe43}"
      }
    }
  },
  suppressWarnings: {
    firefoxDataCollection: true
  }
})
