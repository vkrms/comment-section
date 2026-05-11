import React from 'react'
import data from '../data.json'
import amyrobsonAvatar from '../images/avatars/image-amyrobson.webp'
import juliusomoAvatar from '../images/avatars/image-juliusomo.webp'
import maxblagunAvatar from '../images/avatars/image-maxblagun.webp'
import ramsesmironAvatar from '../images/avatars/image-ramsesmiron.webp'
import CommentCard from './components/CommentCard'
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

function App() {
  const { comments, currentUser } = data

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
              />

              {comment.replies.length > 0 ? (
                <div className="comment-thread__replies" aria-label={`${comment.user.username} replies`}>
                  {comment.replies.map((reply) => (
                    <CommentCard
                      key={reply.id}
                      comment={reply}
                      avatarSrc={getAvatarSrc(reply.user.username)}
                      currentUsername={currentUser.username}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>

        <form className="comment-composer">
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
            />
          </label>
          <button type="submit" className="comment-composer__submit">
            Send
          </button>
        </form>
      </section>
    </main>
  )
}

export default App
