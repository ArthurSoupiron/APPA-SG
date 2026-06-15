// JEECE · SG — Journal d'audit complet (traçabilité)
const ScreenJournal = ({ navigate }) => {
  useIcons();
  const [q, setQ] = React.useState('');
  const [who, setWho] = React.useState('all');

  // auteurs présents dans le journal
  const authors = ['all', ...Array.from(new Set(ACTIVITY.map(a => a.who).filter(w => memberById(w))))];

  const list = ACTIVITY.filter(a => {
    if (who !== 'all' && a.who !== who) return false;
    if (q.trim()) {
      const m = memberById(a.who);
      const hay = `${a.action} ${a.target} ${a.ctx} ${m ? m.first + ' ' + m.last : ''}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const toneC = { brand: 'var(--brand)', info: 'var(--info)', violet: 'var(--violet)', neutral: 'var(--ink-3)' };

  const exportJournal = () => {
    const header = ['Quand', 'Auteur', 'Action', 'Cible', 'Contexte'];
    const rows = ACTIVITY.map(a => {
      const m = memberById(a.who);
      return [a.when, m ? `${m.first} ${m.last}` : a.who, a.action, a.target, a.ctx];
    });
    downloadBlob('journal-audit-jeece-sg.csv', toCSV([header, ...rows]), 'text/csv;charset=utf-8');
    toast('Journal exporté', 'ok');
  };

  return (
    <section className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Journal d'audit</h1>
          <div className="page__sub">{ACTIVITY.length} entrées · traçabilité complète des actions</div>
        </div>
        <div className="page__actions">
          <Btn icon="download" onClick={exportJournal}>Exporter le journal</Btn>
        </div>
      </div>

      {/* filtres */}
      <div className="card" style={{ padding: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
        <div className="search" style={{ maxWidth: 320, margin: 0, flex: '1 1 240px' }}>
          <Icon name="search" /><input placeholder="Rechercher dans le journal…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <SelectField value={who} onChange={setWho} options={authors.map(w => {
          const m = memberById(w);
          return { value: w, label: w === 'all' ? 'Tous les auteurs' : (m ? `${m.first} ${m.last}` : w) };
        })} />
        <span className="spacer"></span>
        <Badge tone="brand">{list.length} / {ACTIVITY.length}</Badge>
      </div>

      {list.length === 0 ? <div className="card"><Empty title="Aucune entrée" sub="Ajustez la recherche ou le filtre." /></div> : (
        <Card noBody>
          {list.map((a, i) => {
            const m = memberById(a.who);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 17px', borderBottom: i < list.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: toneC[a.tone] || 'var(--ink-3)', border: '1px solid var(--border)', flex: '0 0 30px' }}>
                  <Icon name={a.icon} style={{ width: 14, height: 14 }} />
                </span>
                {m && <Avatar m={m} size={26} />}
                <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.4 }}>
                  <strong style={{ fontWeight: 600 }}>{m ? `${m.first} ${m.last}` : a.who}</strong> <span className="muted">{a.action}</span> <strong style={{ fontWeight: 600 }}>{a.target}</strong>
                  <div className="muted-2" style={{ fontSize: 11, marginTop: 1 }}>{a.ctx}</div>
                </div>
                <span className="muted-2 tabular" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{a.when}</span>
              </div>
            );
          })}
        </Card>
      )}
    </section>
  );
};

window.ScreenJournal = ScreenJournal;
