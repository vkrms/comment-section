import data from '../data.json'
import amyrobsonAvatar from '../images/avatars/image-amyrobson.webp'
import CommentCard from './components/CommentCard'
import './App.css'

function App() {
  const [firstComment] = data.comments

  return (
    <main className="app-shell" aria-label="Comments section preview">
      <section className="app-shell__preview" aria-label="Comment component preview">
        <CommentCard comment={firstComment} avatarSrc={amyrobsonAvatar} />
      </section>
    </main>
  )
}

export default App
