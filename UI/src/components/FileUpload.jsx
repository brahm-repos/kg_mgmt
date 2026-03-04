import React, { useRef, useState } from 'react'

const allowedDataTypes = ['.csv', '.xlsx', '.xls']
const allowedOntologyTypes = ['.rdf', '.owl', '.ttl', '.xml', '.json', '.jsonld', '.n3', '.nt']

export function FileUpload({ onUpload, loading, error }) {
  const dataInputRef = useRef(null)
  const ontologyInputRef = useRef(null)
  const [dataFile, setDataFile] = useState(null)
  const [ontologyFile, setOntologyFile] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!dataFile || !ontologyFile) return
    const formData = new FormData()
    formData.append('data_file', dataFile)
    formData.append('ontology_file', ontologyFile)
    onUpload(formData, {
      dataFileName: dataFile.name,
      ontologyFileName: ontologyFile.name,
    })
  }

  const canSubmit = dataFile && ontologyFile && !loading

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ padding: '0.75rem', background: '#fef2f2', color: '#dc2626', borderRadius: 6, marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 420 }}>
        <label style={{ fontWeight: 500 }}>
          Data file (CSV or Excel)
        </label>
        <input
          ref={dataInputRef}
          type="file"
          accept={allowedDataTypes.join(',')}
          onChange={(e) => setDataFile(e.target.files?.[0] || null)}
        />
        {dataFile && <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{dataFile.name}</span>}

        <label style={{ fontWeight: 500 }}>
          Ontology file
        </label>
        <input
          ref={ontologyInputRef}
          type="file"
          accept={allowedOntologyTypes.join(',')}
          onChange={(e) => setOntologyFile(e.target.files?.[0] || null)}
        />
        {ontologyFile && <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{ontologyFile.name}</span>}
      </div>
      <button
        type="submit"
        disabled={!canSubmit}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          background: canSubmit ? '#3b82f6' : '#94a3b8',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          fontWeight: 500,
        }}
      >
        {loading ? 'Uploading…' : 'Upload and continue to mapping'}
      </button>
    </form>
  )
}
