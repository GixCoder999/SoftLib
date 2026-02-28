import './HeroSection.css'

function HeroSection({ softwareCount }) {
  return (
    <section className="hero">
      <p className="eyebrow">SOFTLIB MARKETPLACE</p>
      <h1>Download trusted software for PC and mobile in one place</h1>
      <p className="hero-text">
        Explore utilities, developer tools, multimedia apps, and productivity software.
        Compare ratings, platforms, and popularity before you install.
      </p>

      <div className="hero-stats">
        <article>
          <strong>{softwareCount}+</strong>
          <span>Curated Apps</span>
        </article>
        <article>
          <strong>200K+</strong>
          <span>Daily Visitors</span>
        </article>
        <article>
          <strong>95%</strong>
          <span>Verified Files</span>
        </article>
      </div>
    </section>
  )
}

export default HeroSection
