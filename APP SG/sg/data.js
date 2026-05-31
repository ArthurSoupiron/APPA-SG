// SG · App — shared dataset
// All screens read from these; mutations live in React state initialized from them.

const POLES = {
  presidence: { k: 'Présidence', tone: 'primary' },
  sg:        { k: 'SG', tone: 'primary' },
  tresorerie:{ k: 'Trésorerie', tone: 'primary' },
  qualite:   { k: 'Qualité', tone: 'primary' },
  com:       { k: 'Com', tone: 'primary' },
  rh:        { k: 'RH', tone: 'primary' },
  si:        { k: 'SI', tone: 'primary' },
  commercial:{ k: 'Commercial', tone: 'primary' },
  prod:      { k: 'Production', tone: 'primary' },
};

const STATUS = {
  active: { k: 'Actif', tone: 'success' },
  pending: { k: 'Postulant', tone: 'warn' },
  alumni: { k: 'Alumni', tone: 'neutral' },
  excluded: { k: 'Exclu', tone: 'danger' },
};

const MEMBERS = [
  { id: 'lb', first: 'Léa', last: 'Bernard', initials: 'LB', color: 'c1', role: 'Secrétaire Général', pole: 'sg', promo: 2026, year: 'L3', status: 'active', email: 'lea.bernard@jeece.fr', phone: '+33 6 78 12 34 56', joined: 'sept. 2024', address: '8 rue Saint-Maur, 75011 Paris', school: 'ECE Paris', studentId: 'ECE-23018821', jeeceId: 'JE-2024-0088', mandates: [
      { role: 'Secrétaire Général', period: 'Sept. 2025 → en cours', current: true, tags: ['SG', 'Élue en AG', '47 docs traités'] },
      { role: 'Chargée admin', period: 'Sept. 2024 → août 2025', tags: ['SG junior'] },
    ], birth: '12 janvier 2004' },
  { id: 'hm', first: 'Hugo', last: 'Martin', initials: 'HM', color: 'c2', role: 'Président', pole: 'presidence', promo: 2025, year: 'M1', status: 'active', email: 'hugo.martin@jeece.fr', phone: '+33 6 12 90 22 18', joined: 'sept. 2023', address: '12 rue Oberkampf, 75011 Paris', school: 'ECE Paris', studentId: 'ECE-22014099', jeeceId: 'JE-2023-0042', birth: '14 mars 2003',
    mandates: [
      { role: 'Président · Mandat 2025–2026', period: 'Sept. 2025 → en cours', current: true, tags: ['Présidence', 'Élu en AG', '14 missions supervisées'] },
      { role: 'VP Commercial · Mandat 2024–2025', period: 'Sept. 2024 → août 2025', tags: ['Commercial', 'CA 38 240 €'] },
      { role: "Chargé d'affaires · Mandat 2023–2024", period: 'Oct. 2023 → août 2024', tags: ['Commercial', '7 missions'] },
    ]
  },
  { id: 'cr', first: 'Camille', last: 'Roy', initials: 'CR', color: 'c4', role: 'Trésorière', pole: 'tresorerie', promo: 2026, year: 'L3', status: 'active', email: 'camille.roy@jeece.fr', phone: '+33 6 84 55 71 22', joined: 'oct. 2024' },
  { id: 'pd', first: 'Paul', last: 'Delcourt', initials: 'PD', color: 'c5', role: 'VP Qualité', pole: 'qualite', promo: 2025, year: 'M1', status: 'active', email: 'paul.delcourt@jeece.fr', phone: '+33 6 18 23 88 04', joined: 'sept. 2023' },
  { id: 'em', first: 'Élise', last: 'Moreau', initials: 'EM', color: 'c3', role: 'Chargée comm. interne', pole: 'com', promo: 2027, year: 'L2', status: 'active', email: 'elise.moreau@jeece.fr', phone: '+33 7 02 14 65 30', joined: 'oct. 2025' },
  { id: 'yb', first: 'Yanis', last: 'Belkacem', initials: 'YB', color: 'c7', role: "VP Système d'information", pole: 'si', promo: 2025, year: 'M2', status: 'active', email: 'yanis.belkacem@jeece.fr', phone: '+33 6 47 88 12 09', joined: 'sept. 2022' },
  { id: 'ad', first: 'Anaïs', last: 'Diop', initials: 'AD', color: 'c6', role: 'Chargée recrutement', pole: 'rh', promo: 2026, year: 'L3', status: 'active', email: 'anais.diop@jeece.fr', phone: '+33 6 31 09 67 11', joined: 'sept. 2024' },
  { id: 'ts', first: 'Théo', last: 'Da Silva', initials: 'TD', color: 'c2', role: 'VP Communication', pole: 'com', promo: 2025, year: 'M1', status: 'active', email: 'theo.dasilva@jeece.fr', phone: '+33 7 60 22 18 47', joined: 'sept. 2023' },
  { id: 'mn', first: 'Marion', last: 'Nguyen', initials: 'MN', color: 'c5', role: 'À définir', pole: 'si', promo: 2028, year: 'L1', status: 'pending', email: 'marion.nguyen@edu.ece.fr', phone: '+33 7 88 14 02 99', joined: 'avr. 2026' },
  { id: 'jv', first: 'Jules', last: 'Vasseur', initials: 'JV', color: 'c3', role: 'Ancien Président', pole: 'presidence', promo: 2024, year: 'Diplômé', status: 'alumni', email: 'jules.vasseur@gmail.com', phone: '—', joined: 'sept. 2021' },
  { id: 'rf', first: 'Romain', last: 'Faure', initials: 'RF', color: 'c4', role: 'Membre actif', pole: 'si', promo: 2027, year: 'L2', status: 'excluded', email: 'romain.faure@edu.ece.fr', phone: '—', joined: 'sept. 2025' },
  { id: 'sh', first: 'Sarah', last: 'Halimi', initials: 'SH', color: 'c7', role: 'VP Ressources humaines', pole: 'rh', promo: 2025, year: 'M1', status: 'active', email: 'sarah.halimi@jeece.fr', phone: '+33 6 45 91 03 27', joined: 'sept. 2023' },
  { id: 'jm', first: 'Jules', last: 'Maréchal', initials: 'JM', color: 'c2', role: "Chargé d'affaires", pole: 'commercial', promo: 2026, year: 'L3', status: 'active', email: 'jules.marechal@jeece.fr', phone: '+33 6 02 87 14 56', joined: 'sept. 2024' },
  { id: 'in', first: 'Inès', last: 'Bensaïd', initials: 'IB', color: 'c6', role: 'Chargée production', pole: 'prod', promo: 2026, year: 'L3', status: 'active', email: 'ines.bensaid@jeece.fr', phone: '+33 7 14 22 88 03', joined: 'sept. 2024' },
];

