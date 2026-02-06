import { useMemo, useState } from 'react'
import { SYMBOL_QUESTIONS, type SymbolQuestion } from './symbolQuestions'

type AnswerState = 'idle' | 'correct' | 'wrong'

function randomQuestion(excludeId?: string): SymbolQuestion {
  const candidates = excludeId
    ? SYMBOL_QUESTIONS.filter((question) => question.id !== excludeId)
    : SYMBOL_QUESTIONS
  return candidates[Math.floor(Math.random() * candidates.length)]!
}

function buildChoices(current: SymbolQuestion): readonly string[] {
  const wrongChoices = SYMBOL_QUESTIONS
    .filter((question) => question.id !== current.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((question) => question.meaning)

  const choices = [current.meaning, ...wrongChoices]
  return choices.sort(() => Math.random() - 0.5)
}

export function SymbolGame() {
  const [current, setCurrent] = useState<SymbolQuestion>(() => randomQuestion())
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [correctCount, setCorrectCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const choices = useMemo(() => buildChoices(current), [current])
  const accuracy = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100)

  const resultText =
    answerState === 'idle'
      ? ' '
      : answerState === 'correct'
        ? '正解！'
        : `不正解… 正解は「${current.meaning}」`

  const handleAnswer = (meaning: string) => {
    if (answerState !== 'idle') return

    setSelectedMeaning(meaning)
    setTotalCount((count) => count + 1)

    if (meaning === current.meaning) {
      setCorrectCount((count) => count + 1)
      setAnswerState('correct')
    } else {
      setAnswerState('wrong')
    }
  }

  const goNext = () => {
    setCurrent((prev) => randomQuestion(prev.id))
    setSelectedMeaning(null)
    setAnswerState('idle')
  }

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
            <div className="statLabel">記号名</div>
            <div className="statValue">{current.name}</div>
          </div>
        </div>
      </div>

      <div className="gameMain">
        <div className="staffCard symbolCard" aria-label="記号表示">
          <div className="symbolLabel">この記号の意味は？</div>
          <div className="symbolGlyph">{current.symbol}</div>
        </div>

        <div className="choices" role="group" aria-label="解答">
          {choices.map((meaning) => {
            const isCorrect = answerState !== 'idle' && meaning === current.meaning
            const isSelected = answerState !== 'idle' && selectedMeaning === meaning

            const className = [
              'choiceButton',
              isCorrect ? 'choiceCorrect' : '',
              isSelected && !isCorrect ? 'choiceWrong' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <button
                key={meaning}
                type="button"
                className={className}
                disabled={answerState !== 'idle'}
                onClick={() => handleAnswer(meaning)}
              >
                {meaning}
              </button>
            )
          })}
        </div>

        <div className="result" aria-live="polite">
          {resultText}
        </div>

        <div className="footerButtons">
          <button className="ghostButton" type="button" onClick={goNext}>
            次の問題へ
          </button>
        </div>
      </div>
    </section>
  )
}
