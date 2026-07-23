import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 프로젝트 사이트 주소가 https://tacocat404.github.io/-/ 이므로
// 빌드 결과의 경로 기준(base)을 저장소 이름('-')에 맞춘다.
// 로컬 개발(npm run dev)에서는 항상 '/' 를 써야 하므로 build 때만 적용.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/-/' : '/',
  plugins: [react()],
}))