// Tasks for dashboard (mutable in state).
const TASKS = [
  { id: 't1', title: 'Signer le PV de Bureau du 5 mai', meta: 'PV Bureau · 4 pages · partagé par H. Martin', due: 'En retard 2j', dueTone: 'danger', owner: 'hm', done: false },
  { id: 't2', title: "Préparer ordre du jour Bureau du 12 mai", meta: 'Réunion Bureau · 9 points en attente', due: 'Demain', dueTone: 'warn', owner: 'lb', done: false },
  { id: 't3', title: 'Valider 5 attestations de fonction', meta: 'Pôle Trésorerie · stage convention', due: '13 mai', dueTone: 'primary', owner: 'cr', done: false },
  { id: 't4', title: 'Relire RI v.4 avant diffusion', meta: 'Règlement intérieur · 12 pages · diff Présidence', due: '14 mai', dueTone: 'primary', owner: 'pd', done: false },
  { id: 't5', title: 'Mettre à jour le registre des membres', meta: '3 nouveaux postulants à enregistrer', due: '15 mai', dueTone: 'primary', owner: 'lb', done: false },
  { id: 't6', title: "Archiver CR Bureau d'avril", meta: '3 CR · classement automatique disponible', due: '16 mai', dueTone: 'neutral', owner: 'em', done: true },
];

const DEADLINES = [
  { day: '09', mo: 'mai', title: 'Déclaration changement bureau · Préfecture', sub: 'Cerfa 13971 · échue · à régulariser', delta: '−2j', tone: 'past' },
  { day: '14', mo: 'juin', title: 'Assemblée Générale ordinaire 2026', sub: 'Convocation à diffuser avant 31 mai', delta: 'J−34', tone: 'soon' },
  { day: '22', mo: 'juin', title: 'Renouvellement assurance RC', sub: 'Allianz · contrat n°FR-208441', delta: 'J−42', tone: 'soon' },
  { day: '30', mo: 'juin', title: 'Dépôt comptes annuels 2025', sub: 'JOAFE · seuil dépassé · obligatoire', delta: 'J−50', tone: '' },
  { day: '15', mo: 'juil', title: 'Fin de mandat 2025–2026', sub: 'Passation Bureau · 14 sortants', delta: 'J−65', tone: '' },
  { day: '02', mo: 'août', title: 'Déclaration nouveaux statuts', sub: 'Suite vote AG · Préfecture du 75', delta: 'J−83', tone: '' },
];

