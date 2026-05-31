// JEECE · SG Centralisation — données

// Types de documents officiels suivis dans chaque dossier membre
const DOC_TYPES = [
  { code: 'BA',   label: "Bulletin d'adhésion", icon: 'file-badge', required: true },
  { code: 'CHARTE', label: 'Charte du membre', icon: 'file-signature', required: true },
  { code: 'CE',   label: 'Carte étudiante', icon: 'id-card', required: true },
  { code: 'RIB',  label: 'RIB', icon: 'banknote', required: true },
  { code: 'RC',   label: 'Attestation RC', icon: 'shield-check', required: true },
  { code: 'CV',   label: 'CV à jour', icon: 'file-user', required: false },
];

// Catégories GED (documents officiels de l'association)
const GED_CATS = [
  { id: 'all',    label: 'Tous les documents', icon: 'folder', count: 486 },
  { id: 'ba',     label: "Bulletins d'adhésion", icon: 'file-badge', count: 84 },
  { id: 'cr',     label: 'Comptes rendus (CR)', icon: 'clipboard-list', count: 142 },
  { id: 'pvag',   label: "PV d'Assemblée Générale", icon: 'gavel', count: 31 },
  { id: 'ri',     label: 'Règlement intérieur', icon: 'book-open-text', count: 7 },
  { id: 'statuts',label: 'Statuts', icon: 'scroll-text', count: 5 },
  { id: 'pref',   label: 'Préfecture', icon: 'building-2', count: 23 },
  { id: 'compta', label: 'Comptabilité', icon: 'receipt', count: 64 },
  { id: 'contrats',label: 'Contrats & conventions', icon: 'file-signature', count: 130 },
];

