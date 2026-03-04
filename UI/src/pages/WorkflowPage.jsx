import React, { useState, useCallback } from 'react'
import { Stepper } from '../components/Stepper'
import { FileUpload } from '../components/FileUpload'
import { MappingTable } from '../components/MappingTable'

const API_BASE = '/api'
const TABS = [
  { id: 'configure', label: 'Configure' },
  { id: 'deploy', label: 'Deploy' },
]

export function WorkflowPage() {
  const [activeTab, setActiveTab] = useState('configure')
  const [step, setStep] = useState(1)
  const [uploadId, setUploadId] = useState(null)
  const [columns, setColumns] = useState([])
  const [mapping, setMapping] = useState([])
  const [dataFileName, setDataFileName] = useState(null)
  const [ontologyFileName, setOntologyFileName] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [generated, setGenerated] = useState(null)
  const [generateLoading, setGenerateLoading] = useState(false)
  const [previewType, setPreviewType] = useState(null) // 'data' | 'ontology' | null
  const [previewContent, setPreviewContent] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState(null)

  const handleUpload = useCallback(async (formData, meta) => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || res.statusText || 'Upload failed')
      }
      const data = await res.json()
      setUploadId(data.upload_id)
      setColumns(data.columns || [])
      setMapping([])
      setSaveStatus(null)
      setGenerated(null)
      if (meta) {
        setDataFileName(meta.dataFileName || null)
        setOntologyFileName(meta.ontologyFileName || null)
      } else {
        setDataFileName(null)
        setOntologyFileName(null)
      }
      setStep(2)
      // Automatically trigger Gemini suggestion
      setSuggestLoading(true)
      try {
        const suggestRes = await fetch(`${API_BASE}/mapping/suggest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ upload_id: data.upload_id }),
        })
        if (suggestRes.ok) {
          const suggestData = await suggestRes.json()
          setMapping(suggestData.mapping || [])
        }
      } catch (e) {
        setError('Upload OK; suggestion failed: ' + e.message)
      } finally {
        setSuggestLoading(false)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSaveMapping = useCallback(async () => {
    if (!uploadId || !mapping.length) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/mapping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upload_id: uploadId, mapping }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSaveStatus('Saved')
      setTimeout(() => setSaveStatus(null), 2000)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [uploadId, mapping])

  const handleBackToStep1 = useCallback(() => {
    setError(null)
    setStep(1)
  }, [])

  const handleResetUpload = useCallback(() => {
    setUploadId(null)
    setColumns([])
    setMapping([])
    setGenerated(null)
    setSaveStatus(null)
    setError(null)
    setDataFileName(null)
    setOntologyFileName(null)
    setStep(1)
  }, [])

  const handleContinueToStep3 = useCallback(async () => {
    if (!uploadId) return
    setError(null)
    setGenerateLoading(true)
    setGenerated(null)
    try {
      // Save mapping first so backend has it for code generation
      const saveRes = await fetch(`${API_BASE}/mapping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upload_id: uploadId, mapping }),
      })
      if (!saveRes.ok) throw new Error('Failed to save mapping')
      const res = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upload_id: uploadId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || res.statusText || 'Generate failed')
      }
      const data = await res.json()
      setGenerated(data)
      setStep(3)
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerateLoading(false)
    }
  }, [uploadId, mapping, handleSaveMapping])

  const handleOpenPreview = useCallback(
    async (type) => {
      if (!uploadId) return
      setPreviewType(type)
      setPreviewContent('')
      setPreviewError(null)
      setPreviewLoading(true)
      try {
        const res = await fetch(`${API_BASE}/preview/${type === 'data' ? 'data' : 'ontology'}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ upload_id: uploadId }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.detail || res.statusText || 'Preview failed')
        }
        const data = await res.json()
        setPreviewContent(data.content || '')
      } catch (e) {
        setPreviewError(e.message)
      } finally {
        setPreviewLoading(false)
      }
    },
    [uploadId],
  )

  const handleClosePreview = useCallback(() => {
    setPreviewType(null)
    setPreviewContent('')
    setPreviewError(null)
    setPreviewLoading(false)
  }, [])

  return (
    <div>
      {previewType && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 40,
          }}
          onClick={handleClosePreview}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 8,
              maxWidth: '900px',
              width: '90%',
              maxHeight: '80vh',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.3)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1rem', margin: 0 }}>
                  {previewType === 'data' ? 'Data file preview' : 'Ontology preview'}
                </h2>
                <p style={{ margin: 0, marginTop: 2, fontSize: '0.8rem', color: '#64748b' }}>
                  {previewType === 'data'
                    ? dataFileName || 'Uploaded data file'
                    : ontologyFileName || 'Uploaded ontology file'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClosePreview}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  color: '#64748b',
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '0.75rem 1rem', flex: 1, minHeight: 0 }}>
              {previewLoading && (
                <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Loading preview…</p>
              )}
              {previewError && (
                <p style={{ fontSize: '0.9rem', color: '#dc2626' }}>{previewError}</p>
              )}
              {!previewLoading && !previewError && (
                <pre
                  style={{
                    margin: 0,
                    padding: '0.75rem',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    overflow: 'auto',
                    maxHeight: '60vh',
                    whiteSpace: 'pre',
                  }}
                >
                  {previewContent || '(No preview available)'}
                </pre>
              )}
            </div>
            <div
              style={{
                padding: '0.5rem 1rem',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={handleClosePreview}
                style={{
                  padding: '0.35rem 0.9rem',
                  borderRadius: 999,
                  border: 'none',
                  background: '#0f172a',
                  color: '#f9fafb',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Tabs under main nav */}
      <div
        style={{
          marginBottom: '1rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 400,
                background: isActive ? '#0f172a' : '#e2e8f0',
                color: isActive ? '#f9fafb' : '#475569',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'configure' && (
        <>
          <Stepper currentStep={step} />

          {step === 1 && (
            <section>
              <h2 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Step 1: Upload files</h2>
              {uploadId ? (
                <>
                  <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    You already have files uploaded for this session. You can return to mapping, or re-upload if you want to start over with different files.
                  </p>
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      background: '#f1f5f9',
                      borderRadius: 6,
                      marginBottom: '1rem',
                      fontSize: '0.875rem',
                      color: '#0f172a',
                    }}
                  >
                    <div style={{ marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 500 }}>Data file:</span>{' '}
                      <span style={{ color: '#475569' }}>{dataFileName || 'Uploaded data file'}</span>
                      {uploadId && (
                        <button
                          type="button"
                          onClick={() => handleOpenPreview('data')}
                          style={{
                            marginLeft: '0.75rem',
                            border: 'none',
                            background: 'transparent',
                            padding: 0,
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            color: '#3b82f6',
                            textDecoration: 'underline',
                          }}
                        >
                          View file
                        </button>
                      )}
                    </div>
                    <div>
                      <span style={{ fontWeight: 500 }}>Ontology file:</span>{' '}
                      <span style={{ color: '#475569' }}>{ontologyFileName || 'Uploaded ontology file'}</span>
                      {uploadId && (
                        <button
                          type="button"
                          onClick={() => handleOpenPreview('ontology')}
                          style={{
                            marginLeft: '0.75rem',
                            border: 'none',
                            background: 'transparent',
                            padding: 0,
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            color: '#3b82f6',
                            textDecoration: 'underline',
                          }}
                        >
                          View ontology
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      Return to Step 2
                    </button>
                    <button
                      type="button"
                      onClick={handleResetUpload}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#e2e8f0',
                        color: '#0f172a',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      Re-upload different files
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    Upload a data file (CSV or Excel) and an ontology file. Then continue to map columns to the ontology.
                  </p>
                  <FileUpload onUpload={handleUpload} loading={loading} error={error} />
                </>
              )}
            </section>
          )}

          {step === 2 && (
            <section>
              <h2 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Step 2: Map columns to ontology</h2>
              <p style={{ color: '#64748b', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                Review and edit the LLM-suggested mapping. Each column can be an entity, property, or object property. Save and continue to generate code.
              </p>
              {uploadId && (
                <p style={{ color: '#64748b', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: 500 }}>Current files:</span>{' '}
                  <span>{dataFileName || 'data file'}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenPreview('data')}
                    style={{
                      marginLeft: '0.5rem',
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: '#3b82f6',
                      textDecoration: 'underline',
                    }}
                  >
                    View file
                  </button>
                  <span style={{ marginLeft: '0.75rem' }}>{ontologyFileName || 'ontology file'}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenPreview('ontology')}
                    style={{
                      marginLeft: '0.5rem',
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: '#3b82f6',
                      textDecoration: 'underline',
                    }}
                  >
                    View ontology
                  </button>
                </p>
              )}
              {suggestLoading && <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>Getting mapping suggestions from Gemini…</p>}
              {error && (
                <div style={{ padding: '0.75rem', background: '#fef2f2', color: '#dc2626', borderRadius: 6, marginBottom: '1rem' }}>
                  {error}
                </div>
              )}
              <MappingTable mapping={mapping} onChange={setMapping} readOnly={false} />
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleBackToStep1}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#e2e8f0',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Back to Step 1
                </button>
                <button
                  type="button"
                  onClick={handleSaveMapping}
                  disabled={loading || !mapping.length}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#64748b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: loading || !mapping.length ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {loading ? 'Saving…' : 'Save mapping'}
                </button>
                {saveStatus && <span style={{ color: '#16a34a', fontSize: '0.875rem' }}>{saveStatus}</span>}
                <button
                  type="button"
                  onClick={handleContinueToStep3}
                  disabled={generateLoading || !mapping.length}
                  style={{
                    padding: '0.5rem 1rem',
                    background: (generateLoading || !mapping.length) ? '#94a3b8' : '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: (generateLoading || !mapping.length) ? 'not-allowed' : 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {generateLoading ? 'Generating…' : 'Continue to Step 3'}
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section>
              <h2 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Step 3: Generated code and mapping</h2>
              <p style={{ color: '#64748b', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                Python code and intermediate mapping to translate your data file to the ontology.
              </p>
              {uploadId && (
                <p style={{ color: '#64748b', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: 500 }}>Current files:</span>{' '}
                  <span>{dataFileName || 'data file'}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenPreview('data')}
                    style={{
                      marginLeft: '0.5rem',
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: '#3b82f6',
                      textDecoration: 'underline',
                    }}
                  >
                    View file
                  </button>
                  <span style={{ marginLeft: '0.75rem' }}>{ontologyFileName || 'ontology file'}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenPreview('ontology')}
                    style={{
                      marginLeft: '0.5rem',
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: '#3b82f6',
                      textDecoration: 'underline',
                    }}
                  >
                    View ontology
                  </button>
                </p>
              )}
              {generated && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Intermediate mapping</h3>
                    <pre
                      style={{
                        padding: '1rem',
                        background: '#f1f5f9',
                        borderRadius: 6,
                        fontSize: '0.8125rem',
                        overflow: 'auto',
                        maxHeight: 240,
                      }}
                    >
                      {JSON.stringify(generated.intermediate_mapping, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Python code</h3>
                    <pre
                      style={{
                        padding: '1rem',
                        background: '#1e293b',
                        color: '#e2e8f0',
                        borderRadius: 6,
                        fontSize: '0.8125rem',
                        overflow: 'auto',
                        maxHeight: 400,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}
                    >
                      {generated.python_code}
                    </pre>
                  </div>
                </div>
              )}
              <div style={{ marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => { setStep(1); setUploadId(null); setMapping([]); setGenerated(null); setError(null); }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#64748b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Start over
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {activeTab === 'deploy' && (
        <section>
          <h2 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Deploy</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            This tab will hold deployment and runtime configuration for applying the generated mappings and code.
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginTop: '0.75rem' }}>
            For now, use the Configure tab to design and generate your mapping pipeline; deployment wiring can be added here later.
          </p>
        </section>
      )}
    </div>
  )
}
