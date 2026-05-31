// Shared UI atoms + chrome (Sidebar, Header, Avatar, Badge, Btn, Icon)

const cls = (...xs) => xs.filter(Boolean).join(' ');

// Re-create lucide icons after each render.
const useLucideIcons = () => {
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.6 } });
  });
};

const LucideIcon = ({ name, style, className }) => (
  <i data-lucide={name} style={style} className={className}></i>
);
const Icon = LucideIcon;

const Avatar = ({ m, size = 32, color }) => {
  // Accept either a member object or just initials + color via props.
  const initials = m?.initials || '?';
  const c = m?.color || color || 'c1';
  const fs = size <= 22 ? 10 : size <= 28 ? 11 : size <= 36 ? 13 : 19;
  return (
    <div className={cls('avatar', `avatar--${c}`)}
      style={{ width: size, height: size, fontSize: fs }}>
      {initials}
    </div>
  );
};

const Badge = ({ tone = 'neutral', dot, children, style }) => (
  <span className={cls('badge', tone !== 'neutral' && `badge--${tone}`)} style={style}>
    {dot && <span className="dot"></span>}
    {children}
  </span>
);

const Btn = ({ kind = 'default', size, icon, children, onClick, type = 'button', active, disabled, style }) => (
  <button type={type} disabled={disabled} onClick={onClick}
    className={cls('btn',
      kind === 'primary' && 'btn--primary',
      kind === 'accent' && 'btn--accent',
      kind === 'ghost' && 'btn--ghost',
      size === 'sm' && 'btn--sm',
      active && 'btn--active'
    )} style={style}>
    {icon && <Icon name={icon} />}
    {children}
  </button>
);

const IconBtn = ({ icon, onClick, badge, ariaLabel, style }) => (
  <button type="button" className="icon-btn" aria-label={ariaLabel} onClick={onClick} style={style}>
    <Icon name={icon} />
    {badge && <span className="icon-btn__dot"></span>}
  </button>
);

const Card = ({ title, sub, head, foot, children, action, style, bodyStyle, noBody }) => (
  <div className="card" style={style}>
    {(title || head) && (
      <div className="card__head">
        {head || (
          <>
            <div>
              <div className="card__title">{title}</div>
              {sub && <div className="card__sub">{sub}</div>}
            </div>
            <div className="spacer"></div>
            {action}
          </>
        )}
      </div>
    )}
    {noBody ? children : <div style={bodyStyle}>{children}</div>}
    {foot && <div className="card__foot">{foot}</div>}
  </div>
);

// ============== Sidebar ==============
const SIDE = [
  { id: 'dashboard', k: 'Dashboard', icon: 'layout-dashboard' },
  { id: 'annuaire', k: 'Annuaire', icon: 'users', count: () => MEMBERS.length },
  { id: 'fiche', k: 'Fiche membre', icon: 'user', hidden: true },
  { id: 'bibliotheque', k: 'Bibliothèque docs', icon: 'library', count: () => DOCS.length + 298 /* visible total */, badge: () => DOCS.length + 298 },
];
const SIDE_GESTION = [
  { id: 'generation', k: 'Génération docs', icon: 'file-plus-2' },
  { id: 'echeances',  k: 'Échéances', icon: 'bell-ring', count: () => DEADLINES.length + 1 },
  { id: 'audit',      k: 'Audit trail', icon: 'history' },
  { id: 'parametres', k: 'Paramètres', icon: 'settings' },
];

const Sidebar = ({ route, navigate }) => {
  // Active is the screen the route resolves to. Fiche stays active while inside member detail.
  const active = route.name === 'fiche' ? 'fiche' : route.name;
  return (
    <aside className="sidebar">
      <a href="#/dashboard" className="sidebar__logo" style={{ textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); navigate('dashboard'); }}>
        <div className="sidebar__logo-mark">JE</div>
        <div>
          <div className="sidebar__logo-name">JEECE · SG</div>
          <div className="sidebar__logo-sub">Mandat 2025–2026</div>
        </div>
      </a>

      {SIDE.map(item => {
        if (item.hidden && active !== item.id) return null;
        const isActive = active === item.id;
        return (
          <a key={item.id} href={`#/${item.id}`}
            className={cls('sidebar__item', isActive && 'sidebar__item--active')}
            onClick={(e) => { e.preventDefault(); navigate(item.id); }}>
            <Icon name={item.icon} />
            <span>{item.k}</span>
            {item.count && <span className="sidebar__item-count">{item.count()}</span>}
          </a>
        );
      })}

      <div className="sidebar__group-label">Gestion</div>
      {SIDE_GESTION.map(item => (
        <a key={item.id} href="#" className="sidebar__item"
          onClick={(e) => e.preventDefault()}
          title="Démo · non implémenté">
          <Icon name={item.icon} />
          <span>{item.k}</span>
          {item.count && <span className="sidebar__item-count">{item.count()}</span>}
        </a>
      ))}

      <div className="sidebar__user">
        <Avatar m={memberById('lb')} size={32} />
        <div className="sidebar__user-meta">
          <div className="sidebar__user-name">Léa Bernard</div>
          <div className="sidebar__user-role">Secrétaire Général</div>
        </div>
        <Icon name="chevron-down" className="muted-2" />
      </div>
    </aside>
  );
};

