import SoftwareCard from './SoftwareCard'
import './SoftwareGrid.css'

function SoftwareGrid({ items }) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h3>No software found</h3>
        <p>Try another keyword, platform, or category.</p>
      </div>
    )
  }

  return (
    <div className="software-grid">
      {items.map((item) => (
        <SoftwareCard key={item._id || item.id || item.name} item={item} />
      ))}
    </div>
  )
}

export default SoftwareGrid
