// JEECE · SG — Conformité (vue dédiée CNJE / légal)
const ScreenConformite = ({ navigate }) => {
  useIcons();
  const r = rollups();

  const dossierCheck = { id: '__dossiers', k: 'Dossiers membres complets', s: `${r.complete}/${r.membersTotal} conformes · ${r.incomplete.length} à régulariser`, state: r.incomplete.length ? 'pending' : 'ok', ref: null, computed: true };
  const checks = [...CONFORMITE, dossierCheck];
  const stateMap = {
    ok: { tone: 'ok', label: 'Conforme', icon: 'check-circle', color: 'var(--brand)', bg: 'var(--ok-bg)' },
    pending: { tone: 'warn', label: 'En cours', icon: 'clock', color: 'var(--warn)', bg: 'var(--warn-bg)' },
    todo: { tone: 'danger', label: 'À faire', icon: 'circle-alert', color: 'var(--danger)', bg: 'var(--danger-bg)' },
  };
  const okCount = checks.filter(c => c.state === 'ok').length;
  const pct = Math.round((okCount / checks.length) * 100);

  return (
    <section className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Conformité & sécurité</h1>
          <div className="page__sub">Suivi des obligations légales · label CNJE · audit du 15 juin 2026</div>
        </div>
        <div className="page__actions">
          <Btn icon="download">Rapport de conformité</Btn>
          <Btn kind="primary" icon="shield-check">Lancer un audit</Btn>
        </div>
      </div>

      {/* score band */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 13, marginBottom: 14 }}>
        <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16, gridColumn: 'span 1' }}>
          <Ring pct={pct} size={72} stroke={8} />
          <div><div style={{ fontSize: 13, fontWeight: 600 }}>Score global</div><div className="muted-2" style={{ fontSize: 12, marginTop: 2 }}>{okCount}/{checks.length} points conformes</div></div>
        </div>
        {[
          { ic: 'folder-check', label: 'Dossiers conformes', v: `${r.completePct}%`, tone: 'brand' },
          { ic: 'file-clock', label: 'Documents à signer', v: String(DOCS.filter(d => d.status === 'pending').length), tone: 'warn' },
          { ic: 'calendar-clock', label: 'Échéances < 30j', v: String(DEADLINES.filter(d => { const i = deadlineInfo(d); return i.days >= 0 && i.days <= 30; }).length), tone: 'danger' },
        ].map((x, i) => (
          <div key={i} className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: x.tone === 'brand' ? 'var(--brand-050)' : x.tone === 'warn' ? 'var(--warn-bg)' : 'var(--danger-bg)', display: 'grid', placeItems: 'center', color: x.tone === 'brand' ? 'var(--brand)' : x.tone === 'warn' ? 'var(--warn)' : 'var(--danger)' }}>
                <Icon name={x.ic} style={{ width: 15, height: 15 }} />
              </div>
              <span className="muted" style={{ fontSize: 12 }}>{x.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{x.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
        <Card head={<>
          <div><div className="card__title">Checklist de conformité</div><div className="card__sub">Obligations légales & associatives</div></div>
          <div className="spacer"></div>
          <Badge tone="ok" dot>{okCount} OK</Badge><Badge tone="warn" dot>{checks.filter(c=>c.state==='pending').length} en cours</Badge>
        </>} noBody>
          {checks.map((c, i) => {
            const sm = stateMap[c.state];
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 17px', borderBottom: i < checks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: sm.bg, display: 'grid', placeItems: 'center', color: sm.color, flex: '0 0 32px' }}><Icon name={sm.icon} style={{ width: 16, height: 16 }} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 550, fontSize: 13 }}>{c.k}</div>
                  <div className="muted-2" style={{ fontSize: 11.5 }}>{c.s}{c.ref && <span className="mono"> · {c.ref}</span>}</div>
                </div>
                <Badge tone={sm.tone} dot>{sm.label}</Badge>
                {c.state !== 'ok' && <Btn size="sm" icon="arrow-right"
                  onClick={() => c.computed ? navigate('membres') : advanceCheck(c.id)}>Traiter</Btn>}
              </div>
            );
          })}
        </Card>

        <Card head={<>
          <div><div className="card__title">Prochaines échéances</div><div className="card__sub">Calendrier réglementaire</div></div>
          <div className="spacer"></div>
          <Btn kind="ghost" size="sm" icon="calendar-plus" onClick={() => openModal('deadline')}>Ajouter</Btn>
        </>} noBody>
          {DEADLINES.map((d, i) => {
            const info = deadlineInfo(d);
            return (
            <div key={d.id || i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 12, alignItems: 'center', padding: '12px 17px', borderBottom: i < DEADLINES.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 46, textAlign: 'center', border: '1px solid var(--border)', borderRadius: 9, padding: '6px 2px', background: info.tone === 'warn' ? 'var(--warn-bg)' : 'var(--surface-2)' }}>
                <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1, color: info.tone === 'warn' ? '#9A6212' : 'var(--ink)' }}>{info.day}</div>
                <div style={{ fontSize: 9.5, color: 'var(--ink-3)', textTransform: 'uppercase', marginTop: 2 }}>{info.mo}</div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 550 }}>{d.title}</div>
                <div className="muted-2" style={{ fontSize: 11 }}><Badge style={{ marginRight: 4 }}>{d.kind}</Badge>{d.sub}</div>
              </div>
              <Badge tone={info.tone === 'warn' ? 'warn' : info.tone === 'info' ? 'info' : info.tone === 'danger' ? 'danger' : 'neutral'}>{info.delta}</Badge>
              <IconBtn icon="trash-2" title="Supprimer l'échéance" style={{ width: 28, height: 28 }} onClick={() => deleteDeadline(d.id)} />
            </div>
            );
          })}
        </Card>
      </div>
    </section>
  );
};

window.ScreenConformite = ScreenConformite;
