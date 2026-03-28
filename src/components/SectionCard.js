function SectionCard({ title, children, variant = 'default' }) {
  const variantClass = variant === 'primary'
    ? 'section-card-primary'
    : variant === 'muted'
    ? 'section-card-muted'
    : '';

  const className = ['section-card', variantClass].filter(Boolean).join(' ');

  return (
    <section className={className}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default SectionCard;
