import { useEffect, useRef } from 'react'
import { CaretLeft } from '@phosphor-icons/react'

// 소개 랜딩: 스크롤 내리며 이 앱이 뭔지 설명 → "시작하기"로 입장 코드 화면.
// 프로토타입에서 확정한 해마풍 부드러운 언어. 색은 CSS 토큰(--accent)에서.
// intro=true 면 이미 앱에 들어온 상태에서 '소개 다시보기'로 열린 것 → CTA는 앱으로 복귀.
export default function Landing({ onStart, intro = false }) {
  const ref = useRef(null)
  const cta = intro ? '앱으로 돌아가기' : '시작하기'

  useEffect(() => {
    const els = ref.current?.querySelectorAll('.lp-up')
    if (!els?.length) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))),
      { threshold: 0.12 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="lp" ref={ref}>
      <nav className="lp-nav">
        <span className="lp-brand">
          <span className="b1 blob" />
          언제갈까?
          <span className="sub hand">우리들의 여행 기록</span>
        </span>
        <button className={'primary small' + (intro ? '' : ' accent')} onClick={onStart}>
          {intro && <CaretLeft size={15} weight="bold" />}
          {cta}
        </button>
      </nav>

      {/* 히어로 */}
      <section className="lp-section lp-hero">
        <div className="lp-up">
          <span className="lp-kicker hand">
            <span className="b1 blob face" />
            친구들이랑, 이번엔 진짜 가자
          </span>
          <h1>
            다 되는 날부터
            <br />
            <span className="hl">같이 정해요.</span>
          </h1>
          <p className="lp-lead">
            각자 안 되는 날만 표시하면 끝. 다 같이 되는 날이 한눈에 보여요. 갈 곳은 지도에 모으고, 다녀와선 사진으로
            남겨요.
          </p>
          <div className="lp-cta">
            <button className="primary accent" onClick={onStart}>
              {cta}
            </button>
            <a className="lp-link" href="#peek">
              둘러보기
            </a>
          </div>
        </div>

        {/* 무드 블롭 캘린더 */}
        <div className="lp-up card" style={{ padding: '22px 22px 20px' }} aria-hidden="true">
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div className="num" style={{ fontSize: 13, color: 'var(--sub)', letterSpacing: '.1em' }}>
              2026
            </div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>8월</div>
          </div>
          <MoodCalendar />
          <div className="hand" style={{ marginTop: 14, textAlign: 'center', fontSize: 19, color: 'var(--accent)' }}>
            8월 15일, 다섯 명 다 돼요
          </div>
        </div>
      </section>

      {/* 미리보기 */}
      <section className="lp-section" id="peek">
        <div className="lp-sec-head lp-up">
          <span className="kick hand">이렇게 생겼어요</span>
          <h2>날짜만 정하는 게 아니에요.</h2>
          <p>가는 날을 맞추고, 갈 곳을 지도에 모으고, 다녀와서 사진으로 남기는 것까지 한곳에서 해요.</p>
        </div>

        <div className="lp-peek">
          <div className="lp-panel card lp-up">
            <h3>여행이 흘러간 기록</h3>
            <p className="desc">공지도 사진도 날짜순으로 차곡차곡 쌓여요.</p>
            <div className="stage">
              <div className="lp-entry">
                <span className="av blob face" style={{ background: '#a9dcc8' }} />
                <div>
                  <div className="date hand">8월 15일 · 하나</div>
                  <div className="body">숙소는 내가 예약할게! 애월 쪽으로 봤어.</div>
                </div>
              </div>
              <div className="lp-entry">
                <span className="av blob" style={{ background: '#f4b0bd' }} />
                <div>
                  <div className="date hand">8월 16일 · 미주</div>
                  <div className="photo" style={{ background: 'linear-gradient(135deg,#9db6cc,#6e879c)' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="lp-panel card lp-up">
            <h3>여행 한 편의 정보</h3>
            <p className="desc">기간, 만든 사람, 함께 간 친구, 다녀온 곳까지.</p>
            <div className="stage">
              <div className="lp-metarow">
                <span className="k">기간</span>
                <span className="num">2026. 8. 15 ~ 8. 17</span>
              </div>
              <div className="lp-metarow">
                <span className="k">만든 사람</span>
                <span>미주</span>
              </div>
              <div className="lp-metarow">
                <span className="k">함께</span>
                <span className="pill-row">
                  <span className="legend-item">
                    <i style={{ background: '#f4b0bd' }} />
                    미주
                  </span>
                  <span className="legend-item">
                    <i style={{ background: '#a9c8ee' }} />
                    철수
                  </span>
                  <span className="legend-item">
                    <i style={{ background: '#a9dcc8' }} />
                    하나
                  </span>
                </span>
              </div>
              <div className="lp-metarow">
                <span className="k">다녀온 곳</span>
                <span>제주 애월 · 성산</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 흐름 3단계 */}
      <section className="lp-section">
        <div className="lp-sec-head lp-up">
          <h2>여행 한 번은 이렇게 흘러가요.</h2>
        </div>
        <div className="lp-steps">
          <div className="lp-step card lp-up">
            <div className="no num">01</div>
            <h3>날짜 맞추기</h3>
            <p>각자 안 되는 날만 표시하면, 다 같이 되는 날이 드러나요.</p>
          </div>
          <div className="lp-step card lp-up">
            <div className="no num">02</div>
            <h3>갈 곳 정하기</h3>
            <p>지도에서 지역을 고르고, 가고 싶은 곳에 핀을 꽂아 동선을 그려요.</p>
          </div>
          <div className="lp-step card lp-up">
            <div className="no num">03</div>
            <h3>다녀와서</h3>
            <p>사진과 공지가 여행별로 모여, 다음에 또 꺼내 보는 기록이 돼요.</p>
          </div>
        </div>
      </section>

      {/* 우리끼리 */}
      <section className="lp-section">
        <div className="lp-lock">
          <div className="lp-keycard card lp-up">
            <span className="lp-keyblob blob">
              <span className="kh" />
            </span>
            <div className="code-digits num">
              <span>•</span>
              <span>•</span>
              <span>•</span>
              <span>•</span>
            </div>
            <span className="hand" style={{ color: 'var(--accent)', fontSize: 19 }}>
              입장 코드를 아는 친구만
            </span>
          </div>
          <div className="lp-sec-head lp-up">
            <h2>아는 사람만 들어와요.</h2>
            <p>
              관리자가 정한 입장 코드를 아는 친구만 이름을 적고 들어와요. 코드는 관리자가 언제든 바꿀 수 있고, 멤버와
              여행 정리도 관리자 몫이에요.
            </p>
            <div className="lp-cta">
              <button className="primary accent" onClick={onStart}>
                {cta}
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <span className="lp-brand" style={{ fontSize: 16 }}>
          <span className="b1 blob" />
          언제갈까?
        </span>
        <small className="hand">우리들과 여행 날짜 정하기</small>
      </footer>
    </div>
  )
}

