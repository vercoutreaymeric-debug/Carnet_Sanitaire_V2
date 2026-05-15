import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #00c4ff 0%, #0077aa 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Logo / En-tête */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #00c4ff, #0099d6)',
            borderRadius: 16,
            boxShadow: '0 4px 16px #00aeef44',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logo-cifec-transparent.png"
              alt="CIFEC"
              style={{ height: 44, width: 'auto', filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0e4f6e', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Carnet Sanitaire
          </h1>
          <p style={{ fontSize: 13, color: '#4aaace' }}>CIFEC — Accès sécurisé</p>
        </div>

        <LoginForm />

        <p style={{ textAlign: 'center', fontSize: 11, color: '#aaa', marginTop: 24 }}>
          Arrêté du 26 mai 2021 — NOR:SSAP2004757A
        </p>
      </div>
    </div>
  )
}
