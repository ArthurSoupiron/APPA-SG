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

// Affiche un toast (notification éphémère en bas d'écran), géré par <ToastHost/>.
const toast = (msg, tone = 'ok') => window.dispatchEvent(new CustomEvent('sg:toast', { detail: { msg, tone } }));

// Prépare et ouvre l'email de relance d'un membre (pièces manquantes), puis trace l'action.
const doRelance = (m) => {
  const r = buildRelanceMailto(m);
  if (!r.count) { toast(`Dossier de ${m.first} déjà complet`, 'ok'); return; }
  window.location.href = r.href; // ouvre le client mail avec le brouillon pré-rempli
  logRelance(m);
};

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

// ===== Fichiers : lecture + zone de dépôt =====
const MAX_FILE = 1.5 * 1024 * 1024; // 1,5 Mo (limite localStorage)
const readFileAsDataURL = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(file);
});
const humanSize = (b) => b < 1024 ? b + ' o' : b < 1048576 ? Math.round(b / 1024) + ' Ko' : (b / 1048576).toFixed(1) + ' Mo';

const FileDrop = ({ value, onPick, accept = '.pdf,image/*' }) => {
  const [err, setErr] = React.useState('');
  const [over, setOver] = React.useState(false);
  const inputRef = React.useRef();
  const handle = async (file) => {
    if (!file) return;
    if (file.size > MAX_FILE) { setErr(`Fichier trop lourd (${humanSize(file.size)}). Maximum ${humanSize(MAX_FILE)}.`); return; }
    setErr('');
    const dataURL = await readFileAsDataURL(file);
    onPick({ name: file.name, type: file.type, size: file.size, dataURL });
  };
  return (
    <div>
      <div className={cls('dropzone', over && 'dropzone--over')}
        onClick={() => inputRef.current && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files[0]); }}>
        <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }}
          onChange={(e) => handle(e.target.files[0])} />
        {value ? (
          <div className="row" style={{ gap: 9, justifyContent: 'center' }}>
            <Icon name="file-check-2" style={{ width: 18, height: 18, color: 'var(--brand)' }} />
            <span style={{ fontSize: 12.5, fontWeight: 550 }}>{value.name}</span>
            <span className="muted-2" style={{ fontSize: 11 }}>{humanSize(value.size)}</span>
            <IconBtn icon="x" title="Retirer" style={{ width: 26, height: 26 }} onClick={(e) => { e.stopPropagation(); onPick(null); }} />
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--ink-2)' }}>
            <Icon name="upload-cloud" style={{ width: 22, height: 22, color: 'var(--ink-3)' }} />
            <div style={{ fontSize: 12.5, marginTop: 4 }}>Glissez un fichier ici, ou <span style={{ color: 'var(--brand-700)', fontWeight: 600 }}>parcourir</span></div>
            <div className="muted-2" style={{ fontSize: 11, marginTop: 2 }}>PDF ou image · max {humanSize(MAX_FILE)}</div>
          </div>
        )}
      </div>
      {err && <div className="form-hint" style={{ marginTop: 8, color: '#B23A33', borderColor: 'var(--danger-bg)', background: 'var(--danger-bg)' }}><Icon name="alert-triangle" style={{ width: 13, height: 13 }} />{err}</div>}
    </div>
  );
};