const RECENT_ACTIVITY = [
  { who: 'hm', html: 'a généré <em>Attestation de fonction · A. Diop</em> depuis le template <span class="muted">attestation-fonction-v3</span>', when: 'Il y a 12 min' },
  { who: 'pd', html: 'a modifié la fiche membre <em>Y. Belkacem</em> · pôle changé <span class="muted">SI → Qualité</span>', when: 'Il y a 1h' },
  { who: 'cr', html: 'a uploadé <em>PV AG Extraordinaire · 28 avril 2026.pdf</em> · catégorie <span class="muted">PV AG</span>', when: 'Il y a 3h' },
  { who: 'lb', html: 'a clôturé le statut <em>Postulant → Actif</em> de <span class="muted">3 nouveaux membres</span>', when: 'Hier 18:42' },
];

// Document categories
const DOC_CATEGORIES = [
  { id: 'all',       k: 'Tous', icon: 'folder', count: 312 },
  { id: 'statuts',   k: 'Statuts', icon: 'scroll-text', count: 4 },
  { id: 'ri',        k: 'Règlement intérieur', icon: 'book-open-text', count: 6 },
  { id: 'pv-ag',     k: "PV d'AG", icon: 'file-check-2', count: 28 },
  { id: 'cr-bureau', k: 'CR de Bureau', icon: 'clipboard-list', count: 94 },
  { id: 'prefecture',k: 'Préfecture', icon: 'building-2', count: 17 },
  { id: 'comptes',   k: 'Comptes annuels', icon: 'banknote', count: 12 },
  { id: 'contrats',  k: 'Contrats / conv.', icon: 'file-signature', count: 41 },
  { id: 'assurances',k: 'Assurances', icon: 'shield', count: 8 },
  { id: 'archives',  k: 'Archives mandats', icon: 'archive', count: 102 },
];

