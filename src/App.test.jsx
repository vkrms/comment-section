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
    const commentText = screen.getByText(text)
    return commentText.closest('article')
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

    render(<App />)

    const firstComment = screen.getByRole('article', { name: /amyrobson comment/i })

    await user.click(within(firstComment).getByRole('button', { name: /upvote comment/i }))
    expect(within(firstComment).getByRole('status')).toHaveTextContent('13')

    await user.click(within(firstComment).getByRole('button', { name: /downvote comment/i }))
    await user.click(within(firstComment).getByRole('button', { name: /downvote comment/i }))
    expect(within(firstComment).getByRole('status')).toHaveTextContent('11')
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

    expect(within(firstComment).getByRole('status')).toHaveTextContent('14')
    expect(within(secondComment).getByRole('status')).toHaveTextContent('5') // unchanged
  })

  it('adds a new comment and resets the input when the comment composer is submitted, tne new comment gets current user actions', async () => {
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
})
