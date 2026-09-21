# netatwi-frontend 大規模リファクタリング計画

## 1. この文書の目的

`netatwi-frontend` を、現行の画面・API仕様を維持しながら、安全に変更できる構成へ段階的に移行する。

主な目的は次のとおり。

- 一時スクリプト、生成物、不要コード、古いコメントを整理する
- APIレスポンス、ドメインモデル、コンポーネントPropsの型を整理する
- API通信、状態管理、業務ロジック、表示を分離する
- 投稿、投票、コメント、ブックマーク等の重複ロジックを共通化する
- 重要な振る舞いをテストで固定し、CIで品質を継続的に確認する
- 開発参加者がセットアップと設計を理解できるREADMEを用意する

この計画の作成時には、依頼どおり既存の `docs` 配下は参照せず、アプリケーションコード、設定、テスト、依存関係のみを調査した。

## 2. 基本方針

1. **挙動を変えずに境界を作る。** 仕様変更と構造変更を同じPRに混ぜない。
2. **先に基準線を直す。** lint、型チェック、既存テストを実行可能にしてから大きなファイルを分割する。
3. **型はAPI境界で確定する。** `any` の置き換えだけでなく、API DTOと画面で使うモデルを区別する。
4. **コンポーネントから通信を追い出す。** URL、HTTPメソッド、JSON解析、エラー変換をAPI層へ集約する。
5. **業務ルールを純粋関数へ移す。** 大会ステータス、並び順、投票集計、投稿可否等をUIから独立させる。
6. **高リスクな処理は特性テストを先に書く。** 投票、審査員賞、コメント公開範囲、画像、連打時の楽観的更新を優先する。
7. **PRをレビュー可能な大きさに保つ。** 機械的変更とロジック変更を分け、原則として1 PR 1責務とする。

## 3. 現状調査

### 3.1 技術構成

- Next.js 14 App Router / React 18 / TypeScript strict
- Tailwind CSS、Radix UI、next-themes
- SWRと直接 `fetch` が混在
- Jest / Testing Library
- Next.js rewriteでブラウザの `/api/*` をbackendへ転送
- Server Componentは `BACKEND_URL` を用いてbackendへ直接接続

### 3.2 現在の品質チェック結果

調査時点の `master` (`cf45b79`) で確認した結果。

| コマンド | 結果 | 主な内容 |
| --- | --- | --- |
| `npm test -- --runInBand` | 失敗 | 3スイート中1スイート失敗。`ResultPostCard` の本文に不可視文字が加わり、文字列完全一致テストが失敗 |
| `npx tsc --noEmit` | 失敗 | テストfixtureのUser不足、jest-dom matcher型、`delete` 対象の型で計6エラー |
| `npm run lint` | 実行不能 | ESLint設定がなく、`next lint` が対話式セットアップで停止 |
| `npm run build` | 成功 | 静的生成時に `127.0.0.1:5001` への接続失敗をログ出力。`/venue/[id]` は First Load JS 約378 kB |

「buildが通る」だけでは、型・テスト・lintの健全性を保証できない状態である。

### 3.3 主要な課題

#### 巨大な画面コンポーネント

- `app/venue/[id]/page.tsx` は約1,800行あり、以下を同時に担当している。
  - 大会・投稿・結果の取得
  - 大会ステータス判定
  - 投稿、投票、審査員賞、コメントの状態管理
  - 審査員向けの並び順保存、投票バックアップ・復元
  - 画面全体の描画
- 同ファイルには、実際には `PostForm` に委譲済みの投稿フォーム用state、handler、UI部品、importが残っている。二重実装による挙動差も発生している。
- `app/page.tsx`、`app/admin/page.tsx`、`components/venue/PostForm.tsx` も約670行規模で、データ取得と表示が密結合している。

#### 型の重複と表現揺れ

- `Contest` がトップ、会場一覧、履歴、会場詳細、管理画面で個別定義され、nullableやoptionalの条件が一致していない。
- `Post` / `ResultPost` / `User` / `Comment` も画面ごとに重複している。
- `commentCount` と `comment_count`、camelCaseとsnake_caseがUIまで混在する。
- profile、users、comments、投票バックアップ等で `any` が多用され、壊れたレスポンスや状態をコンパイル時に検出できない。
- `scoringMethod`、`imageRule`、大会種別、通知種別などが単なる `string` になっている。

#### API通信の分散