// Membres — chaque dossier suit la présence des docs officiels
// docs: { CODE: 'ok' | 'pending' | 'missing' }
const MEMBERS = [
  { id: 'lb', first: 'Léa', last: 'Bernard', initials: 'LB', av: 'g1', role: 'Secrétaire Général', pole: 'Bureau', promo: 2026, year: 'L3', status: 'active', email: 'lea.bernard@jeece.fr', phone: '+33 6 78 12 34 56', joined: 'sept. 2024', city: 'Paris 11e', address: '8 rue Saint-Maur, 75011 Paris', studentId: 'ECE-23018821', jeeceId: 'JE-2024-0088', birth: '12 janvier 2004',
    docs: { BA:'ok', CHARTE:'ok', CE:'ok', RIB:'ok', RC:'ok', CV:'ok' },
    mandates: [ { role: 'Secrétaire Général', period: 'Sept. 2025 → en cours', current: true }, { role: 'Chargée administration', period: 'Sept. 2024 → août 2025' } ] },
  { id: 'hm', first: 'Hugo', last: 'Martin', initials: 'HM', av: 'g6', role: 'Président', pole: 'Bureau', promo: 2025, year: 'M1', status: 'active', email: 'hugo.martin@jeece.fr', phone: '+33 6 12 90 22 18', joined: 'sept. 2023', city: 'Paris 11e', address: '12 rue Oberkampf, 75011 Paris', studentId: 'ECE-22014099', jeeceId: 'JE-2023-0042', birth: '14 mars 2003',
    docs: { BA:'ok', CHARTE:'ok', CE:'ok', RIB:'ok', RC:'pending', CV:'ok' },
    mandates: [ { role: 'Président', period: 'Sept. 2025 → en cours', current: true }, { role: 'VP Commercial', period: 'Sept. 2024 → août 2025' }, { role: "Chargé d'affaires", period: 'Oct. 2023 → août 2024' } ] },
  { id: 'cr', first: 'Camille', last: 'Roy', initials: 'CR', av: 'g4', role: 'Trésorière', pole: 'Bureau', promo: 2026, year: 'L3', status: 'active', email: 'camille.roy@jeece.fr', phone: '+33 6 84 55 71 22', joined: 'oct. 2024', city: 'Paris 13e',
    docs: { BA:'ok', CHARTE:'ok', CE:'ok', RIB:'ok', RC:'ok', CV:'pending' } },
  { id: 'pd', first: 'Paul', last: 'Delcourt', initials: 'PD', av: 'g2', role: 'VP Qualité', pole: 'Qualité', promo: 2025, year: 'M1', status: 'active', email: 'paul.delcourt@jeece.fr', phone: '+33 6 18 23 88 04', joined: 'sept. 2023', city: 'Montrouge',
    docs: { BA:'ok', CHARTE:'ok', CE:'ok', RIB:'ok', RC:'ok', CV:'ok' } },
  { id: 'em', first: 'Élise', last: 'Moreau', initials: 'EM', av: 'g3', role: 'Chargée comm.', pole: 'Communication', promo: 2027, year: 'L2', status: 'active', email: 'elise.moreau@jeece.fr', phone: '+33 7 02 14 65 30', joined: 'oct. 2025', city: 'Paris 15e',
    docs: { BA:'ok', CHARTE:'pending', CE:'ok', RIB:'missing', RC:'ok', CV:'ok' } },
  { id: 'yb', first: 'Yanis', last: 'Belkacem', initials: 'YB', av: 'g4', role: "VP Systèmes d'info.", pole: 'SI', promo: 2025, year: 'M2', status: 'active', email: 'yanis.belkacem@jeece.fr', phone: '+33 6 47 88 12 09', joined: 'sept. 2022', city: 'Paris 19e',
    docs: { BA:'ok', CHARTE:'ok', CE:'ok', RIB:'ok', RC:'ok', CV:'ok' } },
  { id: 'ad', first: 'Anaïs', last: 'Diop', initials: 'AD', av: 'g3', role: 'Chargée recrutement', pole: 'RH', promo: 2026, year: 'L3', status: 'active', email: 'anais.diop@jeece.fr', phone: '+33 6 31 09 67 11', joined: 'sept. 2024', city: 'Bagnolet',
    docs: { BA:'ok', CHARTE:'ok', CE:'pending', RIB:'ok', RC:'missing', CV:'ok' } },
  { id: 'td', first: 'Théo', last: 'Da Silva', initials: 'TD', av: 'g6', role: 'VP Communication', pole: 'Communication', promo: 2025, year: 'M1', status: 'active', email: 'theo.dasilva@jeece.fr', phone: '+33 7 60 22 18 47', joined: 'sept. 2023', city: 'Paris 18e',
    docs: { BA:'ok', CHARTE:'ok', CE:'ok', RIB:'ok', RC:'ok', CV:'pending' } },
  { id: 'mn', first: 'Marion', last: 'Nguyen', initials: 'MN', av: 'g2', role: 'Postulante', pole: 'SI', promo: 2028, year: 'L1', status: 'pending', email: 'marion.nguyen@edu.ece.fr', phone: '+33 7 88 14 02 99', joined: 'mai 2026', city: 'Paris 12e',
    docs: { BA:'pending', CHARTE:'missing', CE:'ok', RIB:'missing', RC:'missing', CV:'ok' } },
  { id: 'jv', first: 'Jules', last: 'Vasseur', initials: 'JV', av: 'g5', role: 'Alumni · ex-Président', pole: 'Alumni', promo: 2024, year: 'Diplômé', status: 'alumni', email: 'jules.vasseur@gmail.com', phone: '—', joined: 'sept. 2021', city: 'Lyon',
    docs: { BA:'ok', CHARTE:'ok', CE:'ok', RIB:'ok', RC:'ok', CV:'ok' } },
  { id: 'sh', first: 'Sarah', last: 'Halimi', initials: 'SH', av: 'g4', role: 'VP Ressources humaines', pole: 'RH', promo: 2025, year: 'M1', status: 'active', email: 'sarah.halimi@jeece.fr', phone: '+33 6 45 91 03 27', joined: 'sept. 2023', city: 'Paris 20e',
    docs: { BA:'ok', CHARTE:'ok', CE:'ok', RIB:'ok', RC:'ok', CV:'ok' } },
  { id: 'jm', first: 'Jules', last: 'Maréchal', initials: 'JM', av: 'g6', role: "Chargé d'affaires", pole: 'Commercial', promo: 2026, year: 'L3', status: 'active', email: 'jules.marechal@jeece.fr', phone: '+33 6 02 87 14 56', joined: 'sept. 2024', city: 'Vincennes',
    docs: { BA:'ok', CHARTE:'ok', CE:'ok', RIB:'pending', RC:'ok', CV:'ok' } },
  { id: 'ib', first: 'Inès', last: 'Bensaïd', initials: 'IB', av: 'g3', role: 'Chargée production', pole: 'Production', promo: 2026, year: 'L3', status: 'active', email: 'ines.bensaid@jeece.fr', phone: '+33 7 14 22 88 03', joined: 'sept. 2024', city: 'Paris 17e',
    docs: { BA:'ok', CHARTE:'ok', CE:'ok', RIB:'ok', RC:'ok', CV:'ok' } },
  { id: 'rf', first: 'Romain', last: 'Faure', initials: 'RF', av: 'g5', role: 'Membre actif', pole: 'SI', promo: 2027, year: 'L2', status: 'inactive', email: 'romain.faure@edu.ece.fr', phone: '—', joined: 'sept. 2025', city: '—',
    docs: { BA:'ok', CHARTE:'missing', CE:'missing', RIB:'missing', RC:'missing', CV:'missing' } },
];

