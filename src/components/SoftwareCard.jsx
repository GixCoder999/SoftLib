import './SoftwareCard.css'

function SoftwareCard({ item, onView }) {
  const platforms = Array.isArray(item.platforms) ? item.platforms : []
  const rating = Number.isFinite(item.review) ? item.review : 0
  const downloads = Number.isFinite(item.downloads) ? item.downloads : 0

  return (
    <article className="software-card">
      <div className="card-top">
        <span className="software-icon" aria-hidden="true">
          {item.icon || '📦'}
        </span>
        <span className="card-badge">{item.badge}</span>
      </div>
      <h3>{item.name}</h3>
      <p>{item.category || 'Uncategorized'}</p>

      <div className="meta-row">
        <span>⭐ {rating.toFixed(1)}/5</span>
        <span>{downloads} downloads</span>
      </div>

      <div className="platform-row">
        {platforms.map((platform) => (
          <small key={platform}>{platform}</small>
        ))}
      </div>

      <div className="card-footer">
        <strong>{item.isPremium ? 'Premium' : 'Free'}</strong>
        <button type="button" onClick={() => onView?.(item._id || item.id)}>
          View
        </button>
      </div>
    </article>
  )
}

export default SoftwareCard
