// Shared tokens, icons, chrome (sidebar + topbar) for the RDI app mockups.
// Exposes via window.* so each screen file can pick what it needs.

const RDI_TOKENS = {
  bg: '#FAF8F3',
  surface: '#FFFFFF',
  surfaceWarm: '#F5F2EB',
  ink: '#14201A',
  ink2: '#5C6660',
  ink3: '#8B928D',
  line: '#E8E5DA',
  line2: '#D6D2C4',
  forest: '#1F4D3A',
  forestDeep: '#0E2B20',
  forestSoft: '#E6EEE7',
  lime: '#D8E84C',
  limeSoft: '#F1F5C8',
  amber: '#E8AA3D',
  amberSoft: '#FBEFCE',
  clay: '#C2603E',
  claySoft: '#F4DDD0',
  rose: '#B8475C',
  roseSoft: '#F4DCE2',
  blue: '#2F5BA8',
  blueSoft: '#DEE7F6',
};

// Lucide-style stroke icons, tuned to 1.6 weight.
const Icon = ({ d, size = 16, stroke = 'currentColor', strokeWidth = 1.6, fill = 'none', children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {children || <path d={d} />}
  </svg>
);

const Icons = {
  dashboard: (p) => <Icon {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></Icon>,
  pipeline: (p) => <Icon {...p}><rect x="3" y="4" width="4" height="16" rx="1"/><rect x="10" y="4" width="4" height="11" rx="1"/><rect x="17" y="4" width="4" height="7" rx="1"/></Icon>,
  users: (p) => <Icon {...p}><circle cx="9" cy="8" r="3.2"/><path d="M3 20c1.2-3.2 3.4-4.8 6-4.8s4.8 1.6 6 4.8"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.5c2.4.2 4.2 1.5 5 3.5"/></Icon>,
  briefcase: (p) => <Icon {...p}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/></Icon>,
  survey: (p) => <Icon {...p}><path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M8 11h8M8 15h6M8 7h4"/></Icon>,
  shield: (p) => <Icon {...p}><path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6l-8-3z"/><path d="m9 12 2 2 4-4"/></Icon>,
  settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></Icon>,
  search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>,
  bell: (p) => <Icon {...p}><path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 19a2 2 0 0 0 4 0"/></Icon>,
  plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  filter: (p) => <Icon {...p}><path d="M3 5h18M6 12h12M10 19h4"/></Icon>,
  arrowUp: (p) => <Icon {...p}><path d="M12 19V5M5 12l7-7 7 7"/></Icon>,
  arrowDown: (p) => <Icon {...p}><path d="M12 5v14M19 12l-7 7-7-7"/></Icon>,
  arrowRight: (p) => <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7"/></Icon>,
  more: (p) => <Icon {...p}><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></Icon>,
  check: (p) => <Icon {...p}><path d="m5 12 5 5L20 7"/></Icon>,
  alert: (p) => <Icon {...p}><path d="M12 4 2 20h20L12 4z"/><path d="M12 10v4M12 18v.01"/></Icon>,
  clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  spark: (p) => <Icon {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></Icon>,
  mail: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></Icon>,
  phone: (p) => <Icon {...p}><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></Icon>,
  link: (p) => <Icon {...p}><path d="M10 14a5 5 0 0 1 0-7l3-3a5 5 0 1 1 7 7l-1 1"/><path d="M14 10a5 5 0 0 1 0 7l-3 3a5 5 0 1 1-7-7l1-1"/></Icon>,
  doc: (p) => <Icon {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></Icon>,
  download: (p) => <Icon {...p}><path d="M12 4v12M6 12l6 6 6-6M4 20h16"/></Icon>,
  star: (p) => <Icon {...p}><path d="M12 3.5 14.5 9l5.5.6-4.2 3.8 1.2 5.6L12 16.3 6.9 19l1.2-5.6L4 9.6 9.5 9 12 3.5z"/></Icon>,
  drag: (p) => <Icon {...p}><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></Icon>,
  external: (p) => <Icon {...p}><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/></Icon>,
  globe: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></Icon>,
};

// ---------- Sidebar ----------
const SIDE_NAV = [
  { id: 'dash', label: 'Tableau de bord', icon: 'dashboard' },
  { id: 'pipeline', label: 'Pipeline', icon: 'pipeline', count: 47 },
  { id: 'intervenants', label: 'Intervenants', icon: 'users', count: 23 },
  { id: 'missions', label: 'Missions', icon: 'briefcase', count: 14 },
  { id: 'es', label: 'Enquêtes ES', icon: 'survey', count: 8 },
  { id: 'cnje', label: 'Conformité CNJE', icon: 'shield' },
];

const Sidebar = ({ active = 'dash' }) => {
  const t = RDI_TOKENS;
  return (
    <aside style={{
      width: 224, flex: '0 0 224px', background: t.forestDeep, color: '#E8EDE5',
      display: 'flex', flexDirection: 'column', padding: '20px 14px 16px',
      fontSize: 13, fontFamily: 'Geist, sans-serif',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 22px' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: t.lime, color: t.forestDeep,
          fontFamily: '"Instrument Serif", serif', fontSize: 22, fontStyle: 'italic',
          display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
          paddingTop: 2,
        }}>R</div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>RDI Studio</span>
          <span style={{ fontSize: 11, color: 'rgba(232,237,229,.55)', marginTop: 2 }}>JE Sciences Po · 26</span>
        </div>
      </div>

      {/* Workspace switcher */}
      <button style={{
        background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 8, padding: '8px 10px', color: '#E8EDE5', display: 'flex',
        alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 16, cursor: 'pointer',
        fontFamily: 'inherit',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: 2, background: t.lime }} />
        <span style={{ flex: 1, textAlign: 'left' }}>Mandat 2025–2026</span>
        <Icons.arrowDown size={12} stroke="rgba(232,237,229,.55)" />
      </button>

      {/* Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {SIDE_NAV.map(item => {
          const I = Icons[item.icon];
          const isActive = item.id === active;
          return (
            <a key={item.id} href="#" style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
              borderRadius: 7, color: isActive ? t.forestDeep : 'rgba(232,237,229,.78)',
              background: isActive ? t.lime : 'transparent',
              fontWeight: isActive ? 500 : 400, textDecoration: 'none',
              fontSize: 13,
            }}>
              <I size={16} stroke={isActive ? t.forestDeep : 'rgba(232,237,229,.7)'} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.count != null && (
                <span style={{
                  fontSize: 11, fontVariantNumeric: 'tabular-nums',
                  padding: '1px 6px', borderRadius: 999,
                  background: isActive ? 'rgba(14,43,32,.12)' : 'rgba(255,255,255,.06)',
                  color: isActive ? t.forestDeep : 'rgba(232,237,229,.55)',
                }}>{item.count}</span>
              )}
            </a>
          );
        })}
      </div>

      {/* Integrations */}
      <div style={{ marginTop: 22 }}>
        <div style={{
          fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em',
          color: 'rgba(232,237,229,.4)', padding: '0 10px 8px',
        }}>Intégrations</div>
        {[
          { k: 'Plane', s: 'Sync il y a 4m', dot: '#7C5CFF' },
          { k: 'Jaeger CRM', s: '12 missions', dot: '#FF8A4C' },
          { k: 'Tally Forms', s: '47 réponses', dot: '#5BC9D6' },
          { k: 'Google Drive', s: 'OK', dot: '#9BBF6E' },
        ].map(i => (
          <div key={i.k} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px',
            fontSize: 12, color: 'rgba(232,237,229,.7)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: i.dot }} />
            <span style={{ flex: 1 }}>{i.k}</span>
            <span style={{ fontSize: 10.5, color: 'rgba(232,237,229,.4)' }}>{i.s}</span>
          </div>
        ))}
      </div>

      {/* User card pinned bottom */}
      <div style={{ marginTop: 'auto', padding: '12px 8px 4px', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name="Léa Marchand" size={28} hue={140} />
        <div style={{ flex: 1, lineHeight: 1.2 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500 }}>Léa Marchand</div>
          <div style={{ fontSize: 11, color: 'rgba(232,237,229,.5)' }}>VP RDI</div>
        </div>
        <Icons.settings size={14} stroke="rgba(232,237,229,.5)" />
      </div>
    </aside>
  );
};

// ---------- Topbar ----------
const Topbar = ({ title, sub, right }) => {
  const t = RDI_TOKENS;
  return (
    <header style={{
      height: 60, flex: '0 0 60px', borderBottom: `1px solid ${t.line}`,
      background: t.bg, padding: '0 28px', display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: t.ink3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{sub}</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: t.ink, letterSpacing: '-0.01em' }}>{title}</div>
      </div>
      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
        background: t.surface, border: `1px solid ${t.line}`, borderRadius: 8,
        width: 280, color: t.ink3, fontSize: 13,
      }}>
        <Icons.search size={14} stroke={t.ink3} />
        <span style={{ flex: 1 }}>Rechercher intervenants, missions…</span>
        <kbd style={{
          fontSize: 10.5, fontFamily: 'JetBrains Mono, monospace',
          padding: '1px 5px', border: `1px solid ${t.line}`, borderRadius: 4,
          color: t.ink3, background: t.surfaceWarm,
        }}>⌘K</kbd>
      </div>
      <button style={iconBtn()}>
        <Icons.bell size={15} stroke={t.ink} />
        <span style={{
          position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: 999,
          background: t.clay, border: `1.5px solid ${t.bg}`,
        }} />
      </button>
      {right}
    </header>
  );
};

// ---------- atoms ----------
const Avatar = ({ name = '', size = 32, hue, src }) => {
  const initials = name.split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const h = hue ?? (name.length * 47) % 360;
  return (
    <div style={{
      width: size, height: size, flex: `0 0 ${size}px`, borderRadius: 999,
      background: src ? `center/cover url(${src})` : `oklch(0.78 0.07 ${h})`,
      color: `oklch(0.28 0.05 ${h})`, fontFamily: 'Geist, sans-serif',
      fontSize: size * 0.38, fontWeight: 600, display: 'flex',
      alignItems: 'center', justifyContent: 'center', letterSpacing: '-0.02em',
      border: '1.5px solid rgba(255,255,255,0.7)',
      boxShadow: '0 0 0 1px rgba(20,32,26,0.06)',
    }}>{src ? '' : initials}</div>
  );
};

const Pill = ({ tone = 'neutral', children, dot, style }) => {
  const t = RDI_TOKENS;
  const tones = {
    neutral: { bg: t.surfaceWarm, fg: t.ink2, dot: t.ink3 },
    forest:  { bg: t.forestSoft, fg: t.forest, dot: t.forest },
    lime:    { bg: t.limeSoft, fg: '#5A6815', dot: '#8DA01F' },
    amber:   { bg: t.amberSoft, fg: '#7E5A12', dot: t.amber },
    clay:    { bg: t.claySoft, fg: '#7A3520', dot: t.clay },
    rose:    { bg: t.roseSoft, fg: '#7A2336', dot: t.rose },
    blue:    { bg: t.blueSoft, fg: '#1E3D78', dot: t.blue },
    ghost:   { bg: 'transparent', fg: t.ink2, dot: t.ink3 },
  };
  const c = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px',
      borderRadius: 999, background: c.bg, color: c.fg, fontSize: 11.5, fontWeight: 500,
      lineHeight: 1.5, whiteSpace: 'nowrap', ...style,
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: 999, background: c.dot }} />}
      {children}
    </span>
  );
};

