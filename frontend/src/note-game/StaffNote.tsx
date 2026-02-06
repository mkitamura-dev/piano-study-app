import type { Clef, Note } from './notes'
import './note-game.css'

type Props = {
  note: Note
  clef: Clef
}

const DIATONIC_LETTER_INDEX: Record<Note['letter'], number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
}

function diatonicNumber(note: Note): number {
  return note.octave * 7 + DIATONIC_LETTER_INDEX[note.letter]
}

function staffYForClef(note: Note, referenceBottomLine: Note, bottomLineY: number, positionStepPx: number): number {
  const distance = diatonicNumber(note) - diatonicNumber(referenceBottomLine)
  return bottomLineY - distance * positionStepPx
}

function ledgerLineDistances(distanceFromBottomLine: number): number[] {
  // Lines are at even distances: 0,2,4,6,8 (E4..F5). Ledger lines continue even distances beyond.
  if (distanceFromBottomLine < 0) {
    const lines: number[] = []
    for (let d = -2; d >= distanceFromBottomLine; d -= 2) lines.push(d)
    return lines
  }
  if (distanceFromBottomLine > 8) {
    const lines: number[] = []
    for (let d = 10; d <= distanceFromBottomLine; d += 2) lines.push(d)
    return lines
  }
  return []
}

function diatonicDistanceFromBottomLine(note: Note, referenceBottomLine: Note): number {
  return diatonicNumber(note) - diatonicNumber(referenceBottomLine)
}

const CLEF_BOTTOM_LINE: Record<Clef, Note> = {
  treble: { letter: 'E', octave: 4 },
  bass: { letter: 'G', octave: 2 },
}

const CLEF_SYMBOL: Record<Clef, string> = {
  treble: '𝄞',
  bass: '𝄢',
}

const CLEF_LABEL: Record<Clef, string> = {
  treble: 'ト音記号',
  bass: 'ヘ音記号',
}

export function StaffNote({ note, clef }: Props) {
  const width = 320
  const height = 220
  const staffLeft = 24
  const staffRight = width - 24

  const lineGap = 16
  const positionStep = lineGap / 2
  const bottomLineY = 150
  const referenceBottomLine = CLEF_BOTTOM_LINE[clef]
  const noteX = (staffLeft + staffRight) / 2 + 20

  const y = staffYForClef(note, referenceBottomLine, bottomLineY, positionStep)
  const distance = diatonicDistanceFromBottomLine(note, referenceBottomLine)
  const ledgerDistances = ledgerLineDistances(distance)
  const stemDown = distance >= 4

  return (
    <div className="staffCard" aria-label="譜面">
      <svg
        className="staffSvg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${CLEF_LABEL[clef]}の五線譜`}
      >
        <text x={32} y={122} fontSize="56" opacity="0.9">
          {CLEF_SYMBOL[clef]}
        </text>

        {/* staff lines */}
        {Array.from({ length: 5 }, (_, i) => {
          const yLine = bottomLineY - i * lineGap
          return (
            <line
              key={i}
              x1={staffLeft}
              y1={yLine}
              x2={staffRight}
              y2={yLine}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.9"
            />
          )
        })}

        {/* ledger lines (if needed) */}
        {ledgerDistances.map((d) => {
          const yLine = bottomLineY - d * positionStep
          return (
            <line
              key={d}
              x1={noteX - 26}
              y1={yLine}
              x2={noteX + 26}
              y2={yLine}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.9"
            />
          )
        })}

        {/* note head */}
        <ellipse
          cx={noteX}
          cy={y}
          rx="14"
          ry="10"
          fill="currentColor"
          transform={`rotate(-18 ${noteX} ${y})`}
        />

        {/* stem (simple) */}
        <line
          x1={stemDown ? noteX - 12 : noteX + 12}
          y1={y}
          x2={stemDown ? noteX - 12 : noteX + 12}
          y2={stemDown ? y + 46 : y - 46}
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
