# ネタツイグランプリ frontend

ネタツイグランプリは、ネタツイの投稿・投票・審査を行うコンテストサイトです。このリポジトリは Next.js 14 / React 18 / TypeScript のフロントエンドで、画面表示、ブラウザでの操作、API レスポンスの検証・整形を担当します。データ保存、X 認証、集計、画像保存は別リポジトリの [netatwi-backend](https://github.com/Megane14916/netatwi-backend)（Flask）が担当します。

## 必要な環境

- Node.js 20.x / npm 10.x を推奨（CI は Node.js 20 と同梱の npm で実行）
- backend もローカルで動かす場合は Python 3.11（backend の Dockerfile と同じ系列）
- X ログインを試す場合は X Developer Portal の OAuth 2.0 クライアント情報

## ローカルで起動する

2 つのリポジトリを同じ親ディレクトリに配置します。既に両方ある場合、clone は不要です。

```sh
git clone https://github.com/Megane14916/netatwi-frontend.git
git clone https://github.com/Megane14916/netatwi-backend.git
```

### 1. backend

`netatwi-backend` で [backend の `.env.example`](https://github.com/Megane14916/netatwi-backend/blob/dev/.env.example) を `.env` にコピーします。ローカルでは `FLASK_DEBUG=True`、`SQLALCHEMY_DATABASE_URI=sqlite:///project.db`、`FRONTEND_URL=http://localhost:3000` を使用します。`SECRET_KEY` は自分のローカル環境用の値に変更してください。`X_CONSUMER_KEY` と `X_CONSUMER_SECRET` のサンプル値ではログインできません。ログインを試す場合だけ実際の認証情報を設定し、X 側のコールバック URL に `http://localhost:3000/api/callback/twitter` を登録します。

PowerShell:

```powershell
cd netatwi-backend
Copy-Item .env.example .env
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

macOS / Linux:

```sh
cd netatwi-backend
cp .env.example .env
python3.11 -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
python app.py
```

`python app.py` は初回起動時に SQLite のテーブルを作成し、通常は `http://127.0.0.1:5001` で待ち受けます。X 認証情報なしでも公開ページと API の確認はできます。データが空の状態では大会一覧も空です。

### 2. frontend

別のターミナルで `netatwi-frontend` に移動します。

PowerShell:

```powershell
cd netatwi-frontend
Copy-Item .env.example .env.local
npm ci
npm run dev
```

macOS / Linux:

```sh
cd netatwi-frontend
cp .env.example .env.local
npm ci
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。`http://localhost:3000/api/contests` が JSON を返せば、frontend から backend への接続も確認できます。環境変数を変更したら開発サーバーを再起動してください。

## 環境変数

frontend のローカル開発では必須の環境変数はありません。`BACKEND_URL` を省略すると `http://127.0.0.1:5001` を使用します。デプロイ時には実際の backend URL を指定してください。`.env.local` は Git の追跡対象外です。

| 変数 | 用途 | 設定例 |
| --- | --- | --- |
| `BACKEND_URL` | Next.js の `/api/*` rewrite と server 側の API 通信先。末尾に `/api` は付けない | `http://127.0.0.1:5001` |
| `NEXT_PUBLIC_GA_ID` | 任意。設定した場合だけ Google Analytics のタグを出す | `G-XXXXXXXXXX` |

`.env.local` の例（[`.env.example`](.env.example) と同じ内容）:

```dotenv
BACKEND_URL=http://127.0.0.1:5001
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

backend 側の `SQLALCHEMY_DATABASE_URI`、`SECRET_KEY`、`FRONTEND_URL` などは **backend の `.env`** に設定します。X 認証、R2、Cloud Tasks に必要な値と本番設定は [backend の環境変数サンプル](https://github.com/Megane14916/netatwi-backend/blob/dev/.env.example) を参照してください。認証情報を frontend の `.env.local` や `NEXT_PUBLIC_*` に置かないでください。

## 開発・品質チェック

以下は `netatwi-frontend` で実行します。テストと build は backend を起動していなくても実行できます。

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバーを起動 |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript の型チェック |
| `npm test -- --runInBand` | 全 Jest テストを 1 プロセスで実行 |
| `npm run test:coverage` | テストと coverage レポートを生成 |
| `npm run test:ci` | CI と同じくテスト・coverage 閾値を確認 |
| `npm run build` | 本番向けビルド |
| `npm run start` | build 済みアプリを起動 |

coverage の HTML は `coverage/lcov-report/index.html` に出力されます。テストの構成とモックの使い方は [テストと品質チェック](docs/refactor/testing.md) を参照してください。GitHub Actions の `quality` ジョブも `npm ci`、lint、typecheck、test、build を実行します。

## 通信経路とコード構成

```text
ブラウザ -> 同一 origin の /api/* -> Next.js rewrite -> backend の /api/*
Server Component / generateMetadata -> BACKEND_URL -> backend の /api/*
```

ブラウザ側は `lib/api/browser.ts` の相対 `/api/*` を使い、Cookie を含めて送信します。`next.config.js` の rewrite が backend に転送します。server 側は `lib/api/server.ts` から `BACKEND_URL` へ直接接続します。backend の URL をブラウザ公開用の変数に入れる必要はありません。

| ディレクトリ | 主な責務 |
| --- | --- |
| `app/` | App Router のページ、layout、metadata |
| `components/` | 共通 UI と画面で使う部品 |
| `features/` | 機能ごとの hook、UI、業務モデル |
| `lib/api/` | browser / server 通信、endpoint、レスポンス検証 |
| `lib/mappers/` | API DTO から画面用モデルへの変換 |
| `types/api/`、`types/domain/` | API の型、画面で使うドメインの型 |
| `__tests__/` | unit、component、integration テストと共通 fixture |
| `docs/refactor/` | リファクタリング計画とテスト方針 |

依存方向は原則 `app` / `components` → `features` → `lib/api` → `types` です。機能の判定処理は `features/*/model` に置き、UI や HTTP から分離します。

## 主な機能

- **認証:** X OAuth 2.0 でログインし、backend のセッション Cookie で状態を保持します。ログイン状態は `/api/me` から取得します。審査員ログインは大会単位です。
- **投稿:** 開催中の大会にログインユーザーが投稿できます。作成・編集・削除があり、画像の可否は大会設定に従います。画像は最大 4 枚、合計 16 MiB です。
- **投票:** 投票期間中に一般投票または審査員の採点を行います。自分の投稿には投票できず、審査員には審査員賞とコメントがあります。
- **大会状態:** 開始前 `upcoming` → 投稿期間 `ongoing` → 投票期間 `voting` → 終了 `closed`。予選・決勝のあるグランプリとデイリー大会があります。

## Issue と変更の運用

作業は Issue を起点に、最新の `master` から内容が分かる英語のブランチ名で進めます（例: `docs/11-improve-readme`）。`master` へ直接 push せず、まとまりごとに英語の Conventional Commits 形式でコミットします。通常の変更は PR を作成し、日本語のタイトル・説明、関連 Issue、実行した検証、画面仕様変更の有無を記載します。マージ前に `quality` チェックを確認します。詳しい運用方針は [リファクタリング計画](docs/refactor/refactoring-plan.md) を参照してください。

## よくある問題

| 症状 | 確認すること |
| --- | --- |
| `/api/*` が失敗する | backend の `python app.py` が 5001 番で起動しているか、`BACKEND_URL` がその URL を指しているか確認する。Next.js の設定変更後は `npm run dev` を再起動する。 |
| ログイン後にセッションが残らない | frontend は `localhost:3000` で開き、backend の `FRONTEND_URL` と X のコールバック URL も `localhost:3000` に揃える。`127.0.0.1:3000` との混用やブラウザの Cookie 設定を確認する。 |
| 画像を投稿できない・表示されない | 大会の画像ルール、4 枚・16 MiB の上限、backend の R2 設定を確認する。backend が `USE_R2=False` で返す `/static/uploads/*` は現在の Next.js rewrite（`/api/*` のみ）の対象外なので、ローカル保存画像の表示を確認する際は画像の配信経路も確認する。 |
| `npm run build` で backend への fetch が失敗する | 現在の build は backend 未起動でも完了する。`app/history/page.tsx` はリクエスト時にデータを取得し、動的 metadata は取得失敗時の fallback を持つ。新たな build 時 fetch を追加していないか確認する。 |

## デプロイ

frontend は Vercel で Next.js プロジェクトとしてこのリポジトリを接続します。Vercel の環境変数に `BACKEND_URL`（稼働中の backend の HTTPS オリジン）を設定し、必要なら `NEXT_PUBLIC_GA_ID` を設定してデプロイします。backend は別リポジトリの [Dockerfile](https://github.com/Megane14916/netatwi-backend/blob/dev/Dockerfile) で Cloud Run 向けに構成されています。backend 側の `FRONTEND_URL` は公開 frontend のオリジンに合わせ、X 側のコールバック URL も `<FRONTEND_URL>/api/callback/twitter` に設定します。画像に別ホストを使う場合は `next.config.js` の `images.remotePatterns` も確認してください。
