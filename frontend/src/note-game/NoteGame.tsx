import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { playTone } from './audio'
import {
  formatChoiceLabel,
  NOTE_LETTERS,
  type Clef,
  type NaturalNoteLetter,
  type Note,
  type NoteNameStyle,
  noteToMidi,
  noteToFrequencyHz,
  randomFrom,
} from './notes'
import { StaffNote } from './StaffNote'
import './note-game.css'

type AnswerState =
  | { state: 'idle' }
  | { state: 'correct'; chosen: NaturalNoteLetter }
  | { state: 'wrong'; chosen: NaturalNoteLetter; correct: NaturalNoteLetter }
type GameMode = 'single' | 'preview'
type NoteQueue = readonly Note[]
const BATCH_SIZE = 5

function generateNaturalRange(start: Note, end: Note): readonly Note[] {
  const startMidi = noteToMidi(start)
  const endMidi = noteToMidi(end)
  const notes: Note[] = []

  for (let octave = start.octave; octave <= end.octave; octave += 1) {
    for (const letter of NOTE_LETTERS) {
      const note: Note = { letter, octave }
      const midi = noteToMidi(note)
      if (midi < startMidi || midi > endMidi) continue
      notes.push(note)
    }
  }

  return notes
}

const NOTE_POOLS: Record<Clef, readonly Note[]> = {
  treble: generateNaturalRange({ letter: 'A', octave: 3 }, { letter: 'E', octave: 6 }),
  bass: generateNaturalRange({ letter: 'A', octave: 1 }, { letter: 'E', octave: 4 }),
}

const RANGE_LABELS: Record<Clef, string> = {
  treble: 'A3 〜 E6',
  bass: 'A1 〜 E4',
}
const ANSWER_BUTTONS: readonly NaturalNoteLetter[] = [...NOTE_LETTERS, 'C']

function nextRandomNote(notePool: readonly Note[], prev?: Note): Note {
  if (!prev) return randomFrom(notePool)
  // avoid immediate repeats
  const candidates = notePool.filter((n) => n.letter !== prev.letter || n.octave !== prev.octave)
  return randomFrom(candidates)
}

function createQueue(notePool: readonly Note[], count: number): NoteQueue {
  const notes: Note[] = []
  notes.push(nextRandomNote(notePool))
  while (notes.length < count) {
    notes.push(nextRandomNote(notePool, notes[notes.length - 1]))
  }
  return notes
}

