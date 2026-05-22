import React, { useEffect, useState } from 'react'
import defaultData from '../data.json'
import amyrobsonAvatar from '../images/avatars/image-amyrobson.webp'
import juliusomoAvatar from '../images/avatars/image-juliusomo.webp'
import maxblagunAvatar from '../images/avatars/image-maxblagun.webp'
import ramsesmironAvatar from '../images/avatars/image-ramsesmiron.webp'
import CommentCard from './components/CommentCard'
import DeleteCommentDialog from './components/DeleteCommentDialog'
import {
  addComment,
  addReplyToComment,
  deleteCommentById,
  getNextCommentId,
  getStoredComments,
  setStoredComments,
  updateCommentContent,
  updateCommentScore,
} from './commentUtils'
import './App.css'

const avatarMap = {
  amyrobson: amyrobsonAvatar,
  juliusomo: juliusomoAvatar,
  maxblagun: maxblagunAvatar,
  ramsesmiron: ramsesmironAvatar,
}

function getAvatarSrc(username) {
  return avatarMap[username]
}

function createTimestampLabel() {
  return 'Just now'
}

function App({ initialData = defaultData }) {
  const { currentUser } = initialData
  const [comments, setComments] = useState(() => getStoredComments(initialData.comments))
  const [newCommentContent, setNewCommentContent] = useState('')
  const [activeDraft, setActiveDraft] = useState(null)
  const [commentPendingDeletion, setCommentPendingDeletion] = useState(null)

  useEffect(() => {
    setStoredComments(comments)
  }, [comments])

  function closeDraft() {
    setActiveDraft(null)
  }

  function closeDeleteDialog() {
    setCommentPendingDeletion(null)
  }

  function handleScoreChange(commentId, scoreChange) {
    setComments((currentComments) => updateCommentScore(currentComments, commentId, scoreChange))
  }

  function handleComposerSubmit(event) {
    event.preventDefault()

    const content = newCommentContent.trim()

    if (!content) {
      return
    }

    setComments((currentComments) => {
      const nextComment = {
        id: getNextCommentId(currentComments),
        content,
        createdAt: createTimestampLabel(),
        score: 0,
        user: currentUser,
        replies: [],
      }

      return addComment(currentComments, nextComment)
    })
    setNewCommentContent('')
  }

  function handleReplyStart(threadId, targetId, replyingTo) {
    setActiveDraft({
      mode: 'reply',
      threadId,
      targetId,
      replyingTo,
      content: '',
    })
  }

  function handleEditStart(comment) {
    setActiveDraft({
      mode: 'edit',
      targetId: comment.id,
      content: comment.content,
    })
  }

  function handleDraftChange(event) {
    const { value } = event.target

    setActiveDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft
      }

      return {
        ...currentDraft,
        content: value,
      }
    })
  }

  function handleReplySubmit(event) {
    event.preventDefault()

    if (!activeDraft || activeDraft.mode !== 'reply') {
      return
    }

    const content = activeDraft.content.trim()

    if (!content) {
      return
    }

    setComments((currentComments) => {
      const nextReply = {
        id: getNextCommentId(currentComments),
        content,
        createdAt: createTimestampLabel(),
        score: 0,
        replyingTo: activeDraft.replyingTo,
        user: currentUser,
      }

      return addReplyToComment(currentComments, activeDraft.threadId, nextReply)
    })
    closeDraft()
  }

  function handleEditSubmit(event) {
    event.preventDefault()

    if (!activeDraft || activeDraft.mode !== 'edit') {
      return
    }

    const content = activeDraft.content.trim()

    if (!content) {
      return
    }

    setComments((currentComments) => updateCommentContent(currentComments, activeDraft.targetId, content))
    closeDraft()
  }

  function handleDeleteRequest(targetId) {
    setCommentPendingDeletion({ targetId })
  }

  function handleDeleteConfirm() {
    if (!commentPendingDeletion) {
      return
    }

    const { targetId } = commentPendingDeletion

    setComments((currentComments) => deleteCommentById(currentComments, targetId))

    setActiveDraft((currentDraft) => {
      if (!currentDraft) {
        return null
      }

      if (currentDraft.targetId === targetId || currentDraft.threadId === targetId) {
        return null
      }

      return currentDraft
    })

    closeDeleteDialog()
  }

  function renderReplyComposer(targetId) {
    if (!activeDraft || activeDraft.mode !== 'reply' || activeDraft.targetId !== targetId) {
      return null
    }

    return (
      <form className="comment-composer comment-composer--inline" onSubmit={handleReplySubmit}>
        <img
          className="comment-composer__avatar"
          src={getAvatarSrc(currentUser.username)}
          alt=""
          aria-hidden="true"
          width="40"
          height="40"
        />
        <label className="comment-composer__field">
          <span className="sr-only">Reply to {activeDraft.replyingTo}</span>
          <textarea
            className="comment-composer__input"
            name="reply"
            rows="3"
            placeholder={`Reply to @${activeDraft.replyingTo}`}
            value={activeDraft.content}
            onChange={handleDraftChange}
          />
        </label>
        <div className="comment-composer__actions">
          <button type="button" className="comment-composer__button comment-composer__button--secondary" onClick={closeDraft}>
            Cancel
          </button>
          <button type="submit" className="comment-composer__submit">
            Reply
          </button>
        </div>
      </form>
    )
  }

  return (
    <main className="app-shell" aria-label="Comments section preview">
      <section className="app-shell__preview" aria-label="Comment thread preview">
        <div className="comments-thread">
          {comments.map((comment) => (
            <section className="comment-thread__group" key={comment.id}>
              <CommentCard
                comment={comment}
                avatarSrc={getAvatarSrc(comment.user.username)}
                currentUsername={currentUser.username}
                onUpvote={() => handleScoreChange(comment.id, 1)}
                onDownvote={() => handleScoreChange(comment.id, -1)}
                onReply={() => handleReplyStart(comment.id, comment.id, comment.user.username)}
                onDelete={() => handleDeleteRequest(comment.id)}
                onEdit={() => handleEditStart(comment)}
                onCancelEdit={closeDraft}
                isEditing={activeDraft?.mode === 'edit' && activeDraft.targetId === comment.id}
                editValue={activeDraft?.mode === 'edit' && activeDraft.targetId === comment.id ? activeDraft.content : ''}
                onEditChange={handleDraftChange}
                onEditSubmit={handleEditSubmit}
              />


              {comment.replies.length > 0 ? (
                <div className="comment-thread__replies" role="group" aria-label={`${comment.user.username} replies`}>

                  {renderReplyComposer(comment.id)}

                  {comment.replies.map((reply) => (
                    <React.Fragment key={reply.id}>
                      <CommentCard
                        comment={reply}
                        avatarSrc={getAvatarSrc(reply.user.username)}
                        currentUsername={currentUser.username}
                        onUpvote={() => handleScoreChange(reply.id, 1)}
                        onDownvote={() => handleScoreChange(reply.id, -1)}
                        onReply={() => handleReplyStart(comment.id, reply.id, reply.user.username)}
                        onDelete={() => handleDeleteRequest(reply.id)}
                        onEdit={() => handleEditStart(reply)}
                        onCancelEdit={closeDraft}
                        isEditing={activeDraft?.mode === 'edit' && activeDraft.targetId === reply.id}
                        editValue={activeDraft?.mode === 'edit' && activeDraft.targetId === reply.id ? activeDraft.content : ''}
                        onEditChange={handleDraftChange}
                        onEditSubmit={handleEditSubmit}
                      />

                      {renderReplyComposer(reply.id)}
                    </React.Fragment>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>

        <form className="comment-composer" onSubmit={handleComposerSubmit}>
          <img
            className="comment-composer__avatar"
            src={getAvatarSrc(currentUser.username)}
            alt=""
            aria-hidden="true"
            width="40"
            height="40"
          />
          <label className="comment-composer__field">
            <span className="sr-only">Add a comment</span>
            <textarea
              className="comment-composer__input"
              name="comment"
              rows="3"
              placeholder="Add a comment..."
              value={newCommentContent}
              onChange={(event) => setNewCommentContent(event.target.value)}
            />
          </label>
          <button type="submit" className="comment-composer__submit">
            Send
          </button>
        </form>

        <DeleteCommentDialog
          open={commentPendingDeletion !== null}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              closeDeleteDialog()
            }
          }}
          onConfirm={handleDeleteConfirm}
        />
      </section>
    </main>
  )
}

export default App
