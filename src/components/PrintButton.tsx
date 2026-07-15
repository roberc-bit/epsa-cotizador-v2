'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        background: '#003087', color: '#fff', border: 'none',
        padding: '10px 20px', borderRadius: 8,
        fontSize: '.9rem', fontWeight: 600, cursor: 'pointer'
      }}
    >
      ⬇️ Descargar PDF
    </button>
  )
}
