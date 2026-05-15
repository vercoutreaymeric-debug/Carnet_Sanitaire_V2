'use client'
import Card from '@/components/Card'
import Icon from '@/components/Icon'
import { useLang } from '@/contexts/LangContext'
import { T, t } from '@/lib/translations'

interface Log {
  id: number
  action: string
  module: string
  detail: string
  createdAt: string
}

const actionColor: Record<string, string> = {
  CREATE: 'var(--green)',
  UPDATE: 'var(--accent)',
  DELETE: 'var(--red)',
  RESTORE: 'var(--orange)',
}

const moduleIcon: Record<string, React.ReactNode> = {
  releve:        <Icon name="water" size={13} />,
  intervention:  <Icon name="wrench" size={13} />,
  bassin:        <Icon name="pool" size={13} />,
  frequentation: <Icon name="people" size={13} />,
  contact:       <Icon name="phone" size={13} />,
  backup:        <Icon name="download" size={13} />,
}

export default function HistoriqueClient({ logs }: { logs: Log[] }) {
  const { lang } = useLang()
  const h = T.historique

  function actionLabel(a: string) {
    if (a === 'CREATE')  return t(h.create,  lang)
    if (a === 'UPDATE')  return t(h.update,  lang)
    if (a === 'DELETE')  return t(h.deleteA, lang)
    if (a === 'RESTORE') return t(h.restore, lang)
    return a
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{t(h.title, lang)}</h2>
          <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 13 }}>{t(h.subtitle, lang)}</p>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{logs.length} entrée(s)</span>
      </div>

      {logs.length === 0 ? (
        <Card>
          <div className="empty-state">
            <Icon name="calendar" size={32} color="var(--text3)" />
            <p>{t(h.noLog, lang)}</p>
          </div>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t(h.date, lang)}</th>
                  <th>{t(h.action, lang)}</th>
                  <th>{t(h.module, lang)}</th>
                  <th>{t(h.detail, lang)}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const color = actionColor[log.action] ?? 'var(--text2)'
                  const dt = new Date(log.createdAt)
                  return (
                    <tr key={log.id}>
                      <td style={{ fontFamily: 'DM Mono', fontSize: 12, whiteSpace: 'nowrap', color: 'var(--text2)' }}>
                        {dt.toLocaleDateString('fr-FR')} {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <span style={{
                          fontSize: 11, fontWeight: 700, background: color + '22',
                          color, borderRadius: 6, padding: '3px 10px',
                        }}>
                          {actionLabel(log.action)}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text2)', fontSize: 13 }}>
                          {moduleIcon[log.module] ?? <Icon name="info" size={13} />}
                          {log.module}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text)', maxWidth: 400 }}>{log.detail}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
