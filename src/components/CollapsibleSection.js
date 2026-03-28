import { useState } from 'react';

function CollapsibleSection({ title, defaultOpen = false, badge, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`collapsible-section${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="collapsible-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="collapsible-title">{title}</span>
        {badge && <span className="collapsible-badge">{badge}</span>}
        <span className="collapsible-chevron">{open ? '▾' : '▸'}</span>
      </button>
      <div className="collapsible-body" style={{ display: open ? 'block' : 'none' }}>
        {children}
      </div>
    </div>
  );
}

export default CollapsibleSection;
