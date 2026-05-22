import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { prettyDOM } from '@testing-library/dom'
import { afterEach, beforeEach, vi } from 'vitest'

const shouldPrintDomPreview = globalThis.process?.env?.DEBUG_TEST_DOM === '1'

function trimTestingLibraryMessage(message) {
  const text = typeof message === 'string' ? message : String(message ?? 'Testing Library query failed')

  return text
    .split('Here are the matching elements:')[0]
    .split('Here are the accessible roles:')[0]
    .split('Ignored nodes:')[0]
    .trim()
}

configure({
  getElementError(message, container) {
    const cleanMessage = trimTestingLibraryMessage(message)

    if (!shouldPrintDomPreview) {
      return new Error(cleanMessage)
    }

    const preview = prettyDOM(container, 250)

    return new Error([cleanMessage, '', 'DOM preview:', preview].join('\n'))
  },
})

beforeEach(() => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
