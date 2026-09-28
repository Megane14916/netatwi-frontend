"use client";

import type { ElementType } from "react";
import { Eye, Image as ImageIconLucide, KeyRound, Sliders, Trophy as TrophyIcon } from "lucide-react";
import type { ContestType, ImageRule, ScoringMethod } from "@/types/domain";
import type { AdminDashboardController } from "../hooks/useAdminDashboard";

interface ToggleSwitchProps {
  label: string;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  icon?: ElementType;
}

const ToggleSwitch = ({ label, enabled, setEnabled, icon: Icon }: ToggleSwitchProps) => (
  <div className="flex items-center justify-between">
    <label htmlFor={`toggle-${label}`} className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
      {Icon && <Icon className="h-4 w-4 mr-2 text-gray-600" />}{label}
    </label>
    <button type="button" id={`toggle-${label}`} onClick={() => setEnabled(!enabled)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[#1DA1F2] ${enabled ? "bg-[#1DA1F2]" : "bg-gray-200"}`}>
      <span className="sr-only">{label}を{enabled ? "無効にする" : "有効にする"}</span>
      <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  </div>
);

export function AdminContestForm({ controller }: { controller: AdminDashboardController }) {
  const { createForm, createStatus, createMessage, handleCreateSubmit, handleCreateFormChange } = controller;
  return (
  <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">新しい大会を作成</h2>
      <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div> <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">大会名</label> <input type="text" id="name" value={createForm.name} onChange={(e) => handleCreateFormChange('name', e.target.value)} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none" /> </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-dashed border-gray-300 rounded-md bg-white/30">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">コンテストタイプ</label>
                  <div className="flex space-x-4">
                      <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" name="type" value="grandprix" checked={createForm.type === 'grandprix'} onChange={(e) => handleCreateFormChange('type', e.target.value as ContestType)} className="mr-2" />グランプリ</label>
                      <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" name="type" value="daily" checked={createForm.type === 'daily'} onChange={(e) => handleCreateFormChange('type', e.target.value as ContestType)} className="mr-2" />デイリー</label>
                  </div>
              </div>
          </div>

          <div className="pt-4 border-t border-gray-200 space-y-4">
              <ToggleSwitch label="予選・決勝形式にする" enabled={createForm.hasQualifier} setEnabled={(val) => handleCreateFormChange('hasQualifier', val)} icon={TrophyIcon} />
          </div>

          {createForm.hasQualifier ? (
              <div className="space-y-8">
                  <div className="space-y-6 p-6 border-2 border-gray-200 rounded-lg bg-white shadow-sm">
                      <h3 className="text-xl font-bold text-[#1DA1F2] mb-4">予選の設定</h3>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">予選通過割合</label>
                          <div className="flex items-center space-x-2">
                              <input type="number" min="1" value={createForm.advancementNumerator} onChange={(e) => handleCreateFormChange('advancementNumerator', parseInt(e.target.value) || 1)} className="w-20 bg-white border border-gray-200 rounded-md py-2 px-4 text-center focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none" placeholder="1" />
                              <span className="text-xl text-gray-600">/</span>
                              <input type="number" min="1" value={createForm.advancementDenominator} onChange={(e) => handleCreateFormChange('advancementDenominator', parseInt(e.target.value) || 1)} className="w-20 bg-white border border-gray-200 rounded-md py-2 px-4 text-center focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none" placeholder="3" />
                          </div>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                          <ToggleSwitch label="審査員賞受賞者を無条件で決勝進出とする" enabled={createForm.qualifierJudgeAwardAdvancement} setEnabled={(val) => handleCreateFormChange('qualifierJudgeAwardAdvancement', val)} icon={TrophyIcon} />
                      </div>
                      <div className="p-4 border border-dashed border-gray-300 rounded-md bg-gray-50 space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">採点方法</label>
                              <div className="flex space-x-4">
                                  <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" checked={createForm.qualifierScoringMethod === 'both'} onChange={(e) => handleCreateFormChange('qualifierScoringMethod', e.target.value as ScoringMethod)} value="both" className="mr-2" />審査+ユーザー</label>
                                  <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" checked={createForm.qualifierScoringMethod === 'user'} onChange={(e) => handleCreateFormChange('qualifierScoringMethod', e.target.value as ScoringMethod)} value="user" className="mr-2" />ユーザーのみ</label>
                                  <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" checked={createForm.qualifierScoringMethod === 'judge'} onChange={(e) => handleCreateFormChange('qualifierScoringMethod', e.target.value as ScoringMethod)} value="judge" className="mr-2" />審査のみ</label>
                              </div>
                          </div>

                          {createForm.qualifierScoringMethod !== 'user' && (
                              <div className="pt-4 border-t border-gray-200">
                                  <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center"><Sliders className="w-4 h-4 mr-2"/> スコア計算設定</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                          <label className={`block text-sm font-medium mb-1 ${createForm.qualifierScoringMethod === 'judge' ? 'text-gray-500' : 'text-gray-700'}`}>一般票の重み係数</label>
                                          <input type="number" disabled={createForm.qualifierScoringMethod === 'judge'} value={createForm.qualifierGeneralVoteWeight} onChange={(e) => handleCreateFormChange('qualifierGeneralVoteWeight', parseInt(e.target.value))} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 disabled:opacity-50"/>
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">審査員評価の満点</label>
                                          <input type="number" min="1" max="100" value={createForm.qualifierJudgeMaxScore} onChange={(e) => handleCreateFormChange('qualifierJudgeMaxScore', parseInt(e.target.value))} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4"/>
                                      </div>
                                  </div>
                              </div>
                          )}
                      </div>

                      <div className="space-y-4 p-4 border border-dashed border-gray-300 rounded-md bg-gray-50"> 
                          <h4 className="text-lg font-semibold text-gray-600 mb-3">期間設定</h4> 
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
                              <div> <label className="block text-sm font-medium text-gray-700 mb-1">投稿開始</label> <div className="relative"> <input type="datetime-local" value={createForm.qualifierStartTime} onChange={(e) => handleCreateFormChange('qualifierStartTime', e.target.value)} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none appearance-none" /> </div> </div> 
                              <div> <label className="block text-sm font-medium text-gray-700 mb-1">投稿終了</label> <div className="relative"> <input type="datetime-local" value={createForm.qualifierEndTime} onChange={(e) => handleCreateFormChange('qualifierEndTime', e.target.value)} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none appearance-none" /> </div> </div> 
                          </div> 
                          <div> <label className="block text-sm font-medium text-gray-700 mb-1">投票終了</label> <div className="relative"> <input type="datetime-local" value={createForm.qualifierVotingEndTime} onChange={(e) => handleCreateFormChange('qualifierVotingEndTime', e.target.value)} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none appearance-none" /> </div> </div> 
                      </div>

                      <div className="pt-4 border-t border-gray-200 space-y-6">
                          <ToggleSwitch label="お題を設定する" enabled={createForm.qualifierHasTheme} setEnabled={(val) => handleCreateFormChange('qualifierHasTheme', val)} />
                          {createForm.qualifierHasTheme && (<div> <label className="block text-sm font-medium text-gray-700 mb-2">お題</label> <textarea value={createForm.qualifierTheme} onChange={(e) => handleCreateFormChange('qualifierTheme', e.target.value)} required rows={3} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none"></textarea> </div>)}

                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center"><ImageIconLucide className="h-4 w-4 mr-2" />画像投稿設定</label>
                              <select value={createForm.qualifierImageRule} onChange={(e) => handleCreateFormChange('qualifierImageRule', e.target.value as ImageRule)} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none">
                                  <option value="optional">任意（画像あり/なし両方OK）</option>
                                  <option value="required">必須（最低1枚の画像が必要）</option>
                                  <option value="none">不可（画像投稿禁止）</option>
                              </select>
                          </div>
                          <ToggleSwitch label="投票期間中に一般ユーザーへ投稿を公開する" enabled={createForm.qualifierIsVotingVisible} setEnabled={(val) => handleCreateFormChange('qualifierIsVotingVisible', val)} icon={Eye} />
                      </div>
                      <div> <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center"><KeyRound className="h-4 w-4 mr-2 text-gray-600" />審査員用パスワード (任意)</label> <input type="password" value={createForm.qualifierJudgePassword} onChange={(e) => handleCreateFormChange('qualifierJudgePassword', e.target.value)} placeholder="空の場合はパスワードなし" className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none" /> </div>
                  </div>

                  <div className="space-y-6 p-6 border-2 border-gray-200 rounded-lg bg-white shadow-sm">
                      <h3 className="text-xl font-bold text-[#1DA1F2] mb-4">本選の設定</h3>
                      <div className="p-4 border border-dashed border-gray-300 rounded-md bg-gray-50 space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">採点方法</label>
                              <div className="flex space-x-4">
                                  <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" checked={createForm.scoringMethod === 'both'} onChange={(e) => handleCreateFormChange('scoringMethod', e.target.value as ScoringMethod)} value="both" className="mr-2" />審査+ユーザー</label>
                                  <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" checked={createForm.scoringMethod === 'user'} onChange={(e) => handleCreateFormChange('scoringMethod', e.target.value as ScoringMethod)} value="user" className="mr-2" />ユーザーのみ</label>
                                  <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" checked={createForm.scoringMethod === 'judge'} onChange={(e) => handleCreateFormChange('scoringMethod', e.target.value as ScoringMethod)} value="judge" className="mr-2" />審査のみ</label>
                              </div>
                          </div>

                          {createForm.scoringMethod !== 'user' && (
                              <div className="pt-4 border-t border-gray-200">
                                  <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center"><Sliders className="w-4 h-4 mr-2"/> スコア計算設定</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                          <label className={`block text-sm font-medium mb-1 ${createForm.scoringMethod === 'judge' ? 'text-gray-500' : 'text-gray-700'}`}>一般票の重み係数</label>
                                          <input type="number" disabled={createForm.scoringMethod === 'judge'} value={createForm.generalVoteWeight} onChange={(e) => handleCreateFormChange('generalVoteWeight', parseInt(e.target.value))} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 disabled:opacity-50"/>
                                      </div>
                                      <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">審査員評価の満点</label>
                                          <input type="number" min="1" max="100" value={createForm.judgeMaxScore} onChange={(e) => handleCreateFormChange('judgeMaxScore', parseInt(e.target.value))} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4"/>
                                      </div>
                                  </div>
                              </div>
                          )}
                      </div>

                      <div className="space-y-4 p-4 border border-dashed border-gray-300 rounded-md bg-gray-50"> 
                          <h4 className="text-lg font-semibold text-gray-600 mb-3">期間設定</h4> 
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
                              <div> <label className="block text-sm font-medium text-gray-700 mb-1">投稿開始</label> <div className="relative"> <input type="datetime-local" value={createForm.startTime} onChange={(e) => handleCreateFormChange('startTime', e.target.value)} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none appearance-none" /> </div> </div> 
                              <div> <label className="block text-sm font-medium text-gray-700 mb-1">投稿終了</label> <div className="relative"> <input type="datetime-local" value={createForm.endTime} onChange={(e) => handleCreateFormChange('endTime', e.target.value)} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none appearance-none" /> </div> </div> 
                          </div> 
                          <div> <label className="block text-sm font-medium text-gray-700 mb-1">投票終了</label> <div className="relative"> <input type="datetime-local" value={createForm.votingEndTime} onChange={(e) => handleCreateFormChange('votingEndTime', e.target.value)} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none appearance-none" /> </div> </div> 
                      </div>

                      <div className="pt-4 border-t border-gray-200 space-y-6">
                          <ToggleSwitch label="お題を設定する" enabled={createForm.hasTheme} setEnabled={(val) => handleCreateFormChange('hasTheme', val)} />
                          {createForm.hasTheme && (<div> <label className="block text-sm font-medium text-gray-700 mb-2">お題</label> <textarea value={createForm.theme} onChange={(e) => handleCreateFormChange('theme', e.target.value)} required rows={3} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none"></textarea> </div>)}

                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center"><ImageIconLucide className="h-4 w-4 mr-2" />画像投稿設定</label>
                              <select value={createForm.imageRule} onChange={(e) => handleCreateFormChange('imageRule', e.target.value as ImageRule)} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none">
                                  <option value="optional">任意（画像あり/なし両方OK）</option>
                                  <option value="required">必須（最低1枚の画像が必要）</option>
                                  <option value="none">不可（画像投稿禁止）</option>
                              </select>
                          </div>
                          <ToggleSwitch label="投票期間中に一般ユーザーへ投稿を公開する" enabled={createForm.isVotingVisible} setEnabled={(val) => handleCreateFormChange('isVotingVisible', val)} icon={Eye} />
                      </div>
                      <div> <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center"><KeyRound className="h-4 w-4 mr-2 text-gray-600" />審査員用パスワード (任意)</label> <input type="password" value={createForm.judgePassword} onChange={(e) => handleCreateFormChange('judgePassword', e.target.value)} placeholder="空の場合はパスワードなし" className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none" /> </div>
                  </div>
              </div>
          ) : (
              <div className="space-y-6 p-6 border-2 border-gray-200 rounded-lg bg-white shadow-sm">
                  <h3 className="text-xl font-bold text-[#1DA1F2] mb-4">大会の設定</h3>
                  <div className="p-4 border border-dashed border-gray-300 rounded-md bg-gray-50 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">採点方法</label>
                          <div className="flex space-x-4">
                              <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" checked={createForm.scoringMethod === 'both'} onChange={(e) => handleCreateFormChange('scoringMethod', e.target.value as ScoringMethod)} value="both" className="mr-2" />審査+ユーザー</label>
                              <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" checked={createForm.scoringMethod === 'user'} onChange={(e) => handleCreateFormChange('scoringMethod', e.target.value as ScoringMethod)} value="user" className="mr-2" />ユーザーのみ</label>
                              <label className="flex items-center text-sm text-gray-700 cursor-pointer"><input type="radio" checked={createForm.scoringMethod === 'judge'} onChange={(e) => handleCreateFormChange('scoringMethod', e.target.value as ScoringMethod)} value="judge" className="mr-2" />審査のみ</label>
                          </div>
                      </div>

                      {createForm.scoringMethod !== 'user' && (
                          <div className="pt-4 border-t border-gray-200">
                              <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center"><Sliders className="w-4 h-4 mr-2"/> スコア計算設定</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                      <label className={`block text-sm font-medium mb-1 ${createForm.scoringMethod === 'judge' ? 'text-gray-500' : 'text-gray-700'}`}>一般票の重み係数</label>
                                      <input type="number" disabled={createForm.scoringMethod === 'judge'} value={createForm.generalVoteWeight} onChange={(e) => handleCreateFormChange('generalVoteWeight', parseInt(e.target.value))} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 disabled:opacity-50"/>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">審査員評価の満点</label>
                                      <input type="number" min="1" max="100" value={createForm.judgeMaxScore} onChange={(e) => handleCreateFormChange('judgeMaxScore', parseInt(e.target.value))} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4"/>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="space-y-4 p-4 border border-dashed border-gray-300 rounded-md bg-gray-50"> 
                      <h4 className="text-lg font-semibold text-gray-600 mb-3">期間設定</h4> 
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
                          <div> <label className="block text-sm font-medium text-gray-700 mb-1">投稿開始</label> <div className="relative"> <input type="datetime-local" value={createForm.startTime} onChange={(e) => handleCreateFormChange('startTime', e.target.value)} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none appearance-none" /> </div> </div> 
                          <div> <label className="block text-sm font-medium text-gray-700 mb-1">投稿終了</label> <div className="relative"> <input type="datetime-local" value={createForm.endTime} onChange={(e) => handleCreateFormChange('endTime', e.target.value)} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none appearance-none" /> </div> </div> 
                      </div> 
                      <div> <label className="block text-sm font-medium text-gray-700 mb-1">投票終了</label> <div className="relative"> <input type="datetime-local" value={createForm.votingEndTime} onChange={(e) => handleCreateFormChange('votingEndTime', e.target.value)} required className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none appearance-none" /> </div> </div> 
                  </div>

                  <div className="pt-4 border-t border-gray-200 space-y-6">
                      <ToggleSwitch label="お題を設定する" enabled={createForm.hasTheme} setEnabled={(val) => handleCreateFormChange('hasTheme', val)} />
                      {createForm.hasTheme && (<div> <label className="block text-sm font-medium text-gray-700 mb-2">お題</label> <textarea value={createForm.theme} onChange={(e) => handleCreateFormChange('theme', e.target.value)} required rows={3} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none"></textarea> </div>)}

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center"><ImageIconLucide className="h-4 w-4 mr-2" />画像投稿設定</label>
                          <select value={createForm.imageRule} onChange={(e) => handleCreateFormChange('imageRule', e.target.value as ImageRule)} className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none">
                              <option value="optional">任意（画像あり/なし両方OK）</option>
                              <option value="required">必須（最低1枚の画像が必要）</option>
                              <option value="none">不可（画像投稿禁止）</option>
                          </select>
                      </div>
                      <ToggleSwitch label="投票期間中に一般ユーザーへ投稿を公開する" enabled={createForm.isVotingVisible} setEnabled={(val) => handleCreateFormChange('isVotingVisible', val)} icon={Eye} />
                  </div>
                  <div> <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center"><KeyRound className="h-4 w-4 mr-2 text-gray-600" />審査員用パスワード (任意)</label> <input type="password" value={createForm.judgePassword} onChange={(e) => handleCreateFormChange('judgePassword', e.target.value)} placeholder="空の場合はパスワードなし" className="w-full bg-white border border-gray-200 rounded-md py-2 px-4 focus:ring-2 focus:ring-[#1DA1F2] focus:outline-none" /> </div>
              </div>
          )}
          <div> <button type="submit" disabled={createStatus === 'loading'} className="w-full bg-black text-white font-bold py-3 px-4 rounded-md hover:bg-gray-800 transition duration-300 disabled:bg-gray-600">{createStatus === 'loading' ? '作成中...' : '大会を作成する'}</button> </div>
      </form>
      {createMessage && (<div className={`mt-6 p-4 rounded-md text-sm ${createStatus === 'success' ? 'bg-black text-white' : createStatus === 'error' ? 'bg-red-900/50 text-red-300' : 'bg-blue-900/50 text-blue-300'}`}>{createMessage}</div>)}
  </div>
  );
}
