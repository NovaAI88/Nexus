function ViewToggle({ options, activeView, onChange }) {
  return (
    <div className="view-toggle">
      {options.map((option) => (
        <button
          key={option.id}
          className={activeView === option.id ? 'view-toggle-button active' : 'view-toggle-button'}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default ViewToggle;