// Aperçu d'un fichier stocké (image ou PDF) via son dataURL
const FilePreview = ({ file, height = 340 }) => {
  if (!file) return null;
  if ((file.type || '').startsWith('image/')) return <img src={file.dataURL} alt={file.name} style={{ width: '100%', borderRadius: 8, display: 'block' }} />;
  if ((file.type || '').includes('pdf')) return <iframe src={file.dataURL} title={file.name} style={{ width: '100%', height, border: 'none', borderRadius: 8 }} />;
  return <div className="form-hint"><Icon name="file" style={{ width: 13, height: 13 }} />{file.name} — aperçu non disponible</div>;
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

// ===== Thème clair/sombre (persisté) =====
const THEME_KEY = 'jeece-sg-theme';
const applyTheme = (t) => { document.documentElement.setAttribute('data-theme', t); };
const initTheme = () => { try { applyTheme(localStorage.getItem(THEME_KEY) || 'light'); } catch (e) {} };
initTheme();

const ThemeToggle = () => {
  const [dark, setDark] = React.useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  const toggle = () => {
    const t = dark ? 'light' : 'dark';
    applyTheme(t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    setDark(!dark);
  };
  return (
    <button className="theme-toggle" onClick={toggle} title={dark ? 'Passer en clair' : 'Passer en sombre'}>
      <Icon name={dark ? 'sun' : 'moon'} style={{ width: 15, height: 15 }} />
      <span>{dark ? 'Mode clair' : 'Mode sombre'}</span>
    </button>
  );
};

// ===== Sidebar =====
const NAV = [
  { id: 'dashboard', label: "Tableau de bord", icon: 'layout-dashboard' },
  { id: 'membres',   label: 'Membres', icon: 'users', count: () => MEMBERS.length },
  { id: 'documents', label: 'Documents (GED)', icon: 'folder-open', count: () => DOCS.length },
  { id: 'conformite',label: 'Conformité', icon: 'shield-check', count: () => conformityOpen() },
  { id: 'journal',   label: "Journal d'audit", icon: 'history', count: () => ACTIVITY.length },
];
const NAV_2 = [
  { id: 'archives', label: 'Archives mandats', icon: 'archive' },
  { id: 'parametres', label: 'Paramètres', icon: 'settings' },
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
        <a key={it.id} href={`#/${it.id}`} className={cls('nav-item', active === it.id && 'nav-item--active')}
          onClick={(e) => { e.preventDefault(); navigate(it.id); }}>
          <Icon name={it.icon} /><span style={{ flex: 1 }}>{it.label}</span>
        </a>
      ))}

      <div className="side-card">
        <div className="side-card__h"><Icon name="folder-check" style={{ width: 14, height: 14 }} />Dossiers complets</div>
        <div className="side-card__bar"><i style={{ width: `${r.completePct}%` }}></i></div>
        <div className="side-card__meta">{r.complete} / {r.membersTotal} dossiers conformes · {r.completePct}%</div>
      </div>

      <ThemeToggle />

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
// Notifications calculées en direct depuis les données
const buildNotifs = () => {
  const ns = [];
  const incomplete = MEMBERS.filter(m => m.status !== 'alumni' && dossierStats(m).pct < 100);
  if (incomplete.length) ns.push({ ic: 'folder-x', t: `${incomplete.length} dossier(s) membres incomplets`, s: 'Pièces manquantes · à régulariser', tone: 'var(--danger)', go: 'membres' });
  const toSign = DOCS.filter(d => d.status === 'pending');
  if (toSign.length) ns.push({ ic: 'file-signature', t: `${toSign.length} document(s) à signer`, s: toSign[0].title, tone: 'var(--brand)', go: 'documents' });
  const soon = DEADLINES.map(d => ({ d, info: deadlineInfo(d) })).filter(x => x.info.days >= 0 && x.info.days <= 30).sort((a, b) => a.info.days - b.info.days)[0];
  if (soon) ns.push({ ic: 'calendar-clock', t: `${soon.d.title} · ${soon.info.delta}`, s: soon.d.sub, tone: 'var(--warn)', go: 'conformite' });
  return ns;
};

