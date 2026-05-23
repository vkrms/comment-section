import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'

function DeleteCommentDialog({ open, onOpenChange, onConfirm }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="delete-dialog__overlay" data-testid="delete-dialog-overlay" />
        <Dialog.Content className="delete-dialog__content">
          <Dialog.Title className="delete-dialog__title">Delete comment</Dialog.Title>
          <Dialog.Description className="delete-dialog__description">
            Are you sure you want to delete this comment? This will remove the comment and can&apos;t be undone.
          </Dialog.Description>
          <div className="delete-dialog__actions">
            <Dialog.Close asChild>
              <button type="button" className="delete-dialog__button delete-dialog__button--cancel">
                No, cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              className="delete-dialog__button delete-dialog__button--confirm"
              onClick={onConfirm}
            >
              Yes, delete
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default DeleteCommentDialog
