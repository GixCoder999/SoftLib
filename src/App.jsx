import { useEffect, useState } from 'react'
import './App.css'
import Header from './components/Header'
import HeroSection from './components/HeroSection'
import CategoryFilter from './components/CategoryFilter'
import SoftwareGrid from './components/SoftwareGrid'
import Footer from './components/Footer'

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

const platformOptions = ['All', 'Windows', 'macOS', 'Linux', 'Android', 'iOS']

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activePlatform, setActivePlatform] = useState('All')
  const [activeCategory, setActiveCategory] = useState('All')
  const [isDark, setIsDark] = useState(false)
  const [softwareData, setSoftwareData] = useState([]);
  const [filteredSoftware, setFilteredSoftware] = useState([]);

  const categories = ['All', ...new Set(softwareData.map((item) => item.category))]

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
        const response = await fetch('http://localhost:5000/software')
        const data = await response.json()
        const normalizedData = data.map((item) => ({
          ...item,
          category: item.category ?? 'Uncategorized',
          platforms: Array.isArray(item.platforms) ? item.platforms : [],
        }))
        console.log('Fetched software:', normalizedData)
        setSoftwareData(normalizedData)
      } catch (error) {
        console.error('Error fetching software:', error)
      }
    }

    fetchSoftware()
  },[]);

  return (
    <div className="app-shell">
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isDark={isDark}
        onToggleTheme={() => setIsDark((previous) => !previous)}
      />
      <main className="content-wrap">
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

          <SoftwareGrid items={filteredSoftware} />
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default App