const Btn = ({ kind = 'ghost', children, icon, style, ...rest }) => {
  const t = RDI_TOKENS;
  const kinds = {
    primary: { bg: t.forest, fg: '#F4F8F2', bd: t.forest },
    accent:  { bg: t.lime, fg: t.forestDeep, bd: t.lime },
    ghost:   { bg: t.surface, fg: t.ink, bd: t.line2 },
    soft:    { bg: t.surfaceWarm, fg: t.ink, bd: t.line },
    plain:   { bg: 'transparent', fg: t.ink, bd: 'transparent' },
  };
  const k = kinds[kind] || kinds.ghost;
  return (
    <button {...rest} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px',
      borderRadius: 8, background: k.bg, color: k.fg, border: `1px solid ${k.bd}`,
      fontSize: 12.5, fontWeight: 500, fontFamily: 'Geist, sans-serif',
      cursor: 'pointer', letterSpacing: '-0.005em', ...style,
    }}>
      {icon}
      {children}
    </button>
  );
};

const iconBtn = () => ({
  position: 'relative', width: 34, height: 34, borderRadius: 8,
  background: RDI_TOKENS.surface, border: `1px solid ${RDI_TOKENS.line2}`,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
});

const Card = ({ children, style, pad = 18 }) => (
  <div style={{
    background: RDI_TOKENS.surface, border: `1px solid ${RDI_TOKENS.line}`,
    borderRadius: 14, padding: pad, ...style,
  }}>{children}</div>
);

