// JEECE · SG — composants partagés + chrome
const cls = (...xs) => xs.filter(Boolean).join(' ');

const useIcons = () => {
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.7 } }); });
};
const Icon = ({ name, style, className }) => <i data-lucide={name} style={style} className={className}></i>;

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
        <Btn kind="primary" size="sm" icon="plus">Nouveau dossier</Btn>
        <IconBtn icon="folder-plus" title="Déposer un document" />
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

Object.assign(window, { cls, useIcons, Icon, Avatar, Badge, Btn, IconBtn, Card, Empty, Ring, Bar, Sidebar, Header });
