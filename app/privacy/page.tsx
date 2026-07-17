"use client";

export default function PrivacyPage() {
    return (
        <div className="bg-white dark:bg-black min-h-screen text-black dark:text-white pb-20">
            <div className="container mx-auto max-w-[768px] px-4 py-8">
                <h1 className="text-3xl font-bold mb-8 pb-4 border-b border-gray-200 dark:border-gray-800">プライバシーポリシー</h1>

                <div className="space-y-12">
                    <section>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>ネタツイグランプリ運営（以下，「当社」といいます。）は，本ウェブサイト上で提供するサービス（以下，「本サービス」といいます。）における，ユーザーの個人情報の取扱いについて，以下のとおりプライバシーポリシー（以下，「本ポリシー」といいます。）を定めます。</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">第1条（個人情報）</h2>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>「個人情報」とは，個人情報保護法にいう「個人情報」を指すものとし，生存する個人に関する情報であって，当該情報に含まれる氏名，生年月日，住所，電話番号，連絡先その他の記述等により特定の個人を識別できる情報及び容貌，指紋，声紋にかかるデータ，及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">第2条（個人情報の収集方法）</h2>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>当社は、ユーザーが本サービスを利用・登録する際に、X（旧Twitter）アカウントの認証情報を取得します。</p>
                            <br />
                            <p>本サービスではXアカウントに関連する公開情報（ユーザー名、プロフィール画像など）および認証に必要な識別子のみを収集しており、氏名、生年月日、住所、電話番号、メールアドレスなどのその他の個人情報は一切取得いたしません。</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">第3条（個人情報を収集・利用する目的）</h2>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>当社が個人情報を収集・利用する目的は，以下のとおりです。</p>
                            <ul className="list-decimal pl-5 space-y-2 mt-4">
                                <li>本サービスの提供・運営のため（Xアカウントによるログイン認証など）</li>
                                <li>利用規約に違反したユーザーや，不正・不当な目的でサービスを利用しようとするユーザーの特定をし，ご利用をお断りするため</li>
                                <li>ユーザーにご自身の登録情報の閲覧や変更，削除，ご利用状況の閲覧を行っていただくため</li>
                                <li>メンテナンス，重要なお知らせなど必要に応じたご連絡のため</li>
                                <li>上記の利用目的に付随する目的</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">第4条（利用目的の変更）</h2>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>当社は，利用目的が変更前と関連性を有すると合理的に認められる場合に限り，個人情報の利用目的を変更するものとします。</p>
                            <br />
                            <p>利用目的の変更を行った場合には，変更後の目的について，当社所定の方法により，ユーザーに通知し，または本ウェブサイト上に公表するものとします。</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">第5条（個人情報の第三者提供）</h2>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>当社は，次に掲げる場合を除いて，あらかじめユーザーの同意を得ることなく，第三者に個人情報を提供することはありません。ただし，個人情報保護法その他の法令で認められる場合を除きます。</p>
                            <ul className="list-decimal pl-5 space-y-2 mt-4">
                                <li>人の生命，身体または財産の保護のために必要がある場合であって，本人の同意を得ることが困難であるとき</li>
                                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって，本人の同意を得ることが困難であるとき</li>
                                <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって，本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
                                <li>予め次の事項を告知あるいは公表し，かつ当社が個人情報保護委員会に届出をしたとき
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li>利用目的に第三者への提供を含むこと</li>
                                        <li>第三者に提供されるデータの項目</li>
                                        <li>第三者への提供の手段または方法</li>
                                        <li>本人の求めに応じて個人情報の第三者への提供を停止すること</li>
                                        <li>本人の求めを受け付ける方法</li>
                                    </ul>
                                </li>
                            </ul>
                            <br />
                            <p>前項の定めにかかわらず，次に掲げる場合には，当該情報の提供先は第三者に該当しないものとします。</p>
                            <ul className="list-decimal pl-5 space-y-2 mt-4">
                                <li>当社が利用目的の達成に必要な範囲内において個人情報の取扱いの全部または一部を委託する場合</li>
                                <li>合併その他の事由による事業の承継に伴って個人情報が提供される場合</li>
                                <li>個人情報を特定の者との間で共同して利用する場合であって，その旨並びに共同して利用される個人情報の項目，共同して利用する者の範囲，利用する者の利用目的および当該個人情報の管理について責任を有する者の氏名または名称について，あらかじめ本人に通知し，または本人が容易に知り得る状態に置いた場合</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">第6条（個人情報の訂正および削除）</h2>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>ユーザーは，当社の保有する自己の個人情報が誤った情報である場合には，当社が定める手続きにより，当社に対して個人情報の訂正，追加または削除（以下，「訂正等」といいます。）を請求することができます。</p>
                            <br />
                            <p>当社は，ユーザーから前項の請求を受けてその請求に応じる必要があると判断した場合には，遅滞なく，当該個人情報の訂正等を行うものとします。</p>
                            <br />
                            <p>当社は，前項の規定に基づき訂正等を行った場合，または訂正等を行わない旨の決定をしたときは遅滞なく，これをユーザーに通知します。</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">第7条（個人情報の利用停止等）</h2>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>当社は，本人から，個人情報が，利用目的の範囲を超えて取り扱われているという理由，または不正の手段により取得されたものであるという理由により，その利用の停止または消去（以下，「利用停止等」といいます。）を求められた場合には，遅滞なく必要な調査を行います。</p>
                            <br />
                            <p>前項の調査結果に基づき，その請求に応じる必要があると判断した場合には，遅滞なく，当該個人情報の利用停止等を行います。</p>
                            <br />
                            <p>当社は，前項の規定に基づき利用停止等を行った場合，または利用停止等を行わない旨の決定をしたときは，遅滞なく，これをユーザーに通知します。</p>
                            <br />
                            <p>前2項にかかわらず，利用停止等に多額の費用を有する場合その他利用停止等を行うことが困難な場合であって，ユーザーの権利利益を保護するために必要なこれに代わるべき措置をとれる場合は，この代替策を講じるものとします。</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">第8条（Cookie等の情報の外部送信について）</h2>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>本サービスのWebページでは、アクセス解析等のために、ユーザーの端末に記録された情報（Cookie等）を外部事業者へ送信することがあります。</p>
                            <div className="mt-4 overflow-x-auto">
                                <table className="min-w-full text-left border-collapse border border-gray-300 dark:border-gray-700">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-800">
                                            <th className="p-3 border border-gray-300 dark:border-gray-700 font-bold whitespace-nowrap">送信先事業者</th>
                                            <th className="p-3 border border-gray-300 dark:border-gray-700 font-bold whitespace-nowrap">送信される情報</th>
                                            <th className="p-3 border border-gray-300 dark:border-gray-700 font-bold whitespace-nowrap">利用目的</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="p-3 border border-gray-300 dark:border-gray-700">Google（Googleタグマネージャー／Googleアナリティクス）</td>
                                            <td className="p-3 border border-gray-300 dark:border-gray-700">Cookie、閲覧履歴・アクセス情報</td>
                                            <td className="p-3 border border-gray-300 dark:border-gray-700">アクセス状況の分析・サービス改善</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <br />
                            <p>ユーザーは、ブラウザの設定によりCookieを無効化することができます。Googleアナリティクスのオプトアウトについては第10条をご参照ください。</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">第9条（Cookieの利用について）</h2>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>本サービスは、ログイン状態の保持、セッション管理、利便性向上およびアクセス解析のためにCookieを利用します。</p>
                            <br />
                            <p>Cookieの受け入れはブラウザ設定で拒否できますが、その場合、本サービスの一部機能（ログイン等）が利用できないことがあります。</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">第10条（アクセス解析（Googleアナリティクス））</h2>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>本サービスは、Googleアナリティクスを利用してアクセス状況を分析しています。Googleアナリティクスはトラフィックデータの収集にCookieを利用します。このデータは匿名で収集されており、個人を特定するものではありません。</p>
                            <br />
                            <p>収集方法・利用方法については「<a href="https://marketingplatform.google.com/about/analytics/terms/jp/" target="_blank" rel="noopener noreferrer" className="text-[#1DA1F2] hover:underline">Googleアナリティクスサービス利用規約</a>」および「<a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener noreferrer" className="text-[#1DA1F2] hover:underline">Googleのポリシーと規約</a>」をご覧ください。オプトアウトをご希望の場合は、Googleが提供するオプトアウトアドオン等をご利用ください。</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">第11条（外部サービスとの連携）</h2>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>本サービスは、ログイン認証および本サービスに関する情報の公開・共有のためにX（旧Twitter）と連携します。当社が連携する外部サービスはX（旧Twitter）のみであり、ユーザーがプロフィールに任意で入力した文字列などの公開情報を取得します。連携するXにおける情報の取り扱いは、Xのプライバシーポリシーに従います。</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">第12条（プライバシーポリシーの変更）</h2>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>本ポリシーの内容は，法令その他本ポリシーに別段の定めのある事項を除いて，ユーザーに通知することなく，変更することができるものとします。</p>
                            <br />
                            <p>当社が別途定める場合を除いて，変更後のプライバシーポリシーは，本ウェブサイトに掲載したときから効力を生じるものとします。</p>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
