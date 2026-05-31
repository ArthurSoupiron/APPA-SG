// JEECE · SG — Membres (annuaire + complétude dossier)
const ScreenMembres = ({ navigate }) => {
  useIcons();
  const [q, setQ] = React.useState('');
  const [pole, setPole] = React.useState('all');
  const [status, setStatus] = React.useState('all');
  const [completeness, setCompleteness] = React.useState('all');
  const [view, setView] = React.useState('list');
  const [sort, setSort] = React.useState('completeness');

  const poles = ['all', ...Array.from(new Set(MEMBERS.map(m => m.pole)))];

  let list = MEMBERS.filter(m => {
    if (pole !== 'all' && m.pole !== pole) return false;
    if (status !== 'all' && m.status !== status) return false;
    const s = dossierStats(m);
    if (completeness === 'complete' && s.pct !== 100) return false;
    if (completeness === 'incomplete' && s.pct === 100) return false;
    if (q.trim()) {
      const hay = `${m.first} ${m.last} ${m.email} ${m.role} ${m.pole}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });
  list = list.slice().sort((a, b) => {
    if (sort === 'completeness') return dossierStats(a).pct - dossierStats(b).pct;
    if (sort === 'name') return a.last.localeCompare(b.last);
    return 0;
  });

  const counts = {
    complete: MEMBERS.filter(m => dossierStats(m).pct === 100).length,
    incomplete: MEMBERS.filter(m => dossierStats(m).pct < 100).length,
  };

  const Pill = ({ active, onClick, children, tone }) => (
    <button onClick={onClick} className={cls('btn', 'btn--sm')} style={{
      background: active ? (tone || 'var(--brand)') : 'var(--surface)',
      color: active ? '#fff' : 'var(--ink-2)',
      borderColor: active ? (tone || 'var(--brand)') : 'var(--border-2)',
      boxShadow: active ? '0 2px 8px rgba(26,158,85,0.2)' : 'none',
    }}>{children}</button>
  );

  return (
    <section className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Membres & dossiers</h1>
          <div className="page__sub">{MEMBERS.length} dossiers centralisés · {counts.complete} complets · {counts.incomplete} à régulariser</div>
        </div>
        <div className="page__actions">
          <Btn icon="download" onClick={exportMembersCSV}>Exporter</Btn>
          <Btn icon="upload" onClick={() => openModal('import')}>Importer</Btn>
          <Btn kind="primary" icon="user-plus" onClick={() => openModal('member')}>Nouveau membre</Btn>
        </div>
      </div>

      {/* filter bar */}
      <div className="card" style={{ padding: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
        <div className="search" style={{ maxWidth: 300, margin: 0, flex: '1 1 240px' }}>
          <Icon name="search" /><input placeholder="Rechercher un membre…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select label="Pôle" value={pole} onChange={setPole} options={poles.map(p => ({ value: p, label: p === 'all' ? 'Tous les pôles' : p }))} />
        <Select label="Statut" value={status} onChange={setStatus} options={[
          { value: 'all', label: 'Tous statuts' }, { value: 'active', label: 'Actifs' }, { value: 'pending', label: 'Postulants' }, { value: 'alumni', label: 'Alumni' }, { value: 'inactive', label: 'Inactifs' },
        ]} />
        <div style={{ width: 1, height: 22, background: 'var(--border)' }}></div>
        <Pill active={completeness === 'all'} onClick={() => setCompleteness('all')}>Tous</Pill>
        <Pill active={completeness === 'complete'} onClick={() => setCompleteness('complete')}>Complets ({counts.complete})</Pill>
        <Pill active={completeness === 'incomplete'} onClick={() => setCompleteness('incomplete')} tone="var(--warn)">À compléter ({counts.incomplete})</Pill>
        <span className="spacer"></span>
        <div className="seg">
          <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}><Icon name="list" />Liste</button>
          <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')}><Icon name="layout-grid" />Cartes</button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card"><Empty /></div>
      ) : view === 'list' ? (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Membre</th><th>Pôle / Rôle</th><th>Statut</th>
                <th>Pièces du dossier</th>
                <th style={{ cursor: 'pointer' }} onClick={() => setSort('completeness')}>Complétude {sort === 'completeness' && '↑'}</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {list.map(m => {
                const s = dossierStats(m);
                const st = STATUS_LABEL[m.status];
                return (
                  <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`dossier/${m.id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <Avatar m={m} size={38} />
                        <div><div style={{ fontWeight: 600, fontSize: 13 }}>{m.first} {m.last}</div><div className="muted-2" style={{ fontSize: 11.5 }}>{m.year} · {m.email}</div></div>
                      </div>
                    </td>
                    <td><div style={{ fontSize: 12.5 }}>{m.pole}</div><div className="muted-2" style={{ fontSize: 11.5 }}>{m.role}</div></td>
                    <td><Badge tone={st.tone} dot>{st.k}</Badge></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {DOC_TYPES.filter(d => d.required).map(d => {
                          const v = m.docs[d.code];
                          return <span key={d.code} title={`${d.label} · ${v === 'ok' ? 'présent' : v === 'pending' ? 'en attente' : 'manquant'}`} style={{
                            width: 9, height: 9, borderRadius: 3,
                            background: v === 'ok' ? 'var(--brand)' : v === 'pending' ? 'var(--warn)' : 'var(--danger-bg)',
                            border: v === 'missing' ? '1px solid var(--danger)' : 'none',
                          }}></span>;
                        })}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 90 }}><Bar pct={s.pct} tone={s.pct === 100 ? null : s.pct >= 60 ? 'warn' : 'danger'} /></div>
                        <span className="tabular" style={{ fontWeight: 600, fontSize: 12.5, width: 34 }}>{s.pct}%</span>
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}><IconBtn icon="trash-2" title="Supprimer le dossier" style={{ width: 30, height: 30 }}
                      onClick={() => openModal('confirm', { danger: true, title: 'Supprimer ce dossier ?', confirmLabel: 'Supprimer', message: `Le dossier de ${m.first} ${m.last} et son suivi de pièces seront définitivement supprimés.`, onConfirm: () => deleteMember(m.id) })} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 13 }}>
          {list.map(m => {
            const s = dossierStats(m);
            const st = STATUS_LABEL[m.status];
            return (
              <div key={m.id} className="card" style={{ padding: 16, cursor: 'pointer', transition: 'transform .15s, box-shadow .15s' }}
                onClick={() => navigate(`dossier/${m.id}`)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <Avatar m={m} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{m.first} {m.last}</div>
                    <div className="muted-2" style={{ fontSize: 12 }}>{m.role}</div>
                  </div>
                  <Ring pct={s.pct} size={42} stroke={5} />
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                  <Badge tone={st.tone} dot>{st.k}</Badge>
                  <Badge>{m.pole}</Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 5 }}>
                  {DOC_TYPES.filter(d => d.required).map(d => {
                    const v = m.docs[d.code];
                    return <div key={d.code} title={d.label} style={{
                      padding: '5px 0', borderRadius: 6, textAlign: 'center', fontSize: 9, fontWeight: 700,
                      background: v === 'ok' ? 'var(--ok-bg)' : v === 'pending' ? 'var(--warn-bg)' : 'var(--danger-bg)',
                      color: v === 'ok' ? 'var(--brand-700)' : v === 'pending' ? '#9A6212' : '#B23A33',
                    }}>{d.code === 'CHARTE' ? 'CH' : d.code}</div>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

// inline dropdown select
const Select = ({ label, value, options, onChange }) => {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);
  const cur = options.find(o => o.value === value);
  return (
    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
      <button className="btn btn--sm" onClick={() => setOpen(o => !o)} style={{ color: value !== 'all' ? 'var(--brand-700)' : 'var(--ink-2)', borderColor: value !== 'all' ? 'var(--brand-200)' : 'var(--border-2)', background: value !== 'all' ? 'var(--brand-050)' : 'var(--surface)' }}>
        <span className="muted-2" style={{ fontWeight: 500 }}>{label}:</span> {cur?.label} <Icon name="chevron-down" style={{ width: 13, height: 13 }} />
      </button>
      {open && (
        <div className="pop" style={{ top: 'calc(100% + 4px)', left: 0, minWidth: 180, padding: 5 }}>
          {options.map(o => (
            <div key={o.value} className="pop__item" onClick={() => { onChange(o.value); setOpen(false); }}
              style={{ background: o.value === value ? 'var(--brand-050)' : 'transparent', color: o.value === value ? 'var(--brand-700)' : 'var(--ink)' }}>
              {o.label}{o.value === value && <Icon name="check" style={{ width: 14, height: 14, marginLeft: 'auto' }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

window.ScreenMembres = ScreenMembres;
window.SGSelect = Select;
