import React, { useState } from 'react'
import * as Avatar from '@radix-ui/react-avatar'
import deleteIcon from '../../images/icon-delete.svg'
import editIcon from '../../images/icon-edit.svg'
import plusIcon from '../../images/icon-plus.svg'
import minusIcon from '../../images/icon-minus.svg'
import replyIcon from '../../images/icon-reply.svg'
import './CommentCard.css'

function getInitials(username) {
    return username
        .split(/[^a-zA-Z0-9]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
}

function CommentCard({ comment, avatarSrc, currentUsername }) {
    const [score, setScore] = useState(comment.score)
    const isCurrentUser = comment.user.username === currentUsername

    return (
        <article className="comment-card" aria-label={`${comment.user.username} comment`}>
            <div className="comment-card__score" aria-label="Comment score controls">
                <button
                    type="button"
                    className="comment-card__score-button"
                    onClick={() => setScore((currentScore) => currentScore + 1)}
                    aria-label="Upvote comment"
                >
                    <img src={plusIcon} alt="" aria-hidden="true" />
                </button>

                <output className="comment-card__score-value" aria-live="polite">
                    {score}
                </output>

                <button
                    type="button"
                    className="comment-card__score-button"
                    onClick={() => setScore((currentScore) => Math.max(0, currentScore - 1))}
                    aria-label="Downvote comment"
                >
                    <img src={minusIcon} alt="" aria-hidden="true" />
                </button>
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
                        >
                            <img src={deleteIcon} alt="" aria-hidden="true" />
                            Delete
                        </button>
                        <button
                            type="button"
                            className="comment-card__action comment-card__action--edit"
                        >
                            <img src={editIcon} alt="" aria-hidden="true" />
                            Edit
                        </button>
                    </>
                ) : (
                    <button type="button" className="comment-card__action comment-card__action--reply">
                        <img src={replyIcon} alt="" aria-hidden="true" />
                        Reply
                    </button>
                )}
            </div>

            <p className="comment-card__body">
                {comment.replyingTo ? (
                    <span className="comment-card__replying-to">@{comment.replyingTo} </span>
                ) : null}
                {comment.content}
            </p>
        </article>
    )
}

export default CommentCard
