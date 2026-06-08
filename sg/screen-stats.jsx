// JEECE · SG — Statistiques (analyse des dossiers et de la GED)
const ScreenStats = ({ navigate }) => {
  useIcons();
  const r = rollups();
  const byPole = statsByPole();
  const byStatus = statsByStatus();
  const pieces = statsPieces();
  const docStatus = statsDocStatus();

  const poleMax = Math.max(1, ...byPole.map(p => p.count));
  const statusTone = { ok: 'var(--brand)', warn: 'var(--warn)', info: 'var(--info)', danger: 'var(--danger)' };

  const pieceSeg = [
    { k: 'Présentes', v: pieces.ok, c: 'var(--brand)' },
    { k: 'En attente', v: pieces.pending, c: 'var(--warn)' },
    { k: 'Manquantes', v: pieces.missing, c: 'var(--danger)' },
  ];

  return (
    <section className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Statistiques</h1>
          <div className="page__sub">Analyse des dossiers membres et de la GED · mandat 2025–2026</div>
        </div>
        <div className="page__actions">
          <Btn icon="download" onClick={exportMembersCSV}>Exporter (CSV)</Btn>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 13, marginBottom: 14 }}>
        {[
          { ic: 'users', label: 'Membres', v: r.membersTotal, tone: 'brand' },
          { ic: 'folder-check', label: 'Complétude moyenne', v: `${Math.round(MEMBERS.reduce((a, m) => a + dossierStats(m).pct, 0) / Math.max(1, MEMBERS.length))}%`, tone: 'info' },
          { ic: 'files', label: 'Documents GED', v: DOCS.length, tone: 'violet' },
          { ic: 'shield-check', label: 'Conformité', v: `${conformityScore()}%`, tone: 'warn' },
        ].map((x, i) => (
          <div key={i} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--ink-2)' }}><Icon name={x.ic} style={{ width: 15, height: 15 }} /></div>
              <span className="muted" style={{ fontSize: 12 }}>{x.label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>{x.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Complétude par pôle */}
        <Card title="Complétude moyenne par pôle" sub="Part des pièces requises présentes">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {byPole.map(p => (
              <div key={p.pole}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ fontWeight: 550 }}>{p.pole} <span className="muted-2">· {p.count} membre(s)</span></span>
                  <span className="tabular" style={{ fontWeight: 650 }}>{p.avg}%</span>
                </div>
                <Bar pct={p.avg} tone={p.avg === 100 ? null : p.avg >= 60 ? 'warn' : 'danger'} height={8} />
              </div>
            ))}
          </div>
        </Card>

        {/* Répartition des statuts */}
        <Card title="Répartition des statuts" sub={`${r.membersTotal} membres`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {byStatus.map(s => (
              <div key={s.status} onClick={() => navigate('membres')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: statusTone[s.tone] || 'var(--ink-3)' }}></span>
                <span style={{ flex: 1, fontSize: 12.5 }}>{s.label}</span>
                <div style={{ width: 120 }}><Bar pct={Math.round((s.count / r.membersTotal) * 100)} height={7} /></div>
                <span className="tabular" style={{ fontSize: 12.5, fontWeight: 650, width: 26, textAlign: 'right' }}>{s.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Pièces des dossiers */}
        <Card title="État des pièces (tous dossiers)" sub={`${pieces.total} pièces requises suivies`}>
          <div style={{ display: 'flex', height: 16, borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
            {pieceSeg.map(s => s.v > 0 && <div key={s.k} style={{ width: `${(s.v / pieces.total) * 100}%`, background: s.c }} title={`${s.k}: ${s.v}`}></div>)}
          </div>
          {pieceSeg.map(s => (
            <div key={s.k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12.5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 3, background: s.c }}></span>
              <span style={{ flex: 1 }} className="muted">{s.k}</span>
              <span style={{ fontWeight: 650 }}>{s.v}</span>
              <span className="muted-2" style={{ width: 44, textAlign: 'right' }}>{Math.round((s.v / pieces.total) * 100)}%</span>
            </div>
          ))}
        </Card>

        {/* GED par statut */}
        <Card title="Documents GED par statut" sub={`${DOCS.length} documents`}>
          {[
            { k: 'Signés', v: docStatus.signed || 0, c: 'var(--brand)' },
            { k: 'À signer', v: docStatus.pending || 0, c: 'var(--warn)' },
            { k: 'Archivés', v: docStatus.archived || 0, c: 'var(--info)' },
          ].map(s => (
            <div key={s.k} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                <span>{s.k}</span><span className="tabular" style={{ fontWeight: 650 }}>{s.v}</span>
              </div>
              <div className="bar" style={{ height: 8 }}><i style={{ width: `${(s.v / Math.max(1, DOCS.length)) * 100}%`, background: s.c }}></i></div>
            </div>
          ))}
        </Card>
      </div>
    </section>
  );
};

window.ScreenStats = ScreenStats;