- 認証、管理、投稿、投票、コメント、通知、プロフィール等で直接 `fetch` が使われている。
- `res.ok` の検査、JSON解析、credentials、エラーメッセージの扱いが呼び出しごとに異なる。
- SWR fetcherが複数箇所で再定義され、404を含むHTTPエラーを正しくthrowしない箇所がある。
- Client Component用の相対URLとServer Component用のbackend URLが明確に分離されていない。
- コンポーネント内にAPI URLとDTOの知識が残り、単体テストが難しい。

#### 重複ロジックと状態同期

- トップと会場一覧にGP進行段階判定、デイリー分類、カード表示が重複する。
- 投稿フォーム処理が会場詳細と `PostForm` に重複する。
- ブックマークの連打制御が `ResultPostCard` とプロフィール画面に別実装されている。
- コメントの一括先読みが会場詳細とプロフィール画面に重複する。
- 画像選択・preview URL・削除・FormData生成が複数箇所に分散する。
- `setState` をレンダー中に呼ぶ箇所、空のcatch、`Math.random()` comparatorによるshuffle、object URLの解放漏れリスクがある。

#### テストと開発基盤

- テストは3ファイル、7ケースのみで、投稿・投票・コメント・APIエラー等の主要フローを保護していない。
- lintが非対話で実行できず、`typecheck`、`test:ci`、coverage等のscriptがない。
- Jestの型設定とテストfixtureが本体の型に追従していない。
- `.github/workflows` がなく、PRの品質チェックが自動化されていない。
- buildがローカルbackendの有無に影響され、CIで不安定になる可能性がある。

#### リポジトリ衛生

- `tsconfig.tsbuildinfo` が追跡されているが `.gitignore` 対象ではない。
- `apply-dark-mode*.js` 4本と `search.js` は特定時点の機械編集・調査用スクリプトで、通常の開発フローから参照されていない。
- `assets/favicon.ico` と `app/favicon.ico` の重複、過去の修正履歴を記したコメント、コメントアウト済みimportがある。
- READMEと環境変数サンプルがない。

## 4. 目標アーキテクチャ

最初から全面的なディレクトリ移動は行わず、境界を作りながら次の形へ寄せる。

```text
app/                          # routing、metadata、画面のcompositionのみ
components/
  ui/                         # 汎用UI primitive
features/
  auth/
  contests/
    components/
    hooks/
    model/                    # status、selector、並び替え等の純粋ロジック
  posts/
    components/
    hooks/
  comments/
  profile/
  admin/
lib/
  api/
    client.ts                 # browser向け共通request
    server-client.ts          # Server Component向け共通request
    errors.ts
    auth.ts
    contests.ts
    posts.ts
    comments.ts
    users.ts
    notifications.ts
    admin.ts
  date/
types/
  domain/                     # UI・業務ロジックで使う正規化済みモデル
  api/                        # backendのtransport DTO
test/
  factories/
  handlers/                   # API mock
  utils/
```

依存方向は次のように固定する。

```text
app/components -> features -> lib/api -> types
                      |            |
                      +-> model ---+
```

- `app` はroute paramとlayoutを扱い、画面機能を組み立てる。
- `features` はユースケース、hook、機能固有UIを持つ。
- `lib/api` はHTTP、DTO、エラー変換、DTOからdomainへの正規化を担当する。
- domain modelはHTTPやReactに依存しない。
- 汎用UIはAPIやfeatureをimportしない。

## 5. 実施Issue

Issue番号は `#4`〜`#11` を使用する。実際のIssue作成時には、各項目のチェックリストを本文へ転記する。

### #4 リポジトリ整理と品質基準の復旧

**Branch:** `chore/4-repository-cleanup`  
**Base / PR target:** `master` / `master`

目的は、以後の差分を信頼できる状態にすること。機能の設計変更は含めない。

作業内容:

- `tsconfig.tsbuildinfo` を追跡対象から外し、`.gitignore` に追加する
- coverage、テスト・解析の生成物を `.gitignore` に追加する
- 用途の終了した `apply-dark-mode*.js` と `search.js` を、利用実績を最終確認した上で削除する
- 重複favicon、未使用import、明らかな到達不能コード、修正履歴コメントを整理する
- ESLintを非対話実行できる構成にする
- `lint`、`typecheck`、`test`、`test:ci`、`build` のnpm scriptを整理する
- Jest / jest-domの型設定を修正し、現存する3テストをgreenに戻す
- `ResultPostCard` テストは実装詳細の完全一致ではなく、ユーザーが認識できる出力を安定して検証する
- build時のbackend未起動ログについて、履歴ページのデータ取得戦略を確認し、CIでの期待動作を明文化する

