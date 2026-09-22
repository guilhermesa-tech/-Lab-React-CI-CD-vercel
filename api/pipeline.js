const githubRequest = async (url, token) => {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!response.ok) throw new Error(`GitHub API returned ${response.status}`)
  return response.json()
}

const getWorkflowRun = async (repository, workflow, token) => {
  const params = new URLSearchParams({
    branch: 'main',
    event: 'push',
    per_page: '1',
  })
  const runs = await githubRequest(
    `https://api.github.com/repos/${repository}/actions/workflows/${workflow}/runs?${params}`,
    token,
  )
  return runs.workflow_runs?.[0] || null
}

const getRunDetails = async (repository, run, token) => {
  if (!run) return null

  const payload = await githubRequest(
    `https://api.github.com/repos/${repository}/actions/runs/${run.id}/jobs?per_page=100`,
    token,
  )

  return {
    id: run.id,
    name: run.name,
    status: run.status,
    conclusion: run.conclusion,
    branch: run.head_branch,
    commit: run.head_sha?.slice(0, 7) || null,
    createdAt: run.created_at,
    startedAt: run.run_started_at,
    updatedAt: run.updated_at,
    url: run.html_url,
    jobs: payload.jobs.map((job) => ({
      name: job.name,
      status: job.status,
      conclusion: job.conclusion,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      steps: (job.steps || []).map((step) => ({
        name: step.name,
        status: step.status,
        conclusion: step.conclusion,
        startedAt: step.started_at,
        completedAt: step.completed_at,
      })),
    })),
  }
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const token = process.env.GITHUB_TOKEN
  const repository = process.env.GITHUB_REPOSITORY

  if (!token || !repository) {
    return response.status(503).json({
      error: 'GitHub Actions API is not configured',
      detail: 'Configure GITHUB_TOKEN and GITHUB_REPOSITORY in Vercel.',
    })
  }

  try {
    const [ciRun, cdRun] = await Promise.all([
      getWorkflowRun(repository, 'ci.yaml', token),
      getWorkflowRun(repository, 'cd.yaml', token),
    ])

    response.setHeader('Cache-Control', 'no-store, max-age=0')
    return response.status(200).json({
      ci: await getRunDetails(repository, ciRun, token),
      cd: await getRunDetails(repository, cdRun, token),
    })
  } catch {
    return response.status(502).json({ error: 'Could not reach GitHub Actions API' })
  }
}