const DOCS = [
  { id: 'd1', title: "PV d'AG Extraordinaire — Modification des statuts", cat: 'pv-ag', pages: 6, format: 'PDF', size: '412 Ko', mandat: '25–26', ref: 'PV-AG-2026-002', status: 'signed', author: 'lb', signers: ['hm','lb','cr','pd','yb'], date: '28 avr 26', dateAbs: '2026-04-28', tags: ['statuts','vote','CNJE'] },
  { id: 'd2', title: "PV d'AG Ordinaire 2024–2025 — Approbation comptes", cat: 'pv-ag', pages: 9, format: 'PDF', size: '624 Ko', mandat: '24–25', ref: 'PV-AG-2025-001', status: 'signed', author: 'jv', signers: ['jv','lb','cr'], date: '14 juin 25', dateAbs: '2025-06-14', tags: ['comptes','vote'] },
  { id: 'd3', title: "PV d'AG Élective — Bureau 2025–2026", cat: 'pv-ag', pages: 7, format: 'PDF', size: '388 Ko', mandat: '25–26', ref: 'PV-AG-2025-003', status: 'signed', author: 'hm', signers: ['hm','lb'], date: '12 sept 25', dateAbs: '2025-09-12', tags: ['élection','bureau'] },
  { id: 'd4', title: "PV d'AG Extraordinaire — Refonte RI · brouillon", cat: 'pv-ag', pages: 5, format: 'DOCX', size: '88 Ko', mandat: '25–26', ref: 'PV-AG-2026-003-DRAFT', status: 'pending', author: 'lb', signers: [], date: '3 mai 26', dateAbs: '2026-05-03', tags: ['RI','brouillon'] },
  { id: 'd5', title: "PV d'AG Ordinaire 2023–2024", cat: 'pv-ag', pages: 11, format: 'PDF', size: '720 Ko', mandat: '23–24', ref: 'PV-AG-2024-001', status: 'archived', author: 'cl', signers: ['cl','hm'], date: '10 juin 24', dateAbs: '2024-06-10', tags: ['comptes'] },
  { id: 'd6', title: "Statuts JEECE · version consolidée 2026", cat: 'statuts', pages: 18, format: 'PDF', size: '982 Ko', mandat: '25–26', ref: 'STAT-2026-V4', status: 'signed', author: 'lb', signers: ['hm','lb'], date: '30 avr 26', dateAbs: '2026-04-30', tags: ['statuts','CNJE'] },
  { id: 'd7', title: "Règlement intérieur v.4", cat: 'ri', pages: 12, format: 'DOCX', size: '142 Ko', mandat: '25–26', ref: 'RI-2026-V4-WIP', status: 'pending', author: 'pd', signers: [], date: '8 mai 26', dateAbs: '2026-05-08', tags: ['RI','draft'] },
  { id: 'd8', title: "CR Bureau · 5 mai 2026", cat: 'cr-bureau', pages: 4, format: 'PDF', size: '198 Ko', mandat: '25–26', ref: 'CR-BUR-2026-018', status: 'pending', author: 'lb', signers: ['lb'], date: '5 mai 26', dateAbs: '2026-05-05', tags: ['bureau'] },
  { id: 'd9', title: "CR Bureau · 28 avril 2026", cat: 'cr-bureau', pages: 5, format: 'PDF', size: '222 Ko', mandat: '25–26', ref: 'CR-BUR-2026-017', status: 'signed', author: 'lb', signers: ['hm','lb'], date: '28 avr 26', dateAbs: '2026-04-28', tags: ['bureau'] },
  { id: 'd10', title: "Déclaration changement bureau · Cerfa 13971", cat: 'prefecture', pages: 3, format: 'PDF', size: '120 Ko', mandat: '25–26', ref: 'PREF-2025-014', status: 'signed', author: 'lb', signers: ['hm','lb'], date: '20 sept 25', dateAbs: '2025-09-20', tags: ['Préfecture','Cerfa'] },
  { id: 'd11', title: "Comptes annuels 2024 · liasse complète", cat: 'comptes', pages: 22, format: 'PDF', size: '1.4 Mo', mandat: '24–25', ref: 'COMPTES-2024', status: 'archived', author: 'cr', signers: ['cr','hm','jv'], date: '12 juin 25', dateAbs: '2025-06-12', tags: ['comptes','JOAFE'] },
  { id: 'd12', title: "Convention de stage · Pernod Ricard", cat: 'contrats', pages: 6, format: 'PDF', size: '310 Ko', mandat: '25–26', ref: 'CONV-2026-041', status: 'signed', author: 'jm', signers: ['hm','jm'], date: '12 avr 26', dateAbs: '2026-04-12', tags: ['stage','client'] },
  { id: 'd13', title: "Attestation RC Allianz · contrat FR-208441", cat: 'assurances', pages: 2, format: 'PDF', size: '88 Ko', mandat: '25–26', ref: 'ASSU-2025-002', status: 'signed', author: 'lb', signers: ['lb'], date: '23 août 25', dateAbs: '2025-08-23', tags: ['RC','Allianz'] },
  { id: 'd14', title: "Statuts JEECE · version 2024 · archivée", cat: 'archives', pages: 17, format: 'PDF', size: '912 Ko', mandat: '23–24', ref: 'STAT-2024-V3', status: 'archived', author: 'jv', signers: ['jv'], date: '11 juin 24', dateAbs: '2024-06-11', tags: ['statuts'] },
];

// Audit log for a member (used in fiche).
const memberAudit = (memberId) => ([
  { who: 'lb', html: 'a généré <em>attestation-fonction-president.pdf</em> depuis le template <em>v3</em>.', when: '11 mai · 09:14' },
  { who: 'pd', html: 'a modifié le champ <em>adresse</em> · ancienne valeur masquée par RBAC.', when: '8 mai · 17:02' },
  { who: 'lb', html: 'a ajouté <em>attestation-rc-maif.pdf</em> à la catégorie <em>assurance</em>.', when: '2 mai · 11:38' },
  { who: 'hm', html: '(lui-même) a téléchargé <em>charte-membre-25-26.pdf</em>.', when: '28 avr · 14:21' },
  { who: 'lb', html: 'a changé le statut <em>Postulant → Actif</em>.', when: '12 sept 25 · 09:00' },
]);

// Lookups
const memberById = (id) => MEMBERS.find(m => m.id === id);

Object.assign(window, {
  POLES, STATUS, MEMBERS, TASKS, DEADLINES, RECENT_ACTIVITY,
  DOC_CATEGORIES, DOCS, memberById, memberAudit,
});
