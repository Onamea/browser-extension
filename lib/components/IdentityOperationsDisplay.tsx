import { useEffect, useState } from "react"
import type { Message, IdentityWithMessages } from "@onamea/crdt"
import useExtensionState from "@/lib/hooks/useExtensionState.ts"
import { isRootOperationMessage } from "@/lib/storage/isRootOperationMessage.ts"

type Props = {
  identity: IdentityWithMessages
}

type MessageProps = {
  id: IdentityWithMessages["id"]
  message: Message
  onDelete: (message: Message) => Promise<void>
}

const IdentityMessageDisplay = ({ id, message, onDelete }: MessageProps) => {
  const [isRootOperation, setIsRootOperation] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    isRootOperationMessage(id, message).then(setIsRootOperation).catch(() => setIsRootOperation(true))
  }, [id, message])

  return (
    <div>
      <pre>{ JSON.stringify(message, null, 2) }</pre>
      { isRootOperation === false && <button type="button" onClick={ () => onDelete(message) }>Delete</button> }
    </div>
  )
}

const IdentityOperationsDisplay = ({ identity }: Props) => {
  const { deleteMessage: deleteMessageFromState } = useExtensionState()

  const deleteMessage = async (message: Message) => {
    await deleteMessageFromState(message)
  }

  return (
    <div>
      <p><strong>Operations:</strong></p>
      <pre>{ JSON.stringify(identity.operations, null, 2) }</pre>
      <p><strong>Messages:</strong></p>
      { identity.messages.map(message => 
        <IdentityMessageDisplay
          key={ message.signature }
          id={ identity.id }
          message={ message }
          onDelete={ deleteMessage }
        />
      )}
    </div>
  )
}

export default IdentityOperationsDisplay
