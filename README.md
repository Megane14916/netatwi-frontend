# ネタツイグランプリ frontend

ネタツイの投稿・投票・審査を行うコンテストサイトのフロントエンドです。画面と API の表示用データを扱い、認証・保存・集計は別リポジトリの [netatwi-backend](https://github.com/Megane14916/netatwi-backend) が担当します。

## 使用技術

| 領域 | 技術 |
| --- | --- |
| フロントエンド | Next.js 14（App Router）、React 18、TypeScript |
| UI・データ取得 | Tailwind CSS、Radix UI、SWR |
| テスト・CI | Jest、Testing Library、GitHub Actions |
| backend | Flask、SQLAlchemy、SQLite（ローカル） |
| デプロイ | Vercel（frontend）、Cloud Run 向け Dockerfile（backend） |

## ローカル起動

Node.js 20.x / npm 10.x、backend 用に Python 3.11 を用意します。CI は Node.js 20 で実行します。2 リポジトリを同じ親ディレクトリに配置してください。

```sh
git clone https://github.com/Megane14916/netatwi-frontend.git
git clone https://github.com/Megane14916/netatwi-backend.git
```

### backend

`netatwi-backend` に移動し、[`.env.example`](https://github.com/Megane14916/netatwi-backend/blob/dev/.env.example) を `.env` にコピーします。

| PowerShell | macOS / Linux |
| --- | --- |
| `Copy-Item .env.example .env` | `cp .env.example .env` |
| `py -3.11 -m venv venv` | `python3.11 -m venv venv` |
| `.\venv\Scripts\Activate.ps1` | `source venv/bin/activate` |

`.env` はローカル用の `FLASK_DEBUG=True`、SQLite の URL、`FRONTEND_URL=http://localhost:3000` を使い、`SECRET_KEY` を変更します。その後、仮想環境を有効にしたターミナルで実行します。

```sh
python -m pip install -r requirements.txt
python app.py
```

初回起動時にテーブルが作られ、通常は `http://127.0.0.1:5001` で待ち受けます。X ログインには実際の `X_CONSUMER_KEY` / `X_CONSUMER_SECRET` と、X 側のコールバック URL `http://localhost:3000/api/callback/twitter` が必要です。認証情報がなくても公開 API は確認できます。

### frontend

別のターミナルで `netatwi-frontend` に移動し、[`.env.example`](.env.example) を `.env.local` にコピーします（PowerShell: `Copy-Item .env.example .env.local`、macOS / Linux: `cp .env.example .env.local`）。

```sh
npm ci
npm run dev
```

`http://localhost:3000` を開きます。`http://localhost:3000/api/contests` が JSON を返せば backend に接続できています。環境変数を変えたら開発サーバーを再起動してください。

## 環境変数

frontend のローカル起動に必須の変数はありません。`BACKEND_URL` の既定値は `http://127.0.0.1:5001` です。デプロイ時は実際の backend URL を設定します。`.env.local` は Git の追跡対象外です。

| 変数 | 用途 |
| --- | --- |
| `BACKEND_URL` | `/api/*` の転送先と server 側の通信先。末尾に `/api` は付けない |
| `NEXT_PUBLIC_GA_ID` | 任意の Google Analytics 測定 ID |

`.env.local` の例:

```dotenv
BACKEND_URL=http://127.0.0.1:5001
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

backend の DB・認証・R2 などは [backend の `.env.example`](https://github.com/Megane14916/netatwi-backend/blob/dev/.env.example) を参照してください。秘密情報を `NEXT_PUBLIC_*` に設定しないでください。

## 開発コマンド

以下は frontend で実行します。テストと build に backend は不要です。

| コマンド | 用途 |
| --- | --- |
| `npm run dev` | 開発サーバー |
| `npm run lint` / `npm run typecheck` | lint / 型チェック |
| `npm test -- --runInBand` | 全テスト |
| `npm run test:coverage` | coverage レポート作成 |
| `npm run test:ci` | CI と同じ coverage 閾値付きテスト |
| `npm run build` / `npm run start` | 本番 build / 起動 |

coverage は `coverage/lcov-report/index.html` に出力されます。詳細は [テストと品質チェック](docs/refactor/testing.md) を参照してください。

## 構成と通信

```text
ブラウザ -> 同一 origin の /api/* -> Next.js rewrite -> backend
Server Component / metadata -> BACKEND_URL -> backend
```

ブラウザ通信は `lib/api/browser.ts`（Cookie 付き）、server 側は `lib/api/server.ts` を使います。主な構成は `app/`（ページ）、`components/`（共通 UI）、`features/`（機能・業務モデル）、`lib/api/`（通信・検証）、`lib/mappers/`（DTO 変換）、`types/`（型）、`__tests__/`（テスト）です。依存方向は `app` / `components` → `features` → `lib/api` → `types` を原則とします。

## 主な仕様

- **認証:** X OAuth 2.0 と backend のセッション Cookie。審査員ログインは大会単位。
- **投稿:** 開催中に作成・編集・削除。画像は大会設定に従い、最大 4 枚・合計 16 MiB。
- **投票:** 投票期間中に一般投票または審査員採点。自分の投稿には投票不可。
- **大会:** `upcoming` → `ongoing`（投稿）→ `voting` → `closed`。グランプリは予選・決勝、別にデイリー大会があります。

## 変更の進め方

Issue ごとに最新の `master` から英語名のブランチを作り、英語の Conventional Commits 形式でコミットします。通常は日本語のタイトル・説明で PR を作り、関連 Issue、検証結果、仕様変更の有無を記載します。`master` への直接 push は避け、マージ前に `quality` チェックを確認します。詳細は [リファクタリング計画](docs/refactor/refactoring-plan.md) を参照してください。

## よくある問題

| 症状 | 確認点 |
| --- | --- |
| `/api/*` が失敗 | backend の 5001 番ポートと `BACKEND_URL`。変更後は Next.js を再起動。 |
| ログイン状態が残らない | frontend・`FRONTEND_URL`・X コールバックを `localhost:3000` に統一。Cookie も確認。 |
| 画像が表示されない | 画像ルール、枚数・容量、R2 設定。ローカル保存の `/static/uploads/*` は `/api/*` rewrite の対象外。 |
| build 時に backend fetch が失敗 | 現在の build は backend 不要。追加した build 時データ取得を確認。 |

## デプロイ

frontend は Vercel にこのリポジトリを接続し、`BACKEND_URL` に稼働中の backend の HTTPS オリジンを設定します。backend は別リポジトリの [Dockerfile](https://github.com/Megane14916/netatwi-backend/blob/dev/Dockerfile) を参照してください。backend の `FRONTEND_URL` と X コールバック URL は公開 frontend の URL に合わせます。画像ホストを変える場合は `next.config.js` の `images.remotePatterns` も確認します。