const SectionLabel = ({ children, hint, style }) => (
  <div style={{
    display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10,
    fontSize: 11, color: RDI_TOKENS.ink3, letterSpacing: '0.06em',
    textTransform: 'uppercase', fontWeight: 500, ...style,
  }}>
    <span>{children}</span>
    {hint && <span style={{ textTransform: 'none', letterSpacing: 'normal', color: RDI_TOKENS.ink3, fontSize: 11.5 }}>{hint}</span>}
  </div>
);

// ---------- App frame (sidebar + main column) ----------
const AppFrame = ({ active, title, sub, topbarRight, children }) => (
  <div style={{
    width: '100%', height: '100%', display: 'flex',
    background: RDI_TOKENS.bg, color: RDI_TOKENS.ink,
    fontFamily: 'Geist, sans-serif', fontSize: 13, lineHeight: 1.45,
    letterSpacing: '-0.005em',
  }}>
    <Sidebar active={active} />
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <Topbar title={title} sub={sub} right={topbarRight} />
      <main style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '22px 28px 28px' }}>
        {children}
      </main>
    </div>
  </div>
);

Object.assign(window, {
  RDI_TOKENS, Icons, Sidebar, Topbar, Avatar, Pill, Btn, Card, SectionLabel,
  AppFrame, iconBtn,
});
