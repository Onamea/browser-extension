import { defineConfig } from "wxt"

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Onamea",
    permissions: ["storage", "offscreen"],
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
