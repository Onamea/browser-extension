import type { ComponentType } from "react"
import React from "react"
import ReactDOM from "react-dom/client"

const mountApp = (App: ComponentType) => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

export default mountApp
