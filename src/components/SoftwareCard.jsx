import './SoftwareCard.css'

function SoftwareCard({ item }) {
  return (
    <article className="software-card">
      <div className="card-top">
        <span className="software-icon" aria-hidden="true">
          {item.icon || '📦'}
        </span>
        <span className="card-badge">{item.badge}</span>
      </div>
      <h3>{item.name}</h3>
      <p>{item.category}</p>

      <div className="meta-row">
        <span>⭐ {item.rating}</span>
        <span>{item.downloads} downloads</span>
      </div>

      <div className="platform-row">
        {item.platforms.map((platform) => (
          <small key={platform}>{platform}</small>
        ))}
      </div>

      <div className="card-footer">
        <strong>{item.price}</strong>
        <button>View</button>
      </div>
    </article>
  )
}

export default SoftwareCard
