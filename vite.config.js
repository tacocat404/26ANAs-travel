import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 경로 기준(base) — 배포하는 곳마다 주소 모양이 달라 자동으로 맞춘다.
//  · GitHub Pages(우리가 쓰는 곳): https://tacocat404.github.io/26ANAs-travel/ → 저장소 이름이 붙는다
//  · 최상위 주소로 서비스되는 곳(Vercel 등) / 로컬 개발                        → '/'
// 2026-08-03에 Vercel로도 올려봤다가, base가 '/26ANAs-travel/'로 고정돼 있어 파일을 못 찾고
// 흰 화면이 나온 적이 있다. Vercel은 접었지만, 같은 함정을 다시 밟지 않게 분기는 남겨 둔다.
// (Vercel은 빌드할 때 VERCEL 환경변수를 자동으로 넣어준다.)
const rootDomainHost = !!process.env.VERCEL

export default defineConfig(({ command }) => ({
  base: command === 'build' && !rootDomainHost ? '/26ANAs-travel/' : '/',
  plugins: [react()],
}))
