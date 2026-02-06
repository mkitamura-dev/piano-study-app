import { SYMBOL_QUESTIONS } from './symbolQuestions'

export function SymbolListPage() {
  return (
    <section className="game">
      <div className="gameMain">
        <div className="staffCard symbolListCard">
          <h2 className="symbolListTitle">音楽記号 問題一覧</h2>
          <p className="symbolListSubtitle">記号あてゲームで出題される問題一覧です。</p>

          <div className="symbolTableWrap">
            <table className="symbolTable">
              <thead>
                <tr>
                  <th>記号</th>
                  <th>名称</th>
                  <th>意味</th>
                </tr>
              </thead>
              <tbody>
                {SYMBOL_QUESTIONS.map((question) => (
                  <tr key={question.id}>
                    <td className="symbolCell">{question.symbol}</td>
                    <td>{question.name}</td>
                    <td>{question.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