// completeness helpers (count required docs ok)
const dossierStats = (m) => {
  const req = DOC_TYPES.filter(d => d.required);
  const ok = req.filter(d => m.docs[d.code] === 'ok').length;
  const pct = Math.round((ok / req.length) * 100);
  return { ok, total: req.length, pct, missing: req.filter(d => m.docs[d.code] === 'missing').length, pending: req.filter(d => m.docs[d.code] === 'pending').length };
};

// Échéances légales / conformité
const DEADLINES = [
  { day: '14', mo: 'juin', title: 'Assemblée Générale ordinaire 2026', sub: 'Convocation à diffuser avant le 31 mai', delta: 'J−14', tone: 'warn', kind: 'AG' },
  { day: '22', mo: 'juin', title: 'Renouvellement assurance RC', sub: 'Allianz · contrat FR-208441', delta: 'J−22', tone: 'warn', kind: 'Assurance' },
  { day: '30', mo: 'juin', title: 'Dépôt des comptes annuels 2025', sub: 'JOAFE · obligation légale', delta: 'J−30', tone: 'info', kind: 'Compta' },
  { day: '15', mo: 'juil', title: 'Passation de mandat 2025–2026', sub: '14 membres sortants · archivage dossiers', delta: 'J−45', tone: 'info', kind: 'Mandat' },
  { day: '02', mo: 'août', title: 'Déclaration nouveaux statuts', sub: 'Préfecture du 75 · suite vote AG', delta: 'J−63', tone: 'neutral', kind: 'Préfecture' },
];

