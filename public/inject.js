(() => {
  const SCRIPT_ID = "onamea-inpage-api-script"

  if (document.getElementById(SCRIPT_ID) !== null) {
    return
  }

  const extensionApi = globalThis.browser ?? globalThis.chrome
  if (extensionApi?.runtime?.getURL === undefined) {
    return
  }

  const script = document.createElement("script")
  script.id = SCRIPT_ID
  script.type = "text/javascript"
  script.src = extensionApi.runtime.getURL("inpage-api.js")
  script.async = false

  const root = document.head ?? document.documentElement
  root.appendChild(script)
})()