完了条件:

- クリーンcheckoutで `npm ci` 後、lint・typecheck・testが非対話で成功する
- 生成物・一時スクリプトが追跡されていない
- UIとAPIの外部仕様に変更がない

### #5 ドメイン型とAPI契約の整理

**Branch:** `refactor/5-domain-types`  
**Base / PR target:** `refactor` / `refactor`

作業内容:

- 共通の `User`、`Contest`、`ContestSummary`、`Post`、`ResultPost`、`Comment`、`Notification` 型を定義する
- `ContestType`、`ContestStatus`、`ScoringMethod`、`ImageRule`、`NotificationType` をunion型にする
- `ContestListResponse`、`ContestDetailResponse`、`PostsResponse`、`ResultsResponse` 等のDTOを定義する
- snake_caseのtransport DTOとcamelCaseのdomain modelを分離する
- `comment_count` / `commentCount` のような二重表現をmapperで一本化する
- 管理画面の作成・更新payloadを専用型にし、`value: any` を廃止する
- profile、users、comment prefetch、vote backupの `any` を具体型または `unknown` + narrowingへ置換する
- コンポーネントPropsで巨大な匿名object型を再定義せず、共通型を参照する
- nullとoptionalの意味を決める。APIから必ず返る値を安易にoptionalにしない

完了条件:

- アプリケーションコードに理由のない明示的 `any` が残らない
- 同じ概念の型定義が画面ごとに複製されていない
- DTOからdomainへの変換テストがある
- `typecheck` が成功する

### #6 型付きAPIクライアントとエンドポイント層の整備

**Branch:** `refactor/6-api-client`  
**Base / PR target:** `refactor` / `refactor`

作業内容:

- `ApiError` と `request<T>` を実装する
- HTTP status、JSON/非JSONエラー、空body、credentials、AbortSignalを一貫して扱う
- browser用は同一originの `/api`、server用は `BACKEND_URL` を使う別entry pointにする
- auth、contests、posts、votes、comments、profile/users、notifications、admin/newsのendpoint moduleを作る
- SWR keyとtyped fetcherを各feature hookへ集約する
- コンポーネントとContextから生の `fetch`、URL文字列、HTTP methodの知識を除く
- 404、401/403、413、5xx、ネットワークエラーをUIで区別できる形に正規化する
- 認証のredirect自体はUI/use-case層に残し、認証URL取得はAPI層へ移す
- 必要な主要レスポンスは、採用するschema validatorまたは型guardで実行時検証する

完了条件:

- 生のAPI `fetch` は `lib/api` と明示的なframework境界以外に残らない
- 成功、JSONエラー、非JSONエラー、network error、abortのテストがある
- Cookieを使う認証・審査員ログイン・投稿が現在と同じsame-origin経路で動く
- Server Componentがbrowser専用moduleをimportしない

### #7 大会詳細画面の責務分離

**Branch:** `refactor/7-contest-detail`  
**Base / PR target:** `refactor` / `refactor`

主対象は `app/venue/[id]/page.tsx`。投稿部品内部の詳細は #8 に任せ、ここでは大会詳細画面のcompositionと投票・結果表示を整理する。

作業内容:

- 委譲済み `PostForm` と重複する投稿state、handler、UI、importを削除する
- 大会ステータス判定を `getContestStatus(now, contest)` の純粋関数にする
- 大会情報、投稿一覧、結果取得をfeature hookへ移す
- 投票編集状態を `useContestVoting` またはreducerへ集約する
- 一般投票、審査員採点、審査員賞のvalidationとpayload生成を純粋関数化する
- 審査員用の初期ランダム順をFisher-Yates等で一度だけ生成し、localStorageの読み書きと検証を専用moduleへ分離する
- 投票バックアップに `version` と `contestId` を持たせ、復元時にshape、対象大会、post ID、score範囲を検証する
- レンダー中の `setState` を廃止する
- Header、rules/status、posting、voting、results、judge award、fixed submit barをセクションコンポーネントに分ける
- 404、loading、error、集計中pollingを明示的な状態として扱う
- コメント先読みは #8 の共通hookを利用する契約にする

回帰テスト対象:

- upcoming / ongoing / voting / closed の境界時刻
- 未ログイン、一般ユーザー、審査員の表示差
- 自分の投稿への投票除外
- スコア上限、0点、一括0点、審査員賞選択
- 投票バックアップ・復元の正常系と不正ファイル
- 集計中のみresultsをpollingすること

