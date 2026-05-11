import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
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
})
