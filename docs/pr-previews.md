# 草案のプレビュー

正式版はGitHub Pages、未承認の草案はCloudflare Workers Previewsで公開する。
プレビュー公開は会則の採用・総会承認・PRのマージを意味しない。
公開リポジトリに含まれる文書だけを扱い、個人の報酬・会計証憑・秘密情報は載せない。

## 手動公開

Node.js 24と、対象CloudflareアカウントのWorkers操作権限が必要。

```sh
cd site
npm ci
PREVIEW_LABEL='PR #3' npm run build:preview
CLOUDFLARE_ACCOUNT_ID='<対象アカウントID>' npm run deploy:preview -- --name pr-3 --json
```

更新できるPR別URLと、内容を固定したデプロイURLが返る。
レビュー中はPR別URLを使い、部員総会の議案にはコミットSHAと固定デプロイURLを記録する。
画面には未承認表示と対象コミットを出し、検索エンジンへの登録を抑制する。
検索抑制はアクセス制限ではなく、URLを知る人は閲覧できる。

GitHub Pagesは通常の `npm run build` と `BASE_PATH=/rules` を使用する。
プレビューの `build:preview` はルートパスで出力し、Pagesの公開操作を行わない。

## PR更新に合わせた自動公開

`.github/workflows/cloudflare-preview.yml` を使用する。
同じリポジトリのPRのみが対象で、forkからのPRには資格情報を渡さない。
`pull_request_target` は使わない。CI成功後にプレビューをアップロードし、URLを実行サマリーへ出す。
ビルドとアップロードを別のrunnerに分け、資格情報を持つ側ではPRのコード・スクリプト・Wrangler設定を実行しない。

管理者が環境 `cloudflare-preview` に専用のCloudflare APIトークンを登録し、
対象アカウントの必要なWorkers権限だけを付ける。ClaudeのAPIトークンやローカルOAuthトークンを流用しない。
環境の承認者を設定し、アップロード前の確認を残す。
環境secret: `CLOUDFLARE_API_TOKEN`、環境variable: `CLOUDFLARE_ACCOUNT_ID`。
リポジトリvariable `CLOUDFLARE_PREVIEWS_ENABLED=true` を設定した時だけ動く。
設定が済むまでは手動公開とする。

この仕組みをmainへ取り込んだ後、既存PRにもmainの変更を取り込む。
PR終了時の削除は管理者が `npx wrangler preview delete --name pr-番号` で行う。
議案で使った固定URLを削除すると参照できなくなるため、承認記録の保存期間を先に決める。

参考: [Workers Previews](https://developers.cloudflare.com/workers/previews/get-started/)、
[CIの例](https://developers.cloudflare.com/workers/previews/examples/)。
