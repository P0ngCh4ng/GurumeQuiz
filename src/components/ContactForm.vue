<script setup>
import { ref, computed, onMounted } from 'vue'

// FormSubmit のエンドポイント。
// スパムボットによるアドレス収集を避けるため、平文ではなく Base64 で保持し
// 実行時にデコードする（静的HTML・ソース上に生アドレスを置かない）。
// 初回送信の認証後に FormSubmit から届くランダム英数字のエイリアスURLに
// 差し替えると、アドレスを完全に秘匿できる（README参照）。
const ENDPOINT_B64 = 'aHR0cHM6Ly9mb3Jtc3VibWl0LmNvL3AwbmdjaDRuZ0BnbWFpbC5jb20='

const endpoint = ref('')
onMounted(() => {
  endpoint.value = atob(ENDPOINT_B64)
})

const MESSAGE_MAX = 2000
const name = ref('')
const email = ref('')
const message = ref('')

const canSubmit = computed(
  () =>
    email.value.trim().length > 0 &&
    message.value.trim().length > 0 &&
    message.value.length <= MESSAGE_MAX
)

const siteUrl = `${location.origin}${import.meta.env.BASE_URL}?sent=1`
</script>

<template>
  <div class="contact">
    <h2 class="contact-heading">お問い合わせ</h2>
    <p class="contact-desc">
      問題の誤り（出典の間違い・「要確認」の裏取り情報など）や
      ご意見・ご要望はこちらからどうぞ。
    </p>

    <form :action="endpoint" method="POST" class="contact-form">
      <!-- スパムボット対策: 人間には見えないおとりフィールド（入力があると破棄される） -->
      <input type="text" name="_honey" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true" />
      <!-- FormSubmit 設定: 件名固定・CAPTCHA有効・整形テンプレート・送信後に本サイトへ戻す -->
      <input type="hidden" name="_subject" value="【GurumeQuiz】お問い合わせ" />
      <input type="hidden" name="_captcha" value="true" />
      <input type="hidden" name="_template" value="table" />
      <input type="hidden" name="_next" :value="siteUrl" />

      <label class="field">
        <span class="field-label">お名前（任意）</span>
        <input v-model="name" type="text" name="name" maxlength="100" autocomplete="name" />
      </label>

      <label class="field">
        <span class="field-label">返信先メールアドレス <span class="req">必須</span></span>
        <input v-model="email" type="email" name="email" required maxlength="254" autocomplete="email" />
      </label>

      <label class="field">
        <span class="field-label">
          内容 <span class="req">必須</span>
          <span class="char-count">{{ message.length }} / {{ MESSAGE_MAX }}</span>
        </span>
        <textarea v-model="message" name="message" required :maxlength="MESSAGE_MAX" rows="6"></textarea>
      </label>

      <p class="contact-note">
        送信ボタンを押すと確認画面（CAPTCHA）が表示されます。
        入力内容はフォーム送信サービス FormSubmit を経由して運営者のメールに届きます。
      </p>

      <button type="submit" class="btn btn-start" :disabled="!canSubmit">送信する</button>
    </form>
  </div>
</template>
