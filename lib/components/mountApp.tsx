import type { ComponentType } from "react"
import React from "react"
import ReactDOM from "react-dom/client"

const mountApp = (App: ComponentType) => {
  const root = document.getElementById("root")
  if (root === null) return
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

export default mountApp