// 랜딩 히어로의 무드 캘린더 (파스텔 멤버 블롭). 장식용.
function MoodCalendar() {
  const cells = [
    { c: '#f4b0bd' },
    { d: 11 },
    { c: '#a9c8ee' },
    { c: '#f6d98a' },
    { d: 14 },
    { go: 15 },
    { c: '#cdb8ee' },
    { c: '#a9dcc8', face: true },
    { d: 18 },
    { c: '#f6b79a' },
    { d: 20 },
    { c: '#a9c8ee' },
    { d: 22 },
    { c: '#f4b0bd' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 9, placeItems: 'center' }}>
      {['일', '월', '화', '수', '목', '금', '토'].map((w) => (
        <span key={w} style={{ fontSize: 11, color: 'var(--sub)' }}>
          {w}
        </span>
      ))}
      {cells.map((c, i) => (
        <span
          key={i}
          style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', position: 'relative' }}
        >
          {c.go ? (
            <>
              <span
                style={{
                  position: 'absolute',
                  inset: -4,
                  border: '2.5px solid var(--accent)',
                  borderRadius: '50%',
                }}
              />
              <span className="num" style={{ fontSize: 12, fontWeight: 800 }}>
                {c.go}
              </span>
            </>
          ) : c.c ? (
            <span className={'blob' + (c.face ? ' face' : '')} style={{ width: 30, height: 30, background: c.c }} />
          ) : (
            <span className="num" style={{ fontSize: 12, color: 'var(--sub)' }}>
              {c.d}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
