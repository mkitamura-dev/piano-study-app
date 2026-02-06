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

function nextRandomNote(notePool: readonly Note[], prev?: Note): Note {
  if (!prev) return randomFrom(notePool)
  // avoid immediate repeats
  const candidates = notePool.filter((n) => n.letter !== prev.letter || n.octave !== prev.octave)
  return randomFrom(candidates)
}

export function NoteGame() {
  const [nameStyle, setNameStyle] = useState<NoteNameStyle>('solfege')
  const [clef, setClef] = useState<Clef>('treble')
  const notePool = useMemo(() => NOTE_POOLS[clef], [clef])
  const [current, setCurrent] = useState<Note>(() => randomFrom(NOTE_POOLS.treble))
  const [answer, setAnswer] = useState<AnswerState>({ state: 'idle' })
  const [correctCount, setCorrectCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const pendingAdvanceTimer = useRef<number | undefined>(undefined)

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
    setCurrent((prev) => nextRandomNote(notePool, prev))
  }, [clearPendingAdvance, notePool])

  useEffect(() => {
    clearPendingAdvance()
    setAnswer({ state: 'idle' })
    setCurrent(randomFrom(notePool))
  }, [clearPendingAdvance, notePool])

  const handlePlay = useCallback(async () => {
    setIsPlaying(true)
    try {
      await playTone(noteToFrequencyHz(current))
    } finally {
      setIsPlaying(false)
    }
  }, [current])

  const handleGuess = useCallback(
    async (letter: NaturalNoteLetter) => {
      if (answer.state !== 'idle') return

      const correct = current.letter
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
    [advance, answer.state, current.letter],
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
        <StaffNote note={current} clef={clef} />

        <div className="prompt">
          <div className="promptTitle">この音符はどれ？</div>
          <div className="promptHint">範囲: {RANGE_LABELS[clef]}</div>
        </div>

        <div className="choices" role="group" aria-label="解答">
          {NOTE_LETTERS.map((letter) => {
            const disabled = answer.state !== 'idle'
            const isCorrect = answer.state !== 'idle' && letter === current.letter
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
                key={letter}
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
              setCurrent(randomFrom(notePool))
            }}
          >
            リセット
          </button>
        </div>
      </div>
    </section>
  )
}