const Header = ({ crumbs = [], search, setSearch, navigate }) => {
  const [openSearch, setOpenSearch] = React.useState(false);
  const [openNotif, setOpenNotif] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef();
  const q = (search || '').trim().toLowerCase();

  const results = q ? [
    ...MEMBERS.filter(m => `${m.first} ${m.last} ${m.role}`.toLowerCase().includes(q)).slice(0, 4).map(m => ({ type: 'membre', m })),
    ...DOCS.filter(d => d.title.toLowerCase().includes(q) || d.ref.toLowerCase().includes(q)).slice(0, 3).map(d => ({ type: 'doc', d })),
  ] : [];

  React.useEffect(() => { setActive(0); }, [q]);

  React.useEffect(() => {
    const close = () => { setOpenNotif(false); setOpenSearch(false); };
    window.addEventListener('click', close);
    // raccourci ⌘K / Ctrl+K → focus la recherche
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current && inputRef.current.focus();
        setOpenSearch(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('click', close); window.removeEventListener('keydown', onKey); };
  }, []);

  const go = (r) => {
    if (!r) return;
    if (r.type === 'membre') navigate(`dossier/${r.m.id}`); else navigate('documents');
    setSearch(''); setOpenSearch(false);
  };
  const onSearchKey = (e) => {
    if (!results.length) { if (e.key === 'Escape') { setOpenSearch(false); e.target.blur(); } return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[active]); }
    else if (e.key === 'Escape') { setOpenSearch(false); e.target.blur(); }
  };

  const notifs = buildNotifs();

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
          <input ref={inputRef} placeholder="Rechercher un membre, un document, une référence…"
            value={search || ''} onChange={(e) => { setSearch(e.target.value); setOpenSearch(true); }}
            onFocus={() => setOpenSearch(true)} onKeyDown={onSearchKey} />
          <kbd>⌘K</kbd>
        </div>
        {openSearch && q && (
          <div className="pop" style={{ top: 'calc(100% + 6px)', left: 0, right: 0, padding: 6 }}>
            {results.length === 0 && <div style={{ padding: '10px 12px', color: 'var(--ink-3)', fontSize: 13 }}>Aucun résultat pour « {search} »</div>}
            {results.map((r, i) => r.type === 'membre' ? (
              <div key={i} className="pop__item" style={i === active ? { background: 'var(--brand-050)' } : null} onMouseEnter={() => setActive(i)} onClick={() => go(r)}>
                <Avatar m={r.m} size={26} />
                <div style={{ flex: 1 }}><div style={{ fontWeight: 550 }}>{r.m.first} {r.m.last}</div><div className="muted-2" style={{ fontSize: 11.5 }}>{r.m.role}</div></div>
                <Badge tone="ok">Membre</Badge>
              </div>
            ) : (
              <div key={i} className="pop__item" style={i === active ? { background: 'var(--brand-050)' } : null} onMouseEnter={() => setActive(i)} onClick={() => go(r)}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--ink-2)' }}><Icon name="file-text" style={{ width: 14, height: 14 }} /></div>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 550, fontSize: 12.5 }}>{r.d.title}</div><div className="muted-2 mono" style={{ fontSize: 11 }}>{r.d.ref}</div></div>
                <Badge tone="info">Doc</Badge>
              </div>
            ))}
            <div style={{ padding: '6px 11px 3px', fontSize: 10.5, color: 'var(--ink-3)', display: 'flex', gap: 10 }}>
              <span><kbd>↑</kbd> <kbd>↓</kbd> naviguer</span><span><kbd>↵</kbd> ouvrir</span><span><kbd>esc</kbd> fermer</span>
            </div>
          </div>
        )}
      </div>

      <div className="header__actions">
        <Btn kind="primary" size="sm" icon="plus" onClick={() => openModal('member')}>Nouveau dossier</Btn>
        <IconBtn icon="folder-plus" title="Déposer un document" onClick={() => openModal('doc')} />
        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <IconBtn icon="bell" dot={notifs.length > 0} title="Notifications" onClick={() => setOpenNotif(s => !s)} />
          {openNotif && <NotifPanel notifs={notifs} navigate={navigate} onClose={() => setOpenNotif(false)} />}
        </div>
        <Avatar m={memberById('lb')} size={36} />
      </div>
    </header>
  );
};

