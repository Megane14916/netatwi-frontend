"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

function QAItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-black">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex justify-between items-center py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left"
      >
        <span className="font-bold pr-4 leading-relaxed">Q. {question}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 flex-shrink-0 text-gray-500" /> : <ChevronDown className="w-5 h-5 flex-shrink-0 text-gray-500" />}
      </button>
      <div 
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="pb-4 pt-1 px-2 leading-relaxed text-black/90 dark:text-white/90 whitespace-pre-wrap">
            A. {answer}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RulesPage() {
    return (
        <div className="bg-white dark:bg-black min-h-screen text-black dark:text-white pb-20">
            <div className="container mx-auto max-w-[768px] px-4 py-8">
                <h1 className="text-3xl font-bold mb-8 pb-4 border-b border-gray-200 dark:border-gray-800">ルール</h1>

                <div className="space-y-12">
                    {/* 概要 */}
                    <section>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>ネタツイグランプリとは、実力派ネタツイッタラー７名による審査オンリーの、インプレッション数や流行に縛られない、おもしろさのみで競うインターネット賞レースです。</p>
                        </div>
                    </section>

                    {/* 目次 */}
                    <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg my-8 pb-2">
                        <div className="px-6 py-3 font-bold text-lg text-black dark:text-white">目次</div>
                        <ul className="flex flex-col text-[15px] text-black/90 dark:text-white/90 font-medium px-4">
                            <li className=" dark:border-gray-800/60">
                                <a href="#schedule" className="block px-2 py-2 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors rounded-md my-0.5">日程</a>
                            </li>
                            <li className="border-t border-gray-200/60 dark:border-gray-800/60">
                                <a href="#qualifier-finals" className="block px-2 py-2 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors rounded-md my-0.5">予選・決勝について</a>
                            </li>
                            <li className="border-t border-gray-200/60 dark:border-gray-800/60">
                                <a href="#judging" className="block px-2 py-2 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors rounded-md my-0.5">審査について</a>
                            </li>
                            <li className="border-t border-gray-200/60 dark:border-gray-800/60">
                                <a href="#special-award" className="block px-2 py-2 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors rounded-md my-0.5">審査員特別賞について</a>
                            </li>
                            <li className="border-t border-gray-200/60 dark:border-gray-800/60">
                                <a href="#results" className="block px-2 py-2 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors rounded-md my-0.5">結果発表について</a>
                            </li>
                            <li className="border-t border-gray-200/60 dark:border-gray-800/60">
                                <a href="#daily" className="block px-2 py-2 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors rounded-md my-0.5">デイリーについて</a>
                            </li>
                            <li className="border-t border-gray-200/60 dark:border-gray-800/60">
                                <a href="#rules" className="block px-2 py-2 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors rounded-md my-0.5">禁止事項について</a>
                            </li>
                            <li className="border-t border-gray-200/60 dark:border-gray-800/60">
                                <a href="#qa" className="block px-2 py-2 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors rounded-md my-0.5">Q&A</a>
                            </li>
                        </ul>
                    </div>

                    <section id="schedule" className="scroll-mt-24">
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">
                            日程
                        </h2>
                        <div className="space-y-6">
                            <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                                <p>ユーザーテスト 投稿期間：7/18 （土）0:00 ~ 7/19（日）0:00</p><p>ユーザーテスト 投票期間：7/19 （日）0:00 ~ 7/20（月）0:00</p><p>ユーザーテスト 結果発表：7/20（月）0:00</p><br></br><p>予選 投稿期間：7/31（金）0:00 ~ 8/7（金）0:00</p><p>予選 投票期間：8/7（金）0:00 ~ 8/21（金）0:00</p><p>予選 結果発表：8/21（金）0:00</p><br></br><p>決勝 投稿期間：8/21（金）0:00 ~ 8/28（金）0:00</p><p>決勝 投票期間：8/28（金）0:00 ~ 9/11（金）0:00</p><p>決勝 結果発表：9/11（金）0:00</p>
                            </div>
                        </div>
                    </section>

                    <section id="qualifier-finals" className="scroll-mt-24">
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">
                            予選・決勝について
                        </h2>
                        <div className="space-y-6">
                            <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                                <p>今回のネタツイグランプリでは<u>予選・決勝制度</u>を採用しています。予選で勝ち上がった<strong>上位1/3</strong>だけが決勝に残り、決勝での順位がそのまま最終的な順位となります。なお、予選では<strong>文字</strong>のみ、決勝では<strong>画像</strong>を使う投稿（１枚から４枚）が必須になります。</p>
                            </div>
                        </div>
                    </section>

                    <section id="judging" className="scroll-mt-24">
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">
                            審査について
                        </h2>
                        <div className="space-y-6">
                            <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                                <ul className="space-y-2 mb-6">
                                    <li>余馬（<a href="https://x.com/extra_horse" target="_blank" rel="noopener noreferrer" className="text-[#1DA1F2] hover:underline">@extra_horse</a>）</li>
                                    <li>背靄（<a href="https://x.com/ber_acdc" target="_blank" rel="noopener noreferrer" className="text-[#1DA1F2] hover:underline">@ber_acdc</a>）</li>
                                    <li>まえうしろ（<a href="https://x.com/nyudogumo_saiko" target="_blank" rel="noopener noreferrer" className="text-[#1DA1F2] hover:underline">@nyudogumo_saiko</a>）</li>
                                    <li>止まれ（<a href="https://x.com/STOP_TOMARE" target="_blank" rel="noopener noreferrer" className="text-[#1DA1F2] hover:underline">@STOP_TOMARE</a>）</li>
                                    <li>かめの まくら（<a href="https://x.com/mkr0089" target="_blank" rel="noopener noreferrer" className="text-[#1DA1F2] hover:underline">@mkr0089</a>）</li>
                                    <li>かなり（<a href="https://x.com/kanari_yoi" target="_blank" rel="noopener noreferrer" className="text-[#1DA1F2] hover:underline">@kanari_yoi</a>）</li>
                                    <li>道路（<a href="https://x.com/HappyEnd772" target="_blank" rel="noopener noreferrer" className="text-[#1DA1F2] hover:underline">@HappyEnd772</a>）</li>
                                    <li>結婚アドバイザーさねとも（<a href="https://x.com/FVtaiyou" target="_blank" rel="noopener noreferrer" className="text-[#1DA1F2] hover:underline">@FVtaiyou</a>）</li>
                                </ul>
                                <p>総勢８名（敬称略）をお呼びして、それぞれ20点満点で採点していただき160点満点で合計された点数で、順位を競います。</p>
                            </div>
                        </div>
                    </section>

                    <section id="special-award" className="scroll-mt-24">
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">
                            審査員特別賞について
                        </h2>
                        <div className="space-y-6">
                            <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                                <p>審査員それぞれが一番面白いと思ったネタツイには審査員特別賞が贈られます。審査員特別賞には、その審査員からひとことコメントをいただきます。好きな審査員からの審査員特別賞も狙ってみましょう。</p>
                            </div>
                        </div>
                    </section>

                    <section id="results" className="scroll-mt-24">
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">
                            結果発表について
                        </h2>
                        <div className="space-y-6">
                            <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                                <p>１位から最下位まで、全て公開します。結果が発表された後は、自分のネタツイ・他の誰かの面白かったネタツイ、すべて <span className="font-bold text-[#1DA1F2]">＃ネタツイグランプリ</span> で自由に投稿していただいて構いません。ただし、結果発表前に自分の投稿したネタを投稿するのはおやめください。</p>
                            </div>
                        </div>
                    </section>

                    <section id="daily" className="scroll-mt-24">
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">
                            デイリーについて
                        </h2>
                        <div className="space-y-6">
                            <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                                <p>新たな試みとして、今回から<strong>デイリー</strong>というものを追加しています。グランプリの予選・本選と違い、デイリーは毎日行われます。審査員による投票はなく、順位は全て<strong>ユーザーによるいいね</strong>によって決定されます。大会期間内のうち、審査員による投票期間の8/7（金） ~ 8/21（金）、8/28（金） ~ 9/11（金）の<strong>全28回</strong>行われ、毎日投稿といいね期間（投票期間）が切り替わります。なお、デイリーでは<strong>画像を使用した投稿はできません。</strong></p>
                            </div>
                        </div>
                    </section>

                    <section id="rules" className="scroll-mt-24">
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">
                            禁止事項について
                        </h2>
                        <div className="space-y-6">
                            <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><strong>複数のアカウントでログイン</strong>し、投稿・デイリーに投稿した自分の投稿にいいねする等の行為</li>
                                    <li>X内で既に自分でしたことのあるツイートや、他人のツイートを投稿する等の行為（よって、サイトに投稿する前に被りがないかX内で検索することを推奨）</li>
                                    <li>結果発表以前に、サイトに投稿した自分のポストをXにポストする行為</li>
                                    <li>公序良俗に反する内容、他人を誹謗中傷する内容の投稿</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Q&A */}
                    <section id="qa" className="scroll-mt-24">
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">
                            Q&A
                        </h2>
                        
                        <div className="divide-y divide-gray-200 dark:divide-gray-800 border-y border-gray-200 dark:border-gray-800">
                            <QAItem 
                                question="審査の段階で審査員の方は投稿者の名前を見ることができるのでしょうか、それとも匿名の状態で審査されるのでしょうか？"
                                answer="審査員の方には、名前が見えない状態で採点してもらいます！結果発表の際に初めて投稿者の名前を公開します！"
                            />
                            <QAItem 
                                question="ネタツイを投稿した後にもっと良い物を思いついた場合、投稿したものを編集する事は可能ですか？"
                                answer="可能です。"
                            />
                            <QAItem 
                                question="優勝した際の特典などはありますか？"
                                answer="ありません"
                            />
                            <QAItem 
                                question="結果発表の際に各審査員の点数の内訳は公表されますか?"
                                answer="公表します"
                            />
                            <QAItem 
                                question="早く投稿した方がギリギリまで粘るより印象やポイント高いみたいなのありますか？"
                                answer="投稿した日にち 時間は関係ありません"
                            />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
