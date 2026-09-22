import { useEffect, useState } from 'react'
import './App.css'

const isVercel = __IS_VERCEL__
const deployEnvironment = __VERCEL_ENV__
const deployVersion = __DEPLOY_VERSION__
const buildTimestamp = __BUILD_TIMESTAMP__
const buildBranch = __VERCEL_GIT_COMMIT_REF__

const formatDateTime = (timestamp) => {
  if (!timestamp) return 'indisponivel'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(timestamp))
}

const formatTime = (timestamp) => {
  if (!timestamp) return '--:--:--'

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp))
}

const formatDuration = (start, end) => {
  if (!start || !end) return 'indisponivel'

  const seconds = Math.max(0, Math.round((end - start) / 1000))
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

const getStatusLabel = (status) => {
  if (status === 'READY') return 'Deployment ready'
  if (status === 'BUILDING') return 'Build em andamento'
  if (status === 'QUEUED') return 'Deployment na fila'
  if (status === 'ERROR') return 'Deployment com erro'
  return 'Status indisponivel'
}

const getLogs = (deployment) => {
  if (!deployment) return []

  const logs = []
  if (deployment.createdAt) logs.push([deployment.createdAt, 'deploy', 'Deployment criado na Vercel'])
  if (deployment.buildingAt) logs.push([deployment.buildingAt, 'build', 'Build iniciado'])
  if (deployment.readyAt) logs.push([deployment.readyAt, 'ready', 'Deployment pronto'])

  return logs
}

function App() {
  const [now, setNow] = useState(() => Date.now())
  const [deployment, setDeployment] = useState({
    status: isVercel ? 'READY' : null,
    createdAt: buildTimestamp,
    readyAt: isVercel ? buildTimestamp : null,
    branch: buildBranch,
    commit: deployVersion,
    source: 'build',
  })

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(clock)
  }, [])

  useEffect(() => {
    if (!isVercel) return undefined

    let active = true
    const collectDeployment = async () => {
      try {
        const response = await fetch('/api/deployment', { cache: 'no-store' })
        if (!response.ok) return

        const currentDeployment = await response.json()
        if (active) setDeployment({ ...currentDeployment, source: 'vercel-api' })
      } catch {
        // Mantem os metadados do build quando a API nao esta configurada.
      }
    }

    collectDeployment()
    const collector = window.setInterval(collectDeployment, 15000)
    return () => {
      active = false
      window.clearInterval(collector)
    }
  }, [])

  const logs = getLogs(deployment)
  const statusLabel = getStatusLabel(deployment.status)
  const branch = deployment.branch || buildBranch
  const version = deployment.commit || deployVersion
  const readyAt = deployment.readyAt || buildTimestamp
  const buildDuration = formatDuration(deployment.createdAt, deployment.readyAt)
  const dataSource = deployment.source === 'vercel-api' ? 'Vercel API' : 'metadados do build'

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
        <div className="status-badge"><span className="status-dot" /> {isVercel ? 'coleta ativa na Vercel' : 'ambiente local'}</div>
      </section>

      <section className="summary-grid" aria-label="Resumo do deployment">
        <article className="summary-card highlight">
          <span className="card-label">STATUS</span>
          <strong>{statusLabel}</strong>
          <small>{formatDateTime(readyAt)}</small>
        </article>
        <article className="summary-card">
          <span className="card-label">BRANCH</span>
          <strong>{branch}</strong>
          <small>Branch do deployment</small>
        </article>
        <article className="summary-card">
          <span className="card-label">BUILD</span>
          <strong>{buildDuration}</strong>
          <small>Tempo medido pela Vercel</small>
        </article>
        <article className="summary-card version-card">
          <span className="card-label">VERSION</span>
          <strong>{version}</strong>
          <small>{isVercel ? `${deployEnvironment} / ${dataSource}` : 'Identificacao local'}</small>
        </article>
      </section>

      <section className="logs-panel">
        <div className="panel-heading">
          <div>
            <span className="card-label">ACTIVITY LOG</span>
            <h2>Ultima execucao</h2>
          </div>
          <span className="live-label"><span className="live-dot" /> {isVercel ? 'live' : 'local'}</span>
        </div>
        <div className="logs" role="log" aria-label="Logs da ultima execucao">
          {logs.map(([time, type, message]) => (
            <div className="log-line" key={`${time}-${type}`}>
              <time dateTime={new Date(time).toISOString()}>{formatTime(time)}</time>
              <span className={`log-type ${type}`}>{type}</span>
              <span>{message}</span>
            </div>
          ))}
        </div>
        <p className="panel-note">Ultima coleta: <code>{formatDateTime(now)}</code>. Build <code>{version}</code> medido por {dataSource}.</p>
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
