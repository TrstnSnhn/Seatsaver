import styles from './FilterBar.module.css'

// Controlled by EventsPage, which owns the filters and refetches when they change.
export default function FilterBar({ orgs, filters, onChange, onClear }) {
  const set = (field) => (event) => onChange({ ...filters, [field]: event.target.value })
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <form className={styles.bar} role="search" onSubmit={(event) => event.preventDefault()}>
      <div className={`${styles.field} ${styles.org}`}>
        <label htmlFor="filter-org">Org</label>
        <select id="filter-org" value={filters.orgId} onChange={set('orgId')}>
          <option value="">All orgs</option>
          {orgs.map((org) => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="filter-from">From</label>
        <input id="filter-from" type="date" value={filters.from} onChange={set('from')} />
      </div>
      <div className={styles.field}>
        <label htmlFor="filter-to">To</label>
        <input id="filter-to" type="date" value={filters.to} min={filters.from || undefined} onChange={set('to')} />
      </div>
      <div className={`${styles.field} ${styles.search}`}>
        <label htmlFor="filter-q">Search events</label>
        <input id="filter-q" type="search" value={filters.q} onChange={set('q')} autoComplete="off" />
      </div>
      {hasFilters && (
        <button type="button" className={styles.clear} onClick={onClear}>Clear filters</button>
      )}
    </form>
  )
}
