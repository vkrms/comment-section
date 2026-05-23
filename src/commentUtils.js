export const COMMENTS_STORAGE_KEY = 'comments-section-comments'

export const VOTE_VALUE = {
  down: -1,
  neutral: 0,
  up: 1,
}

function isValidLegacyVoteState(voteState) {
  if (voteState === undefined) {
    return true
  }

  if (voteState === 'neutral' || voteState === 'up' || voteState === 'down') {
    return true
  }

  return Boolean(
    voteState
      && typeof voteState === 'object'
      && !Array.isArray(voteState)
      && (voteState.current === 'neutral' || voteState.current === 'up' || voteState.current === 'down')
      && typeof voteState.upUsed === 'boolean'
      && typeof voteState.downUsed === 'boolean',
  )
}

function isValidVote(vote) {
  return vote === undefined || Object.values(VOTE_VALUE).includes(vote)
}

function getLegacyVoteValue(voteState) {
  if (voteState === 'up' || voteState?.current === 'up') {
    return VOTE_VALUE.up
  }

  if (voteState === 'down' || voteState?.current === 'down') {
    return VOTE_VALUE.down
  }

  return VOTE_VALUE.neutral
}

function normalizeVoteValue(vote, voteState) {
  if (isValidVote(vote) && vote !== undefined) {
    return vote
  }

  return getLegacyVoteValue(voteState)
}

function normalizeReply(reply) {
  const vote = normalizeVoteValue(reply.vote, reply.voteState)

  return {
    ...reply,
    score: reply.vote === undefined ? reply.score - vote : reply.score,
    vote,
  }
}

function normalizeComment(comment) {
  const vote = normalizeVoteValue(comment.vote, comment.voteState)

  return {
    ...comment,
    score: comment.vote === undefined ? comment.score - vote : comment.score,
    vote,
    replies: comment.replies.map(normalizeReply),
  }
}

function seedStoredComments(fallbackComments) {
  const normalizedComments = fallbackComments.map(normalizeComment)
  const serializedComments = JSON.stringify(normalizedComments)

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
      && isValidVote(reply.vote)
      && isValidLegacyVoteState(reply.voteState)
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
      && isValidVote(comment.vote)
      && isValidLegacyVoteState(comment.voteState)
      && Array.isArray(comment.replies)
      && isValidCommentUser(comment.user)
      && comment.replies.every(isValidReply),
  )
}

function updateVote(item, nextVote) {
  const currentVote = item.vote ?? VOTE_VALUE.neutral

  if (!isValidVote(nextVote) || nextVote === undefined) {
    return item
  }

  if (currentVote === nextVote) {
    return item
  }

   if (currentVote !== VOTE_VALUE.neutral && currentVote === -nextVote) {
    return {
      ...item,
      vote: VOTE_VALUE.neutral,
    }
  }

  return {
    ...item,
    vote: nextVote,
  }
}

export function getStoredComments(fallbackComments) {
  if (typeof window === 'undefined') {
    return fallbackComments.map(normalizeComment)
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

    return parsedValue.map(normalizeComment)
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
  return [...comments, normalizeComment(newComment)]
}

export function addReplyToComment(comments, parentCommentId, newReply) {
  return comments.map((comment) => {
    if (comment.id !== parentCommentId) {
      return comment
    }

    return {
      ...comment,
      replies: [...comment.replies, normalizeReply(newReply)],
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

export function updateCommentVote(comments, targetId, nextVote, currentUsername) {
  return comments.map((comment) => {
    if (comment.id === targetId) {
      if (comment.user.username === currentUsername) {
        return comment
      }

      return updateVote(comment, nextVote)
    }

    const replies = comment.replies.map((reply) => {
      if (reply.id !== targetId) {
        return reply
      }

      if (reply.user.username === currentUsername) {
        return reply
      }

      return updateVote(reply, nextVote)
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

export function getDisplayedScore(comment) {
  return comment.score + (comment.vote ?? VOTE_VALUE.neutral)
}
