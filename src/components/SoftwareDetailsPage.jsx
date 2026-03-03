import { useEffect, useState } from 'react'
import './SoftwareDetailsPage.css'

function SoftwareDetailsPage({ apiBaseUrl, softwareId, onBack }) {
  const [software, setSoftware] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState(0)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewFeedback, setReviewFeedback] = useState('')

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
      const response = await fetch(`${apiBaseUrl}/software/${softwareId}/download?redirect=false`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to prepare download')
      }

      if (result.downloadUrl) {
        setSoftware((currentSoftware) => {
          if (!currentSoftware) {
            return currentSoftware
          }

          return {
            ...currentSoftware,
            downloads: Number.isFinite(result.downloads)
              ? result.downloads
              : (Number.isFinite(currentSoftware.downloads) ? currentSoftware.downloads + 1 : 1),
          }
        })
        const popup = window.open(result.downloadUrl, '_blank', 'noopener,noreferrer')
        if (!popup) {
          window.location.assign(result.downloadUrl)
        }
        setSelectedReview(0)
        setReviewFeedback('')
        setIsReviewModalOpen(true)
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
  const review = Number.isFinite(software?.review) ? software.review : 0
  const downloads = Number.isFinite(software?.downloads) ? software.downloads : 0

  const submitReview = async () => {
    if (!selectedReview || reviewSubmitting) {
      return
    }

    setReviewSubmitting(true)
    setReviewFeedback('')
    try {
      const response = await fetch(`${apiBaseUrl}/software/${softwareId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ review: selectedReview }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit review')
      }

      setSoftware((currentSoftware) => {
        if (!currentSoftware) {
          return currentSoftware
        }
        return {
          ...currentSoftware,
          review: Number.isFinite(result.review) ? result.review : selectedReview,
        }
      })
      setReviewFeedback('Thanks for your review.')
      setTimeout(() => {
        setIsReviewModalOpen(false)
      }, 650)
    } catch (requestError) {
      setReviewFeedback(requestError.message)
    } finally {
      setReviewSubmitting(false)
    }
  }

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
        <div>
          <span>Review</span>
          <strong>{review.toFixed(1)}/5</strong>
        </div>
        <div>
          <span>Downloads</span>
          <strong>{downloads}</strong>
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

      {isReviewModalOpen && (
        <div className="review-modal-backdrop" role="dialog" aria-modal="true" aria-label="Rate software">
          <div className="review-modal">
            <h3>Rate this software</h3>
            <p>How would you rate your download experience?</p>
            <div className="review-stars">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <button
                  key={starValue}
                  type="button"
                  className={`star-btn ${selectedReview >= starValue ? 'active' : ''}`}
                  onClick={() => setSelectedReview(starValue)}
                  aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="review-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setIsReviewModalOpen(false)}
                disabled={reviewSubmitting}
              >
                Skip
              </button>
              <button
                type="button"
                className="download-btn"
                onClick={submitReview}
                disabled={!selectedReview || reviewSubmitting}
              >
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
            {reviewFeedback && <p className="review-feedback">{reviewFeedback}</p>}
          </div>
        </div>
      )}
    </section>
  )
}

export default SoftwareDetailsPage
