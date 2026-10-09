# ネタツイグランプリ フロントエンド

ネタツイを投稿・投票・審査するコンテストサイトです。このリポジトリは画面と API 通信を担当します。

- バックエンドのリポジトリURL: [netatwi-backend](https://github.com/Megane14916/netatwi-backend)
- サイトURL: [https://n-1gp.vercel.app](https://n-1gp.vercel.app)

## 使用技術

| 領域 | 技術 |
| --- | --- |
| フロントエンド | Next.js 14（App Router）、React 18、TypeScript |
| UI・データ取得 | Tailwind CSS、Radix UI、SWR |
| バックエンド | Flask、SQLAlchemy、Cloud Run |
| データ・画像 | Neon PostgreSQL、Cloudflare R2（ローカル DB は SQLite） |
| 非同期処理・認証 | Cloud Tasks、Cloud Run Jobs、X API（OAuth 2.0） |
| テスト・CI | Jest、Testing Library、GitHub Actions |
| デプロイ | Vercel、Cloud Run |

## システム構成

画面は Next.js / Vercel、API は Flask / Cloud Run で動作します。データは Neon、画像は R2 に保存し、X でログインします。大会イベントは Cloud Tasks、ランキング集計は Cloud Run Jobs で処理します。

```text
[利用者のブラウザ]
   │ 画面表示・操作、Cookie 付き /api/*
   ⇅
[Next.js / Vercel]
   │ /api rewrite・Server Component の通信
   ⇅
[Flask API / Cloud Run] ──データの読み書き──⇄ [Neon PostgreSQL]
   ├─ 大会イベントを予約 ──▶ [Cloud Tasks]
   │                            └─ 指定時刻に HTTP 実行 ──▶ [Flask API]
   ├─ 投稿画像を保存・削除 ──▶ [Cloudflare R2] ──公開画像を配信──▶ [ブラウザ]
   └─ トークン交換・ユーザー情報取得 ──⇄ [X API]

[利用者のブラウザ] ──ログイン認可・リダイレクト──⇄ [X の認可画面]
[Cloud Run Jobs / ユーザーランキング集計]
   └─ 大会結果を読み、UserStats を更新 ──⇄ [Neon PostgreSQL]
```

## 開発環境構築

Node.js 20.x / npm 10.x を使用します。リポジトリ直下で実行してください（PowerShell）。

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev
```

macOS / Linux では `Copy-Item` を `cp` に置き換えます。`http://localhost:3000` で起動します。API を利用するには backend も起動してください。手順は [backend の README](https://github.com/Megane14916/netatwi-backend#readme) を参照してください。

## 環境変数

設定項目は [`.env.example`](.env.example) を参照してください。ローカルでは次の値を設定します。

```dotenv
BACKEND_URL=http://127.0.0.1:5001
```

`BACKEND_URL` は API の接続先です。`NEXT_PUBLIC_GA_ID` は任意の Google Analytics 測定 ID です。

## テスト

```powershell
npm run lint
npm run typecheck
npm test -- --runInBand
```

## デプロイ

Vercel にこのリポジトリを接続し、`BACKEND_URL` に稼働中の backend の HTTPS オリジンを設定します。
