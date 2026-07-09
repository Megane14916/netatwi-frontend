// ルールページのコンポーネント
// 基本的なルール説明を記載
export default function RulesPage() {
    return (
        <div className="bg-white dark:bg-black min-h-screen text-black dark:text-white">
            <div className="container mx-auto max-w-[672px] px-4 py-8">
                <h1 className="text-3xl font-bold mb-6 border-b border-[#1DA1F2] pb-2">大会ルール</h1>

                <div className="space-y-6 text-black dark:text-white">
                    <section>
                        <h2 className="text-2xl font-semibold mb-3 text-[#1DA1F2]">基本ルール</h2>
                        <ul className="list-disc list-inside space-y-2 pl-4">
                            <li>ネタツイを投稿してください。お題はありません。</li>
                            <li>投稿期間内に投稿されたツイートが審査・投票の対象となります。</li>
                            <li>投稿は1つの大会につき、1人1回までです。</li>
                            <li>公序良俗に反する内容、他人を誹謗中傷する内容の投稿は禁止です。</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3 text-[#1DA1F2]">投稿について</h2>
                        <ul className="list-disc list-inside space-y-2 pl-4">
                            <li>投稿はテキスト形式です。絵文字・画像も使用可能です。</li>
                            <li>投稿された内容は、投稿期間終了まで編集することが可能です。</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3 text-[#1DA1F2]">投票について</h2>
                        <ul className="list-disc list-inside space-y-2 pl-4">
                            <li>投票期間になると、各投稿に対して投票ができるようになります。</li>
                            <li>一般ユーザーは投稿に対して「いいね」で投票ができます。</li>
                            <li>投票は、投票期間終了まで編集することが可能です。</li>
                            <li>審査員は、全ての投稿に10点満点で点数をつけてもらいます。</li>
                            <li>審査員は、<span className="text-[#1DA1F2] font-bold">審査員特別賞</span>を1つ選出してもらい、ひとことコメントをいただきます。好きな審査員からの審査員特別賞も狙ってみましょう。</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3 text-[#1DA1F2]">結果発表について</h2>
                        <ul className="list-disc list-inside space-y-2 pl-4">
                            <li>投票期間が終了すると、結果が集計され、会場ページで発表されます。審査員特別賞も同時に発表されます。</li>
                            <li>順位は、一般票と審査員票を、大会ごとに設定された比率で合算して決定されます。詳しくは下の「得点の計算方法について」をご覧ください。</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3 text-[#1DA1F2]">得点の計算方法について</h2>
                        <ul className="list-disc list-inside space-y-2 pl-4">
                            <li>得点は、(一般投票者からのいいねの数/一般投票者の人数) × 50 + (審査員がつけた点数の合計) で計算されます。</li>
                            <li>審査員の数は20人、10点満点で評価するため、満点は250点となります。</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3 text-[#1DA1F2]">その他</h2>
                         <ul className="list-disc list-inside space-y-2 pl-4">
                            <li>不明な点があれば、<a href="https://x.com/netatwiGP" className="text-[#1DA1F2] hover:underline">運営</a>までお問い合わせください。</li>
                            <li>本サイトに使用している絵文字には Twemoji を使用しています。© Twitter, Inc. and contributors. Licensed under CC BY 4.0.</li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
}
