# テストと品質チェック

`npm run test:ci` は全テストと coverage を実行する。`npm run test:coverage` でも同じ coverage レポートをローカルで確認できる。HTML レポートは `coverage/lcov-report/index.html`、機械可読な要約は `coverage/coverage-summary.json` に出力される。

## テストの責務

- `__tests__/features` と `__tests__/lib`: 業務モデル、mapper、API error、hook の単体テスト
- `__tests__/components`: 操作と状態同期の component テスト
- `__tests__/integration`: 認証・投稿・投票・コメント・管理者操作の API フローと page の統合テスト
- `__tests__/support`: domain fixture、API mock、固定日時、AuthProvider と分離した SWR cache を使う render

通信テストでは `installApiMock()` に method、`/api/` path、応答を登録する。予期しない通信は失敗し、`assertDone()` は未使用の応答を検出する。時刻に依存するテストでは `freezeTime()` の戻り値を `finally` で呼んで実時計へ戻す。乱数に依存する model は乱数関数を注入する。

大会の時刻判定、投票 payload、投稿 validation、browser API、API error、mapper はファイル別に branch coverage 80% 以上を要求する。全体の率だけでは未テストの重要な分岐を見落とすため、全体閾値は設けない。

## CI と backend

GitHub Actions の `quality` ジョブは Node 20 で `npm ci`、lint、typecheck、test と coverage、build を順に実行する。CI に backend は起動しない。browser API は相対パス `/api/` を使い、通信テストでは全て mock する。build 時の rewrite 用 `BACKEND_URL` は loopback の固定値で、現在の静的生成は backend へ通信しない。build が backend 通信を始めた場合は CI で失敗させ、対象ページのデータ取得境界を見直す。

`master` の branch protection では GitHub 上の `quality` status check を必須にする。workflow が初回実行された後、repository 管理者が Rulesets または Branch protection rule に追加する。
