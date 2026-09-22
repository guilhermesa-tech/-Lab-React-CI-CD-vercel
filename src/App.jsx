import { useEffect, useState } from 'react'
import { formatDuration, getDurationMilliseconds } from './deployment.js'
import './App.css'

const isVercel = __IS_VERCEL__
const deployEnvironment = __VERCEL_ENV__
const deployVersion = __DEPLOY_VERSION__
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

const getStepType = (name) => {
  const normalizedName = name.toLowerCase()
  if (normalizedName.includes('lint')) return 'lint'
  if (normalizedName.includes('test')) return 'test'
  if (normalizedName.includes('build')) return 'build'
  if (normalizedName.includes('docker')) return 'docker'
  if (normalizedName.includes('deploy')) return 'deploy'
  if (normalizedName.includes('audit')) return 'audit'
  return 'ci'
}

const getPipelineLogs = (pipeline) => {
  if (!pipeline) return []

  return [pipeline.ci, pipeline.cd]
    .filter(Boolean)
    .flatMap((run) => run.jobs.flatMap((job) => job.steps.map((step) => ({
      time: step.startedAt || step.completedAt || run.createdAt,
      type: getStepType(step.name),
      message: `${run.name}: ${step.name}`,
      status: step.conclusion || step.status,
    }))))
    .sort((first, second) => new Date(first.time) - new Date(second.time))
}

function App() {
  const [now, setNow] = useState(() => Date.now())
  const [deployment, setDeployment] = useState({
    status: null,
    createdAt: null,
    readyAt: null,
    branch: buildBranch,
    commit: deployVersion,
    source: 'build',
  })
  const [pipeline, setPipeline] = useState(null)

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(clock)
  }, [])

  useEffect(() => {
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

    const collectPipeline = async () => {
      try {
        const response = await fetch('/api/pipeline', { cache: 'no-store' })
        if (!response.ok) return

        const currentPipeline = await response.json()
        if (active) setPipeline(currentPipeline)
      } catch {
        // O painel continua usando os dados da Vercel se o GitHub estiver indisponivel.
      }
    }

    collectDeployment()
    collectPipeline()
    const collector = window.setInterval(() => {
      collectDeployment()
      collectPipeline()
    }, 15000)
    return () => {
      active = false
      window.clearInterval(collector)
    }
  }, [])

  const logs = getLogs(deployment)
  const pipelineLogs = getPipelineLogs(pipeline)
  const statusLabel = getStatusLabel(deployment.status)
  const latestRun = pipeline?.cd || pipeline?.ci
  const branch = deployment.branch || latestRun?.branch || buildBranch
  const version = deployment.commit || latestRun?.commit || deployVersion
  const readyAt = deployment.readyAt
  const apiDuration = Number(deployment.durationMs)
  const durationMilliseconds = Number.isFinite(apiDuration)
    ? apiDuration
    : getDurationMilliseconds(deployment.createdAt, deployment.readyAt)
  const buildDuration = formatDuration(durationMilliseconds)
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
          <small>{readyAt ? formatDateTime(readyAt) : 'Em andamento'}</small>
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
          {pipelineLogs.length > 0 ? pipelineLogs.map((entry) => (
            <div className="log-line" key={`${entry.time}-${entry.type}-${entry.message}`}>
              <time dateTime={new Date(entry.time).toISOString()}>{formatTime(entry.time)}</time>
              <span className={`log-type ${entry.type}`}>{entry.type}</span>
              <span>{entry.message} ({entry.status})</span>
            </div>
          )) : logs.map(([time, type, message]) => (
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