// ============== Header ==============
const Header = ({ crumbs = [], onSearch, searchPlaceholder = 'Rechercher membre, doc, mandat…', searchValue, onSearchChange, onSearchFocus }) => {
  const [showNotif, setShowNotif] = React.useState(false);
  React.useEffect(() => {
    if (!showNotif) return;
    const onDoc = () => setShowNotif(false);
    window.addEventListener('click', onDoc);
    return () => window.removeEventListener('click', onDoc);
  }, [showNotif]);

  return (
    <header className="header">
      <nav className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="crumbs__sep">/</span>}
            {c.onClick ? (
              <a href="#" className="muted" onClick={(e) => { e.preventDefault(); c.onClick(); }}>{c.k}</a>
            ) : (
              <span className={cls(i === crumbs.length - 1 && 'crumbs__last')}>{c.k}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      <form className="header__search" onSubmit={(e) => { e.preventDefault(); onSearch && onSearch(searchValue); }}>
        <Icon name="search" />
        <input
          value={searchValue || ''}
          placeholder={searchPlaceholder}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          onFocus={onSearchFocus}
        />
        <kbd>⌘K</kbd>
      </form>

      <div className="header__actions">
        <IconBtn icon="help-circle" ariaLabel="Aide" />
        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <IconBtn icon="bell" ariaLabel="Notifications" badge onClick={() => setShowNotif(s => !s)} />
          {showNotif && <NotifPanel onClose={() => setShowNotif(false)} />}
        </div>
        <Avatar m={memberById('lb')} />
      </div>
    </header>
  );
};

const NotifPanel = ({ onClose }) => (
  <div style={{
    position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 340,
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)',
    zIndex: 20, padding: 6, fontSize: 12.5,
  }}>
    <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center' }}>
      <strong>Notifications</strong>
      <span className="spacer"></span>
      <span className="muted-2" style={{ fontSize: 11 }}>3 nouvelles</span>
    </div>
    {[
      { ic: 'alert-triangle', t: 'Déclaration préfecture en retard', s: 'Cerfa 13971 · échue le 9 mai', tone: '#DC2626' },
      { ic: 'file-signature', t: 'PV Bureau du 5 mai à signer', s: 'Hugo Martin a partagé · 4 pages', tone: '#F59E0B' },
      { ic: 'user-plus', t: '3 nouveaux postulants', s: 'Pôle SI, Com, RH', tone: '#4338CA' },
    ].map((n, i) => (
      <div key={i} style={{ padding: '8px 10px', display: 'flex', gap: 10, alignItems: 'flex-start', borderTop: '1px solid var(--border)' }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: '#F3F4F6', display: 'grid', placeItems: 'center', flex: '0 0 26px', color: n.tone }}>
          <Icon name={n.ic} style={{ width: 13, height: 13 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500 }}>{n.t}</div>
          <div className="muted" style={{ fontSize: 11.5 }}>{n.s}</div>
        </div>
      </div>
    ))}
    <div style={{ padding: 6, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
      <a href="#" className="muted" style={{ fontSize: 12 }} onClick={(e) => { e.preventDefault(); onClose(); }}>Tout marquer comme lu</a>
    </div>
  </div>
);

// Empty state
const Empty = ({ icon = 'search-x', title = 'Aucun résultat', sub = 'Essayez d’ajuster vos filtres.' }) => (
  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-2)' }}>
    <Icon name={icon} style={{ width: 28, height: 28, color: 'var(--text-3)', marginBottom: 8 }} />
    <div style={{ fontWeight: 500, color: 'var(--text)' }}>{title}</div>
    <div style={{ fontSize: 12.5, marginTop: 4 }}>{sub}</div>
  </div>
);

Object.assign(window, {
  cls, useLucideIcons, Icon, LucideIcon, Avatar, Badge, Btn, IconBtn, Card, Sidebar, Header, Empty,
});
