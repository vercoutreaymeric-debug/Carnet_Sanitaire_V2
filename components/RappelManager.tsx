'use client'
import { useEffect, useRef } from 'react'

export default function RappelManager() {
  const notifiedRef = useRef(false)

  useEffect(() => {
    // Demande de permission notifications au premier chargement
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    function check() {
      if (notifiedRef.current) return
      if (Notification.permission !== 'granted') return

      const heureRappel = localStorage.getItem('rappelHeure') || '10:00'
      const now = new Date()
      const [hh, mm] = heureRappel.split(':').map(Number)
      const rappelMs = hh * 60 * 60 * 1000 + mm * 60 * 1000
      const nowMs = now.getHours() * 60 * 60 * 1000 + now.getMinutes() * 60 * 1000

      if (nowMs < rappelMs) return // Pas encore l'heure

      // Vérifie si un relevé a été saisi aujourd'hui
      const today = now.toISOString().slice(0, 10)
      const lastNotifDate = localStorage.getItem('lastRappelDate')
      if (lastNotifDate === today) { notifiedRef.current = true; return } // Déjà notifié

      fetch(`/api/releves?date=${today}`)
        .then(r => r.json())
        .then((data: unknown[]) => {
          if (!Array.isArray(data) || data.length === 0) {
            new Notification('⚠️ Carnet Sanitaire — Relevé manquant', {
              body: `Aucun relevé saisi aujourd'hui (${today}). Arrêté du 26/05/2021.`,
              icon: '/assets/logo-cifec.png',
              tag: 'rappel-releve',
            })
            localStorage.setItem('lastRappelDate', today)
          }
          notifiedRef.current = true
        })
        .catch(() => {})
    }

    check() // Vérification immédiate
    const interval = setInterval(check, 60 * 1000) // Toutes les minutes
    return () => clearInterval(interval)
  }, [])

  return null
}
