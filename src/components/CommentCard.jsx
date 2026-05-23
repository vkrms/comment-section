import React from 'react'
import * as Avatar from '@radix-ui/react-avatar'
import deleteIcon from '../assets/icon-delete.svg'
import editIcon from '../assets/icon-edit.svg'
import plusIcon from '../assets/icon-plus.svg'
import minusIcon from '../assets/icon-minus.svg'
import replyIcon from '../assets/icon-reply.svg'
import { VOTE_VALUE } from '../lib/commentUtils'
import './CommentCard.css'

function getInitials(username) {
    return username
        .split(/[^a-zA-Z0-9]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
}

function CommentCard({
    comment,
    displayedScore,
    avatarSrc,
    currentUsername,
    onUpvote,
    onDownvote,
    onReply,
    onDelete,
    onEdit,
    onCancelEdit,
    isEditing = false,
    editValue = '',
    onEditChange,
    onEditSubmit,
}) {
    const isCurrentUser = comment.user.username === currentUsername
    const currentVote = comment.vote ?? VOTE_VALUE.neutral

    return (
        <article className="comment-card" aria-label={`${comment.user.username} comment`}>
            <div className="comment-card__score" aria-label="Comment score controls">
                {!isCurrentUser ? (
                    <button
                        type="button"
                        className="comment-card__score-button"
                        onClick={onUpvote}
                        aria-label="Upvote comment"
                        aria-pressed={currentVote === VOTE_VALUE.up}
                    >
                        <img src={plusIcon} alt="" aria-hidden="true" />
                    </button>
                ) : null}

                <output className="comment-card__score-value" aria-live="polite">
                    {displayedScore}
                </output>

                {!isCurrentUser ? (
                    <button
                        type="button"
                        className="comment-card__score-button"
                        onClick={onDownvote}
                        aria-label="Downvote comment"
                        aria-pressed={currentVote === VOTE_VALUE.down}
                    >
                        <img src={minusIcon} alt="" aria-hidden="true" />
                    </button>
                ) : null}
            </div>

            <header className="comment-card__meta">
                <Avatar.Root className="comment-card__avatar">
                    <Avatar.Image src={avatarSrc} alt="" className="comment-card__avatar-image" />
                    <Avatar.Fallback className="comment-card__avatar-fallback" delayMs={200}>
                        {getInitials(comment.user.username)}
                    </Avatar.Fallback>
                </Avatar.Root>

                <div className="comment-card__author-row">
                    <strong className="comment-card__author">{comment.user.username}</strong>
                    {isCurrentUser ? <span className="comment-card__badge">you</span> : null}
                </div>
                <span className="comment-card__timestamp">{comment.createdAt}</span>
            </header>

            <div className="comment-card__actions">
                {isCurrentUser ? (
                    <>
                        <button
                            type="button"
                            className="comment-card__action comment-card__action--delete"
                            onClick={onDelete}
                        >
                            <img src={deleteIcon} alt="" aria-hidden="true" />
                            Delete
                        </button>
                        <button
                            type="button"
                            className="comment-card__action comment-card__action--edit"
                            onClick={isEditing ? onCancelEdit : onEdit}
                        >
                            <img src={editIcon} alt="" aria-hidden="true" />
                            {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                    </>
                ) : (
                    <button type="button" className="comment-card__action comment-card__action--reply" onClick={onReply}>
                        <img src={replyIcon} alt="" aria-hidden="true" />
                        Reply
                    </button>
                )}
            </div>

            {isEditing ? (
                <form className="comment-card__editor" onSubmit={onEditSubmit}>
                    <label className="sr-only" htmlFor={`edit-comment-${comment.id}`}>
                        Edit comment by {comment.user.username}
                    </label>
                    <textarea
                        id={`edit-comment-${comment.id}`}
                        className="comment-card__editor-input"
                        value={editValue}
                        onChange={onEditChange}
                        rows="4"
                    />
                    <button type="submit" className="comment-card__editor-submit">
                        Update
                    </button>
                </form>
            ) : (
                <p className="comment-card__body">
                    {comment.replyingTo ? (
                        <span className="comment-card__replying-to">@{comment.replyingTo} </span>
                    ) : null}
                    {comment.content}
                </p>
            )}
        </article>
    )
}

export default CommentCard