完了条件:

- route pageは取得済み状態とセクションを組み立てる責務に限定される
- 投稿作成・編集ロジックの二重実装がない
- 時刻、投票、並び順、backup処理がReactなしで単体テスト可能
- 会場詳細の主要なユーザーフローが既存と同じである

### #8 投稿・リアクション・コメント部品の整理

**Branch:** `refactor/8-post-components`  
**Base / PR target:** `refactor` / `refactor`

主対象は `PostForm`、`ResultPostCard`、`CommentList`、プロフィール内の投稿操作。

作業内容:

- `PostForm` をデータ取得hook、editor、image attachments、my-post displayへ分割する
- contest情報と既存投稿を親/hookから受け取り、同じendpointの重複取得を避ける
- 画像の最大4枚、圧縮、合計16 MiB、既存画像維持、object URL解放を `usePostImages` に集約する
- 投稿payload/FormData生成とvalidationを独立関数にする
- `ResultPostCard` を表示本体、rank/award、actions、voters、commentsへ分ける
- bookmark/likeの連打時に「最後の希望状態」を送る処理を共通 `useQueuedToggle` にする
- profile独自のbookmark queueを共通hookへ置換する
- comment CRUD、楽観的更新、投票中の公開範囲、prefetch mergeを共通化する
- コメント先読みを `usePrefetchedComments` に集約し、会場詳細とプロフィールから利用する
- `currentUser: any`、`initialComments: any[]`、`onToggleBookmark(post: any)` を具体型へ変更する
- アクセシブルなbutton名、dialog、loading/error feedbackを整える

回帰テスト対象:

- 投稿の作成・編集・取消、文字数、画像必須、画像上限
- 画像圧縮中と送信中の二重送信防止
- bookmark/likeの高速連打とAPI失敗時rollback
- コメントの作成・編集・削除
- voting中は許可されたコメントだけ、closedでは全コメントが表示されること
- profileのposts/bookmarks/likes間で状態が同期すること

完了条件:

- post cardとprofileに重複するqueue実装がない
- 画像preview URLが削除時・unmount時に解放される
- API通信は #6 のmodule経由のみ
- コンポーネントテストがユーザー操作ベースで記述されている

### #9 周辺画面とアプリケーションシェルの整理

**Branch:** `refactor/9-secondary-screens`  
**Base / PR target:** `refactor` / `refactor`

提示された例にはない補完Issue。これを設けないと、トップ、管理画面、一覧画面、認証/Headerの責務混在が残るため追加する。

作業内容:

- トップと会場一覧に重複するGP進行段階、デイリー分類、タイトル、contest cardを共通化する
- `app/page.tsx` をHero、active grand prix、daily contests、news、past resultsのsectionへ分割する
- `app/admin/page.tsx` をtabs、contest form、contest management、news managementへ分割する
- 管理画面のcreate/edit form model、日付変換、payload組み立てを共通化する
- usersの検索・pagination cacheをtyped hookへ移す
- notificationsの取得・既読化と表示modelを分離する
- AuthContextはsession提供に限定し、API詳細とredirectフローをhook/serviceへ移す
- Headerの通知polling、desktop/mobile menu、theme切替を分離し、ナビゲーション定義を共通化する
- metadata取得でbackendが利用できない場合の扱いを統一する
- `Countdown` / `CountdownTimer` の用途を確認し、統合可能なら一本化する

完了条件:

- トップ・会場一覧・履歴で大会分類ロジックが共有される
- admin pageがAPI、form変換、3タブUIを一つのコンポーネントで保持しない
- 認証、通知、一覧画面に生のAPI通信がない
- 各抽出ロジックと主要画面状態にテストがある

### #10 テストスイートと品質チェックの整備

**Branch:** `ci/10-quality-checks`  
**Base / PR target:** refactor統合後の `master` / `master`

作業内容:

- Jest + Testing Libraryの共通render、user fixture、contest/post/comment factoryを追加する
- API mockを導入し、通信テストをURLや実backendから独立させる
- fake timerと固定日時の共通helperを用意する
- unit、hook/component、page integrationの責務を分ける
- coverageを出力し、業務ロジックとAPI clientに個別thresholdを設定する
- GitHub Actionsで `npm ci`、lint、typecheck、test、buildを実行する
- workflowにconcurrency cancel、npm cache、最小権限、timeoutを設定する
- buildが実backendに依存しないよう、必要なenvとmock/fallback方針を決める
- branch protectionでquality jobを必須化する

