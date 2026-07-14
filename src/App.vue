<script setup>
import { ref, computed, onMounted } from 'vue'
import allQuestions from './questions.json'
import ContactForm from './components/ContactForm.vue'

const QUIZ_SIZE = 10 // 1ラウンドの出題数（実在・捏造を半々）

// 'start' | 'playing' | 'result'
const phase = ref('start')
const questions = ref([])
const currentIndex = ref(0)
const results = ref([]) // { question, userAnswer, correct }
const answered = ref(false)
const lastCorrect = ref(false)

const current = computed(() => questions.value[currentIndex.value])
const score = computed(() => results.value.filter(r => r.correct).length)
const progress = computed(() =>
  questions.value.length ? ((currentIndex.value + (answered.value ? 1 : 0)) / questions.value.length) * 100 : 0
)

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function startQuiz() {
  const real = shuffle(allQuestions.filter(q => q.answer))
  const fake = shuffle(allQuestions.filter(q => !q.answer))
  const half = Math.floor(QUIZ_SIZE / 2)
  questions.value = shuffle([...real.slice(0, half), ...fake.slice(0, QUIZ_SIZE - half)])
  currentIndex.value = 0
  results.value = []
  answered.value = false
  phase.value = 'playing'
}

function answer(userAnswer) {
  if (answered.value) return
  const correct = userAnswer === current.value.answer
  lastCorrect.value = correct
  results.value.push({ question: current.value, userAnswer, correct })
  answered.value = true
}

function next() {
  if (currentIndex.value + 1 >= questions.value.length) {
    phase.value = 'result'
  } else {
    currentIndex.value++
    answered.value = false
  }
}

// お問い合わせ画面の表示状態と、送信完了（?sent=1 で戻ってきた時）のバナー
const showContact = ref(false)
const sentThanks = ref(false)

onMounted(() => {
  const params = new URLSearchParams(location.search)
  if (params.get('sent') === '1') {
    sentThanks.value = true
    history.replaceState(null, '', location.pathname)
  }
})

const rank = computed(() => {
  const s = score.value
  if (s === QUIZ_SIZE) return { title: '美食神', comment: '完全制覇！グルメ細胞が覚醒しています。' }
  if (s >= 8) return { title: '四天王クラス', comment: 'お見事！トリコ世界にかなり詳しいですね。' }
  if (s >= 6) return { title: '一流の美食屋', comment: 'なかなかの実力。グルメ界進出も近い？' }
  if (s >= 4) return { title: '駆け出し美食屋', comment: 'まだまだ伸びしろあり。原作を読み返そう！' }
  return { title: '一般人', comment: 'グルメ時代の常識はこれから。まずは第1巻から！' }
})
</script>

<template>
  <div class="app">
    <header class="header">
      <h1 class="title">
        <span class="title-gurume">グルメ〇〇</span>
        <span class="title-sub">ある / ないクイズ</span>
      </h1>
      <p class="tagline">『トリコ』に実在する「グルメ〇〇」を見抜け！</p>
    </header>

    <div v-if="sentThanks" class="sent-banner" role="status">
      お問い合わせを送信しました。ありがとうございました！
      <button class="sent-close" @click="sentThanks = false" aria-label="閉じる">×</button>
    </div>

    <!-- お問い合わせ画面 -->
    <main v-if="showContact" class="card contact-card">
      <ContactForm />
      <button class="btn btn-back" @click="showContact = false">クイズに戻る</button>
    </main>

    <!-- スタート画面 -->
    <main v-else-if="phase === 'start'" class="card start-card">
      <p class="start-desc">
        表示される「グルメ〇〇」という言葉が、<br />
        漫画『トリコ』の作中に<strong>実在する（ある）</strong>か、<br />
        <strong>捏造された（ない）</strong>言葉かを当てるクイズです。
      </p>
      <p class="start-meta">全 {{ QUIZ_SIZE }} 問（毎回ランダム出題）</p>
      <button class="btn btn-start" @click="startQuiz">クイズを始める</button>
    </main>

    <!-- 出題画面 -->
    <main v-else-if="phase === 'playing'" class="card quiz-card">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <p class="question-count">第 {{ currentIndex + 1 }} 問 / {{ questions.length }}</p>

      <div class="term-box">
        <span class="term">{{ current.term }}</span>
      </div>
      <p class="question-text">この言葉、トリコに……</p>

      <div v-if="!answered" class="answer-buttons">
        <button class="btn btn-aru" @click="answer(true)">ある</button>
        <button class="btn btn-nai" @click="answer(false)">ない</button>
      </div>

      <div v-else class="feedback" :class="lastCorrect ? 'feedback-correct' : 'feedback-wrong'">
        <p class="feedback-mark">{{ lastCorrect ? '⭕ 正解！' : '❌ 不正解…' }}</p>
        <p class="feedback-answer">
          「{{ current.term }}」は<strong>{{ current.answer ? 'ある' : 'ない' }}</strong>
        </p>
        <p class="feedback-source">{{ current.source }}</p>
        <p class="feedback-category">カテゴリ: {{ current.category }}</p>
        <button class="btn btn-next" @click="next">
          {{ currentIndex + 1 >= questions.length ? '結果を見る' : '次の問題へ' }}
        </button>
      </div>
    </main>

    <!-- 結果画面 -->
    <main v-else class="card result-card">
      <h2 class="result-heading">結果発表</h2>
      <p class="result-score">{{ score }} <span class="result-score-unit">/ {{ questions.length }} 問正解</span></p>
      <p class="result-rank">称号：<strong>{{ rank.title }}</strong></p>
      <p class="result-comment">{{ rank.comment }}</p>

      <ul class="review-list">
        <li v-for="(r, i) in results" :key="i" class="review-item" :class="r.correct ? 'review-correct' : 'review-wrong'">
          <span class="review-mark">{{ r.correct ? '⭕' : '❌' }}</span>
          <div class="review-body">
            <span class="review-term">{{ r.question.term }}</span>
            <span class="review-answer">正解: {{ r.question.answer ? 'ある' : 'ない' }}</span>
            <span class="review-source">{{ r.question.source }}</span>
          </div>
        </li>
      </ul>

      <button class="btn btn-start" @click="startQuiz">もう一度挑戦</button>
    </main>

    <footer class="footer">
      <button v-if="!showContact" class="footer-link" @click="showContact = true">📮 お問い合わせ</button>
      <p>非公式ファンサイトです。『トリコ』（島袋光年／集英社）の画像・ロゴ等は使用していません。</p>
    </footer>
  </div>
</template>
