import { useCallback, useEffect, useState } from 'react'
import './App.css'
import Header from './components/Header'
import HeroSection from './components/HeroSection'
import CategoryFilter from './components/CategoryFilter'
import SoftwareGrid from './components/SoftwareGrid'
import Footer from './components/Footer'
import AuthPage from './components/AuthPage'
import SoftwareDetailsPage from './components/SoftwareDetailsPage'
import SubmitSoftwarePage from './components/SubmitSoftwarePage'
import AdminReviewPage from './components/AdminReviewPage'
import PrivacyPage from './components/PrivacyPage'
import SupportPage from './components/SupportPage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:5000'
const platformOptions = ['All', 'Windows', 'macOS', 'Linux', 'Android', 'iOS']

function App() {
  const [routePath, setRoutePath] = useState(window.location.pathname)
  const [searchTerm, setSearchTerm] = useState('')
  const [activePlatform, setActivePlatform] = useState('All')
  const [activeCategory, setActiveCategory] = useState('All')
  const [isDark, setIsDark] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [softwareData, setSoftwareData] = useState([])
  const [filteredSoftware, setFilteredSoftware] = useState([])

  const categories = ['All', ...new Set(softwareData.map((item) => item.category))]

  const navigateTo = (path) => {
    if (window.location.pathname === path) {
      return
    }
    window.history.pushState({}, '', path)
    setRoutePath(path)
  }

  useEffect(() => {
    const handlePopState = () => {
      setRoutePath(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const nextList = softwareData.filter((item) => {
      const itemName = item.name ?? ''
      const itemCategory = item.category ?? ''
      const itemPlatforms = Array.isArray(item.platforms) ? item.platforms : []

      const matchesSearch =
        itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itemCategory.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesPlatform =
        activePlatform === 'All' || itemPlatforms.includes(activePlatform)

      const matchesCategory =
        activeCategory === 'All' || itemCategory === activeCategory

      return matchesSearch && matchesPlatform && matchesCategory
    })

    setFilteredSoftware(nextList)
  }, [softwareData, searchTerm, activePlatform, activeCategory])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const syncAuthState = useCallback(async () => {
    try {
      const authResponse = await fetch(`${API_BASE_URL}/auth/status`, {
        credentials: 'include',
      })
      if (!authResponse.ok) {
        setIsAuthenticated(false)
        setIsAdmin(false)
        return
      }

      setIsAuthenticated(true)
      const adminResponse = await fetch(`${API_BASE_URL}/auth/admin-status`, {
        credentials: 'include',
      })

      if (!adminResponse.ok) {
        setIsAdmin(false)
        return
      }

      const adminData = await adminResponse.json()
      setIsAdmin(Boolean(adminData?.isAdmin))
    } catch (error) {
      setIsAuthenticated(false)
      setIsAdmin(false)
    } finally {
      setAuthChecked(true)
    }
  }, [])

  useEffect(() => {
    syncAuthState()
  }, [syncAuthState])

  useEffect(() => {
    const fetchSoftware = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/software`)
        const data = await response.json()
        const normalizedData = data.map((item) => ({
          ...item,
          category: item.category ?? 'Uncategorized',
          platforms: Array.isArray(item.platforms) ? item.platforms : [],
          review: Number.isFinite(item.review) ? item.review : 0,
          downloads: Number.isFinite(item.downloads) ? item.downloads : 0,
        }))
        console.log('Fetched software:', normalizedData)
        setSoftwareData(normalizedData)
      } catch (error) {
        console.error('Error fetching software:', error)
      }
    }

    fetchSoftware()
  }, [])

  const softwareDetailsMatch = routePath.match(/^\/software\/([^/]+)$/)
  const softwareIdFromRoute = softwareDetailsMatch?.[1]

  const isHomeRoute = routePath === '/'
  const isAuthRoute = routePath === '/auth'
  const isSubmitRoute = routePath === '/submit'
  const isAdminReviewRoute = routePath === '/admin/review'
  const isPrivacyRoute = routePath === '/privacy'
  const isSupportRoute = routePath === '/support'
  const isSoftwareDetailsRoute = Boolean(softwareIdFromRoute)
  const navigateToSubmit = () => {
    if (!isAuthenticated) {
      navigateTo('/auth')
      return
    }
    navigateTo('/submit')
  }

  const navigateToAdminReview = () => {
    if (!isAdmin) {
      navigateTo('/')
      return
    }
    navigateTo('/admin/review')
  }

  useEffect(() => {
    if (!authChecked) {
      return
    }
    if (routePath === '/submit' && !isAuthenticated) {
      navigateTo('/auth')
    }
    if (routePath === '/admin/review' && !isAdmin) {
      navigateTo('/')
    }
  }, [authChecked, routePath, isAuthenticated, isAdmin])

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Error logging out:', error)
    } finally {
      setIsAuthenticated(false)
      setIsAdmin(false)
      navigateTo('/')
    }
  }

  return (
    <div className="app-shell">
      <Header
        onBrandClick={() => navigateTo('/')}
        onAuthClick={() => navigateTo('/auth')}
        onLogoutClick={handleLogout}
        onSubmitClick={navigateToSubmit}
        onHomeClick={() => navigateTo('/')}
        hideSearch={!isHomeRoute}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isDark={isDark}
        isAuthenticated={isAuthenticated}
        onToggleTheme={() => setIsDark((previous) => !previous)}
      />
      <main className="content-wrap">
        {isHomeRoute && (
          <>
            <HeroSection softwareCount={softwareData.length} />

            <section className="discovery-panel">
              <div className="filter-row">
                <div className="filter-title-row">
                  <h2>Discover Software</h2>
                  {isAdmin && (
                    <button type="button" className="admin-review-btn" onClick={navigateToAdminReview}>
                      Review Software
                    </button>
                  )}
                </div>
                <div className="platform-filters">
                  {platformOptions.map((platform) => (
                    <button
                      key={platform}
                      className={`platform-chip ${
                        activePlatform === platform ? 'active' : ''
                      }`}
                      onClick={() => setActivePlatform(platform)}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              <CategoryFilter
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />

              <SoftwareGrid
                items={filteredSoftware}
                onView={(itemId) => navigateTo(`/software/${itemId}`)}
              />
            </section>
          </>
        )}

        {isAuthRoute && (
          <AuthPage
            apiBaseUrl={API_BASE_URL}
            onSuccess={() => {
              syncAuthState()
              navigateTo('/')
            }}
          />
        )}

        {isSubmitRoute && isAuthenticated && (
          <SubmitSoftwarePage
            apiBaseUrl={API_BASE_URL}
            onBack={() => navigateTo('/')}
          />
        )}

        {isAdminReviewRoute && isAdmin && (
          <AdminReviewPage apiBaseUrl={API_BASE_URL} onBack={() => navigateTo('/')} />
        )}

        {isPrivacyRoute && <PrivacyPage />}

        {isSupportRoute && <SupportPage />}

        {isSoftwareDetailsRoute && (
          <SoftwareDetailsPage
            apiBaseUrl={API_BASE_URL}
            softwareId={softwareIdFromRoute}
            isAuthenticated={isAuthenticated}
            onRequireAuth={() => navigateTo('/auth')}
            onAuthInvalid={() => {
              setIsAuthenticated(false)
              setIsAdmin(false)
            }}
            onBack={() => navigateTo('/')}
          />
        )}
      </main>
      <Footer
        onSubmitClick={navigateToSubmit}
        onPrivacyClick={() => navigateTo('/privacy')}
        onSupportClick={() => navigateTo('/support')}
      />
    </div>
  )
}

export default App
