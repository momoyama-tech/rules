# 会則の閲覧ページ

SvelteKit（JavaScript）とstatic adapterで `../rules/` のMarkdownを読み、静的HTMLを生成します。編集手順と承認手続は [ルートREADME](../README.md) を参照してください。

```sh
npm ci
npm run dev
npm run check
npm test
npm run build
npm run preview
```

`BASE_PATH` は配信先のサブパスです。公開版は独自ドメイン直下のため空にします。`SOURCE_REF` を設定すると原文・履歴リンクがそのコミット／ブランチを参照します（既定値 `main`）。CIと公開ビルドでは対象コミットを指定します。

`npm run format` でコードを整形できます。`build/` は生成物なので編集・commitしません。
