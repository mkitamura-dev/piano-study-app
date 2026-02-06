import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '../note-game/note-game.css'
import './rhythm-game.css'

type Hand = 'left' | 'right'
type HandState = Record<Hand, boolean>

type RhythmPattern = {
  id: string
  name: string
  length: number
  left: readonly number[]
  right: readonly number[]
}

const RHYTHM_PATTERNS: readonly RhythmPattern[] = [
  {
    id: 'three-vs-four',
    name: '左3:右4（12分割）',
    length: 12,
    left: [0, 4, 8],
    right: [0, 3, 6, 9],
  },
  {
    id: 'two-vs-three',
    name: '左2:右3（12分割）',
    length: 12,
    left: [0, 6],
    right: [0, 4, 8],
  },
  {
    id: 'quarter-vs-eighth',
    name: '左4分:右8分（16分割）',
    length: 16,
    left: [0, 4, 8, 12],
    right: [0, 2, 4, 6, 8, 10, 12, 14],
  },
]

const BPM_OPTIONS = [60, 72, 84, 96, 108, 120]

function isRequired(pattern: RhythmPattern, hand: Hand, step: number): boolean {
  return (hand === 'left' ? pattern.left : pattern.right).includes(step)
}

export function RhythmHandsGame() {
  const [patternId, setPatternId] = useState(RHYTHM_PATTERNS[0]!.id)
  const [bpm, setBpm] = useState(84)
  const [isRunning, setIsRunning] = useState(false)
  const [step, setStep] = useState(0)
  const [pressed, setPressed] = useState<HandState>({ left: false, right: false })
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [combo, setCombo] = useState(0)
  const [feedback, setFeedback] = useState('スタートして同時リズムに挑戦')

  const stepRef = useRef(step)
  const pressedRef = useRef<HandState>(pressed)
  const pattern = useMemo(
    () => RHYTHM_PATTERNS.find((item) => item.id === patternId) ?? RHYTHM_PATTERNS[0]!,
    [patternId],
  )

  const accuracy = useMemo(() => {
    const total = hits + misses
    if (total === 0) return 0
    return Math.round((hits / total) * 100)
  }, [hits, misses])

  const stepMs = useMemo(() => Math.round(60000 / bpm / 2), [bpm])

  useEffect(() => {
    stepRef.current = step
  }, [step])

  useEffect(() => {
    pressedRef.current = pressed
  }, [pressed])

  const judgeMissesAndAdvance = useCallback(() => {
    const currentStep = stepRef.current
    const pendingMisses: Hand[] = []

    if (isRequired(pattern, 'left', currentStep) && !pressedRef.current.left) pendingMisses.push('left')
    if (isRequired(pattern, 'right', currentStep) && !pressedRef.current.right) pendingMisses.push('right')

    if (pendingMisses.length > 0) {
      setMisses((value) => value + pendingMisses.length)
      setCombo(0)
      setFeedback(
        `ミス: ${
          pendingMisses.includes('left') && pendingMisses.includes('right')
            ? '左右'
            : pendingMisses.includes('left')
              ? '左'
              : '右'
        }`,
      )
    }

    const nextStep = (currentStep + 1) % pattern.length
    stepRef.current = nextStep
    setStep(nextStep)
    pressedRef.current = { left: false, right: false }
    setPressed({ left: false, right: false })
  }, [pattern])

  useEffect(() => {
    if (!isRunning) return
    const timer = window.setInterval(judgeMissesAndAdvance, stepMs)
    return () => window.clearInterval(timer)
  }, [isRunning, judgeMissesAndAdvance, stepMs])

  const tap = (hand: Hand) => {
    if (!isRunning) return
    if (pressedRef.current[hand]) return

    const currentStep = stepRef.current
    const required = isRequired(pattern, hand, currentStep)

    pressedRef.current = { ...pressedRef.current, [hand]: true }
    setPressed((prev) => ({ ...prev, [hand]: true }))

    if (required) {
      setHits((value) => value + 1)
      setCombo((value) => value + 1)
      setFeedback(`${hand === 'left' ? '左手' : '右手'} ナイス`)
      return
    }

    setMisses((value) => value + 1)
    setCombo(0)
    setFeedback(`${hand === 'left' ? '左手' : '右手'} はこの拍で不要`)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (event.key === 'f' || event.key === 'F') tap('left')
      if (event.key === 'j' || event.key === 'J') tap('right')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const resetGame = () => {
    setIsRunning(false)
    stepRef.current = 0
    pressedRef.current = { left: false, right: false }
    setStep(0)
    setPressed({ left: false, right: false })
    setHits(0)
    setMisses(0)
    setCombo(0)
    setFeedback('リセットしました')
  }

  return (
    <section className="game">
      <div className="gameTop">
        <div className="stats">
          <div className="stat">
            <div className="statLabel">成功</div>
            <div className="statValue">{hits}</div>
          </div>
          <div className="stat">
            <div className="statLabel">ミス</div>
            <div className="statValue">{misses}</div>
          </div>
          <div className="stat">
            <div className="statLabel">正確さ</div>
            <div className="statValue">{accuracy}%</div>
          </div>
          <div className="stat">
            <div className="statLabel">コンボ</div>
            <div className="statValue">{combo}</div>
          </div>
        </div>

        <div className="controls">
          <label className="selectLabel">
            パターン
            <select className="select" value={pattern.id} onChange={(event) => setPatternId(event.target.value)}>
              {RHYTHM_PATTERNS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="selectLabel">
            速度
            <select className="select" value={bpm} onChange={(event) => setBpm(Number(event.target.value))}>
              {BPM_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value} BPM
                </option>
              ))}
            </select>
          </label>

          <button className="secondaryButton" type="button" onClick={() => setIsRunning((value) => !value)}>
            {isRunning ? '停止' : 'スタート'}
          </button>
        </div>
      </div>

      <div className="gameMain">
        <div className="staffCard rhythmCard">
          <div className="rhythmLegend">
            <span>現在ステップ: {step + 1}</span>
            <span>キー: 左 `F` / 右 `J`</span>
          </div>

          <div className="rhythmLane">
            <div className="rhythmLaneLabel">左手</div>
            <div className="rhythmSteps">
              {Array.from({ length: pattern.length }, (_, index) => {
                const active = step === index
                const required = pattern.left.includes(index)
                return (
                  <div
                    key={`left-${index}`}
                    className={[
                      'rhythmStep',
                      active ? 'rhythmStepActive' : '',
                      required ? 'rhythmStepRequiredLeft' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                )
              })}
            </div>
          </div>

          <div className="rhythmLane">
            <div className="rhythmLaneLabel">右手</div>
            <div className="rhythmSteps">
              {Array.from({ length: pattern.length }, (_, index) => {
                const active = step === index
                const required = pattern.right.includes(index)
                return (
                  <div
                    key={`right-${index}`}
                    className={[
                      'rhythmStep',
                      active ? 'rhythmStepActive' : '',
                      required ? 'rhythmStepRequiredRight' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                )
              })}
            </div>
          </div>
        </div>

        <div className="tapButtons">
          <button
            className={`tapButton tapButtonLeft ${pressed.left ? 'tapButtonPressed' : ''}`}
            type="button"
            onClick={() => tap('left')}
          >
            左手を叩く（F）
          </button>
          <button
            className={`tapButton tapButtonRight ${pressed.right ? 'tapButtonPressed' : ''}`}
            type="button"
            onClick={() => tap('right')}
          >
            右手を叩く（J）
          </button>
        </div>

        <div className="result" aria-live="polite">
          {feedback}
        </div>

        <div className="footerButtons">
          <button className="ghostButton" type="button" onClick={resetGame}>
            リセット
          </button>
        </div>
      </div>
    </section>
  )
}
