import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages: https://p0ngch4ng.github.io/GurumeQuiz/
export default defineConfig({
  base: '/GurumeQuiz/',
  plugins: [vue()],
})
