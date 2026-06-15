// JEECE · SG — Archives des mandats (alumni + mandats passés par promo)
const ScreenArchives = ({ navigate }) => {
  useIcons();

  // membres alumni / inactifs, regroupés par année de promotion
  const archived = MEMBERS.filter(m => m.status === 'alumni' || m.status === 'inactive');
  const byPromo = {};
  archived.forEach(m => { (byPromo[m.promo] = byPromo[m.promo] || []).push(m); });
  const promos = Object.keys(byPromo).sort((a, b) => b - a);

  // tous les mandats passés (non courants) recensés sur l'ensemble des membres
  const pastMandates = [];
  MEMBERS.forEach(m => (m.mandates || []).forEach(md => { if (!md.current) pastMandates.push({ m, md }); }));

  return (
    <section className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Archives des mandats</h1>
          <div className="page__sub">{archived.length} membre(s) archivé(s) · {pastMandates.length} mandat(s) passé(s)</div>
        </div>
        <div className="page__actions">
          <Btn icon="download" onClick={exportMembersCSV}>Exporter l'annuaire</Btn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14 }}>
        {/* alumni par promo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {promos.length === 0 && <div className="card"><Empty icon="archive" title="Aucun membre archivé" sub="Les alumni et inactifs apparaîtront ici." /></div>}
          {promos.map(p => (
            <Card key={p} head={<>
              <div><div className="card__title">Promotion {p}</div><div className="card__sub">{byPromo[p].length} membre(s)</div></div>
              <div className="spacer"></div>
              <Badge tone="info" dot>Archive</Badge>
            </>} noBody>
              {byPromo[p].map((m, i) => {
                const st = STATUS_LABEL[m.status];
                return (
                  <div key={m.id} onClick={() => navigate(`dossier/${m.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 17px', borderBottom: i < byPromo[p].length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}>
                    <Avatar m={m} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 550, fontSize: 13 }}>{m.first} {m.last}</div>
                      <div className="muted-2" style={{ fontSize: 11.5 }}>{m.role} · {m.pole}</div>
                    </div>
                    <Badge tone={st.tone} dot>{st.k}</Badge>
                    <Icon name="chevron-right" style={{ width: 16, height: 16, color: 'var(--ink-3)' }} />
                  </div>
                );
              })}
            </Card>
          ))}
        </div>

        {/* mandats passés */}
        <Card head={<>
          <div><div className="card__title">Historique des mandats</div><div className="card__sub">Tous pôles · mandats clôturés</div></div>
        </>} noBody>
          {pastMandates.length === 0 && <Empty icon="milestone" title="Aucun mandat passé" sub="Clôturez un mandat depuis une fiche membre." />}
          {pastMandates.map(({ m, md }, i) => (
            <div key={i} onClick={() => navigate(`dossier/${m.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 17px', borderBottom: i < pastMandates.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}>
              <Avatar m={m} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 550 }}>{md.role}</div>
                <div className="muted-2" style={{ fontSize: 11 }}>{m.first} {m.last} · {md.period}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </section>
  );
};

window.ScreenArchives = ScreenArchives;
