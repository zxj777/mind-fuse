import type { Investigation } from '@mind-fuse/investigation'
import { CURRENT_INVESTIGATION_SCHEMA_VERSION } from '@mind-fuse/schema'
import styles from './page.module.css'

const investigations: Array<Pick<Investigation, 'id' | 'title' | 'updatedAt'>> = [
  {
    id: 'investigation:render-pipeline' as Investigation['id'],
    title: 'PixiJS v8 render pipeline rollout',
    updatedAt: '2026-04-28T08:40:00.000Z',
  },
  {
    id: 'investigation:ai-boundary' as Investigation['id'],
    title: 'AI suggestion boundary and acceptance model',
    updatedAt: '2026-04-28T07:15:00.000Z',
  },
  {
    id: 'investigation:snapshot-revisit' as Investigation['id'],
    title: 'Snapshot restore and revisit flow',
    updatedAt: '2026-04-27T21:05:00.000Z',
  },
]

const managementSections = [
  'Authentication and OAuth entry points',
  'Investigation list, create, rename, archive, and delete',
  'Organization, members, and permissions',
  'Account, billing, notifications, and settings',
]

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Management surface</span>
          <h1>Mind-Fuse keeps the work surface and the management surface separate.</h1>
          <p>
            This app owns the investigation list, account surface, and operational controls. The
            canvas-native investigation experience now lives in <code>apps/workspace</code>.
          </p>
        </div>
        <div className={styles.heroCard}>
          <div>
            <span className={styles.cardLabel}>Schema version</span>
            <strong>v{CURRENT_INVESTIGATION_SCHEMA_VERSION}</strong>
          </div>
          <div>
            <span className={styles.cardLabel}>Active investigations</span>
            <strong>{investigations.length}</strong>
          </div>
          <div>
            <span className={styles.cardLabel}>Direction</span>
            <strong>Technical investigation workspace</strong>
          </div>
        </div>
      </section>

      <section className={styles.grid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Investigation list</h2>
            <button className={styles.primary}>Create investigation</button>
          </div>
          <div className={styles.list}>
            {investigations.map(investigation => (
              <div key={investigation.id} className={styles.listItem}>
                <div>
                  <strong>{investigation.title}</strong>
                  <span>{investigation.id}</span>
                </div>
                <time>{new Date(investigation.updatedAt).toLocaleString('zh-CN')}</time>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <h2>What stays in `apps/web`</h2>
          <ul className={styles.capabilityList}>
            {managementSections.map(section => (
              <li key={section}>{section}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
