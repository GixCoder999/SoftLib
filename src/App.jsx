import { useEffect, useState } from 'react'
import './App.css'
import Header from './components/Header'
import HeroSection from './components/HeroSection'
import CategoryFilter from './components/CategoryFilter'
import SoftwareGrid from './components/SoftwareGrid'
import Footer from './components/Footer'
import AuthPage from './components/AuthPage'
import SoftwareDetailsPage from './components/SoftwareDetailsPage'

const TestConnection = async () => {
  try {
    const response = await fetch('http://localhost:5000')
    const data = await response.json()
    console.log('Backend response:', data)
  } catch (error) {
    console.error('Error connecting to backend:', error)
  }
}

TestConnection();

//const softwareData = [];

const API_BASE_URL = 'http://localhost:5000'
const platformOptions = ['All', 'Windows', 'macOS', 'Linux', 'Android', 'iOS']

function App() {
  const [routePath, setRoutePath] = useState(window.location.pathname)
  const [searchTerm, setSearchTerm] = useState('')
  const [activePlatform, setActivePlatform] = useState('All')
  const [activeCategory, setActiveCategory] = useState('All')
  const [isDark, setIsDark] = useState(false)
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
  const isSoftwareDetailsRoute = Boolean(softwareIdFromRoute)

  return (
    <div className="app-shell">
      <Header
        onBrandClick={() => navigateTo('/')}
        onAuthClick={() => navigateTo('/auth')}
        onHomeClick={() => navigateTo('/')}
        hideSearch={!isHomeRoute}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isDark={isDark}
        onToggleTheme={() => setIsDark((previous) => !previous)}
      />
      <main className="content-wrap">
        {isHomeRoute && (
          <>
            <HeroSection softwareCount={softwareData.length} />

            <section className="discovery-panel">
              <div className="filter-row">
                <h2>Discover Software</h2>
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

        {isAuthRoute && <AuthPage apiBaseUrl={API_BASE_URL} onSuccess={() => navigateTo('/')} />}

        {isSoftwareDetailsRoute && (
          <SoftwareDetailsPage
            apiBaseUrl={API_BASE_URL}
            softwareId={softwareIdFromRoute}
            onBack={() => navigateTo('/')}
          />
        )}
      </main>
      <Footer />
    </div>
  )
}

export default App
