import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import testData from './test/testData.json'

describe('App', () => {
  function getCommentByUsername(username) {
    return screen.getByRole('article', { name: new RegExp(`${username} comment`, 'i') })
  }

function getCommentByText(text) {
  const el = screen.getByText(text)
  const article = el.closest('article')
  if (!article) throw new Error(`No article ancestor found for text: "${text}"`)
  return article
}

  async function openDeleteDialog() {
    render(<App initialData={testData} />)

    const user = userEvent.setup()
    const commentToDelete = getCommentByUsername('juliusomo')
    const deleteButton = within(commentToDelete).getByRole('button', { name: /delete/i })

    await user.click(deleteButton)
    return { commentToDelete, user }
  }

  it('renders the nested thread from the challenge data', () => {
    render(<App />)

    expect(screen.getAllByRole('article')).toHaveLength(4)
    expect(screen.getByText('amyrobson')).toBeInTheDocument()
    expect(screen.getByText('maxblagun')).toBeInTheDocument()
    expect(screen.getByText('ramsesmiron')).toBeInTheDocument()
    expect(screen.getByText('juliusomo')).toBeInTheDocument()
    expect(screen.getByText('@maxblagun', { exact: false })).toBeInTheDocument()
    expect(
      screen.getByText(/drag feature could be improved/i),
    ).toBeInTheDocument()

    const firstComment = screen.getByRole('article', { name: /amyrobson comment/i })
    expect(within(firstComment).getByRole('status')).toHaveTextContent('12')
  })

  it('updates the score when the voting controls are used', async () => {
    const user = userEvent.setup()

    render(<App initialData={testData} />)

    const firstComment = getCommentByUsername('amyrobson')
    const secondComment = getCommentByUsername('maxblagun')

    await user.click(within(firstComment).getByRole('button', { name: /upvote comment/i }))
    expect(within(firstComment).getByRole('status')).toHaveTextContent('13')

    await user.click(within(secondComment).getByRole('button', { name: /downvote comment/i }))
    expect(within(secondComment).getByRole('status')).toHaveTextContent('4')
  })

  it('renders reply button for non-current user comments', () => {
    render(<App initialData={testData} />)

    const nonCurrentUserComment = getCommentByUsername('amyrobson')

    expect(within(nonCurrentUserComment).getByRole('button', { name: /reply/i })).toBeInTheDocument()

    expect(within(nonCurrentUserComment).queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(within(nonCurrentUserComment).queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('renders edit and delete buttons for current user comments', () => {
    render(<App initialData={testData} />)

    const currentUserComment = getCommentByUsername('juliusomo')

    const currentUserActions = within(currentUserComment)

    expect(currentUserActions.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    expect(currentUserActions.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    expect(currentUserActions.queryByRole('button', { name: /reply/i })).not.toBeInTheDocument()
  })

  it('tracks the score state independently for each comment', async () => {
    const user = userEvent.setup()

    render(<App initialData={testData} />)

    const firstComment = getCommentByUsername('amyrobson')
    const secondComment = getCommentByUsername('maxblagun')

    await user.click(within(firstComment).getByRole('button', { name: /upvote comment/i }))
    await user.click(within(firstComment).getByRole('button', { name: /upvote comment/i }))

    expect(within(firstComment).getByRole('status')).toHaveTextContent('13')
    expect(within(secondComment).getByRole('status')).toHaveTextContent('5') // unchanged
  })

  it('adds a new comment and resets the input when the comment composer is submitted, the new comment gets current user actions', async () => {
    render(<App initialData={testData} />)

    const user = userEvent.setup()
    const commentInput = screen.getByRole('textbox', { name: /add a comment/i })
    const sendButton = screen.getByRole('button', { name: /send/i })

    const commentText = 'This is a new comment'

    await user.type(commentInput, commentText)
    await user.click(sendButton)

    expect(commentInput).toHaveValue('')

    const newComment = getCommentByText(commentText)

    expect(newComment).toBeInTheDocument()

    const newCommentActions = within(newComment)

    expect(newCommentActions.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    expect(newCommentActions.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    expect(newCommentActions.queryByRole('button', { name: /reply/i })).not.toBeInTheDocument()

    // score starts at 0
    expect(within(newComment).getByRole('status')).toHaveTextContent('0')
  })

  it('allows current user to edit their comment and save changes', async () => {
    render(<App initialData={testData} />)

    const user = userEvent.setup()
    const commentToEdit = getCommentByUsername('juliusomo')
    const editButton = within(commentToEdit).getByRole('button', { name: /edit/i })

    await user.click(editButton)

    const textbox = within(commentToEdit).getByRole('textbox', { name: /edit comment by juliusomo/i })

    const oldText = textbox.value
    expect(oldText).toBeTruthy()

    const updateButton = within(commentToEdit).getByRole('button', { name: /update/i })
    expect(textbox).toBeInTheDocument()

    const updatedText = 'This comment has been edited'
    await user.clear(textbox)
    await user.type(textbox, updatedText)
    await user.click(updateButton)

    expect(within(commentToEdit).getByText(updatedText)).toBeInTheDocument()

    // old text is gone
    expect(within(commentToEdit).queryByText(oldText)).not.toBeInTheDocument()

    // textbox is gone
    expect(within(commentToEdit).queryByRole('textbox', { name: /edit comment by juliusomo/i })).not.toBeInTheDocument()
  })

  it('allows current user to reply to someone else’s comment, adds the new reply to the correct comment thread, and resets the input', async () => {
    render(<App initialData={testData} />)

    const user = userEvent.setup()
    const commentToReplyTo = getCommentByUsername('maxblagun')
    const replyButton = within(commentToReplyTo).getByRole('button', { name: /reply/i })

    await user.click(replyButton)

    const textbox = screen.getByRole('textbox', { name : /reply/i })
    expect(textbox).toBeInTheDocument()

    const commentText = 'This is a reply'
    await user.type(textbox, commentText)


    const replyComposer = textbox.closest('form')
    const sendReplyButton = within(replyComposer).getByRole('button', { name: /reply/i })
    await user.click(sendReplyButton)

    const thread = screen.getByRole('group', { name: /maxblagun replies/i })

    // textbox is gone
    expect(within(thread).queryByRole('textbox', { name : /reply/i })).not.toBeInTheDocument()
    // in the right thread
    expect(within(thread).getByText(commentText)).toBeInTheDocument()

    const newReply = getCommentByText(commentText)
    expect(newReply).toBeInTheDocument()

    // has edit, delete, but not reply actions
    const newReplyActions = within(newReply)
    expect(newReplyActions.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    expect(newReplyActions.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    expect(newReplyActions.queryByRole('button', { name: /reply/i })).not.toBeInTheDocument()
  })

  it('allows current user to delete their comment and removes it from the thread', async () => {
    render(<App initialData={testData} />)

    const user = userEvent.setup()

    const commentToDelete = getCommentByUsername('juliusomo')

    const deleteButton = within(commentToDelete).getByRole('button', { name: /delete/i })

    await user.click(deleteButton)

    const confirmButton = screen.getByRole('button', { name: /yes, delete/i })
    await user.click(confirmButton)

    expect(commentToDelete).not.toBeInTheDocument()
  })

  it('won\'t add empty comments', async () => {
    render(<App initialData={testData} />)

    const user = userEvent.setup()
    const commentInput = screen.getByRole('textbox', { name: /add a comment/i })
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(commentInput, '   ')
    await user.click(sendButton)

    // still the same number of comments as initial data
    expect(screen.getAllByRole('article')).toHaveLength(4)
  })

  it('won\'t allow empty comment edits', async () => {
    render(<App initialData={testData} />)

    const user = userEvent.setup()
    const commentToEdit = getCommentByUsername('juliusomo')
    const editButton = within(commentToEdit).getByRole('button', { name: /edit/i })

    await user.click(editButton)

    const textbox = within(commentToEdit).getByRole('textbox', { name: /edit comment by juliusomo/i })

    const updateButton = within(commentToEdit).getByRole('button', { name: /update/i })
    const cancelButton = within(commentToEdit).getByRole('button', { name: /cancel/i })

    await user.clear(textbox)
    await user.type(textbox, '   ')
    await user.click(updateButton)

    // textbox is still there since update was unsuccessful
    expect(within(commentToEdit).getByRole('textbox', { name: /edit comment by juliusomo/i })).toBeInTheDocument()

    await user.click(cancelButton)

    // text is unchanged
    expect(within(commentToEdit).getByText(/Everything moves/i)).toBeInTheDocument()
  })

  it('won\'t allow empty replies', async () => {
    render(<App initialData={testData} />)

    const user = userEvent.setup()
    const commentToReplyTo = getCommentByUsername('maxblagun')
    const replyButton = within(commentToReplyTo).getByRole('button', { name: /reply/i })

    await user.click(replyButton)

    const textbox = screen.getByRole('textbox', { name : /reply/i })
    const replyComposer = textbox.closest('form')
    const sendReplyButton = within(replyComposer).getByRole('button', { name: /reply/i })

    await user.type(textbox, '   ')
    await user.click(sendReplyButton)

    // still the same number of comments as initial data
    expect(screen.getAllByRole('article')).toHaveLength(4)

    // textbox is still there since submission was unsuccessful
    expect(screen.getByRole('textbox', { name : /reply/i })).toBeInTheDocument()
  })

  it('won\'t add a reply if it\'s cancelled', async () => {
    render(<App initialData={testData} />)

    const user = userEvent.setup()
    const commentToReplyTo = getCommentByUsername('maxblagun')
    const replyButton = within(commentToReplyTo).getByRole('button', { name: /reply/i })

    await user.click(replyButton)

    const textbox = screen.getByRole('textbox', { name : /reply/i })
    const replyComposer = textbox.closest('form')
    const cancelButton = within(replyComposer).getByRole('button', { name: /cancel/i })

    await user.type(textbox, 'This is a reply that will be cancelled')
    await user.click(cancelButton)

    // still the same number of comments as initial data
    expect(screen.getAllByRole('article')).toHaveLength(4)

    // textbox is gone since composer was closed
    expect(screen.queryByRole('textbox', { name : /reply/i })).not.toBeInTheDocument()
  })

  it('will not persist changes from cancelled edit', async () => {
    render(<App initialData={testData} />)

    const user = userEvent.setup()
    const commentToEdit = getCommentByUsername('juliusomo')
    const editButton = within(commentToEdit).getByRole('button', { name: /edit/i })

    await user.click(editButton)

    const textbox = within(commentToEdit).getByRole('textbox', { name: /edit comment by juliusomo/i })

    const cancelButton = within(commentToEdit).getByRole('button', { name: /cancel/i })

    const draftText = 'This edit will be cancelled'

    await user.clear(textbox)
    await user.type(textbox, draftText)
    await user.click(cancelButton)

    // text is unchanged
    expect(within(commentToEdit).getByText(/Everything moves/i)).toBeInTheDocument()

    // textbox is gone
    expect(within(commentToEdit).queryByRole('textbox', { name: /edit comment by juliusomo/i })).not.toBeInTheDocument()

    // draft text is gone
    expect(screen.queryByText(draftText)).not.toBeInTheDocument()
  })

  it('includes mention in replies and doesn\'t allow editing it out', async () => {
    render(<App initialData={testData} />)

      const user = userEvent.setup()
      const commentToReplyTo = getCommentByUsername('maxblagun')
      const replyButton = within(commentToReplyTo).getByRole('button', { name: /reply/i })

      await user.click(replyButton)

      const textbox = screen.getByRole('textbox', { name : /reply/i })
      const replyComposer = textbox.closest('form')
      const sendReplyButton = within(replyComposer).getByRole('button', { name: /reply/i })

      const commentText = 'This is a reply'
      await user.type(textbox, commentText)
      await user.click(sendReplyButton)

      const newReply = getCommentByText(commentText)
      expect(newReply).toBeInTheDocument()

      const mention = within(newReply).getByText('@maxblagun', { exact: false })
      expect(mention).toBeInTheDocument()

      const editButton = within(newReply).getByRole('button', { name: /edit/i })
      await user.click(editButton)

      const editTextbox = within(newReply).getByRole('textbox', { name: /edit comment by/i })
      const updateButton = within(newReply).getByRole('button', { name: /update/i })

      const newText = 'Trying to edit the mention out of this reply'
      await user.clear(editTextbox)
      await user.type(editTextbox, newText)
      await user.click(updateButton)

      // mention is still there
      expect(within(newReply).getByText('@maxblagun', { exact: false })).toBeInTheDocument()
      // new text is also there
      expect(within(newReply).getByText(newText)).toBeInTheDocument()
  })

  it('closes the delete confirmation modal when clicking outside of it', async () => {
    const { commentToDelete, user } = await openDeleteDialog()

    const overlay = screen.getByTestId('delete-dialog-overlay')
    expect(overlay).toBeInTheDocument()

    await user.click(overlay) // click the backdrop

    expect(screen.queryByRole('button', { name: /yes, delete/i })).not.toBeInTheDocument()

    expect(commentToDelete).toBeInTheDocument()
  })


  it('closes the delete confirmation modal when pressing the Escape key', async () => {
    const { commentToDelete, user } = await openDeleteDialog()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('button', { name: /yes, delete/i })).not.toBeInTheDocument()

    expect(commentToDelete).toBeInTheDocument()
  })


  it('closes the delete confirmation modal when clicking the cancel button, comment is not deleted', async () => {
    const { commentToDelete, user } = await openDeleteDialog()

    const cancelButton = screen.getByRole('button', { name: /no, cancel/i })
    await user.click(cancelButton)

    expect(screen.queryByRole('button', { name: /yes, delete/i })).not.toBeInTheDocument()

    // comment is still there
    expect(commentToDelete).toBeInTheDocument()
  })

  it('does not allow current user to vote on their own comment', async () => {
    render(<App initialData={testData} />)

    const currentUserComment = getCommentByUsername('juliusomo')
    const upvoteButton = within(currentUserComment).queryByRole('button', { name: /upvote comment/i })
    const downvoteButton = within(currentUserComment).queryByRole('button', { name: /downvote comment/i })

    expect(upvoteButton).not.toBeInTheDocument()
    expect(downvoteButton).not.toBeInTheDocument()
  })

  it('reverses an existing vote one step at a time before applying the opposite vote', async () => {
    const user = userEvent.setup()
    render(<App initialData={testData} />)

    const firstComment = getCommentByUsername('amyrobson')
    const upvoteButton = within(firstComment).getByRole('button', { name: /upvote comment/i })
    const downvoteButton = within(firstComment).getByRole('button', { name: /downvote comment/i })

    await user.click(upvoteButton)

    expect(within(firstComment).getByRole('status')).toHaveTextContent('13')

    await user.click(downvoteButton)

    expect(within(firstComment).getByRole('status')).toHaveTextContent('12')

    await user.click(downvoteButton)

    expect(within(firstComment).getByRole('status')).toHaveTextContent('11')
  })
})
