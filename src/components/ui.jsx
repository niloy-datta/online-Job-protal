function joinClasses(...tokens) {
  return tokens.filter(Boolean).join(' ')
}

export function PageHeading({ eyebrow, title, description, className = '' }) {
  return (
    <div className={joinClasses('space-y-3', className)}>
      {eyebrow && <p className="ui-eyebrow">{eyebrow}</p>}
      <h1 className="ui-title">{title}</h1>
      {description && <p className="ui-copy max-w-3xl">{description}</p>}
    </div>
  )
}

export function CardPanel({ children, className = '' }) {
  return <article className={joinClasses('ui-card-panel', className)}>{children}</article>
}

export function MetricPill({ label, value }) {
  return (
    <div className="ui-metric-pill">
      <p className="text-sm font-semibold text-emerald-700">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
