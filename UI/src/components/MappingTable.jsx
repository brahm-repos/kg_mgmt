import React from 'react'

const MAPPING_TYPES = [
  { value: 'entity', label: 'Entity' },
  { value: 'property', label: 'Property' },
  { value: 'object_property', label: 'Object property' },
]

export function MappingTable({ mapping, onChange, readOnly }) {
  if (!mapping?.length) return <p style={{ color: '#64748b' }}>No mapping rows. Run suggestion from Step 1 first.</p>

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem', fontWeight: 600 }}>Column</th>
            <th style={{ padding: '0.75rem', fontWeight: 600 }}>Mapping type</th>
            <th style={{ padding: '0.75rem', fontWeight: 600 }}>Ontology term</th>
          </tr>
        </thead>
        <tbody>
          {mapping.map((row, i) => (
            <tr key={row.column} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.75rem' }}>{row.column}</td>
              <td style={{ padding: '0.75rem' }}>
                {readOnly ? (
                  row.mapping_type
                ) : (
                  <select
                    value={row.mapping_type || 'property'}
                    onChange={(e) => {
                      const next = [...mapping]
                      next[i] = { ...next[i], mapping_type: e.target.value }
                      onChange(next)
                    }}
                    style={{ padding: '0.35rem 0.5rem', borderRadius: 4, border: '1px solid #cbd5e1', minWidth: 140 }}
                  >
                    {MAPPING_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
              </td>
              <td style={{ padding: '0.75rem' }}>
                {readOnly ? (
                  row.ontology_term
                ) : (
                  <input
                    type="text"
                    value={row.ontology_term || ''}
                    onChange={(e) => {
                      const next = [...mapping]
                      next[i] = { ...next[i], ontology_term: e.target.value }
                      onChange(next)
                    }}
                    placeholder="e.g. http://schema.org/name"
                    style={{
                      width: '100%',
                      maxWidth: 320,
                      padding: '0.35rem 0.5rem',
                      borderRadius: 4,
                      border: '1px solid #cbd5e1',
                    }}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