最低限固定するシナリオ:

1. ログイン状態の取得、ログイン開始、ログアウト
2. 大会の時刻境界と予選・決勝の進行段階
3. 投稿作成・編集・削除と画像validation
4. 一般投票・審査員投票・審査員賞
5. bookmark/likeの楽観的更新と失敗時rollback
6. コメントの公開範囲とCRUD
7. profileの3タブと状態同期
8. adminの大会作成・更新payload

coverageは全体数値だけを目的にせず、`contest status`、投票payload、API error、mapper等の重要モジュールにbranch coverage 80%以上を要求する。ブラウザE2Eは安定したtest backendを用意できる場合に別Issueで導入する。

完了条件:

- PRごとに全品質チェックが自動実行される
- backend未起動でもCIが決定的に完了する
- flakyな時刻・乱数・network依存テストがない
- 必須checkに失敗したPRはmergeできない

### #11 READMEの改善

**Branch:** `docs/11-improve-readme`  
**Base / PR target:** #10統合後の `master` / `master`

READMEに次を記載する。

- プロダクト概要とfrontendの責務
- 必要なNode/npmバージョン
- backendを含むローカルセットアップ手順
- 必須・任意の環境変数と `.env.local` 例
- dev、lint、typecheck、test、coverage、buildのコマンド
- browser `/api` rewriteとServer Componentの通信経路
- 主要ディレクトリと依存方向
- 認証、投稿、投票、大会ステータスの概要
- Issue、branch、commit、PRの運用方法
- よくある問題（backend未起動、Cookie、画像、build時fetch）
- deploy方法またはdeploy先ドキュメントへの導線

完了条件:

- 新規参加者がREADMEだけでローカル起動とテスト実行まで到達できる
- コマンドと環境変数が実リポジトリと一致する
- 廃止済み構成や一時的な移行手順を書かない

## 6. Issueの管理方法

### 6.1 親Issue

大規模リファクタリング用のtracking issueを1件作り、#4〜#11をチェックリスト化する。tracking issueには次だけを置く。

- 背景、非目標、成功指標
- 子Issue一覧と依存関係
- 現在の基準線
- 未決事項とリスク
- refactor統合PRへのリンク

個別の実装議論やチェックリストは子Issueへ置き、親Issueを肥大化させない。

### 6.2 ラベル

推奨ラベル:

- 種別: `type:chore`、`type:refactor`、`type:test`、`type:ci`、`type:docs`
- 領域: `area:api`、`area:types`、`area:contest`、`area:post`、`area:admin`
- 状態: `status:blocked`、`status:ready`
- リスク: `risk:high`（認証、投票、投稿、削除等）

### 6.3 Issueテンプレート

各Issueに以下を必須とする。

- 背景 / 現在の問題
- 対象範囲
- 対象外
- 変更方針
- 受け入れ条件
- テスト観点
- 依存Issue / blockするIssue
- rollback方針

### 6.4 完了の定義

- 受け入れ条件を満たす
- 変更した責務に対応するテストがある
- lint、typecheck、test、buildが成功する
- 新しい `any`、直接API `fetch`、重複型を持ち込まない
- UI変更がある場合はPC/モバイル、light/darkの確認結果をPRに載せる
- 設計判断が長期的に必要ならREADMEまたは短いADRへ反映する

## 7. ブランチとPRの管理方法

### 7.1 ブランチ構成

```text
master
│
├── chore/4-repository-cleanup
│       └── PR -> master
│
├── refactor                         # 一時的な統合ブランチ
│   ├── refactor/5-domain-types
│   ├── refactor/6-api-client
│   ├── refactor/7-contest-detail
│   ├── refactor/8-post-components
│   └── refactor/9-secondary-screens
│           └── 各PR -> refactor
│
│   refactor ── 統合PR -> master
│
├── ci/10-quality-checks
│       └── PR -> master
│
└── docs/11-improve-readme
        └── PR -> master
```

### 7.2 作成順序

1. `chore/4-repository-cleanup` を現在の `master` から作り、mergeする。
2. 更新済み `master` から `refactor` を作る。
3. #5を `refactor` から作成し、PR先を `refactor` にする。
4. #5 merge後の `refactor` から #6を作成する。
5. #6 merge後、型とAPI境界を固定して #7と #8を作る。変更ファイルが重なる場合は #7を先にmergeし、#8をrebaseする。
6. #7/#8 merge後に #9を進める。
7. #5〜#9完了後、`refactor -> master` の統合PRを作る。
8. 統合後の `master` から #10、#11を順に作る。READMEは最終構成に合わせるため #11を最後にする。

