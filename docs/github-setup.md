# GitHub管理設定チェックリスト

2026年10月9日の初期調査ではPublic、default branchはmain、OrganizationはFree。Rulesetsは0件、Pages APIは404でした。会則管理用チームと役割は未確定です。今回のPRは手順とコードを追加し、管理設定や公開を実行しません。

## 運用開始前

- [ ] 原文一致、3細則の採択状況、公開範囲を確認
- [ ] 現行会則に基づく正式決議の手続を確定
- [ ] 作成者以外の2名が確認できる体制と交代時の引き継ぎを用意
- [ ] 決議確認・技術確認チームのメンバー、write権限、別人の確認を設定
- [ ] CODEOWNERS.exampleを実在チームに置換しCODEOWNERSへ改名
- [ ] mainのRulesetをREADME記載の条件でActiveに設定
- [ ] force push・main削除を禁止、通常のバイパスを空に設定
- [ ] CI実行後に `site-checks` を必須チェックへ指定
- [ ] レビューの却下解除、Ruleset・チーム変更ができる人を限定

## 拒否テスト

実際のテストPRで確認し、結果とURLを記録する。

| ケース | 期待 |
| --- | --- |
| 直接mainへpush | 拒否 |
| Approveが1名 | マージ不可 |
| 2名が同じ役割だけ | 別チームの必須承認がなければマージ不可 |
| 作成者・最後のpush者だけが確認 | 条件を満たさずマージ不可 |
| Approve後に本文変更 | 承認失効・再審議と再レビュー |
| 正式決議なし | 確認担当がApproveしない。決議自動判定CIは未実装 |
| CI失敗・未解決の議論 | マージ不可 |
| PRから公開 | 公開ジョブが動かない |

## 初回公開

- [ ] 初回公開の具体的な承認がある
- [ ] Pages Source = GitHub Actions
- [ ] github-pages environmentはSelected branchesでmainのみ許可
- [ ] 必要なら公開担当のenvironment承認を要求し管理者バイパスを禁止
- [ ] `PAGES_ENABLED=true` を設定
- [ ] mainからDeploy Pagesを手動実行
- [ ] 公開先で全ページ・条文リンク・モバイル・印刷・404を確認
- [ ] 公開コミット、日時、URL、検証結果を記録

EnvironmentのRequired reviewersは複数人指定しても通常は1名で通るため、2名PRレビューの代用にはしない。