export function NoteGame() {
  const [nameStyle, setNameStyle] = useState<NoteNameStyle>('solfege')
  const [clef, setClef] = useState<Clef>('treble')
  const [gameMode, setGameMode] = useState<GameMode>('single')
  const [batchIndex, setBatchIndex] = useState(0)
  const notePool = useMemo(() => NOTE_POOLS[clef], [clef])
  const [queue, setQueue] = useState<NoteQueue>(() => createQueue(NOTE_POOLS.treble, BATCH_SIZE))
  const [answer, setAnswer] = useState<AnswerState>({ state: 'idle' })
  const [correctCount, setCorrectCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const pendingAdvanceTimer = useRef<number | undefined>(undefined)
  const currentNote = gameMode === 'preview' ? queue[batchIndex] : queue[0]
  const currentLetter = currentNote.letter

  const accuracy = useMemo(() => {
    if (totalCount === 0) return 0
    return Math.round((correctCount / totalCount) * 100)
  }, [correctCount, totalCount])

  const clearPendingAdvance = useCallback(() => {
    if (pendingAdvanceTimer.current === undefined) return
    window.clearTimeout(pendingAdvanceTimer.current)
    pendingAdvanceTimer.current = undefined
  }, [])

  const advance = useCallback(() => {
    clearPendingAdvance()
    setAnswer({ state: 'idle' })
    if (gameMode === 'preview') {
      setBatchIndex((prevIndex) => {
        const nextIndex = prevIndex + 1
        if (nextIndex >= BATCH_SIZE) {
          setQueue(createQueue(notePool, BATCH_SIZE))
          return 0
        }
        return nextIndex
      })
      return
    }
    setBatchIndex(0)
    setQueue(createQueue(notePool, BATCH_SIZE))
  }, [clearPendingAdvance, gameMode, notePool])

  useEffect(() => {
    clearPendingAdvance()
    setAnswer({ state: 'idle' })
    setBatchIndex(0)
    setQueue(createQueue(notePool, BATCH_SIZE))
  }, [clearPendingAdvance, notePool, gameMode])

  const handlePlay = useCallback(async () => {
    setIsPlaying(true)
    try {
      await playTone(noteToFrequencyHz(currentNote))
    } finally {
      setIsPlaying(false)
    }
  }, [currentNote])

  const handleGuess = useCallback(
    async (letter: NaturalNoteLetter) => {
      if (answer.state !== 'idle') return

      const correct = currentLetter
      setTotalCount((n) => n + 1)

      if (letter === correct) {
        setCorrectCount((n) => n + 1)
        setStreak((n) => n + 1)
        setAnswer({ state: 'correct', chosen: letter })
      } else {
        setStreak(0)
        setAnswer({ state: 'wrong', chosen: letter, correct })
      }

      // small delay then next question
      pendingAdvanceTimer.current = window.setTimeout(() => {
        advance()
      }, 650)
    },
    [advance, answer.state, currentLetter],
  )

  const resultText = useMemo(() => {
    if (answer.state === 'idle') return ' '
    if (answer.state === 'correct') return '正解！'
    return `不正解… 正解は ${formatChoiceLabel(answer.correct, nameStyle)}`
  }, [answer, nameStyle])

  return (
    <section className="game">
      <div className="gameTop">
        <div className="stats">
          <div className="stat">
            <div className="statLabel">正解</div>
            <div className="statValue">{correctCount}</div>
          </div>
          <div className="stat">
            <div className="statLabel">問題</div>
            <div className="statValue">{totalCount}</div>
          </div>
          <div className="stat">
            <div className="statLabel">正答率</div>
            <div className="statValue">{accuracy}%</div>
          </div>
          <div className="stat">
            <div className="statLabel">連続</div>
            <div className="statValue">{streak}</div>
          </div>
        </div>

        <div className="controls">
          <label className="selectLabel">
            譜表
            <select className="select" value={clef} onChange={(e) => setClef(e.target.value as Clef)}>
              <option value="treble">ト音記号</option>
              <option value="bass">ヘ音記号</option>
            </select>
          </label>

          <label className="selectLabel">
            モード
            <select className="select" value={gameMode} onChange={(e) => setGameMode(e.target.value as GameMode)}>
              <option value="single">通常</option>
              <option value="preview">5音先読み</option>
            </select>
          </label>

          <label className="selectLabel">
            表示
            <select
              className="select"
              value={nameStyle}
              onChange={(e) => setNameStyle(e.target.value as NoteNameStyle)}
            >
              <option value="solfege">ドレミ（CDE併記）</option>
              <option value="letter">CDE</option>
            </select>
          </label>

          <button className="secondaryButton" type="button" onClick={handlePlay} disabled={isPlaying}>
            {isPlaying ? '再生中…' : '音を鳴らす'}
          </button>
        </div>
      </div>

      <div className="gameMain">
        <StaffNote
          clef={clef}
          notes={gameMode === 'preview' ? queue : [currentNote]}
          activeIndex={gameMode === 'preview' ? batchIndex : 0}
        />

        <div className="prompt">
          <div className="promptTitle">この音符はどれ？</div>
          <div className="promptHint">
            範囲: {RANGE_LABELS[clef]}
            {gameMode === 'preview' ? ' / 5音答えたら次の5音へ' : ''}
          </div>
        </div>

        <div className="choices" role="group" aria-label="解答">
          {ANSWER_BUTTONS.map((letter, index) => {
            const disabled = answer.state !== 'idle'
            const isCorrect = answer.state !== 'idle' && letter === currentLetter
            const isChosen = answer.state !== 'idle' && 'chosen' in answer && answer.chosen === letter

            const className = [
              'choiceButton',
              isCorrect ? 'choiceCorrect' : '',
              isChosen && !isCorrect ? 'choiceWrong' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <button
                key={`${letter}-${index}`}
                type="button"
                className={className}
                onClick={() => void handleGuess(letter)}
                disabled={disabled}
              >
                {formatChoiceLabel(letter, nameStyle)}
              </button>
            )
          })}
        </div>

        <div className="result" aria-live="polite">
          {resultText}
        </div>

        <div className="footerButtons">
          <button className="ghostButton" type="button" onClick={advance}>
            スキップ / 次へ
          </button>
          <button
            className="ghostButton"
            type="button"
            onClick={() => {
              clearPendingAdvance()
              setAnswer({ state: 'idle' })
              setCorrectCount(0)
              setTotalCount(0)
              setStreak(0)
              setBatchIndex(0)
              setQueue(createQueue(notePool, BATCH_SIZE))
            }}
          >
            リセット
          </button>
        </div>
      </div>
    </section>
  )
}
