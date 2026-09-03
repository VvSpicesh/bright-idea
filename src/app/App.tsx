import { useState } from 'react'

type Section = '起课' | '记录' | '规则'

const sections: Section[] = ['起课', '记录', '规则']

export function App() {
  const [activeSection, setActiveSection] = useState<Section>('起课')

  return (
    <div className="app-shell">
      <main className="main-content">
        <header className="brand-block">
          <p className="eyebrow">小六壬工具</p>
          <h1>bright-idea</h1>
          <p className="intro">把每一步看清楚，再做自己的判断。</p>
        </header>

        <section className="welcome-panel" aria-labelledby="welcome-title">
          <span className="panel-mark" aria-hidden="true">卜</span>
          <div>
            <h2 id="welcome-title">准备开始</h2>
            <p>选择一种起课方式，结果会保留完整的计算过程。</p>
          </div>
        </section>

        <p className="disclaimer">传统文化研究与娱乐用途，不构成现实领域的专业建议。</p>
      </main>

      <nav className="bottom-nav" aria-label="主要导航">
        {sections.map((section) => (
          <button
            key={section}
            type="button"
            className={activeSection === section ? 'nav-item is-active' : 'nav-item'}
            aria-current={activeSection === section ? 'page' : undefined}
            onClick={() => setActiveSection(section)}
          >
            <span className="nav-icon" aria-hidden="true">{section === '起课' ? '起' : section === '记录' ? '簿' : '序'}</span>
            <span>{section}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
