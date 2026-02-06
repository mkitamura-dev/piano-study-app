export type SymbolQuestion = {
  id: string
  symbol: string
  name: string
  meaning: string
}

export const SYMBOL_QUESTIONS: readonly SymbolQuestion[] = [
  { id: 'pp', symbol: 'pp', name: 'ピアニッシモ', meaning: 'とても弱く' },
  { id: 'p', symbol: 'p', name: 'ピアノ', meaning: '弱く' },
  { id: 'mf', symbol: 'mf', name: 'メゾフォルテ', meaning: 'やや強く' },
  { id: 'f', symbol: 'f', name: 'フォルテ', meaning: '強く' },
  { id: 'ff', symbol: 'ff', name: 'フォルティッシモ', meaning: 'とても強く' },
  { id: 'crescendo', symbol: 'cresc.', name: 'クレッシェンド', meaning: 'だんだん強く' },
  { id: 'diminuendo', symbol: 'dim.', name: 'ディミヌエンド', meaning: 'だんだん弱く' },
  { id: 'staccato', symbol: '•', name: 'スタッカート', meaning: '音を短く切って' },
  { id: 'tenuto', symbol: '—', name: 'テヌート', meaning: '音を十分保って' },
  { id: 'fermata', symbol: '𝄐', name: 'フェルマータ', meaning: 'ほどよく伸ばす' },
  { id: 'pedal', symbol: 'Ped.', name: 'ペダル', meaning: 'ダンパーペダルを踏む' },
]
