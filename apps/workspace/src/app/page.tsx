import Link from 'next/link'

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
        color: '#e2e8f0',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 720,
          borderRadius: 28,
          padding: 32,
          border: '1px solid rgba(148, 163, 184, 0.2)',
          background: 'rgba(15, 23, 42, 0.8)',
          boxShadow: '0 28px 80px rgba(2, 6, 23, 0.45)',
        }}
      >
        <span style={{ color: '#93c5fd', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Workspace surface
        </span>
        <h1 style={{ margin: '12px 0 14px', fontSize: 'clamp(2rem, 4vw, 3.4rem)', lineHeight: 1.05 }}>
          Open a canvas-native investigation workspace.
        </h1>
        <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.7 }}>
          The actual investigation surface lives at a workspace route. Open the seeded demo workspace to paste captures,
          promote cards, connect evidence, and create snapshots.
        </p>
        <Link
          href="/w/investigation:demo"
          style={{
            display: 'inline-flex',
            marginTop: 24,
            borderRadius: 999,
            background: '#2563eb',
            color: '#eff6ff',
            padding: '14px 18px',
            fontWeight: 700,
          }}
        >
          Open demo workspace
        </Link>
      </div>
    </main>
  )
}
