import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 경로 기준(base) — 배포하는 곳마다 주소 모양이 달라서 자동으로 맞춘다.
//  · GitHub Pages: https://tacocat404.github.io/26ANAs-travel/ 처럼 저장소 이름이 붙는다 → '/26ANAs-travel/'
//  · Vercel:       https://26-an-as-travel.vercel.app/ 처럼 최상위다            → '/'
//  · 로컬 개발(npm run dev)                                                    → '/'
// Vercel은 빌드할 때 VERCEL 환경변수를 자동으로 넣어주므로 그걸로 구분한다.
// ⚠️ 이걸 '/26ANAs-travel/' 로 고정하면 Vercel에서 파일을 못 찾아 흰 화면이 된다.
const onVercel = !!process.env.VERCEL

export default defineConfig(({ command }) => ({
  base: command === 'build' && !onVercel ? '/26ANAs-travel/' : '/',
  plugins: [react()],
}))
