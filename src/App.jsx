import './App.css'

const logs = [
  ['09:42:08', 'checkout', 'Repository atualizado'],
  ['09:42:12', 'build', 'npm run build concluido'],
  ['09:42:18', 'vercel', 'Deploy de producao enviado'],
  ['09:42:21', 'ready', 'Deployment ready'],
]

const deployVersion = import.meta.env.VITE_DEPLOY_VERSION || 'local'

function App() {
  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Pipeline Lab início">
          <span className="brand-mark">PL</span>
          <span>Pipeline Lab</span>
        </a>
        <span className="study-tag">PRODUCTION / MAIN</span>
      </header>

      <section className="hero-row">
        <div>
          <div className="eyebrow"><span className="pulse" /> deployment monitor</div>
          <h1>Deploy <em>online.</em></h1>
          <p className="intro-copy">Um painel mínimo para conferir o resultado do seu pipeline.</p>
        </div>
        <div className="status-badge"><span className="status-dot" /> pronto</div>
      </section>

      <section className="summary-grid" aria-label="Resumo do deployment">
        <article className="summary-card highlight">
          <span className="card-label">STATUS</span>
          <strong>Deployment ready</strong>
          <small>Produção está respondendo</small>
        </article>
        <article className="summary-card">
          <span className="card-label">BRANCH</span>
          <strong>main</strong>
          <small>Último push aprovado</small>
        </article>
        <article className="summary-card">
          <span className="card-label">BUILD</span>
          <strong>42s</strong>
          <small>Vite production build</small>
        </article>
        <article className="summary-card version-card">
          <span className="card-label">VERSION</span>
          <strong>{deployVersion}</strong>
          <small>Identificação do build</small>
        </article>
      </section>

      <section className="logs-panel">
        <div className="panel-heading">
          <div>
            <span className="card-label">ACTIVITY LOG</span>
            <h2>Última execução</h2>
          </div>
          <span className="live-label"><span className="live-dot" /> live</span>
        </div>
        <div className="logs" role="log" aria-label="Logs da última execução">
          {logs.map(([time, type, message]) => (
            <div className="log-line" key={`${time}-${type}`}>
              <time>{time}</time>
              <span className={`log-type ${type}`}>{type}</span>
              <span>{message}</span>
            </div>
          ))}
        </div>
        <p className="panel-note">Amostra visual dos passos definidos em <code>ci.yaml</code> e <code>cd.yaml</code>.</p>
      </section>

      <footer className="footer">
        <span>React + Vite</span>
        <span className="footer-line" />
        <span>CI/CD study project</span>
      </footer>
    </main>
  )
}

export default App
