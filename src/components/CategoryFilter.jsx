import './CategoryFilter.css'

function CategoryFilter({ categories, activeCategory, onCategoryChange }) {
  return (
    <div className="category-row">
      {categories.map((category) => (
        <button
          key={category}
          className={`category-chip ${activeCategory === category ? 'active' : ''}`}
          onClick={() => onCategoryChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  )
}

export default CategoryFilter
