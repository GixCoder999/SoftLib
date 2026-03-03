import { useEffect, useState } from 'react'
import './SoftwareDetailsPage.css'

function SoftwareDetailsPage({ apiBaseUrl, softwareId, onBack, onAuthRequired }) {
  const [software, setSoftware] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const fetchDetails = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`${apiBaseUrl}/software/${softwareId}`)
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch software details')
        }
        if (isMounted) {
          setSoftware(data)
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

    fetchDetails()
    return () => {
      isMounted = false
    }
  }, [apiBaseUrl, softwareId])

  const startDownload = async () => {
    if (downloading) {
      return
    }

    setDownloading(true)
    setCountdown(5)
    for (let seconds = 5; seconds > 0; seconds -= 1) {
      await new Promise((resolve) => {
        setTimeout(resolve, 1000)
      })
      setCountdown(seconds - 1)
    }

    try {
      const response = await fetch(`${apiBaseUrl}/software/${softwareId}/download?redirect=false`, {
        credentials: 'include',
      })
      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please sign in first to download this software.')
          onAuthRequired?.()
          return
        }
        throw new Error(result.error || 'Failed to prepare download')
      }

      if (result.downloadUrl) {
        window.location.assign(result.downloadUrl)
      } else {
        throw new Error('Download URL missing in response')
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return <section className="details-panel">Loading software details...</section>
  }

  if (error && !software) {
    return (
      <section className="details-panel">
        <p className="details-error">{error}</p>
        <button type="button" className="secondary-btn" onClick={onBack}>
          Back to list
        </button>
      </section>
    )
  }

  const platforms = Array.isArray(software?.platforms) ? software.platforms : []

  return (
    <section className="details-panel">
      <button type="button" className="secondary-btn" onClick={onBack}>
        Back
      </button>

      <h2>{software?.name}</h2>
      <p className="details-description">{software?.description}</p>

      <div className="details-meta-grid">
        <div>
          <span>Category</span>
          <strong>{software?.category || 'Uncategorized'}</strong>
        </div>
        <div>
          <span>Version</span>
          <strong>{software?.version || 'N/A'}</strong>
        </div>
        <div>
          <span>License</span>
          <strong>{software?.license || 'N/A'}</strong>
        </div>
        <div>
          <span>Type</span>
          <strong>{software?.isPremium ? 'Premium' : 'Free'}</strong>
        </div>
      </div>

      <div className="platform-row details-platforms">
        {platforms.map((platform) => (
          <small key={platform}>{platform}</small>
        ))}
      </div>

      <button type="button" className="download-btn" onClick={startDownload} disabled={downloading}>
        {downloading && countdown > 0 ? `Starting download in ${countdown}s...` : 'Download'}
      </button>

      {error && <p className="details-error">{error}</p>}
    </section>
  )
}

export default SoftwareDetailsPage
