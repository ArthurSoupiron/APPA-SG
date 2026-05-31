// JEECE · SG — composants partagés + chrome
const cls = (...xs) => xs.filter(Boolean).join(' ');

const useIcons = () => {
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.7 } }); });
};
const Icon = ({ name, style, className }) => <i data-lucide={name} style={style} className={className}></i>;

// S'abonne au store : re-render à chaque « sg:change » (mutation persistée).
const useStore = () => {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const h = () => force(v => v + 1);
    window.addEventListener('sg:change', h);
    return () => window.removeEventListener('sg:change', h);
  }, []);
};

// Ouvre une modale globale, gérée par <ModalHost/> dans App.
const openModal = (type, props = {}) => window.dispatchEvent(new CustomEvent('sg:modal', { detail: { type, props } }));

// ===== Utilitaires : téléchargement, CSV, modèles de documents =====
const downloadBlob = (filename, content, type = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// tableau de lignes → CSV (séparateur « ; » pour Excel FR, BOM pour les accents)
const toCSV = (rows) => '﻿' + rows.map(r => r.map(c => {
  const s = String(c == null ? '' : c);
  return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}).join(';')).join('\r\n');

const exportMembersCSV = () => {
  const header = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Pôle', 'Rôle', 'Année', 'Promo', 'Statut', 'Ville', 'Complétude %', 'Pièces manquantes'];
  const rows = MEMBERS.map(m => {
    const s = dossierStats(m);
    return [m.first, m.last, m.email, m.phone, m.pole, m.role, m.year, m.promo, (STATUS_LABEL[m.status] || {}).k || m.status, m.city, s.pct, s.missing];
  });
  downloadBlob('membres-jeece-sg.csv', toCSV([header, ...rows]), 'text/csv;charset=utf-8');
};

const exportDocsCSV = () => {
  const header = ['Titre', 'Référence', 'Catégorie', 'Format', 'Pages', 'Statut', 'Confidentialité', 'Date', 'Tags'];
  const rows = DOCS.map(d => [d.title, d.ref, (GED_CATS.find(c => c.id === d.cat) || {}).label || d.cat, d.format, d.pages, d.status, d.security, d.date, (d.tags || []).join(', ')]);
  downloadBlob('documents-jeece-sg.csv', toCSV([header, ...rows]), 'text/csv;charset=utf-8');
};

// Modèles de documents officiels — renvoient un document HTML imprimable
const DOC_TEMPLATES = [
  { id: 'attestation', label: 'Attestation de fonction', cat: 'pref', icon: 'file-badge',
    title: (m) => `Attestation de fonction — ${m.first} ${m.last}`,
    body: (m) => `<p>Je soussigné·e, Président·e de l'association <strong>JEECE</strong> (Junior-Entreprise de l'ECE Paris),
      atteste par la présente que :</p>
      <p style="margin:18px 0;font-size:16px"><strong>${m.first} ${m.last}</strong>, né·e le ${m.birth || '—'},
      étudiant·e en ${m.year} à l'ECE Paris (promotion ${m.promo}),</p>
      <p>exerce les fonctions de <strong>${m.role}</strong> au sein du pôle ${m.pole} de l'association,
      depuis ${m.joined}.</p>
      <p>La présente attestation est délivrée à l'intéressé·e pour servir et valoir ce que de droit.</p>` },
  { id: 'recu', label: "Reçu d'adhésion", cat: 'ba', icon: 'receipt',
    title: (m) => `Reçu d'adhésion — ${m.first} ${m.last}`,
    body: (m) => `<p>L'association <strong>JEECE</strong> accuse réception de l'adhésion de :</p>
      <p style="margin:18px 0;font-size:16px"><strong>${m.first} ${m.last}</strong> — ${m.email}</p>
      <p>Statut : <strong>${(STATUS_LABEL[m.status] || {}).k || m.status}</strong> · Pôle ${m.pole} · Adhésion depuis ${m.joined}.</p>
      <p>Ce reçu confirme l'inscription du membre au registre de l'association pour le mandat 2025–2026.</p>` },
];

const renderDocHTML = (tpl, m) => {
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${tpl.title(m)}</title>
    <style>
      body{font-family:Georgia,'Times New Roman',serif;color:#14271C;max-width:720px;margin:40px auto;padding:0 32px;line-height:1.6}
      .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1A9E55;padding-bottom:16px;margin-bottom:28px}
      .brand{font-family:Arial,sans-serif;font-weight:700;font-size:20px;color:#0F6E39}
      .brand small{display:block;font-weight:400;font-size:11px;color:#587065;letter-spacing:.04em}
      h1{font-size:20px;margin:0 0 24px}
      .meta{font-family:Arial,sans-serif;font-size:12px;color:#587065;text-align:right}
      .sign{margin-top:48px;display:flex;justify-content:space-between;align-items:flex-end}
      .stamp{width:90px;height:90px;border:2px solid #1A9E55;border-radius:50%;color:#1A9E55;display:flex;align-items:center;justify-content:center;text-align:center;font-family:Arial,sans-serif;font-size:10px;font-weight:700;transform:rotate(-8deg);opacity:.8}
      @media print{body{margin:0}}
    </style></head><body>
    <div class="head"><div class="brand">JEECE<small>Junior-Entreprise · ECE Paris</small></div>
      <div class="meta">Paris, le ${today}<br>Mandat 2025–2026</div></div>
    <h1>${tpl.title(m)}</h1>
    ${tpl.body(m)}
    <div class="sign"><div>Fait à Paris, le ${today}<br><br>La Présidence</div>
      <div class="stamp">JEECE<br>ECE PARIS</div></div>
  </body></html>`;
};

const Avatar = ({ m, size = 34, av, initials }) => {
  const i = m?.initials || initials || '?';
  const a = m?.av || av || 'g1';
  const fs = size <= 22 ? 10 : size <= 28 ? 11.5 : size <= 36 ? 13 : size <= 48 ? 17 : 22;
  return <div className={cls('av', `av--${a}`)} style={{ width: size, height: size, fontSize: fs }}>{i}</div>;
};

const Badge = ({ tone, dot, children, style }) => (
  <span className={cls('badge', tone && `badge--${tone}`)} style={style}>
    {dot && <span className="dot"></span>}{children}
  </span>
);

const Btn = ({ kind, size, icon, iconRight, children, onClick, active, style, title }) => (
  <button type="button" title={title} onClick={onClick}
    className={cls('btn', kind && `btn--${kind}`, size && `btn--${size}`)} style={style}>
    {icon && <Icon name={icon} />}{children}{iconRight && <Icon name={iconRight} />}
  </button>
);

const IconBtn = ({ icon, onClick, dot, title, style }) => (
  <button type="button" className="iconbtn" title={title} onClick={onClick} style={style}>
    <Icon name={icon} />{dot && <span className="iconbtn__dot"></span>}
  </button>
);

const Card = ({ title, sub, action, head, foot, children, style, noBody, bodyStyle }) => (
  <div className="card" style={style}>
    {(title || head) && (
      <div className="card__head">
        {head || (<><div><div className="card__title">{title}</div>{sub && <div className="card__sub">{sub}</div>}</div><div className="spacer"></div>{action}</>)}
      </div>
    )}
    {noBody ? children : <div style={bodyStyle}>{children}</div>}
    {foot && <div className="card__foot">{foot}</div>}
  </div>
);

const Empty = ({ icon = 'search-x', title = 'Aucun résultat', sub = 'Ajustez vos filtres ou votre recherche.' }) => (
  <div className="empty"><Icon name={icon} /><div className="empty__t">{title}</div><div className="empty__s">{sub}</div></div>
);

// Progress ring (SVG donut) with animated fill
const Ring = ({ pct, size = 44, stroke = 5, color, label }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [off, setOff] = React.useState(c);
  React.useEffect(() => {
    const t = setTimeout(() => setOff(c - (pct / 100) * c), 60);
    return () => clearTimeout(t);
  }, [pct, c]);
  const col = color || (pct === 100 ? 'var(--brand)' : pct >= 60 ? 'var(--warn)' : 'var(--danger)');
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: `0 0 ${size}px` }}>
      <svg width={size} height={size} className="ring">
        <circle className="ring__bg" cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={stroke} />
        <circle className="ring__fg" cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={stroke}
          stroke={col} strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: size <= 44 ? 11 : 13, fontWeight: 700, color: 'var(--ink)' }}>
        {label != null ? label : `${pct}`}
      </div>
    </div>
  );
};

const Bar = ({ pct, tone, height = 7 }) => (
  <div className={cls('bar', tone && `bar--${tone}`)} style={{ height }}>
    <i style={{ width: `${pct}%` }}></i>
  </div>
);

// ===== Sidebar =====
const NAV = [
  { id: 'dashboard', label: "Tableau de bord", icon: 'layout-dashboard' },
  { id: 'membres',   label: 'Membres', icon: 'users', count: () => MEMBERS.length },
  { id: 'documents', label: 'Documents (GED)', icon: 'folder-open', count: () => 486 },
  { id: 'conformite',label: 'Conformité', icon: 'shield-check', count: () => 4 },
];
const NAV_2 = [
  { id: 'archives', label: 'Archives mandats', icon: 'archive' },
  { id: 'parametres', label: 'Paramètres & SSO', icon: 'settings' },
];

const Sidebar = ({ route, navigate }) => {
  const active = route.name === 'dossier' ? 'membres' : route.name;
  const r = rollups();
  return (
    <aside className="sidebar">
      <a href="#/dashboard" className="brand" onClick={(e) => { e.preventDefault(); navigate('dashboard'); }}>
        <div className="brand__mark">JE</div>
        <div>
          <div className="brand__name">JEECE · SG</div>
          <div className="brand__sub">Centralisation des dossiers</div>
        </div>
      </a>

      <div className="nav-group">Pilotage</div>
      {NAV.map(it => (
        <a key={it.id} href={`#/${it.id}`} className={cls('nav-item', active === it.id && 'nav-item--active')}
          onClick={(e) => { e.preventDefault(); navigate(it.id); }}>
          <Icon name={it.icon} /><span style={{ flex: 1 }}>{it.label}</span>
          {it.count && <span className="nav-item__count">{it.count()}</span>}
        </a>
      ))}

      <div className="nav-group">Système</div>
      {NAV_2.map(it => (
        <a key={it.id} href="#" className="nav-item" onClick={(e) => e.preventDefault()} title="Démo">
          <Icon name={it.icon} /><span style={{ flex: 1 }}>{it.label}</span>
        </a>
      ))}

      <div className="side-card">
        <div className="side-card__h"><Icon name="folder-check" style={{ width: 14, height: 14 }} />Dossiers complets</div>
        <div className="side-card__bar"><i style={{ width: `${r.completePct}%` }}></i></div>
        <div className="side-card__meta">{r.complete} / {r.membersTotal} dossiers conformes · {r.completePct}%</div>
      </div>

      <div className="side-user">
        <Avatar m={memberById('lb')} size={34} />
        <div className="side-user__meta">
          <div className="side-user__name">Léa Bernard</div>
          <div className="side-user__role">Secrétaire Général</div>
        </div>
        <Icon name="log-out" className="muted-2" style={{ width: 15, height: 15 }} />
      </div>
    </aside>
  );
};

// ===== Header =====
const Header = ({ crumbs = [], search, setSearch, navigate }) => {
  const [openSearch, setOpenSearch] = React.useState(false);
  const [openNotif, setOpenNotif] = React.useState(false);
  const q = (search || '').trim().toLowerCase();

  const results = q ? [
    ...MEMBERS.filter(m => `${m.first} ${m.last} ${m.role}`.toLowerCase().includes(q)).slice(0, 4).map(m => ({ type: 'membre', m })),
    ...DOCS.filter(d => d.title.toLowerCase().includes(q) || d.ref.toLowerCase().includes(q)).slice(0, 3).map(d => ({ type: 'doc', d })),
  ] : [];

  React.useEffect(() => {
    const close = () => { setOpenNotif(false); setOpenSearch(false); };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  return (
    <header className="header">
      <nav className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="crumbs__sep">/</span>}
            {c.onClick ? <a href="#" className="muted" onClick={(e) => { e.preventDefault(); c.onClick(); }}>{c.k}</a>
              : <span className={cls(i === crumbs.length - 1 && 'crumbs__last')}>{c.k}</span>}
          </React.Fragment>
        ))}
      </nav>

      <div style={{ position: 'relative', flex: 1, maxWidth: 420, marginLeft: 6 }} onClick={(e) => e.stopPropagation()}>
        <div className="search">
          <Icon name="search" />
          <input placeholder="Rechercher un membre, un document, une référence…"
            value={search || ''} onChange={(e) => { setSearch(e.target.value); setOpenSearch(true); }}
            onFocus={() => setOpenSearch(true)} />
          <kbd>⌘K</kbd>
        </div>
        {openSearch && q && (
          <div className="pop" style={{ top: 'calc(100% + 6px)', left: 0, right: 0, padding: 6 }}>
            {results.length === 0 && <div style={{ padding: '10px 12px', color: 'var(--ink-3)', fontSize: 13 }}>Aucun résultat pour « {search} »</div>}
            {results.map((r, i) => r.type === 'membre' ? (
              <div key={i} className="pop__item" onClick={() => { navigate(`dossier/${r.m.id}`); setSearch(''); setOpenSearch(false); }}>
                <Avatar m={r.m} size={26} />
                <div style={{ flex: 1 }}><div style={{ fontWeight: 550 }}>{r.m.first} {r.m.last}</div><div className="muted-2" style={{ fontSize: 11.5 }}>{r.m.role}</div></div>
                <Badge tone="ok">Membre</Badge>
              </div>
            ) : (
              <div key={i} className="pop__item" onClick={() => { navigate('documents'); setSearch(''); setOpenSearch(false); }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--ink-2)' }}><Icon name="file-text" style={{ width: 14, height: 14 }} /></div>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 550, fontSize: 12.5 }}>{r.d.title}</div><div className="muted-2 mono" style={{ fontSize: 11 }}>{r.d.ref}</div></div>
                <Badge tone="info">Doc</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="header__actions">
        <Btn kind="primary" size="sm" icon="plus" onClick={() => openModal('member')}>Nouveau dossier</Btn>
        <IconBtn icon="folder-plus" title="Déposer un document" onClick={() => openModal('doc')} />
        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <IconBtn icon="bell" dot title="Notifications" onClick={() => setOpenNotif(s => !s)} />
          {openNotif && <NotifPanel />}
        </div>
        <Avatar m={memberById('lb')} size={36} />
      </div>
    </header>
  );
};

const NotifPanel = () => (
  <div className="pop" style={{ top: 'calc(100% + 8px)', right: 0, width: 330, padding: 6 }}>
    <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center' }}>
      <strong style={{ fontSize: 13 }}>Notifications</strong><span className="spacer"></span><span className="muted-2" style={{ fontSize: 11 }}>3 nouvelles</span>
    </div>
    {[
      { ic: 'folder-x', t: '3 dossiers membres incomplets', s: 'Pièces manquantes · à régulariser', tone: 'var(--danger)' },
      { ic: 'calendar-clock', t: 'AG ordinaire dans 14 jours', s: 'Convocation à diffuser', tone: 'var(--warn)' },
      { ic: 'file-signature', t: 'RI v.4 en attente de signature', s: 'Paul Delcourt', tone: 'var(--brand)' },
    ].map((n, i) => (
      <div key={i} style={{ padding: '9px 10px', display: 'flex', gap: 10, borderTop: '1px solid var(--border)' }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', flex: '0 0 28px', color: n.tone }}><Icon name={n.ic} style={{ width: 14, height: 14 }} /></div>
        <div><div style={{ fontWeight: 550, fontSize: 12.5 }}>{n.t}</div><div className="muted-2" style={{ fontSize: 11.5 }}>{n.s}</div></div>
      </div>
    ))}
  </div>
);

// ===== Modale générique =====
const Modal = ({ title, sub, icon, onClose, children, footer, width = 480 }) => {
  useIcons();
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          {icon && <div className="modal__icon"><Icon name={icon} style={{ width: 18, height: 18 }} /></div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal__title">{title}</div>
            {sub && <div className="modal__sub">{sub}</div>}
          </div>
          <IconBtn icon="x" onClick={onClose} title="Fermer" />
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
  );
};

// ===== Champs de formulaire =====
const Field = ({ label, required, children, half }) => (
  <label className="field" style={half ? { flex: '1 1 0', minWidth: 0 } : null}>
    <span className="field__label">{label}{required && <span style={{ color: 'var(--danger)' }}> *</span>}</span>
    {children}
  </label>
);
const TextField = ({ value, onChange, ...rest }) => (
  <input className="input" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
);
const SelectField = ({ value, onChange, options }) => (
  <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

// ===== Modales métier =====
const NewMemberModal = ({ onClose, navigate }) => {
  const poles = Array.from(new Set(MEMBERS.map(m => m.pole)));
  const [f, setF] = React.useState({ first: '', last: '', email: '', role: '', pole: poles[0] || 'SI', year: 'L1', status: 'active', phone: '', city: '' });
  const set = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const valid = f.first.trim() && f.last.trim();
  const submit = () => {
    if (!valid) return;
    const m = addMember(f);
    onClose();
    if (navigate) navigate(`dossier/${m.id}`);
  };
  return (
    <Modal icon="user-plus" title="Nouveau dossier membre" sub="Crée un dossier vide — les pièces seront à déposer ensuite" onClose={onClose}
      footer={<><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" icon="check" onClick={submit} >Créer le dossier</Btn></>}>
      <div className="form-row">
        <Field label="Prénom" required half><TextField value={f.first} onChange={set('first')} placeholder="Léa" autoFocus /></Field>
        <Field label="Nom" required half><TextField value={f.last} onChange={set('last')} placeholder="Bernard" /></Field>
      </div>
      <Field label="Email"><TextField value={f.email} onChange={set('email')} placeholder="auto : prenom.nom@jeece.fr" type="email" /></Field>
      <div className="form-row">
        <Field label="Rôle" half><TextField value={f.role} onChange={set('role')} placeholder="Chargé de mission" /></Field>
        <Field label="Pôle" half><SelectField value={f.pole} onChange={set('pole')} options={poles.map(p => ({ value: p, label: p }))} /></Field>
      </div>
      <div className="form-row">
        <Field label="Année" half><SelectField value={f.year} onChange={set('year')} options={['L1','L2','L3','M1','M2','Diplômé'].map(y => ({ value: y, label: y }))} /></Field>
        <Field label="Statut" half><SelectField value={f.status} onChange={set('status')} options={[{value:'active',label:'Actif'},{value:'pending',label:'Postulant'},{value:'alumni',label:'Alumni'},{value:'inactive',label:'Inactif'}]} /></Field>
      </div>
      <div className="form-row">
        <Field label="Téléphone" half><TextField value={f.phone} onChange={set('phone')} placeholder="+33 6 …" /></Field>
        <Field label="Ville" half><TextField value={f.city} onChange={set('city')} placeholder="Paris 11e" /></Field>
      </div>
      {!valid && <div className="form-hint"><Icon name="info" style={{ width: 13, height: 13 }} />Prénom et nom sont requis.</div>}
    </Modal>
  );
};

const UploadPieceModal = ({ onClose, memberId }) => {
  const m = memberById(memberId);
  const firstTodo = m ? (DOC_TYPES.find(d => m.docs[d.code] !== 'ok') || DOC_TYPES[0]).code : 'BA';
  const [code, setCode] = React.useState(firstTodo);
  const [status, setStatus] = React.useState('pending');
  if (!m) return null;
  const submit = () => { setDocStatus(memberId, code, status); onClose(); };
  return (
    <Modal icon="upload" title="Déposer une pièce" sub={`Dossier de ${m.first} ${m.last}`} onClose={onClose} width={440}
      footer={<><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" icon="check" onClick={submit}>Enregistrer</Btn></>}>
      <Field label="Type de pièce">
        <SelectField value={code} onChange={setCode} options={DOC_TYPES.map(d => ({ value: d.code, label: `${d.label}${m.docs[d.code] === 'ok' ? ' (déjà présent)' : ''}` }))} />
      </Field>
      <Field label="État de la pièce">
        <SelectField value={status} onChange={setStatus} options={[{ value: 'pending', label: 'Déposée — en attente de validation' }, { value: 'ok', label: 'Validée — présente et conforme' }]} />
      </Field>
      <div className="form-hint"><Icon name="shield-check" style={{ width: 13, height: 13, color: 'var(--brand)' }} />Pièce stockée de façon chiffrée · accès tracé.</div>
    </Modal>
  );
};

const NewDocModal = ({ onClose, author }) => {
  const [f, setF] = React.useState({ title: '', cat: 'cr', format: 'PDF', security: 'Interne', status: 'pending', pages: '', tags: '', author: author || 'lb' });
  const set = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const valid = f.title.trim();
  const submit = () => { if (!valid) return; addGedDoc(f); onClose(); };
  const catOptions = GED_CATS.filter(c => c.id !== 'all').map(c => ({ value: c.id, label: c.label }));
  return (
    <Modal icon="upload" title="Déposer un document" sub="Ajout à la GED — stockage cloud chiffré, accès tracé" onClose={onClose}
      footer={<><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" icon="check" onClick={submit}>Déposer</Btn></>}>
      <Field label="Titre du document" required><TextField value={f.title} onChange={set('title')} placeholder="CR Bureau — 5 mai 2026" autoFocus /></Field>
      <div className="form-row">
        <Field label="Catégorie" half><SelectField value={f.cat} onChange={set('cat')} options={catOptions} /></Field>
        <Field label="Confidentialité" half><SelectField value={f.security} onChange={set('security')} options={['Public','Interne','Confidentiel'].map(s => ({ value: s, label: s }))} /></Field>
      </div>
      <div className="form-row">
        <Field label="Format" half><SelectField value={f.format} onChange={set('format')} options={['PDF','DOCX','XLSX'].map(s => ({ value: s, label: s }))} /></Field>
        <Field label="Pages" half><TextField value={f.pages} onChange={set('pages')} placeholder="4" type="number" min="1" /></Field>
      </div>
      <Field label="Statut"><SelectField value={f.status} onChange={set('status')} options={[{value:'pending',label:'À signer'},{value:'signed',label:'Signé'},{value:'archived',label:'Archivé'}]} /></Field>
      <Field label="Tags (séparés par des virgules)"><TextField value={f.tags} onChange={set('tags')} placeholder="bureau, vote" /></Field>
      {!valid && <div className="form-hint"><Icon name="info" style={{ width: 13, height: 13 }} />Le titre est requis.</div>}
    </Modal>
  );
};

const EditMemberModal = ({ onClose, memberId }) => {
  const m = memberById(memberId);
  const poles = Array.from(new Set(MEMBERS.map(x => x.pole)));
  const [f, setF] = React.useState(m ? { first: m.first, last: m.last, email: m.email, role: m.role, pole: m.pole, year: m.year, status: m.status, phone: m.phone, city: m.city, birth: m.birth || '', address: m.address || '' } : null);
  const set = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  if (!m) return null;
  const valid = f.first.trim() && f.last.trim();
  const submit = () => { if (!valid) return; updateMember(memberId, f); onClose(); };
  return (
    <Modal icon="pencil" title="Éditer l'identité" sub={`${m.first} ${m.last}`} onClose={onClose}
      footer={<><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" icon="check" onClick={submit}>Enregistrer</Btn></>}>
      <div className="form-row">
        <Field label="Prénom" required half><TextField value={f.first} onChange={set('first')} /></Field>
        <Field label="Nom" required half><TextField value={f.last} onChange={set('last')} /></Field>
      </div>
      <div className="form-row">
        <Field label="Date de naissance" half><TextField value={f.birth} onChange={set('birth')} placeholder="12 janvier 2004" /></Field>
        <Field label="Téléphone" half><TextField value={f.phone} onChange={set('phone')} /></Field>
      </div>
      <Field label="Email"><TextField value={f.email} onChange={set('email')} type="email" /></Field>
      <Field label="Adresse"><TextField value={f.address} onChange={set('address')} placeholder="8 rue Saint-Maur, 75011 Paris" /></Field>
      <div className="form-row">
        <Field label="Rôle" half><TextField value={f.role} onChange={set('role')} /></Field>
        <Field label="Pôle" half><SelectField value={f.pole} onChange={set('pole')} options={poles.map(p => ({ value: p, label: p }))} /></Field>
      </div>
      <div className="form-row">
        <Field label="Année" half><SelectField value={f.year} onChange={set('year')} options={['L1','L2','L3','M1','M2','Diplômé'].map(y => ({ value: y, label: y }))} /></Field>
        <Field label="Statut" half><SelectField value={f.status} onChange={set('status')} options={[{value:'active',label:'Actif'},{value:'pending',label:'Postulant'},{value:'alumni',label:'Alumni'},{value:'inactive',label:'Inactif'}]} /></Field>
      </div>
      <Field label="Ville"><TextField value={f.city} onChange={set('city')} /></Field>
    </Modal>
  );
};

const GenerateDocModal = ({ onClose, memberId }) => {
  const others = MEMBERS;
  const [mid, setMid] = React.useState(memberId || (others[0] && others[0].id));
  const [tplId, setTplId] = React.useState(DOC_TEMPLATES[0].id);
  const m = memberById(mid);
  const tpl = DOC_TEMPLATES.find(t => t.id === tplId);
  const generate = () => {
    if (!m || !tpl) return;
    const html = renderDocHTML(tpl, m);
    downloadBlob(`${tpl.title(m).replace(/[^\w\- ]/g, '')}.html`, html, 'text/html;charset=utf-8');
    addGedDoc({ title: tpl.title(m), cat: tpl.cat, format: 'HTML', status: 'pending', author: 'lb', tags: 'généré, modèle', security: 'Interne' });
    onClose();
  };
  return (
    <Modal icon="file-plus-2" title="Générer un document" sub="Pré-rempli depuis les infos du membre · téléchargé + ajouté à la GED" onClose={onClose}
      footer={<><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" icon="download" onClick={generate}>Générer & télécharger</Btn></>}>
      <Field label="Modèle">
        <SelectField value={tplId} onChange={setTplId} options={DOC_TEMPLATES.map(t => ({ value: t.id, label: t.label }))} />
      </Field>
      <Field label="Membre concerné">
        <SelectField value={mid} onChange={setMid} options={others.map(x => ({ value: x.id, label: `${x.first} ${x.last} · ${x.role}` }))} />
      </Field>
      {m && tpl && (
        <div className="form-hint" style={{ display: 'block' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}><Icon name="eye" style={{ width: 13, height: 13 }} /> Aperçu</div>
          « {tpl.title(m)} » — généré au nom de {m.first} {m.last} ({m.role}, {m.pole}).
        </div>
      )}
    </Modal>
  );
};

const ConfirmModal = ({ onClose, title, message, confirmLabel = 'Confirmer', danger, onConfirm }) => (
  <Modal icon={danger ? 'trash-2' : 'help-circle'} title={title} onClose={onClose} width={420}
    footer={<><Btn onClick={onClose}>Annuler</Btn>
      <Btn kind="primary" icon={danger ? 'trash-2' : 'check'} style={danger ? { background: 'var(--danger)', borderColor: 'var(--danger)', boxShadow: 'none' } : null}
        onClick={() => { onConfirm && onConfirm(); onClose(); }}>{confirmLabel}</Btn></>}>
    <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{message}</div>
  </Modal>
);

// Hôte des modales : écoute « sg:modal » et affiche la bonne modale.
const ModalHost = ({ navigate }) => {
  const [modal, setModal] = React.useState(null);
  React.useEffect(() => {
    const onOpen = (e) => setModal(e.detail);
    window.addEventListener('sg:modal', onOpen);
    return () => window.removeEventListener('sg:modal', onOpen);
  }, []);
  if (!modal) return null;
  const close = () => setModal(null);
  const p = modal.props || {};
  if (modal.type === 'member')     return <NewMemberModal onClose={close} navigate={navigate} />;
  if (modal.type === 'editMember') return <EditMemberModal onClose={close} {...p} />;
  if (modal.type === 'doc')        return <NewDocModal onClose={close} {...p} />;
  if (modal.type === 'piece')      return <UploadPieceModal onClose={close} {...p} />;
  if (modal.type === 'generate')   return <GenerateDocModal onClose={close} {...p} />;
  if (modal.type === 'confirm')    return <ConfirmModal onClose={close} {...p} />;
  return null;
};

Object.assign(window, { cls, useIcons, useStore, openModal, downloadBlob, toCSV, exportMembersCSV, exportDocsCSV, Icon, Avatar, Badge, Btn, IconBtn, Card, Empty, Ring, Bar, Sidebar, Header, Modal, Field, TextField, SelectField, ModalHost });
