<script setup>
import { ref, computed, onMounted } from 'vue'

// FormSubmit の AJAX エンドポイント。
// スパムボットによるアドレス収集を避けるため、平文ではなく Base64 で保持し
// 実行時にデコードする（静的HTML・ソース上に生アドレスを置かない）。
// 初回送信の認証後に FormSubmit から届くランダム英数字のエイリアスに
// 差し替えると、アドレスを完全に秘匿できる（README参照）。
const ENDPOINT_B64 = 'aHR0cHM6Ly9mb3Jtc3VibWl0LmNvL2FqYXgvcDBuZ2NoNG5nQGdtYWlsLmNvbQ=='

const endpoint = ref('')
onMounted(() => {
  endpoint.value = atob(ENDPOINT_B64)
})

const MESSAGE_MAX = 2000
const TIMEOUT_MS = 20000

const name = ref('')
const email = ref('')
const message = ref('')
const honey = ref('') // ハニーポット（ボットが埋めたらFormSubmit側で破棄される）

// 'idle' | 'sending' | 'success' | 'error'
const status = ref('idle')
const errorText = ref('')

const canSubmit = computed(
  () =>
    status.value !== 'sending' &&
    email.value.trim().length > 0 &&
    message.value.trim().length > 0 &&
    message.value.length <= MESSAGE_MAX
)

async function submit() {
  if (!canSubmit.value) return
  status.value = 'sending'
  errorText.value = ''

  // サービス側がダウンしていても無限にロードし続けないようタイムアウトを設ける
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(endpoint.value, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        name: name.value.trim(),
        email: email.value.trim(),
        message: message.value.trim(),
        _honey: honey.value,
        _subject: '【GurumeQuiz】お問い合わせ',
        _template: 'table',
      }),
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    await res.json()
    status.value = 'success'
    name.value = ''
    email.value = ''
    message.value = ''
  } catch (e) {
    status.value = 'error'
    errorText.value =
      e.name === 'AbortError'
        ? '送信がタイムアウトしました。送信サービス側で障害が起きている可能性があります。時間をおいて再度お試しください。'
        : '送信に失敗しました。時間をおいて再度お試しください。'
  } finally {
    clearTimeout(timer)
  }
}
</script>

<template>
  <div class="contact">
    <h2 class="contact-heading">お問い合わせ</h2>
    <p class="contact-desc">
      問題の誤り（出典の間違い・「要確認」の裏取り情報など）や
      ご意見・ご要望はこちらからどうぞ。
    </p>

    <div v-if="status === 'success'" class="form-result form-result-success" role="status">
      お問い合わせを送信しました。ありがとうございました！
    </div>

    <form v-else class="contact-form" @submit.prevent="submit">
      <!-- スパムボット対策: 人間には見えないおとりフィールド -->
      <input v-model="honey" type="text" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true" />

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

      <p v-if="status === 'error'" class="form-result form-result-error" role="alert">
        {{ errorText }}
      </p>

      <p class="contact-note">
        入力内容はフォーム送信サービス FormSubmit を経由して運営者のメールに届きます。
      </p>

      <button type="submit" class="btn btn-start" :disabled="!canSubmit">
        {{ status === 'sending' ? '送信中…' : '送信する' }}
      </button>
    </form>
  </div>
</template>
