"use client";

export default function TermsPage() {
    return (
        <div className="bg-white dark:bg-black min-h-screen text-black dark:text-white pb-20">
            <div className="container mx-auto max-w-[768px] px-4 py-8">
                <h1 className="text-3xl font-bold mb-8 pb-4 border-b border-gray-200 dark:border-gray-800">利用規約</h1>

                <div className="space-y-12">
                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">第1条（適用）</h2>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>本規約は、ユーザーと本サービス（ネタツイグランプリ）との間の利用に関わる一切の関係に適用されるものとします。</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">第2条（禁止事項）</h2>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
                            <ul className="list-disc pl-5 space-y-2 mt-4">
                                <li>法令または公序良俗に違反する行為</li>
                                <li>犯罪行為に関連する行為</li>
                                <li>当サイトのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                                <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                                <li>他のユーザーに成りすます行為</li>
                                <li>その他、運営が不適切と判断する行為</li>
                            </ul>
                        </div>
                    </section>
                    
                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">第3条（免責事項）</h2>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>当運営は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。</p>
                            <br/>
                            <p>当運営は、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
