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

const softwareData = [
  {
    id: 1,
    name: 'PixelForge Studio',
    icon: '🎨',
    category: 'Design',
    platforms: ['Windows', 'macOS'],
    rating: 4.8,
    downloads: '1.4M',
    price: 'Free',
    badge: 'Editor Choice',
  },
  {
    id: 2,
    name: 'ShieldWave Antivirus',
    icon: '🛡️',
    category: 'Security',
    platforms: ['Windows', 'Android'],
    rating: 4.6,
    downloads: '3.9M',
    price: 'Freemium',
    badge: 'Trending',
  },
  {
    id: 3,
    name: 'TaskOrbit Pro',
    icon: '✅',
    category: 'Productivity',
    platforms: ['Windows', 'macOS', 'Android'],
    rating: 4.5,
    downloads: '980K',
    price: '$9.99',
    badge: 'Top Rated',
  },
  {
    id: 4,
    name: 'DevDock IDE',
    icon: '💻',
    category: 'Developer Tools',
    platforms: ['Windows', 'Linux', 'macOS'],
    rating: 4.9,
    downloads: '2.1M',
    price: 'Free',
    badge: 'Hot',
  },
  {
    id: 5,
    name: 'TuneCast Music',
    icon: '🎵',
    category: 'Multimedia',
    platforms: ['Android', 'iOS', 'Windows'],
    rating: 4.3,
    downloads: '6.8M',
    price: 'Free',
    badge: 'Popular',
  },
  {
    id: 6,
    name: 'CloudKeep Backup',
    icon: '☁️',
    category: 'Utilities',
    platforms: ['Windows', 'macOS'],
    rating: 4.4,
    downloads: '710K',
    price: '$4.99',
    badge: 'Reliable',
  },
  {
    id: 7,
    name: 'QuickLearn AI',
    icon: '🧠',
    category: 'Education',
    platforms: ['Android', 'iOS'],
    rating: 4.7,
    downloads: '2.9M',
    price: 'Freemium',
    badge: 'New',
  },
  {
    id: 8,
    name: 'FrameCut Video',
    icon: '🎬',
    category: 'Multimedia',
    platforms: ['Windows', 'macOS'],
    rating: 4.2,
    downloads: '1.2M',
    price: 'Free',
    badge: 'Community Pick',
  },
  {
    id: 9,
    name: 'PocketFinance',
    icon: '💰',
    category: 'Productivity',
    platforms: ['Android', 'iOS'],
    rating: 4.5,
    downloads: '4.1M',
    price: 'Free',
    badge: 'Best Mobile',
  },
]

const platformOptions = ['All', 'Windows', 'macOS', 'Linux', 'Android', 'iOS']

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activePlatform, setActivePlatform] = useState('All')
  const [activeCategory, setActiveCategory] = useState('All')
  const [filteredSoftware, setFilteredSoftware] = useState(softwareData)
  const [isDark, setIsDark] = useState(false)

  const categories = ['All', ...new Set(softwareData.map((item) => item.category))]

  useEffect(() => {
    const nextList = softwareData.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesPlatform =
        activePlatform === 'All' || item.platforms.includes(activePlatform)

      const matchesCategory =
        activeCategory === 'All' || item.category === activeCategory

      return matchesSearch && matchesPlatform && matchesCategory
    })

    setFilteredSoftware(nextList)
  }, [searchTerm, activePlatform, activeCategory])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

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
