import './Header.css'

function Header({
  searchTerm,
  onSearchChange,
  isDark,
  onToggleTheme,
  hideSearch,
  onAuthClick,
  onLogoutClick,
  onSubmitClick,
  onHomeClick,
  onBrandClick,
  isAuthenticated,
}) {
  return (
    <header className="topbar">
      <div className="brand-block">
        <button type="button" className="brand-mark brand-button" onClick={onBrandClick}>
          SoftLib
        </button>
        <p className="brand-subtitle">Public software collection for mobile and desktop</p>
      </div>

      <div className="search-area">
        {!hideSearch && (
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search software, categories, and tools..."
          />
        )}
      </div>

      <div className="header-actions">
        <nav className="quick-nav">
          <button type="button" className="linkish" onClick={onHomeClick}>
            Home
          </button>
          <button type="button" className="linkish" onClick={onSubmitClick}>
            Submit
          </button>
          {isAuthenticated ? (
            <button type="button" className="linkish" onClick={onLogoutClick}>
              Logout
            </button>
          ) : (
            <button type="button" className="linkish" onClick={onAuthClick}>
              Sign In / Up
            </button>
          )}
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
