import { createContext, type ReactNode, useContext, useState } from "react"

type View = "account" | "accountEdit" | "container"

type ViewContextValue = {
  view: View
  showAccount: () => void
  showAccountEdit: () => void
  showContainer: () => void
}

const ViewContext = createContext<ViewContextValue | undefined>(undefined)

type Props = {
  children: ReactNode
}

export const ViewProvider = ({ children }: Props) => {
  const [view, setView] = useState<View>("account")

  const value = {
    view,
    showAccount: () => setView("account"),
    showAccountEdit: () => setView("accountEdit"),
    showContainer: () => setView("container")
  }

  return (
    <ViewContext.Provider value={ value }>
      { children }
    </ViewContext.Provider>
  )
}

const useView = () => {
  const context = useContext(ViewContext)

  if (context === undefined) {
    throw new Error("useView must be used within a ViewProvider")
  }

  return context
}

export default useView
