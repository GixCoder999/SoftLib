import { useState } from 'react'
import './AuthPage.css'

function AuthPage({ apiBaseUrl, onSuccess }) {
  const [mode, setMode] = useState('signin')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSignup = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch(`${apiBaseUrl}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Signup failed')
        return
      }

      setMessage(result.message || 'Signup successful. Please sign in.')
      setMode('signin')
      setPassword('')
      setUsernameOrEmail(email)
    } catch (requestError) {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignin = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch(`${apiBaseUrl}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ usernameOrEmail, password }),
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error || 'Signin failed')
        return
      }

      setMessage(result.message || 'Login successful')
      onSuccess?.()
    } catch (requestError) {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-panel">
      <div className="auth-switcher">
        <button
          type="button"
          className={mode === 'signin' ? 'active' : ''}
          onClick={() => setMode('signin')}
        >
          Sign In
        </button>
        <button
          type="button"
          className={mode === 'signup' ? 'active' : ''}
          onClick={() => setMode('signup')}
        >
          Sign Up
        </button>
      </div>

      {mode === 'signin' ? (
        <form className="auth-form" onSubmit={handleSignin}>
          <h2>Welcome back</h2>
          <label htmlFor="signin-username-email">Username or Email</label>
          <input
            id="signin-username-email"
            type="text"
            value={usernameOrEmail}
            onChange={(event) => setUsernameOrEmail(event.target.value)}
            required
          />
          <label htmlFor="signin-password">Password</label>
          <input
            id="signin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleSignup}>
          <h2>Create account</h2>
          <label htmlFor="signup-username">Username</label>
          <input
            id="signup-username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
      )}

      {error && <p className="auth-error">{error}</p>}
      {message && <p className="auth-message">{message}</p>}
    </section>
  )
}

export default AuthPage