// Documents GED
const DOCS = [
  { id: 'g1', title: "PV d'AG Extraordinaire — Modification des statuts", cat: 'pvag', pages: 6, format: 'PDF', size: '412 Ko', mandat: '25–26', ref: 'PV-AG-2026-002', status: 'signed', author: 'lb', signers: ['hm','lb','cr','pd','yb'], date: '28 avr 2026', dateAbs: '2026-04-28', tags: ['statuts','vote','CNJE'], security: 'Confidentiel' },
  { id: 'g2', title: 'Statuts JEECE — version consolidée 2026', cat: 'statuts', pages: 18, format: 'PDF', size: '982 Ko', mandat: '25–26', ref: 'STAT-2026-V4', status: 'signed', author: 'lb', signers: ['hm','lb'], date: '30 avr 2026', dateAbs: '2026-04-30', tags: ['statuts','CNJE'], security: 'Public' },
  { id: 'g3', title: 'Règlement intérieur v.4', cat: 'ri', pages: 12, format: 'DOCX', size: '142 Ko', mandat: '25–26', ref: 'RI-2026-V4-WIP', status: 'pending', author: 'pd', signers: [], date: '8 mai 2026', dateAbs: '2026-05-08', tags: ['RI','brouillon'], security: 'Interne' },
  { id: 'g4', title: 'CR Bureau — 5 mai 2026', cat: 'cr', pages: 4, format: 'PDF', size: '198 Ko', mandat: '25–26', ref: 'CR-BUR-2026-018', status: 'pending', author: 'lb', signers: ['lb'], date: '5 mai 2026', dateAbs: '2026-05-05', tags: ['bureau'], security: 'Interne' },
  { id: 'g5', title: "Bulletin d'adhésion — M. Nguyen", cat: 'ba', pages: 2, format: 'PDF', size: '96 Ko', mandat: '25–26', ref: 'BA-2026-084', status: 'pending', author: 'sh', signers: [], date: '6 mai 2026', dateAbs: '2026-05-06', tags: ['adhésion','postulant'], security: 'Confidentiel' },
  { id: 'g6', title: 'Déclaration changement de bureau — Cerfa 13971', cat: 'pref', pages: 3, format: 'PDF', size: '120 Ko', mandat: '25–26', ref: 'PREF-2025-014', status: 'signed', author: 'lb', signers: ['hm','lb'], date: '20 sept 2025', dateAbs: '2025-09-20', tags: ['Préfecture','Cerfa'], security: 'Public' },
  { id: 'g7', title: "PV d'AG Élective — Bureau 2025–2026", cat: 'pvag', pages: 7, format: 'PDF', size: '388 Ko', mandat: '25–26', ref: 'PV-AG-2025-003', status: 'signed', author: 'hm', signers: ['hm','lb'], date: '12 sept 2025', dateAbs: '2025-09-12', tags: ['élection','bureau'], security: 'Public' },
  { id: 'g8', title: 'Comptes annuels 2024 — liasse complète', cat: 'compta', pages: 22, format: 'PDF', size: '1.4 Mo', mandat: '24–25', ref: 'COMPTA-2024', status: 'archived', author: 'cr', signers: ['cr','hm','jv'], date: '12 juin 2025', dateAbs: '2025-06-12', tags: ['comptes','JOAFE'], security: 'Confidentiel' },
  { id: 'g9', title: 'Convention de stage — Pernod Ricard', cat: 'contrats', pages: 6, format: 'PDF', size: '310 Ko', mandat: '25–26', ref: 'CONV-2026-041', status: 'signed', author: 'jm', signers: ['hm','jm'], date: '12 avr 2026', dateAbs: '2026-04-12', tags: ['stage','client'], security: 'Confidentiel' },
  { id: 'g10', title: 'CR Bureau — 28 avril 2026', cat: 'cr', pages: 5, format: 'PDF', size: '222 Ko', mandat: '25–26', ref: 'CR-BUR-2026-017', status: 'signed', author: 'lb', signers: ['hm','lb'], date: '28 avr 2026', dateAbs: '2026-04-28', tags: ['bureau'], security: 'Interne' },
  { id: 'g11', title: "PV d'AG Ordinaire 2024–2025 — Approbation comptes", cat: 'pvag', pages: 9, format: 'PDF', size: '624 Ko', mandat: '24–25', ref: 'PV-AG-2025-001', status: 'signed', author: 'jv', signers: ['jv','lb','cr'], date: '14 juin 2025', dateAbs: '2025-06-14', tags: ['comptes','vote'], security: 'Public' },
  { id: 'g12', title: 'Attestation RC Allianz — contrat FR-208441', cat: 'contrats', pages: 2, format: 'PDF', size: '88 Ko', mandat: '25–26', ref: 'ASSU-2025-002', status: 'signed', author: 'lb', signers: ['lb'], date: '23 août 2025', dateAbs: '2025-08-23', tags: ['RC','Allianz'], security: 'Interne' },
];

// Activité / historique (audit trail)
const ACTIVITY = [
  { who: 'hm', action: 'a généré', target: "Attestation de fonction · A. Diop", ctx: 'modèle attestation-fonction-v3', when: 'il y a 12 min', icon: 'file-plus-2', tone: 'brand' },
  { who: 'pd', action: 'a déposé', target: 'CR Bureau — 5 mai 2026.pdf', ctx: 'catégorie Comptes rendus', when: 'il y a 1 h', icon: 'upload', tone: 'info' },
  { who: 'sh', action: 'a complété le dossier de', target: 'Marion Nguyen', ctx: "bulletin d'adhésion ajouté", when: 'il y a 3 h', icon: 'folder-check', tone: 'brand' },
  { who: 'lb', action: 'a signé', target: "PV d'AG Extraordinaire", ctx: 'signature numérique · DocuSign', when: 'hier 18:42', icon: 'pen-tool', tone: 'violet' },
  { who: 'cr', action: 'a archivé', target: 'Comptes annuels 2024', ctx: 'dépôt JOAFE confirmé', when: 'hier 16:10', icon: 'archive', tone: 'neutral' },
];

const STATUS_LABEL = {
  active: { k: 'Actif', tone: 'ok' },
  pending: { k: 'Postulant', tone: 'warn' },
  alumni: { k: 'Alumni', tone: 'info' },
  inactive: { k: 'Inactif', tone: 'danger' },
};

