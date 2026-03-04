import './Footer.css'

function Footer({ onSubmitClick, onPrivacyClick, onSupportClick }) {
  return (
    <footer className="footer">
      <p>SoftLib © 2026</p>
      <div>
        <button type="button" className="footer-linkish" onClick={onSubmitClick}>
          Submit Software
        </button>
        <button type="button" className="footer-linkish" onClick={onPrivacyClick}>
          Privacy
        </button>
        <button type="button" className="footer-linkish" onClick={onSupportClick}>
          Support
        </button>
      </div>
    </footer>
  )
}

export default Footer
