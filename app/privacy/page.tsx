"use client";

export default function PrivacyPage() {
    return (
        <div className="bg-white dark:bg-black min-h-screen text-black dark:text-white pb-20">
            <div className="container mx-auto max-w-[768px] px-4 py-8">
                <h1 className="text-3xl font-bold mb-8 pb-4 border-b border-gray-200 dark:border-gray-800">プライバシーポリシー</h1>

                <div className="space-y-12">
                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">個人情報の収集について</h2>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>本サービス（ネタツイグランプリ）では、利用者の利便性向上やサービス改善のために、アクセスログ等の情報を収集することがあります。ただし、これらは個人を特定できる情報ではありません。X（旧Twitter）アカウントを用いてログインいただいた場合、公開されているプロフィール情報等を必要最小限の範囲で取得します。</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">情報の利用目的</h2>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>収集した情報は、本サービスの品質向上、およびユーザーの皆様に最適な体験を提供するための分析、ランキング作成などにのみ使用します。</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">第三者への提供</h2>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>本サービスでは、法令に基づく場合を除き、取得した個人情報をあらかじめユーザーの同意を得ることなく第三者に提供することはありません。</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">プライバシーポリシーの変更</h2>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく変更することができるものとします。変更後のプライバシーポリシーは、本サービスに掲載したときから効力を生じるものとします。</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
