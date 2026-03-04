import { Outlet, Link } from 'react-router-dom'

export function Layout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
          Ontology Knowledge Mgmt
        </h1>
        <nav>
          <Link to="/" style={{ marginRight: '1rem', color: '#475569', textDecoration: 'none' }}>Home</Link>
          <Link to="/workflow" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>Workflow</Link>
        </nav>
      </header>
      <main style={{ flex: 1, padding: '1.5rem' }}>
        <Outlet />
      </main>
    </div>
  )
}
