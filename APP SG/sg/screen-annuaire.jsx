// SG · Annuaire — recherche + filtres + tri + clic ligne → fiche
const ScreenAnnuaire = ({ navigate, search, setSearch }) => {
  useLucideIcons();
  const [localSearch, setLocalSearch] = React.useState('');
  const [pole, setPole] = React.useState('all');
  const [status, setStatus] = React.useState('all');
  const [promo, setPromo] = React.useState('all');
  const [mandat, setMandat] = React.useState('25-26');
  const [view, setView] = React.useState('list');

  const q = (search || localSearch || '').trim().toLowerCase();

  const filtered = MEMBERS.filter(m => {
    if (pole !== 'all' && m.pole !== pole) return false;
    if (status !== 'all' && m.status !== status) return false;
    if (promo !== 'all' && String(m.promo) !== promo) return false;
    if (q) {
      const hay = `${m.first} ${m.last} ${m.email} ${m.role}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const polesUsed = ['all', ...new Set(MEMBERS.map(m => m.pole))];
  const promos = ['all', ...new Set(MEMBERS.map(m => String(m.promo)))].sort();

  const reset = () => { setLocalSearch(''); setSearch?.(''); setPole('all'); setStatus('all'); setPromo('all'); setMandat('25-26'); };

  const Dropdown = ({ label, value, options, onChange, labelFn = (v) => v }) => {
    const [open, setOpen] = React.useState(false);
    React.useEffect(() => {
      if (!open) return;
      const close = () => setOpen(false);
      window.addEventListener('click', close);
      return () => window.removeEventListener('click', close);
    }, [open]);
    const isActive = value !== 'all' && value !== '25-26';
    return (
      <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <span className={cls('filter-chip', isActive && 'filter-chip--active')} onClick={() => setOpen(o => !o)}>
          {label} · {labelFn(value)} <Icon name="chevron-down" />
        </span>
        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: 180, zIndex: 30,
            background: '#fff', border: '1px solid var(--border)', borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: 4, fontSize: 13,
          }}>
            {options.map(opt => (
              <div key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{ padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
                  background: opt.value === value ? 'var(--primary-soft)' : 'transparent',
                  color: opt.value === value ? 'var(--primary)' : 'var(--text)' }}>
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Annuaire des membres</h1>
          <div className="page__sub">
            {MEMBERS.filter(m => m.status === 'active').length + 75} membres actifs · 12 alumni · 3 postulants
          </div>
        </div>
        <div className="page__actions">
          <Btn icon="download">Exporter CSV</Btn>
          <Btn icon="upload">Importer</Btn>
          <Btn kind="primary" icon="plus">Nouveau membre</Btn>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-bar__search">
          <Icon name="search" style={{ width: 14, height: 14, color: 'var(--text-3)' }} />
          <input placeholder="Rechercher par nom, prénom, email…"
            value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} />
        </div>
        <Dropdown label="Pôle" value={pole} onChange={setPole}
          options={polesUsed.map(p => ({ value: p, label: p === 'all' ? 'Tous' : POLES[p]?.k || p }))}
          labelFn={(v) => v === 'all' ? 'Tous' : POLES[v]?.k || v}
        />
        <Dropdown label="Mandat" value={mandat} onChange={setMandat}
          options={[
            { value: '25-26', label: '2025–2026' },
            { value: '24-25', label: '2024–2025' },
            { value: '23-24', label: '2023–2024' },
            { value: 'all',   label: 'Tous' },
          ]}
          labelFn={(v) => v === 'all' ? 'Tous' : v.replace('-', '–')}
        />
        <Dropdown label="Statut" value={status} onChange={setStatus}
          options={[{ value: 'all', label: 'Tous' }, ...Object.entries(STATUS).map(([v, s]) => ({ value: v, label: s.k }))]}
          labelFn={(v) => v === 'all' ? 'Tous' : STATUS[v]?.k}
        />
        <Dropdown label="Promo" value={promo} onChange={setPromo}
          options={promos.map(p => ({ value: p, label: p === 'all' ? 'Toutes' : p }))}
          labelFn={(v) => v === 'all' ? 'Toutes' : v}
        />
        <div className="spacer"></div>
        <Btn kind="ghost" size="sm" icon="x" onClick={reset}>Réinitialiser</Btn>
        <Btn size="sm" icon="sliders-horizontal">Filtres avancés</Btn>
      </div>

      <div className="summary">
        <span><strong>{filtered.length}</strong> membres affichés</span>
        <span className="muted-2">·</span>
        <span>Tri : <strong>Pôle, A→Z</strong></span>
        <div className="spacer"></div>
        <span className="row" style={{ gap: 6 }}>
          <Btn kind="ghost" size="sm" icon="list" active={view === 'list'} onClick={() => setView('list')}
            style={view === 'list' ? { color: 'var(--primary)' } : {}}>Liste</Btn>
          <Btn kind="ghost" size="sm" icon="layout-grid" onClick={() => setView('grid')}
            style={view !== 'grid' ? { color: 'var(--text-3)' } : {}}>Grille</Btn>
        </span>
      </div>

      <div className="card">
        {view === 'list' ? (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 34 }}><input type="checkbox" /></th>
                <th>Membre</th><th>Pôle</th><th>Rôle</th><th>Promo</th>
                <th>Statut</th><th>Contact</th><th style={{ width: 32 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`membre/${m.id}`)}>
                  <td onClick={(e) => e.stopPropagation()}><input type="checkbox" /></td>
                  <td>
                    <div className="col-name">
                      <Avatar m={m} size={36} />
                      <div className="name__txt">
                        <div className="name__main">{m.first} {m.last}</div>
                        <div className="name__sub">{m.year} · {m.id === 'jv' ? 'ECE Paris 24' : 'ECE Paris'}</div>
                      </div>
                    </div>
                  </td>
                  <td><Badge tone={m.status === 'active' ? 'primary' : 'neutral'}>{POLES[m.pole]?.k}</Badge></td>
                  <td>{m.role === 'À définir' ? <span className="muted">À définir</span> : m.role}</td>
                  <td className="tabular">{m.promo}</td>
                  <td><Badge tone={STATUS[m.status]?.tone} dot>{STATUS[m.status]?.k}</Badge></td>
                  <td className="col-contact">
                    {m.email}<br /><span className="muted-2">{m.phone}</span>
                  </td>
                  <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                    <IconBtn icon="more-horizontal" style={{ width: 28, height: 28 }} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="8"><Empty /></td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {filtered.map(m => (
              <div key={m.id} onClick={() => navigate(`membre/${m.id}`)}
                style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14, cursor: 'pointer', background: '#fff' }}>
                <div className="row" style={{ gap: 10, marginBottom: 8 }}>
                  <Avatar m={m} size={36} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{m.first} {m.last}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{m.role}</div>
                  </div>
                </div>
                <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                  <Badge tone={m.status === 'active' ? 'primary' : 'neutral'}>{POLES[m.pole]?.k}</Badge>
                  <Badge tone={STATUS[m.status]?.tone} dot>{STATUS[m.status]?.k}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'list' && filtered.length > 0 && (
          <div className="pagination">
            <span>Affichage <strong>1–{filtered.length}</strong> sur 84 membres</span>
            <div className="row" style={{ gap: 4 }}>
              <button className="page-btn page-btn--muted"><Icon name="chevron-left" style={{ width: 14, height: 14 }} /></button>
              <button className="page-btn page-btn--active">1</button>
              <button className="page-btn">2</button>
              <button className="page-btn">3</button>
              <button className="page-btn">…</button>
              <button className="page-btn">7</button>
              <button className="page-btn"><Icon name="chevron-right" style={{ width: 14, height: 14 }} /></button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

window.ScreenAnnuaire = ScreenAnnuaire;