const memberById = (id) => MEMBERS.find(m => m.id === id);

// ===========================================================================
//  Store réactif + persistance (localStorage)
//  Les écrans lisent directement MEMBERS / DOCS / ACTIVITY (globals). On mute
//  ces tableaux EN PLACE (push/splice/affectation de champ) pour préserver les
//  références, on sauvegarde dans le navigateur, puis on émet « sg:change »
//  pour forcer un re-render de l'app.
// ===========================================================================
const SG_STORE_KEY = 'jeece-sg-store-v1';

const sgPersist = () => {
  try {
    localStorage.setItem(SG_STORE_KEY, JSON.stringify({ MEMBERS, DOCS, ACTIVITY }));
  } catch (e) { /* quota / mode privé : on ignore */ }
};

const sgHydrate = () => {
  try {
    const raw = localStorage.getItem(SG_STORE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.MEMBERS))  MEMBERS.splice(0, MEMBERS.length, ...saved.MEMBERS);
    if (Array.isArray(saved.DOCS))     DOCS.splice(0, DOCS.length, ...saved.DOCS);
    if (Array.isArray(saved.ACTIVITY)) ACTIVITY.splice(0, ACTIVITY.length, ...saved.ACTIVITY);
  } catch (e) { /* données corrompues : on repart du seed */ }
};

// applique une mutation : persiste + notifie l'UI
const sgCommit = () => { sgPersist(); window.dispatchEvent(new Event('sg:change')); };

// réinitialise le store (utile pour la démo)
const sgReset = () => { try { localStorage.removeItem(SG_STORE_KEY); } catch (e) {} location.reload(); };

// journalise une entrée dans l'audit trail (en tête de liste)
const logActivity = (entry) => {
  ACTIVITY.unshift({ when: "à l'instant", tone: 'brand', icon: 'pencil', ...entry });
  if (ACTIVITY.length > 40) ACTIVITY.length = 40;
};

// ---- Mutations métier ----------------------------------------------------

// crée un dossier membre vide (toutes pièces manquantes) et le persiste
const addMember = (data) => {
  const first = (data.first || '').trim();
  const last  = (data.last || '').trim();
  const initials = ((first[0] || '?') + (last[0] || '')).toUpperCase();
  let id = (initials.toLowerCase() || 'm') ;
  while (MEMBERS.some(m => m.id === id)) id += Math.floor(Math.random() * 10);
  const m = {
    id, first, last, initials,
    av: 'g' + (1 + (MEMBERS.length % 7)),
    role: data.role || 'Membre actif',
    pole: data.pole || 'SI',
    promo: Number(data.promo) || new Date().getFullYear() + 2,
    year: data.year || 'L1',
    status: data.status || 'active',
    email: data.email || `${first}.${last}`.toLowerCase().replace(/\s+/g, '') + '@jeece.fr',
    phone: data.phone || '—',
    joined: data.joined || new Date().toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
    city: data.city || '—',
    docs: { BA: 'missing', CHARTE: 'missing', CE: 'missing', RIB: 'missing', RC: 'missing', CV: 'missing' },
  };
  MEMBERS.push(m);
  logActivity({ who: 'lb', action: 'a créé le dossier de', target: `${first} ${last}`, ctx: 'nouveau membre', icon: 'user-plus', tone: 'brand' });
  sgCommit();
  return m;
};

// change l'état d'une pièce d'un dossier : 'missing' → 'pending' → 'ok'
const setDocStatus = (memberId, code, status) => {
  const m = memberById(memberId);
  if (!m) return;
  m.docs[code] = status;
  const dt = (DOC_TYPES.find(d => d.code === code) || {}).label || code;
  const verb = status === 'ok' ? 'a validé' : status === 'pending' ? 'a déposé' : 'a retiré';
  logActivity({ who: 'lb', action: verb, target: `${dt} · ${m.first} ${m.last}`, ctx: 'dossier membre', icon: status === 'ok' ? 'check-circle' : 'upload', tone: status === 'ok' ? 'brand' : 'info' });
  sgCommit();
};

