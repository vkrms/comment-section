import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the first comment from the challenge data', () => {
    render(<App />)

    expect(screen.getByText('amyrobson')).toBeInTheDocument()
    expect(
      screen.getByText(/drag feature could be improved/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('12')
  })

  it('updates the score when the voting controls are used', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: /upvote comment/i }))
    expect(screen.getByRole('status')).toHaveTextContent('13')

    await user.click(screen.getByRole('button', { name: /downvote comment/i }))
    await user.click(screen.getByRole('button', { name: /downvote comment/i }))
    expect(screen.getByRole('status')).toHaveTextContent('11')
  })
})