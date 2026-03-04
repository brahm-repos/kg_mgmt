import React from 'react'

const steps = [
  { id: 1, label: 'Upload files' },
  { id: 2, label: 'Map columns to ontology' },
  { id: 3, label: 'Generate code & mapping' },
]

export function Stepper({ currentStep }) {
  return (
    <nav style={{ marginBottom: '1.5rem' }}>
      <ol style={{ display: 'flex', gap: '1rem', listStyle: 'none', padding: 0, margin: 0, flexWrap: 'wrap' }}>
        {steps.map((step, i) => {
          const isActive = step.id === currentStep
          const isPast = step.id < currentStep
          return (
            <li
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#0f172a' : isPast ? '#475569' : '#94a3b8',
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: isActive ? '#3b82f6' : isPast ? '#22c55e' : '#e2e8f0',
                  color: isPast && !isActive ? '#fff' : isActive ? '#fff' : '#64748b',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                }}
              >
                {isPast ? '✓' : step.id}
              </span>
              <span>Step {step.id}: {step.label}</span>
              {i < steps.length - 1 && (
                <span style={{ color: '#e2e8f0', marginLeft: '0.25rem' }}>→</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
