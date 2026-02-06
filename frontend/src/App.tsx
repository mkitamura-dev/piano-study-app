import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { NoteGame } from './note-game/NoteGame'
import { SymbolGame } from './symbol-game/SymbolGame'
import { SymbolListPage } from './symbol-game/SymbolListPage'

type Page = 'notes' | 'symbols' | 'symbols-list'

function parseHashToPage(hash: string): Page {
  if (hash === '#/symbols-list') return 'symbols-list'
  return hash === '#/symbols' ? 'symbols' : 'notes'
}

function App() {
  const [page, setPage] = useState<Page>(() => parseHashToPage(window.location.hash))

  useEffect(() => {
    const onHashChange = () => {
      setPage(parseHashToPage(window.location.hash))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const title = useMemo(
    () =>
      page === 'notes'
        ? 'ピアノの音符あてゲーム'
        : page === 'symbols'
          ? 'ピアノの音楽記号あてゲーム'
          : 'ピアノの音楽記号一覧',
    [page],
  )

  const subtitle = useMemo(
    () =>
      page === 'notes'
        ? '譜面の音符（＋音）を見て、正しい音名を当てよう'
        : page === 'symbols'
          ? '楽譜で使う記号を見て、意味を当てよう'
          : '記号あてゲームで使う問題を一覧で確認できます',
    [page],
  )

  return (
    <main className="app">
      <header className="appHeader">
        <h1 className="appTitle">{title}</h1>
        <p className="appSubtitle">{subtitle}</p>
        <nav className="pageNav" aria-label="ゲームページ切り替え">
          <a className={page === 'notes' ? 'pageLink pageLinkActive' : 'pageLink'} href="#/notes">
            音符あて
          </a>
          <a className={page === 'symbols' ? 'pageLink pageLinkActive' : 'pageLink'} href="#/symbols">
            記号あて
          </a>
          <a className={page === 'symbols-list' ? 'pageLink pageLinkActive' : 'pageLink'} href="#/symbols-list">
            記号一覧
          </a>
        </nav>
      </header>

      {page === 'notes' ? <NoteGame /> : page === 'symbols' ? <SymbolGame /> : <SymbolListPage />}
    </main>
  )
}

export default App
