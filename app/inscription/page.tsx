'use client'
import { useState } from 'react'
import Image from 'next/image'

const PLANS = [
  {
    id: 'Starter',
    label: 'Starter',
    price: '29€/mois',
    color: '#0097A7',
    features: ['Jusqu\'à 5 bassins', 'Jusqu\'à 10 utilisateurs', 'Relevés journaliers', 'Export PDF'],
  },
  {
    id: 'Pro',
    label: 'Pro',
    price: '59€/mois',
    color: '#285E89',
    features: ['Jusqu\'à 15 bassins', 'Jusqu\'à 30 utilisateurs', 'Statistiques avancées', 'Notifications email'],
    popular: true,
  },
  {
    id: 'Intégral',
    label: 'Intégral',
    price: '99€/mois',
    color: '#1A4568',
    features: ['Bassins illimités', 'Utilisateurs illimités', 'Toutes fonctionnalités', 'Support prioritaire'],
  },
]

export default function InscriptionPage() {
  const [plan, setPlan]       = useState('Starter')
  const [step, setStep]       = useState<'form' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [result, setResult]   = useState<{ username: string; plan: string; essaiJusquau: string; nom: string } | null>(null)

  const [form, setForm] = useState({
    nomEtablissement: '', adresse: '', telephone: '',
    nomContact: '', email: '',
    username: '', password: '',
  })

  function f(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(v => ({ ...v, [field]: e.target.value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan }),
      })
      const data = await r.json()
      if (!r.ok) { setError(data.error || 'Erreur'); setLoading(false); return }
      setResult(data)
      setStep('success')
    } catch { setError('Erreur réseau. Vérifiez votre connexion.') }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid #D1D9E0', background: '#fff',
    fontSize: 14, color: '#1a1a2e', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
  }

  if (step === 'success' && result) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1A4568 0%, #285E89 50%, #0097A7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 48, maxWidth: 500, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A4568', marginBottom: 8 }}>Votre espace est prêt !</h1>
        <p style={{ color: '#666', marginBottom: 32 }}>Bienvenue sur le Carnet Sanitaire Numérique CIFEC</p>

        <div style={{ background: '#F4F6F8', borderRadius: 12, padding: 24, marginBottom: 24, textAlign: 'left' }}>
          <p style={{ fontWeight: 700, color: '#1A4568', marginBottom: 16, fontSize: 15 }}>🔑 Vos identifiants de connexion</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#666' }}>Établissement</span>
              <strong style={{ color: '#1A4568' }}>{result.nom}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#666' }}>Identifiant</span>
              <code style={{ background: '#1A456818', padding: '3px 10px', borderRadius: 6, fontWeight: 700, color: '#1A4568', fontSize: 14 }}>{result.username}</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#666' }}>Mot de passe</span>
              <span style={{ color: '#666', fontSize: 13 }}>Celui que vous avez choisi</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#666' }}>Plan</span>
              <span style={{ background: '#0097A718', color: '#0097A7', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{result.plan} — Essai gratuit</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#666' }}>Essai valable jusqu\'au</span>
              <strong style={{ color: '#10b981' }}>{result.essaiJusquau}</strong>
            </div>
          </div>
        </div>

        <a href="/login" style={{
          display: 'block', background: 'linear-gradient(135deg, #1A4568, #0097A7)',
          color: '#fff', padding: '14px 24px', borderRadius: 12,
          textDecoration: 'none', fontWeight: 700, fontSize: 16,
          boxShadow: '0 4px 15px rgba(0,151,167,0.4)',
        }}>
          → Se connecter maintenant
        </a>
        <p style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
          Gardez précieusement ces identifiants.<br />Un email de confirmation vous a été envoyé.
        </p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F8', fontFamily: 'Arial, sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1A4568, #285E89)', padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 16px' }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 20, letterSpacing: '0.05em' }}>CIFEC</span>
        </div>
        <div>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Carnet Sanitaire Numérique</p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Conforme à l'arrêté du 26 mai 2021</p>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>

        {/* Titre */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1A4568', marginBottom: 8 }}>
            Créez votre carnet sanitaire
          </h1>
          <p style={{ color: '#666', fontSize: 16 }}>
            Essai gratuit 30 jours — Aucune carte bancaire requise
          </p>
        </div>

        {/* Choix du plan */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontWeight: 700, color: '#1A4568', marginBottom: 16, fontSize: 15 }}>1. Choisissez votre plan</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {PLANS.map(p => (
              <div key={p.id} onClick={() => setPlan(p.id)} style={{
                border: `2px solid ${plan === p.id ? p.color : '#D1D9E0'}`,
                borderRadius: 14, padding: 20, cursor: 'pointer', background: '#fff',
                position: 'relative', transition: 'all 0.2s',
                boxShadow: plan === p.id ? `0 4px 20px ${p.color}33` : 'none',
                transform: plan === p.id ? 'translateY(-2px)' : 'none',
              }}>
                {p.popular && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: p.color, color: '#fff', padding: '3px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    ⭐ Le plus populaire
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 18, color: p.color }}>{p.label}</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: '#1A4568', marginTop: 4 }}>{p.price}</p>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${plan === p.id ? p.color : '#ccc'}`, background: plan === p.id ? p.color : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {plan === p.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: p.color, fontWeight: 700 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={submit}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }}>
            <p style={{ fontWeight: 700, color: '#1A4568', marginBottom: 20, fontSize: 15 }}>2. Votre établissement</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 6, fontWeight: 600 }}>Nom de la piscine / établissement *</label>
                <input style={inp} required value={form.nomEtablissement} onChange={f('nomEtablissement')} placeholder="Piscine municipale de..." />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 6, fontWeight: 600 }}>Adresse</label>
                <input style={inp} value={form.adresse} onChange={f('adresse')} placeholder="1 rue des Sports, 75001 Paris" />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 6, fontWeight: 600 }}>Téléphone</label>
                <input style={inp} value={form.telephone} onChange={f('telephone')} placeholder="01 23 45 67 89" />
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }}>
            <p style={{ fontWeight: 700, color: '#1A4568', marginBottom: 20, fontSize: 15 }}>3. Votre compte</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 6, fontWeight: 600 }}>Votre nom complet *</label>
                <input style={inp} required value={form.nomContact} onChange={f('nomContact')} placeholder="Jean Dupont" />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 6, fontWeight: 600 }}>Email *</label>
                <input style={inp} required type="email" value={form.email} onChange={f('email')} placeholder="jean@mairie.fr" />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 6, fontWeight: 600 }}>Identifiant de connexion *</label>
                <input style={inp} required value={form.username} onChange={f('username')} placeholder="jean.dupont" autoComplete="username" />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 6, fontWeight: 600 }}>Mot de passe * (min. 6 caractères)</label>
                <input style={inp} required type="password" value={form.password} onChange={f('password')} placeholder="••••••••" autoComplete="new-password" />
              </div>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: 14 }}>
              ❌ {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '16px 24px', borderRadius: 12, border: 'none',
            background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #1A4568, #0097A7)',
            color: '#fff', fontSize: 17, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(0,151,167,0.4)',
            transition: 'all 0.2s',
          }}>
            {loading ? '⏳ Création en cours...' : `🚀 Créer mon espace gratuit — Plan ${plan}`}
          </button>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#999' }}>
            Essai 30 jours gratuit · Aucune CB requise · Résiliable à tout moment
          </p>
          <p style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#bbb' }}>
            Déjà un compte ? <a href="/login" style={{ color: '#0097A7', fontWeight: 600, textDecoration: 'none' }}>Se connecter →</a>
          </p>
        </form>

      </div>
    </div>
  )
}
