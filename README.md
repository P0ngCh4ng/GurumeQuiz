# グルメ〇〇 ある/ないクイズ

漫画『トリコ』に登場する「グルメ〇〇」という言葉が**実在する（ある）**か、**捏造された（ない）**言葉かを当てるクイズサイトです。

- 出題型クイズ形式（毎回ランダムに10問出題、実在語・捏造語を半々でミックス）
- テキストのみで構成された非公式ファンサイト（画像・ロゴ・コマの転載なし）

## 技術構成

- Vue 3 + Vite（静的サイト）
- 問題バンク: [src/questions.json](src/questions.json)
  - `term`: 出題する言葉
  - `answer`: `true` = 実在する / `false` = 捏造語
  - `source`: 出典（単行本巻数・アニメ話数・登場エピソードなど）
  - `category`: カテゴリ（施設 / 職業 / 制度 / 組織 / 現象 など）

> **出典について**: `source` の巻数・話数は記憶ベースの暫定値を含みます。「要確認」と記載のある項目は原作で裏取りのうえ更新してください。

## 開発

```bash
npm install
npm run dev      # 開発サーバー
npm run build    # 本番ビルド（dist/）
```

## デプロイ（GitHub Pages）

`main` ブランチへの push で GitHub Actions（[.github/workflows/deploy.yml](.github/workflows/deploy.yml)）が自動ビルド・デプロイします。

初回のみ、リポジトリの **Settings → Pages → Source** を **GitHub Actions** に設定してください。

公開URL: https://p0ngch4ng.github.io/GurumeQuiz/

## お問い合わせフォーム

バックエンド不要のフォーム送信サービス [FormSubmit](https://formsubmit.co/) を利用して、運営者のメールアドレス宛に問い合わせを送信します（[src/components/ContactForm.vue](src/components/ContactForm.vue)）。

### セキュリティ対策

- **メールアドレスの非露出**: 送信先アドレスは静的HTML・ソースに平文で置かず、Base64で保持して実行時にデコード（ボットの単純クロール対策）
- **ハニーポット**: 人間には見えない `_honey` フィールドに入力があった送信はFormSubmit側で破棄
- **CAPTCHA**: `_captcha=true` により送信時にFormSubmitの確認画面（reCAPTCHA）を挟む
- **入力制限**: 必須項目・型（email）・最大文字数（本文2000字）をクライアント側で検証
- **PIIをURLに載せない**: POST送信のみ。送信後のリダイレクトは `?sent=1` フラグだけで、履歴からも即時除去

### 初回セットアップ（運営者の作業）

1. デプロイ後、自分でフォームを1回送信する
2. FormSubmitから届く確認メール（activation）内のリンクをクリックして有効化する
3. （推奨）有効化後にFormSubmitから案内されるランダム英数字のエイリアスURL（`https://formsubmit.co/<random-string>` 形式）を取得し、`ContactForm.vue` の `ENDPOINT_B64` をそのエイリアスのBase64に差し替える。これでアドレスがバンドルからも完全に秘匿されます:

```bash
echo -n "https://formsubmit.co/あなたのエイリアス文字列" | base64
```

## 問題の追加方法

`src/questions.json` にエントリを追加するだけです。実在語と捏造語の数はなるべく揃えてください（出題時に半々でサンプリングされます）。
