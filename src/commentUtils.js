export const COMMENTS_STORAGE_KEY = 'comments-section-comments'

function seedStoredComments(fallbackComments) {
  const serializedComments = JSON.stringify(fallbackComments)

  window.localStorage.setItem(COMMENTS_STORAGE_KEY, serializedComments)

  return JSON.parse(serializedComments)
}

function isValidCommentUser(user) {
  return Boolean(user && typeof user.username === 'string')
}

function isValidReply(reply) {
  return Boolean(
    reply
      && typeof reply.id === 'number'
      && typeof reply.content === 'string'
      && typeof reply.createdAt === 'string'
      && typeof reply.score === 'number'
      && isValidCommentUser(reply.user),
  )
}

function isValidComment(comment) {
  return Boolean(
    comment
      && typeof comment.id === 'number'
      && typeof comment.content === 'string'
      && typeof comment.createdAt === 'string'
      && typeof comment.score === 'number'
      && Array.isArray(comment.replies)
      && isValidCommentUser(comment.user)
      && comment.replies.every(isValidReply),
  )
}

export function getStoredComments(fallbackComments) {
  if (typeof window === 'undefined') {
    return fallbackComments
  }

  try {
    const storedValue = window.localStorage.getItem(COMMENTS_STORAGE_KEY)

    if (!storedValue) {
      return seedStoredComments(fallbackComments)
    }

    const parsedValue = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue) || !parsedValue.every(isValidComment)) {
      return seedStoredComments(fallbackComments)
    }

    return parsedValue
  } catch {
    return seedStoredComments(fallbackComments)
  }
}

export function setStoredComments(comments) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments))
}

export function getNextCommentId(comments) {
  return comments.reduce((highestId, comment) => {
    const replyHighestId = comment.replies.reduce(
      (replyMaxId, reply) => Math.max(replyMaxId, reply.id),
      comment.id,
    )

    return Math.max(highestId, replyHighestId)
  }, 0) + 1
}

export function addComment(comments, newComment) {
  return [...comments, newComment]
}

export function addReplyToComment(comments, parentCommentId, newReply) {
  return comments.map((comment) => {
    if (comment.id !== parentCommentId) {
      return comment
    }

    return {
      ...comment,
      replies: [...comment.replies, newReply],
    }
  })
}

export function updateCommentContent(comments, targetId, nextContent) {
  return comments.map((comment) => {
    if (comment.id === targetId) {
      return {
        ...comment,
        content: nextContent,
      }
    }

    let hasReplyUpdate = false
    const replies = comment.replies.map((reply) => {
      if (reply.id !== targetId) {
        return reply
      }

      hasReplyUpdate = true

      return {
        ...reply,
        content: nextContent,
      }
    })

    if (!hasReplyUpdate) {
      return comment
    }

    return {
      ...comment,
      replies,
    }
  })
}

export function deleteCommentById(comments, targetId) {
  return comments
    .filter((comment) => comment.id !== targetId)
    .map((comment) => ({
      ...comment,
      replies: comment.replies.filter((reply) => reply.id !== targetId),
    }))
}

export function updateCommentScore(comments, targetId, scoreChange) {
  return comments.map((comment) => {
    if (comment.id === targetId) {
      return {
        ...comment,
        score: Math.max(0, comment.score + scoreChange),
      }
    }

    const replies = comment.replies.map((reply) => {
      if (reply.id !== targetId) {
        return reply
      }

      return {
        ...reply,
        score: Math.max(0, reply.score + scoreChange),
      }
    })

    const hasReplyUpdate = replies.some((reply, index) => reply !== comment.replies[index])

    if (!hasReplyUpdate) {
      return comment
    }

    return {
      ...comment,
      replies,
    }
  })
}