// dépose un document dans la GED
const addGedDoc = (data) => {
  const id = 'g' + (DOCS.length + 1) + Math.floor(Math.random() * 100);
  const now = new Date();
  const cat = data.cat || 'cr';
  const prefix = { ba: 'BA', cr: 'CR', pvag: 'PV-AG', ri: 'RI', statuts: 'STAT', pref: 'PREF', compta: 'COMPTA', contrats: 'CONV' }[cat] || 'DOC';
  const doc = {
    id,
    title: (data.title || 'Document sans titre').trim(),
    cat,
    pages: Number(data.pages) || 1,
    format: data.format || 'PDF',
    size: data.size || '—',
    mandat: '25–26',
    ref: data.ref || `${prefix}-2026-${String(100 + DOCS.length)}`,
    status: data.status || 'pending',
    author: data.author || 'lb',
    signers: [],
    date: now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
    dateAbs: now.toISOString().slice(0, 10),
    tags: (data.tags || '').split(',').map(t => t.trim()).filter(Boolean),
    security: data.security || 'Interne',
  };
  DOCS.unshift(doc);
  logActivity({ who: doc.author, action: 'a déposé', target: doc.title, ctx: `catégorie ${(GED_CATS.find(c => c.id === cat) || {}).label || cat}`, icon: 'upload', tone: 'info' });
  sgCommit();
  return doc;
};

// met à jour les champs d'un dossier membre
const updateMember = (id, patch) => {
  const m = memberById(id);
  if (!m) return;
  Object.assign(m, patch);
  if (patch.first || patch.last) m.initials = ((m.first[0] || '?') + (m.last[0] || '')).toUpperCase();
  logActivity({ who: 'lb', action: 'a mis à jour le dossier de', target: `${m.first} ${m.last}`, ctx: 'identité éditée', icon: 'pencil', tone: 'neutral' });
  sgCommit();
};

// supprime un dossier membre
const deleteMember = (id) => {
  const i = MEMBERS.findIndex(m => m.id === id);
  if (i < 0) return;
  const m = MEMBERS[i];
  MEMBERS.splice(i, 1);
  logActivity({ who: 'lb', action: 'a supprimé le dossier de', target: `${m.first} ${m.last}`, ctx: 'suppression définitive', icon: 'trash-2', tone: 'neutral' });
  sgCommit();
};

// change le statut d'un document GED (signed / archived / pending)
const setGedStatus = (id, status) => {
  const d = DOCS.find(x => x.id === id);
  if (!d) return;
  d.status = status;
  const verb = status === 'signed' ? 'a signé' : status === 'archived' ? 'a archivé' : 'a remis en attente';
  logActivity({ who: 'lb', action: verb, target: d.title, ctx: 'GED', icon: status === 'signed' ? 'pen-tool' : status === 'archived' ? 'archive' : 'clock', tone: status === 'signed' ? 'violet' : 'neutral' });
  sgCommit();
};

// (dé)marque un document comme favori
const toggleGedFav = (id) => {
  const d = DOCS.find(x => x.id === id);
  if (!d) return;
  d.fav = !d.fav;
  sgCommit();
};

// supprime un document de la GED
const deleteGedDoc = (id) => {
  const i = DOCS.findIndex(x => x.id === id);
  if (i < 0) return;
  const d = DOCS[i];
  DOCS.splice(i, 1);
  logActivity({ who: 'lb', action: 'a supprimé', target: d.title, ctx: 'GED', icon: 'trash-2', tone: 'neutral' });
  sgCommit();
};

// hydrate dès le chargement du module (avant le 1er render)
sgHydrate();

// global rollups
const rollups = () => {
  const active = MEMBERS.filter(m => m.status === 'active');
  const complete = MEMBERS.filter(m => dossierStats(m).pct === 100).length;
  const totalDocs = 486;
  const incomplete = MEMBERS.filter(m => dossierStats(m).pct < 100);
  return { membersTotal: MEMBERS.length, active: active.length, complete, completePct: Math.round((complete / MEMBERS.length) * 100), totalDocs, incomplete };
};

Object.assign(window, {
  DOC_TYPES, GED_CATS, MEMBERS, DEADLINES, DOCS, ACTIVITY, STATUS_LABEL,
  dossierStats, memberById, rollups,
  sgCommit, sgReset, logActivity, addMember, setDocStatus, addGedDoc,
  updateMember, deleteMember, setGedStatus, toggleGedFav, deleteGedDoc,
});