const NotifPanel = ({ notifs = [], navigate, onClose }) => (
  <div className="pop" style={{ top: 'calc(100% + 8px)', right: 0, width: 330, padding: 6 }}>
    <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center' }}>
      <strong style={{ fontSize: 13 }}>Notifications</strong><span className="spacer"></span>
      <span className="muted-2" style={{ fontSize: 11 }}>{notifs.length} active(s)</span>
    </div>
    {notifs.length === 0 && <div style={{ padding: '14px 10px', fontSize: 12.5, color: 'var(--ink-3)' }}>Rien à signaler — tout est à jour ✅</div>}
    {notifs.map((n, i) => (
      <div key={i} className="pop__item" style={{ borderTop: '1px solid var(--border)', borderRadius: 0, alignItems: 'flex-start' }}
        onClick={() => { navigate(n.go); onClose && onClose(); }}>
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
  const [file, setFile] = React.useState(null);
  if (!m) return null;
  const submit = () => { setDocStatus(memberId, code, status, file); onClose(); };
  return (
    <Modal icon="upload" title="Déposer une pièce" sub={`Dossier de ${m.first} ${m.last}`} onClose={onClose} width={440}
      footer={<><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" icon="check" onClick={submit}>Enregistrer</Btn></>}>
      <Field label="Type de pièce">
        <SelectField value={code} onChange={setCode} options={DOC_TYPES.map(d => ({ value: d.code, label: `${d.label}${m.docs[d.code] === 'ok' ? ' (déjà présent)' : ''}` }))} />
      </Field>
      <Field label="Fichier (optionnel)"><FileDrop value={file} onPick={setFile} /></Field>
      <Field label="État de la pièce">
        <SelectField value={status} onChange={setStatus} options={[{ value: 'pending', label: 'Déposée — en attente de validation' }, { value: 'ok', label: 'Validée — présente et conforme' }]} />
      </Field>
      <div className="form-hint"><Icon name="shield-check" style={{ width: 13, height: 13, color: 'var(--brand)' }} />Pièce stockée de façon chiffrée · accès tracé.</div>
    </Modal>
  );
};

const NewDocModal = ({ onClose, author }) => {
  const [f, setF] = React.useState({ title: '', cat: 'cr', format: 'PDF', security: 'Interne', status: 'pending', pages: '', tags: '', author: author || 'lb', file: null });
  const set = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const valid = f.title.trim();
  const submit = () => {
    if (!valid) return;
    const ext = f.file ? (f.file.name.split('.').pop() || '').toUpperCase() : f.format;
    addGedDoc({ ...f, format: ext || f.format, size: f.file ? humanSize(f.file.size) : '—' });
    onClose();
  };
  const pickFile = (file) => setF(s => ({
    ...s, file,
    title: s.title || (file ? file.name.replace(/\.[^.]+$/, '') : s.title),
  }));
  const catOptions = GED_CATS.filter(c => c.id !== 'all').map(c => ({ value: c.id, label: c.label }));
  return (
    <Modal icon="upload" title="Déposer un document" sub="Ajout à la GED — stockage cloud chiffré, accès tracé" onClose={onClose}
      footer={<><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" icon="check" onClick={submit}>Déposer</Btn></>}>
      <Field label="Fichier (optionnel)"><FileDrop value={f.file} onPick={pickFile} /></Field>
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

// Parse un CSV simple (séparateur ; ou ,) → tableau d'objets selon l'en-tête
const parseMembersCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return [];
  const sep = lines[0].includes(';') ? ';' : ',';
  const norm = (s) => s.trim().toLowerCase().replace(/\s+/g, '');
  const head = lines[0].replace(/^﻿/, '').split(sep).map(norm);
  const map = { prénom: 'first', prenom: 'first', nom: 'last', email: 'email', 'e-mail': 'email', téléphone: 'phone', telephone: 'phone', tel: 'phone', pôle: 'pole', pole: 'pole', rôle: 'role', role: 'role', année: 'year', annee: 'year', promo: 'promo', promotion: 'promo', statut: 'status', ville: 'city' };
  return lines.slice(1).map(line => {
    const cells = line.split(sep);
    const o = {};
    head.forEach((h, i) => { const k = map[h]; if (k) o[k] = (cells[i] || '').trim(); });
    return o;
  });
};

const ImportMembersModal = ({ onClose }) => {
  const [rows, setRows] = React.useState([]);
  const [err, setErr] = React.useState('');
  const onFile = async (file) => {
    if (!file) { setRows([]); return; }
    try {
      const text = await file.text();
      const parsed = parseMembersCSV(text).filter(r => r.first && r.last);
      if (!parsed.length) { setErr('Aucune ligne valide. Vérifiez les colonnes « Prénom » et « Nom ».'); setRows([]); return; }
      setErr(''); setRows(parsed);
    } catch (e) { setErr('Lecture du fichier impossible.'); }
  };
  const submit = () => { if (rows.length) addMembersBatch(rows); onClose(); };
  return (
    <Modal icon="upload" title="Importer des membres" sub="Fichier CSV — crée plusieurs dossiers d'un coup" onClose={onClose}
      footer={<><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" icon="user-plus" onClick={submit} >Importer {rows.length ? `(${rows.length})` : ''}</Btn></>}>
      <div className="form-hint" style={{ display: 'block' }}>
        Colonnes reconnues : <strong>Prénom; Nom; Email; Téléphone; Pôle; Rôle; Année; Promo; Statut; Ville</strong>.
        <br />Astuce : exporte d'abord l'annuaire pour obtenir le bon format, puis réimporte.
      </div>
      <Field label="Fichier CSV">
        <input className="input" type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files[0])} style={{ padding: 8 }} />
      </Field>
      {err && <div className="form-hint" style={{ color: '#B23A33', background: 'var(--danger-bg)', borderColor: 'var(--danger-bg)' }}><Icon name="alert-triangle" style={{ width: 13, height: 13 }} />{err}</div>}
      {rows.length > 0 && (
        <div className="form-hint" style={{ display: 'block' }}>
          <strong>{rows.length}</strong> membre(s) prêts à l'import :
          <div style={{ marginTop: 6, maxHeight: 120, overflowY: 'auto', fontSize: 12 }}>
            {rows.slice(0, 8).map((r, i) => <div key={i}>· {r.first} {r.last} {r.pole ? `— ${r.pole}` : ''}</div>)}
            {rows.length > 8 && <div className="muted-2">… et {rows.length - 8} autres</div>}
          </div>
        </div>
      )}
    </Modal>
  );
};

const AddMandateModal = ({ onClose, memberId }) => {
  const m = memberById(memberId);
  const [f, setF] = React.useState({ role: '', period: '', current: 'true' });
  const set = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  if (!m) return null;
  const valid = f.role.trim() && f.period.trim();
  const submit = () => { if (!valid) return; addMandate(memberId, { role: f.role, period: f.period, current: f.current === 'true' }); onClose(); };
  return (
    <Modal icon="milestone" title="Ajouter un mandat" sub={`Parcours de ${m.first} ${m.last}`} onClose={onClose} width={440}
      footer={<><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" icon="check" onClick={submit}>Ajouter</Btn></>}>
      <Field label="Rôle / fonction" required><TextField value={f.role} onChange={set('role')} placeholder="VP Communication" autoFocus /></Field>
      <Field label="Période" required><TextField value={f.period} onChange={set('period')} placeholder="Sept. 2025 → en cours" /></Field>
      <Field label="Mandat en cours ?"><SelectField value={f.current} onChange={set('current')} options={[{ value: 'true', label: 'Oui — mandat actuel' }, { value: 'false', label: 'Non — mandat passé' }]} /></Field>
    </Modal>
  );
};

const AddDeadlineModal = ({ onClose }) => {
  const [f, setF] = React.useState({ title: '', date: '', kind: 'AG', sub: '' });
  const set = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const valid = f.title.trim() && f.date;
  const submit = () => { if (!valid) return; addDeadline(f); onClose(); };
  return (
    <Modal icon="calendar-plus" title="Ajouter une échéance" sub="Calendrier réglementaire · J−X calculé automatiquement" onClose={onClose} width={460}
      footer={<><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" icon="check" onClick={submit}>Ajouter</Btn></>}>
      <Field label="Intitulé" required><TextField value={f.title} onChange={set('title')} placeholder="Renouvellement assurance RC" autoFocus /></Field>
      <div className="form-row">
        <Field label="Date" required half><TextField value={f.date} onChange={set('date')} type="date" /></Field>
        <Field label="Type" half><SelectField value={f.kind} onChange={set('kind')} options={['AG','Assurance','Compta','Mandat','Préfecture','Autre'].map(k => ({ value: k, label: k }))} /></Field>
      </div>
      <Field label="Détail"><TextField value={f.sub} onChange={set('sub')} placeholder="Allianz · contrat FR-208441" /></Field>
    </Modal>
  );
};

const NewDocTypeModal = ({ onClose }) => {
  const [f, setF] = React.useState({ code: '', label: '', icon: 'file', required: 'true' });
  const set = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const valid = f.code.trim() && f.label.trim();
  const submit = () => {
    if (!valid) return;
    if (DOC_TYPES.some(d => d.code === f.code.trim().toUpperCase())) { toast('Ce code existe déjà', 'warn'); return; }
    addDocType({ code: f.code, label: f.label, icon: f.icon, required: f.required === 'true' });
    toast('Type de pièce ajouté', 'ok');
    onClose();
  };
  return (
    <Modal icon="file-plus-2" title="Nouveau type de pièce" sub="Document officiel suivi dans les dossiers" onClose={onClose} width={440}
      footer={<><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" icon="check" onClick={submit}>Ajouter</Btn></>}>
      <div className="form-row">
        <Field label="Code court" required half><TextField value={f.code} onChange={set('code')} placeholder="PASS" autoFocus /></Field>
        <Field label="Icône (Lucide)" half><TextField value={f.icon} onChange={set('icon')} placeholder="file" /></Field>
      </div>
      <Field label="Libellé" required><TextField value={f.label} onChange={set('label')} placeholder="Passeport / pièce d'identité" /></Field>
      <Field label="Caractère"><SelectField value={f.required} onChange={set('required')} options={[{ value: 'true', label: 'Obligatoire' }, { value: 'false', label: 'Optionnel' }]} /></Field>
    </Modal>
  );
};

const NewCatModal = ({ onClose }) => {
  const [f, setF] = React.useState({ label: '', icon: 'folder' });
  const set = (k) => (v) => setF(s => ({ ...s, [k]: v }));
  const valid = f.label.trim();
  const submit = () => { if (!valid) return; addCat({ label: f.label, icon: f.icon }); toast('Catégorie ajoutée', 'ok'); onClose(); };
  return (
    <Modal icon="folder-plus" title="Nouvelle catégorie GED" sub="Classement des documents officiels" onClose={onClose} width={440}
      footer={<><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" icon="check" onClick={submit}>Ajouter</Btn></>}>
      <Field label="Libellé" required><TextField value={f.label} onChange={set('label')} placeholder="Partenariats" autoFocus /></Field>
      <Field label="Icône (Lucide)"><TextField value={f.icon} onChange={set('icon')} placeholder="folder" /></Field>
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

// Hôte des toasts : empile les notifications éphémères, auto-disparition.
const ToastHost = () => {
  const [items, setItems] = React.useState([]);
  useIcons();
  React.useEffect(() => {
    const onToast = (e) => {
      const id = Date.now() + Math.random();
      setItems(xs => [...xs, { id, ...e.detail }]);
      setTimeout(() => setItems(xs => xs.filter(t => t.id !== id)), 3200);
    };
    window.addEventListener('sg:toast', onToast);
    return () => window.removeEventListener('sg:toast', onToast);
  }, []);
  const ic = { ok: 'check-circle', info: 'info', warn: 'alert-triangle', danger: 'x-circle' };
  return (
    <div className="toast-host">
      {items.map(t => (
        <div key={t.id} className={cls('toast', `toast--${t.tone}`)}>
          <Icon name={ic[t.tone] || 'bell'} style={{ width: 16, height: 16 }} />
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
};

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
  if (modal.type === 'import')     return <ImportMembersModal onClose={close} {...p} />;
  if (modal.type === 'mandate')    return <AddMandateModal onClose={close} {...p} />;
  if (modal.type === 'deadline')   return <AddDeadlineModal onClose={close} {...p} />;
  if (modal.type === 'docType')    return <NewDocTypeModal onClose={close} {...p} />;
  if (modal.type === 'cat')        return <NewCatModal onClose={close} {...p} />;
  if (modal.type === 'confirm')    return <ConfirmModal onClose={close} {...p} />;
  return null;
};

Object.assign(window, { cls, useIcons, useStore, openModal, toast, doRelance, downloadBlob, toCSV, exportMembersCSV, exportDocsCSV, humanSize, FileDrop, FilePreview, Icon, Avatar, Badge, Btn, IconBtn, Card, Empty, Ring, Bar, Sidebar, Header, Modal, Field, TextField, SelectField, ModalHost, ToastHost, ThemeToggle });
