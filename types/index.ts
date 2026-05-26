export interface Releve {
  id: number
  date: string
  bassinId: number
  bassinNom: string
  heure: string
  transparence: string
  pointPrelevement: string | null
  tempEau: number
  tempAir: number | null
  ph: number
  chloreLibre: number
  chloreCombine: number | null
  chloreTotal: number | null
  turbidite: number | null
  redox: number | null
  cyanurate: number | null
  tauxChlorure: number | null
  th: number | null
  tac: number | null
  chloreActif: number | null
  volumeReactif: number | null
  debitRecyclage: number | null
  status: 'conforme' | 'attention' | 'nonconforme'
  valide: boolean
  valideePar: string | null
  valideeAt: string | null
  createdAt: string
}

export interface Bassin {
  id: number
  nom: string
  type: string
  typeReglementaire: string | null
  mineralisationEau: string | null
  longueur: number | null
  largeur: number | null
  profMin: number | null
  profMax: number | null
  surfSuperieure: number | null
  surfInferieure: number | null
  volumeTotal: number | null
  debitReglementaire: number | null
  debitInstallation: number | null
  traitementPrincipal: string | null
  typeStabilisant: string | null
  typeMesure: string | null
  createdAt: string
  updatedAt: string
}

export interface Frequentation {
  id: number
  date: string
  scolaire: number
  club: number
  publicCount: number
  autre: number
  total: number
  reportEau: number | null
  releveEau: number | null
  totalEau: number | null
  litresParBaigneur: number | null
  createdAt: string
}

export interface Intervention {
  id: number
  date: string
  heure: string | null
  type: string
  bassin: string
  description: string
  agent: string | null
  status: string
  createdAt: string
}

export interface Contact {
  id: number
  categorie: string
  nom: string
  adresse: string | null
  responsable: string | null
  bureau: string | null
  domicile: string | null
}

export interface Etablissement {
  id: number
  nom: string
  adresse: string
  telephone: string
  capaciteBaigneursCouvert: number
  capaciteVisiteursCouvert: number
  capaciteBaigneursPleinAir: number
  capaciteVisiteursPleinAir: number
  updatedAt: string
}
