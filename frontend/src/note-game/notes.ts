export type NaturalNoteLetter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'

export type NoteNameStyle = 'letter' | 'solfege'
export type Clef = 'treble' | 'bass'

export type Note = Readonly<{
  letter: NaturalNoteLetter
  octave: number
}>

export const NOTE_LETTERS: readonly NaturalNoteLetter[] = [
  'C',
  'D',
  'E',
  'F',
  'G',
  'A',
  'B',
]

const LETTER_TO_SEMITONE: Record<NaturalNoteLetter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

const LETTER_TO_SOLFEGE: Record<NaturalNoteLetter, string> = {
  C: 'ド',
  D: 'レ',
  E: 'ミ',
  F: 'ファ',
  G: 'ソ',
  A: 'ラ',
  B: 'シ',
}

export function noteToMidi(note: Note): number {
  // MIDI: C4 = 60, formula uses octave where C-1 = 0
  return (note.octave + 1) * 12 + LETTER_TO_SEMITONE[note.letter]
}

export function midiToFrequencyHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

export function noteToFrequencyHz(note: Note): number {
  return midiToFrequencyHz(noteToMidi(note))
}

export function formatNoteName(note: Note, style: NoteNameStyle): string {
  if (style === 'solfege') return `${LETTER_TO_SOLFEGE[note.letter]}（${note.letter}${note.octave}）`
  return `${note.letter}${note.octave}`
}

export function formatChoiceLabel(letter: NaturalNoteLetter, style: NoteNameStyle): string {
  if (style === 'solfege') return `${LETTER_TO_SOLFEGE[letter]}（${letter}）`
  return letter
}

export function generateNaturalNotes(startOctave: number, endOctave: number): readonly Note[] {
  const notes: Note[] = []
  for (let octave = startOctave; octave <= endOctave; octave += 1) {
    for (const letter of NOTE_LETTERS) notes.push({ letter, octave })
  }
  return notes
}

export function randomFrom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}
