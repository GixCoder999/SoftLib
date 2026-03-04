import { useEffect, useState } from 'react'
import './AdminReviewPage.css'

function AdminReviewPage({ apiBaseUrl, onBack }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [workingId, setWorkingId] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchQueue = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`${apiBaseUrl}/admin/software/review-queue`, {
          credentials: 'include',
        })
        const result = await response.json().catch(() => [])
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch review queue')
        }
        if (isMounted) {
          setItems(Array.isArray(result) ? result : [])
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchQueue()
    return () => {
      isMounted = false
    }
  }, [apiBaseUrl])

  const handleApprove = async (softwareId) => {
    if (workingId) {
      return
    }

    setWorkingId(softwareId)
    setError('')
    try {
      const response = await fetch(`${apiBaseUrl}/admin/software/${softwareId}/approve`, {
        method: 'POST',
        credentials: 'include',
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve software')
      }
      setItems((current) => current.filter((item) => item._id !== softwareId))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setWorkingId('')
    }
  }

  const handleReject = async (softwareId) => {
    if (workingId) {
      return
    }

    setWorkingId(softwareId)
    setError('')
    try {
      const response = await fetch(`${apiBaseUrl}/admin/software/${softwareId}/reject`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject software')
      }
      setItems((current) => current.filter((item) => item._id !== softwareId))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setWorkingId('')
    }
  }

  if (loading) {
    return <section className="review-panel">Loading pending submissions...</section>
  }

  return (
    <section className="review-panel">
      <button type="button" className="secondary-btn" onClick={onBack}>
        Back
      </button>

      <h2>Review Software Submissions</h2>
      {error && <p className="review-error">{error}</p>}

      {items.length === 0 ? (
        <p className="review-empty">No pending software submissions.</p>
      ) : (
        <div className="review-list">
          {items.map((item) => (
            <article key={item._id} className="review-card">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="review-meta">
                <div>
                  <span>Category</span>
                  <strong>{item.category || 'Uncategorized'}</strong>
                </div>
                <div>
                  <span>Version</span>
                  <strong>{item.version || 'N/A'}</strong>
                </div>
                <div>
                  <span>License</span>
                  <strong>{item.license || 'N/A'}</strong>
                </div>
                <div>
                  <span>Type</span>
                  <strong>{item.isPremium ? 'Premium' : 'Free'}</strong>
                </div>
                <div>
                  <span>Reviewed</span>
                  <strong>{item.reviewed ? 'Yes' : 'No'}</strong>
                </div>
                <div>
                  <span>Submitted</span>
                  <strong>
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown'}
                  </strong>
                </div>
              </div>

              <p className="review-platforms">
                <strong>Platforms:</strong>{' '}
                {Array.isArray(item.platforms) && item.platforms.length > 0
                  ? item.platforms.join(', ')
                  : 'None'}
              </p>
              <p className="review-link">
                <strong>Dropbox URL:</strong>{' '}
                <a href={item.repositoryUrl} target="_blank" rel="noreferrer">
                  {item.repositoryUrl}
                </a>
              </p>

              <div className="review-actions">
                <button
                  type="button"
                  className="download-btn"
                  onClick={() => handleApprove(item._id)}
                  disabled={Boolean(workingId)}
                >
                  {workingId === item._id ? 'Working...' : 'Approve'}
                </button>
                <button
                  type="button"
                  className="secondary-btn danger-btn"
                  onClick={() => handleReject(item._id)}
                  disabled={Boolean(workingId)}
                >
                  {workingId === item._id ? 'Working...' : 'Reject'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default AdminReviewPage
