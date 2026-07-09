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
                        <h2 className="text-2xl font-bold mb-4 text-[#1DA1F2]">
                            概要
                        </h2>
                        <div className="text-[15px] leading-relaxed text-black/90 dark:text-white/90">
                            <p>ネタツイグランプリとは、実力派ネタツイッタラー7名（予定）による審査オンリーの、インプレッション数や流行に縛られない、おもしろさのみで競うネタツイの賞レースである。</p>
                        </div>
                    </section>

                    {/* ネタツイグランプリについて */}
                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">
                            ネタツイグランプリについて
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold mb-2">投稿について</h3>
                                <p className="text-[15px] leading-relaxed text-black/80 dark:text-white/80">
                                    投稿はひとりにつき、１投稿です。複数のアカウントを使って複数投稿することもおやめください。大喜利と違って、お題はありません。投稿が140文字を超えた場合、脱落とします。（Xに投稿することができる場合はOK、できなければ脱落です）既に自分でしたことのあるツイートや、他人のツイートを投稿するのは禁止です。大会期間内に、同じ内容のものをXに投稿することも禁止です。よって、投稿する前に必ず検索をかけて、既出ではないか確認してください。公序良俗に反する内容、他人を誹謗中傷する内容の投稿は禁止です。
                                </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold mb-2">審査について</h3>
                                <p className="text-[15px] leading-relaxed text-black/80 dark:text-white/80">
                                    審査員７名をお呼びして、それぞれ20点満点で採点してもらいます。
                                </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold mb-2">審査員特別賞について</h3>
                                <p className="text-[15px] leading-relaxed text-black/80 dark:text-white/80">
                                    審査員それぞれが一番面白いと思ったネタツイには審査員特別賞が贈られます。審査員特別賞には、その審査員からひとことコメントをいただきます。好きな審査員からの審査員特別賞も狙ってみましょう。
                                </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold mb-2">結果発表について</h3>
                                <p className="text-[15px] leading-relaxed text-black/80 dark:text-white/80">
                                    優勝から最下位まで、全て公開します。結果が発表された後、自分が投稿したネタは好きにツイートしていただいて構いません。サイトも好きにスクショしていただいて、 #ネタツイグランプリ とつけて自由に共有してください！ただし、大会期間内に自分の投稿したネタをポストすることは禁止です。
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 日めくりコンテストについて */}
                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-[#1DA1F2]">
                            日めくりコンテストについて
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold mb-2">投稿について</h3>
                                <p className="text-[15px] leading-relaxed text-black/80 dark:text-white/80">
                                    グランプリにおけるルールと同じ。
                                </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold mb-2">投票について</h3>
                                <p className="text-[15px] leading-relaxed text-black/80 dark:text-white/80">
                                    一般ユーザーによる投票が行われます。
                                </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold mb-2">結果発表について</h3>
                                <p className="text-[15px] leading-relaxed text-black/80 dark:text-white/80">
                                    結果は優勝から最下位まで、全て公開します。
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Q&A */}
                    <section>
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
