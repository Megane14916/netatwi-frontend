// ルールページのコンポーネント
// 基本的なルール説明を記載
export default function RulesPage() {
    return (
        <div className="container mx-auto max-w-3xl px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-2">大会ルール</h1>

            <div className="space-y-6 text-gray-300">
                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-yellow-400">基本ルール</h2>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li>各大会で出題されるお題に沿って、面白いツイート（ネタツイ）を投稿してください。</li>
                        <li>投稿期間内に投稿されたツイートが審査・投票の対象となります。</li>
                        <li>投稿は1つの大会につき、1人1回までです。</li>
                        <li>公序良俗に反する内容、他人を誹謗中傷する内容の投稿は禁止です。</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-yellow-400">投稿について</h2>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li>投稿はテキスト形式です。絵文字も使用可能です。</li>
                        <li>（画像投稿は現在未実装です）</li>
                        <li>投稿された内容は、投稿期間終了まで編集・削除できません。</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-yellow-400">投票について</h2>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li>投票期間になると、各投稿に対して投票ができるようになります。</li>
                        <li>一般ユーザーは、各投稿に対して0〜3票の範囲で投票できます。</li>
                        <li>投票するには、合計で10票以上を異なる投稿に割り振る必要があります。</li>
                        <li>一度確定した投票は変更できません。</li>
                        <li>審査員は別途、審査員票として投票を行います。</li>
                    </ul>
                </section>

                 <section>
                    <h2 className="text-2xl font-semibold mb-3 text-yellow-400">結果発表について</h2>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li>投票期間が終了すると、結果が集計され、大会ページで発表されます。</li>
                        <li>順位は、一般票と審査員票を、大会ごとに設定された比率で合算して決定されます。</li>
                        <li>（審査員特別賞については後日追記します）</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-3 text-yellow-400">その他</h2>
                     <ul className="list-disc list-inside space-y-2 pl-4">
                        <li>ルールは予告なく変更される場合があります。</li>
                        <li>不明な点があれば、運営までお問い合わせください（未実装）。</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}
