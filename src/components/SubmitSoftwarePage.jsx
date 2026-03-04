import { useMemo, useState } from 'react'
import './SubmitSoftwarePage.css'

const platformOptions = ['Windows', 'macOS', 'Linux', 'Android', 'iOS']

function isDropboxUrl(rawUrl) {
  try {
    const url = new URL(rawUrl)
    const host = url.hostname.toLowerCase()
    return (
      host === 'dropbox.com' ||
      host === 'www.dropbox.com' ||
      host === 'dl.dropboxusercontent.com'
    )
  } catch (error) {
    return false
  }
}

function SubmitSoftwarePage({ apiBaseUrl, onBack, onSubmitted }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [version, setVersion] = useState('')
  const [license, setLicense] = useState('')
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState([])
  const [customPlatformInput, setCustomPlatformInput] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const platforms = useMemo(() => {
    const customPlatforms = customPlatformInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    return [...new Set([...selectedPlatforms, ...customPlatforms])]
  }, [selectedPlatforms, customPlatformInput])

  const togglePlatform = (platform) => {
    setSelectedPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform]
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) {
      return
    }

    setError('')
    setMessage('')

    if (
      !name.trim() ||
      !category.trim() ||
      !description.trim() ||
      !version.trim() ||
      !license.trim() ||
      !repositoryUrl.trim()
    ) {
      setError('All fields are required.')
      return
    }

    if (platforms.length === 0) {
      setError('Select at least one platform.')
      return
    }

    if (!isDropboxUrl(repositoryUrl.trim())) {
      setError('Please provide a valid Dropbox URL only.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`${apiBaseUrl}/software/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category: category.trim(),
          platforms,
          description: description.trim(),
          version: version.trim(),
          license: license.trim(),
          repositoryUrl: repositoryUrl.trim(),
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit software')
      }

      setMessage('Your software is successfully submitted and is currently in review process.')
      setName('')
      setCategory('')
      setDescription('')
      setVersion('')
      setLicense('')
      setRepositoryUrl('')
      setSelectedPlatforms([])
      setCustomPlatformInput('')
      onSubmitted?.(result.software)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="submit-panel">
      <button type="button" className="secondary-btn" onClick={onBack}>
        Back
      </button>

      <form className="submit-form" onSubmit={handleSubmit}>
        <h2>Submit Software</h2>

        <label htmlFor="submit-name">Name</label>
        <input
          id="submit-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <label htmlFor="submit-category">Category</label>
        <input
          id="submit-category"
          type="text"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          required
        />

        <label>Platforms</label>
        <div className="platform-checkboxes">
          {platformOptions.map((platform) => (
            <label key={platform} className="platform-option">
              <input
                type="checkbox"
                checked={selectedPlatforms.includes(platform)}
                onChange={() => togglePlatform(platform)}
              />
              <span>{platform}</span>
            </label>
          ))}
        </div>
        <label htmlFor="submit-platforms-custom">Custom Platforms (comma separated)</label>
        <input
          id="submit-platforms-custom"
          type="text"
          value={customPlatformInput}
          onChange={(event) => setCustomPlatformInput(event.target.value)}
          placeholder="e.g. Web, Steam Deck"
        />

        <label htmlFor="submit-description">Description</label>
        <textarea
          id="submit-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          required
        />

        <label htmlFor="submit-version">Version</label>
        <input
          id="submit-version"
          type="text"
          value={version}
          onChange={(event) => setVersion(event.target.value)}
          required
        />

        <label htmlFor="submit-license">License</label>
        <input
          id="submit-license"
          type="text"
          value={license}
          onChange={(event) => setLicense(event.target.value)}
          required
        />

        <label htmlFor="submit-repo-url">Dropbox URL</label>
        <input
          id="submit-repo-url"
          type="url"
          value={repositoryUrl}
          onChange={(event) => setRepositoryUrl(event.target.value)}
          placeholder="https://www.dropbox.com/s/..."
          required
        />

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Software'}
        </button>

        {error && <p className="submit-error">{error}</p>}
        {message && <p className="submit-message">{message}</p>}
      </form>
    </section>
  )
}

export default SubmitSoftwarePage
