import './App.css'
import { NoteGame } from './note-game/NoteGame'

function App() {
  return (
    <main className="app">
      <header className="appHeader">
        <h1 className="appTitle">ピアノの音符あてゲーム</h1>
        <p className="appSubtitle">譜面の音符（＋音）を見て、正しい音名を当てよう</p>
      </header>

      <NoteGame />
    </main>
  )
}

export default App