### 7.3 運用ルール

- `master` と `refactor` への直接pushは禁止する。
- 子PRのbaseを誤って `master` にしない。
- ブランチ名は英語で記述し、`codex/`、個人名、ツール名など作業内容と無関係な接頭辞を付けない。
- コミットメッセージは英語で記述する。Conventional Commits形式を推奨する（例: `refactor: extract contest status calculation`）。
- Issueタイトル、PRタイトル、PRの説明文は日本語で記述する。
- 子PRは原則squash mergeする。統合PRは子Issueの履歴を残せる方法をrepository policyに合わせて選ぶ。
- `refactor` へmergeした後は、依存する作業ブランチを最新 `refactor` にrebaseする。
- `master` のhotfixは通常どおり `master` へmergeし、直後に `refactor` へ取り込む。
- PR本文に `Closes #xx` またはtracking issueへの関連を明記する。
- レビューしやすいよう、rename/move、formatter差分、ロジック変更を可能な限り別commitにする。
- 各PRで「画面仕様を変えたか」を明記する。意図しない仕様変更が見つかった場合は別Issueに分離する。
- 長期間の並行開発を避け、`refactor` は統合後に削除する。

### 7.4 PRの必須記載事項

- 変更前の問題と変更後の責務
- 主要な変更ファイル
- 仕様変更の有無
- 実行したコマンドと結果
- 手動確認した画面・権限・大会状態
- screenshotまたは動画（見た目・操作変更時）
- リスクとrollback方法
- 後続Issueに残した項目

## 8. 推奨実施順と依存関係

```text
#4 baseline
  -> #5 shared types
      -> #6 API boundary
          -> #7 contest detail ─┐
          -> #8 posts/comments ├-> #9 secondary screens
                                └-> refactor integration PR
                                      -> #10 tests/CI
                                          -> #11 README
```

#7と#8は一部並行可能だが、`PostForm`、`ResultPostCard`、`CommentList` のProps契約を #5で先に固定する。会場詳細側はそれらを利用するだけにし、両PRで同じコンポーネントの内部を編集しない。

## 9. リスクと対策

| リスク | 対策 |
| --- | --- |
| 大会切替時刻の境界で表示が変わる | 固定日時の純粋関数テストを先に作る |
| 投票中のコメント秘匿が崩れる | 権限・status別の特性テストを追加する |
| 審査員の並び順が再描画で変わる | seeded/testableなshuffleとstorage adapterに分離する |
| rapid clickでlike/bookmarkが逆転する | queued toggleを単一実装にし、遅延レスポンス順のテストを書く |
| API型を整理した結果、backendの実データとずれる | DTOを実レスポンスに合わせ、境界でruntime validationする |
| browser/serverのAPI URLを取り違える | entry pointを分け、server-only/client-only依存をレビューする |
| 画像previewでメモリリークする | object URLの所有者をhookに一本化しcleanupをテストする |
| 巨大PRになりレビュー不能になる | Issue境界とファイル所有範囲を守り、機械変更を分離する |
| refactor中のhotfixが欠落する | master merge直後にrefactorへ取り込む運用を徹底する |

## 10. 成功指標

リファクタリング完了時に以下を満たす。

- lint、typecheck、test、buildがローカルとCIで安定して成功する
- 主要なAPI呼び出しがtyped API module経由になっている
- 主要なdomain型とAPI DTOが一箇所で管理される
- `app/venue/[id]/page.tsx` が画面composition中心になり、業務ロジックを保持しない
- 投稿、画像、reaction queue、comment prefetchの重複実装がない
- 重要な業務ルールと失敗系が自動テストで保護される
- `master` は各段階でdeploy可能で、統合PRから安全にrollbackできる
- READMEのみで新規参加者が起動・テスト・構成把握まで行える

## 11. 今回の非目標

- backend API仕様やDB schemaの変更
- デザインの全面刷新
- Next.js / Reactのmajor version upgrade
- state管理libraryの新規導入そのものを目的にすること
- すべてのServer Component化、またはすべてのClient Component化
- 数値だけを上げるための低価値なcoverage追加

これらが必要になった場合は、本リファクタリングと分離したIssueとして扱う。
