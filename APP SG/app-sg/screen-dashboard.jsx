// JEECE · SG — Tableau de bord
const ScreenDashboard = ({ navigate }) => {
  useIcons();
  const r = rollups();
  const incomplete = r.incomplete.filter(m => m.status !== 'alumni').slice(0, 5);

  // doc type distribution (GED)
  const dist = [
    { k: 'Comptes rendus', v: 142, tone: 'brand' },
    { k: 'Contrats & conv.', v: 130, tone: 'info' },
    { k: "Bulletins d'adhésion", v: 84, tone: 'lime' },
    { k: 'Comptabilité', v: 64, tone: 'violet' },
    { k: "PV d'AG", v: 31, tone: 'warn' },
    { k: 'Préfecture', v: 23, tone: 'neutral' },
  ];
  const distMax = Math.max(...dist.map(d => d.v));
  const toneColor = { brand: 'var(--brand)', info: 'var(--info)', lime: 'var(--lime)', violet: 'var(--violet)', warn: 'var(--warn)', neutral: 'var(--ink-3)' };

  return (
    <section className="page">
      {/* Hero */}
      <div style={{
        borderRadius: 18, padding: '22px 24px', marginBottom: 16, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--brand-700) 0%, var(--brand) 55%, var(--brand-600) 100%)',
        color: '#fff', boxShadow: '0 12px 30px rgba(26,158,85,0.25)',
      }}>
        <div style={{ position: 'absolute', right: -40, top: -60, width: 220, height: 220, borderRadius: 999, background: 'rgba(124,196,46,0.22)', filter: 'blur(8px)' }}></div>
        <div style={{ position: 'absolute', right: 120, bottom: -80, width: 180, height: 180, borderRadius: 999, background: 'rgba(255,255,255,0.08)' }}></div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, opacity: 0.85, marginBottom: 4 }}>Dimanche 31 mai 2026 · Mandat 2025–2026</div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 680, letterSpacing: '-0.02em' }}>Bonjour Léa 👋</h1>
            <div style={{ fontSize: 14, opacity: 0.92, marginTop: 6, maxWidth: 540 }}>
              Tous les dossiers membres et documents officiels de l'association, centralisés et sécurisés en un seul espace.
            </div>
            <div style={{ display: 'flex', gap: 9, marginTop: 16 }}>
              <button className="btn" style={{ background: '#fff', color: 'var(--brand-700)', border: 'none', fontWeight: 600 }} onClick={() => navigate('membres')}>
                <i data-lucide="folder-search"></i>Voir les dossiers
              </button>
              <button className="btn" style={{ background: 'rgba(255,255,255,0.16)', color: '#fff', border: '1px solid rgba(255,255,255,0.28)' }} onClick={() => navigate('documents')}>
                <i data-lucide="upload"></i>Déposer un document
              </button>
            </div>
          </div>
          {/* completeness ring */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', background: 'rgba(255,255,255,0.12)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)' }}>
            <Ring pct={r.completePct} size={84} stroke={8} color="#fff" label={<span style={{ color: '#fff', fontSize: 19 }}>{r.completePct}%</span>} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Dossiers conformes</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{r.complete} sur {r.membersTotal} membres</div>
              <div style={{ fontSize: 11.5, opacity: 0.8, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <i data-lucide="trending-up" style={{ width: 13, height: 13 }}></i>+5 pts ce mois
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 13, marginBottom: 14 }}>
        <Kpi icon="users" label="Membres centralisés" value={r.membersTotal + 71} sub={`${r.active + 68} actifs · 3 postulants`} trend="+6" />
        <Kpi icon="folder-check" label="Dossiers complets" value={`${r.completePct}%`} sub={`${r.complete}/${r.membersTotal} conformes`} trend="+5 pts" tone="brand" />
        <Kpi icon="files" label="Documents stockés" value="486" sub="GED sécurisée · cloud" trend="+38" tone="info" />
        <Kpi icon="shield-check" label="Conformité CNJE" value="96%" sub="4 points à régulariser" trendTone="warn" trend="4 alertes" tone="warn" />
      </div>

      {/* main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Dossiers à compléter */}
        <Card head={<>
          <div><div className="card__title">Dossiers à compléter</div><div className="card__sub">Pièces manquantes ou en attente de validation</div></div>
          <div className="spacer"></div>
          <Badge tone="danger" dot>{r.incomplete.filter(m => m.status !== 'alumni').length} à traiter</Badge>
          <Btn kind="ghost" size="sm" onClick={() => navigate('membres')}>Tout voir</Btn>
        </>} noBody>
          {incomplete.map((m, i) => {
            const s = dossierStats(m);
            return (
              <div key={m.id} onClick={() => navigate(`dossier/${m.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 17px', borderBottom: i < incomplete.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--brand-050)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <Avatar m={m} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 550, fontSize: 13 }}>{m.first} {m.last}</div>
                  <div className="muted-2" style={{ fontSize: 11.5 }}>{m.role} · {m.pole}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {DOC_TYPES.filter(d => d.required).map(d => (
                    <span key={d.code} title={`${d.label} · ${m.docs[d.code]}`} style={{
                      width: 22, height: 22, borderRadius: 6, display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700,
                      background: m.docs[d.code] === 'ok' ? 'var(--ok-bg)' : m.docs[d.code] === 'pending' ? 'var(--warn-bg)' : 'var(--danger-bg)',
                      color: m.docs[d.code] === 'ok' ? 'var(--brand-700)' : m.docs[d.code] === 'pending' ? '#9A6212' : '#B23A33',
                    }}>{d.code === 'CHARTE' ? 'CH' : d.code}</span>
                  ))}
                </div>
                <div style={{ width: 130, display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Bar pct={s.pct} tone={s.pct === 100 ? null : s.pct >= 60 ? 'warn' : 'danger'} />
                  <span className="tabular" style={{ fontSize: 12, fontWeight: 600, width: 32, textAlign: 'right' }}>{s.pct}%</span>
                </div>
                <Icon name="chevron-right" style={{ width: 16, height: 16, color: 'var(--ink-3)' }} />
              </div>
            );
          })}
        </Card>

        {/* Échéances */}
        <Card head={<>
          <div><div className="card__title">Échéances de conformité</div><div className="card__sub">90 jours · AG, préfecture, comptes</div></div>
          <div className="spacer"></div>
          <Btn kind="ghost" size="sm" icon="calendar">Agenda</Btn>
        </>} noBody>
          {DEADLINES.map((d, i) => {
            const info = deadlineInfo(d);
            return (
            <div key={d.id || i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center', padding: '11px 17px', borderBottom: i < DEADLINES.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 46, textAlign: 'center', border: '1px solid var(--border)', borderRadius: 9, padding: '6px 2px', background: info.tone === 'warn' ? 'var(--warn-bg)' : 'var(--surface-2)' }}>
                <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1, color: info.tone === 'warn' ? '#9A6212' : 'var(--ink)' }}>{info.day}</div>
                <div style={{ fontSize: 9.5, color: 'var(--ink-3)', textTransform: 'uppercase', marginTop: 2 }}>{info.mo}</div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 550 }}>{d.title}</div>
                <div className="muted-2" style={{ fontSize: 11 }}>{d.sub}</div>
              </div>
              <Badge tone={info.tone === 'warn' ? 'warn' : info.tone === 'info' ? 'info' : info.tone === 'danger' ? 'danger' : 'neutral'}>{info.delta}</Badge>
            </div>
            );
          })}
        </Card>
      </div>

      {/* bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 14 }}>
        {/* doc distribution */}
        <Card title="Répartition de la GED" sub="486 documents par catégorie">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {dist.map(d => (
              <div key={d.k}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>{d.k}</span><span className="tabular muted" style={{ fontWeight: 600 }}>{d.v}</span>
                </div>
                <div className="bar" style={{ height: 8 }}>
                  <i style={{ width: `${(d.v / distMax) * 100}%`, background: toneColor[d.tone] }}></i>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* activity / historique */}
        <Card head={<>
          <div><div className="card__title">Historique d'activité</div><div className="card__sub">Traçabilité complète · audit trail</div></div>
          <div className="spacer"></div>
          <Btn kind="ghost" size="sm" icon="history">Journal complet</Btn>
        </>} noBody>
          <div style={{ padding: '6px 17px 14px' }}>
            {ACTIVITY.map((a, i) => {
              const m = memberById(a.who);
              const toneC = { brand: 'var(--brand)', info: 'var(--info)', violet: 'var(--violet)', neutral: 'var(--ink-3)' }[a.tone];
              return (
                <div key={i} style={{ position: 'relative', paddingLeft: 30, paddingTop: 9, paddingBottom: i < ACTIVITY.length - 1 ? 9 : 0 }}>
                  {i < ACTIVITY.length - 1 && <span style={{ position: 'absolute', left: 13, top: 30, bottom: -2, width: 1.5, background: 'var(--border)' }}></span>}
                  <span style={{ position: 'absolute', left: 4, top: 9, width: 19, height: 19, borderRadius: 6, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: toneC, border: '1px solid var(--border)' }}>
                    <Icon name={a.icon} style={{ width: 11, height: 11 }} />
                  </span>
                  <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>
                    <strong style={{ fontWeight: 600 }}>{m?.first} {m?.last}</strong> <span className="muted">{a.action}</span> <strong style={{ fontWeight: 600 }}>{a.target}</strong>
                  </div>
                  <div className="muted-2" style={{ fontSize: 11, marginTop: 1 }}>{a.ctx} · {a.when}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </section>
  );
};

const Kpi = ({ icon, label, value, sub, trend, trendTone = 'ok', tone }) => {
  const accent = { brand: 'var(--brand)', info: 'var(--info)', warn: 'var(--warn)' }[tone] || 'var(--ink-2)';
  const accentBg = { brand: 'var(--brand-050)', info: 'var(--info-bg)', warn: 'var(--warn-bg)' }[tone] || 'var(--surface-2)';
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: accentBg, display: 'grid', placeItems: 'center', color: accent }}>
          <Icon name={icon} style={{ width: 16, height: 16 }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{label}</span>
        <span className="spacer"></span>
        {trend && <Badge tone={trendTone === 'warn' ? 'warn' : 'ok'} style={{ fontSize: 10.5 }}>{trend}</Badge>}
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1 }}>{value}</div>
      <div className="muted-2" style={{ fontSize: 11.5, marginTop: 6 }}>{sub}</div>
    </div>
  );
};

window.ScreenDashboard = ScreenDashboard;
