export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const token = process.env.VERCEL_API_TOKEN || process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  const teamId = process.env.VERCEL_ORG_ID

  if (!token || !projectId) {
    return response.status(503).json({
      error: 'Vercel API is not configured',
      detail: 'Configure VERCEL_API_TOKEN and VERCEL_PROJECT_ID in Vercel.',
    })
  }

  const query = new URLSearchParams({
    limit: '1',
    projectId,
    target: 'production',
  })

  if (teamId) query.set('teamId', teamId)

  try {
    const apiResponse = await fetch(`https://api.vercel.com/v6/deployments?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!apiResponse.ok) {
      return response.status(apiResponse.status).json({ error: 'Vercel API request failed' })
    }

    const payload = await apiResponse.json()
    const deployment = payload.deployments?.[0]

    if (!deployment) {
      return response.status(404).json({ error: 'No production deployment found' })
    }

    const completedAt = deployment.readyAt || deployment.completedAt || null
    const createdTimestamp = deployment.createdAt == null ? null : Number(deployment.createdAt)
    const completedTimestamp = completedAt == null ? null : Number(completedAt)
    const durationMs = Number.isFinite(createdTimestamp) && Number.isFinite(completedTimestamp)
      ? Math.max(0, completedTimestamp - createdTimestamp)
      : null

    response.setHeader('Cache-Control', 'no-store, max-age=0')
    return response.status(200).json({
      id: deployment.uid,
      status: deployment.readyState || deployment.state,
      url: deployment.url ? `https://${deployment.url}` : null,
      createdAt: deployment.createdAt || null,
      buildingAt: deployment.buildingAt || null,
      readyAt: completedAt,
      durationMs,
      target: deployment.target || 'production',
      branch: deployment.meta?.githubCommitRef || process.env.VERCEL_GIT_COMMIT_REF || null,
      commit: deployment.meta?.githubCommitSha?.slice(0, 7)
        || process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)
        || null,
    })
  } catch {
    return response.status(502).json({ error: 'Could not reach Vercel API' })
  }
}