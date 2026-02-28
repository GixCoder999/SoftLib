import './Header.css'

function Header({ searchTerm, onSearchChange, isDark, onToggleTheme }) {
  return (
    <header className="topbar">
      <div className="brand-block">
        <span className="brand-mark">SoftLib</span>
        <p className="brand-subtitle">Public software collection for mobile and desktop</p>
      </div>

      <div className="search-area">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search software, categories, and tools..."
        />
      </div>

      <div className="header-actions">
        <nav className="quick-nav">
          <a href="#">Latest</a>
          <a href="#">Top Charts</a>
          <a href="#">Categories</a>
        </nav>
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}

export default Header
