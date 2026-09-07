import { useState } from "react"
import type { ExtensionState } from "../background/state.ts"
import IdentitySubKeysEdit from "../components/IdentitySubKeysEdit.tsx"
import CreateKeyPairForm from "../components/CreateKeyPairForm.tsx"
import IdentityReferentsEdit from "../components/IdentityReferentsEdit.tsx"
import IdentityReferentsAdd from "../components/IdentityReferentsAdd.tsx"
import useView from "../hooks/useView.tsx"
import IdentityEdit from "../components/IdentityEdit.tsx"
import IdentityOperationsDisplay from "../components/IdentityOperationsDisplay.tsx"

type Props = {
  state: ExtensionState
}

type Section = "body" | "subKeys" | "referents" | "operations"

const AccountEdit = ({ state }: Props) => {

  const { showAccount } = useView()
  const [openSection, setOpenSection] = useState<Section | undefined>(undefined)
  const identity = state.local.identity
  const keyPair = state.container.data?.identity.keyPair

  if (identity === undefined) {
    return <p>You do not have an identity, yet.</p>
  }

  if (keyPair === undefined) {
    return <p>You do not have a key pair for Identity, yet.</p>
  }

  const toggleSection = (section: Section) => () => {
    setOpenSection(openSection === section ? undefined : section)
  }

  return (
    <div>
      <h2>{ identity.fingerprintedName }</h2>
      <p><strong>NameKey: </strong>{ identity.id }</p>
      <section>
        <h3>
          <button
            type="button"
            aria-expanded={ openSection === "body" }
            aria-controls="account-edit-body"
            onClick={ toggleSection("body") }
          >
            Body & Tombstone
          </button>
        </h3>
        { openSection === "body" && (
          <div id="account-edit-body">
            <IdentityEdit identity={ identity } keyPair={ keyPair } />
          </div>
        ) }
      </section>
      <section>
        <h3>
          <button
            type="button"
            aria-expanded={ openSection === "subKeys" }
            aria-controls="account-edit-sub-keys"
            onClick={ toggleSection("subKeys") }
          >
            SubKeys
          </button>
        </h3>
        { openSection === "subKeys" && (
          <div id="account-edit-sub-keys">
            <IdentitySubKeysEdit identity={ identity } keyPair={ keyPair } />
            <CreateKeyPairForm forSubKey />
          </div>
        ) }
      </section>
      <section>
        <h3>
          <button
            type="button"
            aria-expanded={ openSection === "referents" }
            aria-controls="account-edit-referents"
            onClick={ toggleSection("referents") }
          >
            Referents
          </button>
        </h3>
        { openSection === "referents" && (
          <div id="account-edit-referents">
            <IdentityReferentsEdit identity={ identity } keyPair={ keyPair } />
            <IdentityReferentsAdd identity={ identity } keyPair={ keyPair } />
          </div>
        ) }
      </section>
      <section>
        <h3>
          <button
            type="button"
            aria-expanded={ openSection === "operations" }
            aria-controls="account-edit-operations"
            onClick={ toggleSection("operations") }
          >
            Operations & Messages
          </button>
        </h3>
        { openSection === "operations" && (
          <div id="account-edit-operations">
            <IdentityOperationsDisplay identity={ identity } />
          </div>
        ) }
      </section>
      <menu>
        <button type="button" onClick={ showAccount }>Cancel</button>
      </menu>
    </div>
  )
}

export default AccountEdit
