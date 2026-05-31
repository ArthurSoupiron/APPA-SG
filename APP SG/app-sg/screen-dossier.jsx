// JEECE · SG — Dossier membre (checklist documents officiels + historique)
const ScreenDossier = ({ navigate, memberId }) => {
  useIcons();
  const [tab, setTab] = React.useState('dossier');
  const m = memberById(memberId) || memberById('hm');
  if (!m) return <div className="page"><div className="card"><Empty title="Membre introuvable" /></div></div>;

  const s = dossierStats(m);
  const st = STATUS_LABEL[m.status];
  const mandates = m.mandates || [{ role: m.role, period: `Depuis ${m.joined}`, current: true }];

  const statusMap = {
    ok: { tone: 'ok', label: 'Présent', icon: 'check', color: 'var(--brand)', bg: 'var(--ok-bg)' },
    pending: { tone: 'warn', label: 'En attente', icon: 'clock', color: 'var(--warn)', bg: 'var(--warn-bg)' },
    missing: { tone: 'danger', label: 'Manquant', icon: 'x', color: 'var(--danger)', bg: 'var(--danger-bg)' },
  };

  const tabs = [
    { id: 'dossier', label: 'Dossier & pièces', icon: 'folder' },
    { id: 'identite', label: 'Identité', icon: 'user' },
    { id: 'parcours', label: 'Parcours', icon: 'milestone', count: mandates.length },
    { id: 'historique', label: 'Historique', icon: 'history', count: 24 },
  ];

  const audit = [
    { who: 'lb', t: `a généré l'attestation de fonction de ${m.first}`, when: '11 mai · 09:14', ic: 'file-plus-2' },
    { who: 'sh', t: 'a vérifié la carte étudiante 25–26', when: '8 mai · 17:02', ic: 'check-circle' },
    { who: 'lb', t: 'a déposé le RIB dans le dossier', when: '2 mai · 11:38', ic: 'upload' },
    { who: m.id, t: '(lui-même) a téléchargé la charte du membre', when: '28 avr · 14:21', ic: 'download' },
    { who: 'lb', t: `a changé le statut en « ${st.k} »`, when: `${m.joined}`, ic: 'user-check' },
  ];

  return (
    <section className="page">
      {/* Header card */}
      <div className="card" style={{ marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 18, padding: '20px 22px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Avatar m={m} size={64} />
            {m.status === 'active' && <span style={{ position: 'absolute', bottom: 1, right: 1, width: 15, height: 15, borderRadius: 99, background: 'var(--brand)', border: '2.5px solid #fff' }}></span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 23, fontWeight: 680, letterSpacing: '-0.02em' }}>{m.first} {m.last}</h1>
              <Badge tone={st.tone} dot>{st.k}</Badge>
              <Badge tone="brand">{m.pole}</Badge>
            </div>
            <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>{m.role} · ECE Paris · Promo {m.promo} · membre depuis {m.joined}</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12.5, color: 'var(--ink-2)', flexWrap: 'wrap' }}>
              <span className="row" style={{ gap: 5 }}><Icon name="mail" style={{ width: 13, height: 13, color: 'var(--ink-3)' }} />{m.email}</span>
              <span className="row" style={{ gap: 5 }}><Icon name="phone" style={{ width: 13, height: 13, color: 'var(--ink-3)' }} />{m.phone}</span>
              <span className="row" style={{ gap: 5 }}><Icon name="map-pin" style={{ width: 13, height: 13, color: 'var(--ink-3)' }} />{m.city}</span>
              <span className="row mono" style={{ gap: 5, fontSize: 11.5 }}><Icon name="hash" style={{ width: 13, height: 13, color: 'var(--ink-3)' }} />{m.jeeceId || 'JE-2024-' + m.id.toUpperCase()}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '0 8px' }}>
            <Ring pct={s.pct} size={66} stroke={7} />
            <div style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 550 }}>Dossier {s.pct}%</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Btn kind="primary" icon="file-plus-2" onClick={() => openModal('doc', { author: m.id })}>Générer un doc</Btn>
            <Btn icon="upload" onClick={() => openModal('piece', { memberId: m.id })}>Déposer une pièce</Btn>
          </div>
        </div>
        {/* sub stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderTop: '1px solid var(--border)' }}>
          {[
            { k: 'Pièces présentes', v: `${s.ok}/${s.total}`, tone: s.ok === s.total ? 'var(--brand)' : 'var(--ink)' },
            { k: 'En attente', v: s.pending, tone: s.pending ? 'var(--warn)' : 'var(--ink)' },
            { k: 'Manquantes', v: s.missing, tone: s.missing ? 'var(--danger)' : 'var(--ink)' },
            { k: 'Conformité dossier', v: s.pct === 100 ? 'Conforme' : 'À régulariser', tone: s.pct === 100 ? 'var(--brand)' : 'var(--warn)', small: true },
          ].map((x, i) => (
            <div key={i} style={{ padding: '13px 18px', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{x.k}</div>
              <div style={{ fontSize: x.small ? 15 : 19, fontWeight: 680, color: x.tone, letterSpacing: '-0.01em' }}>{x.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 15px', border: 'none', background: 'transparent', cursor: 'pointer',
            borderBottom: `2px solid ${tab === t.id ? 'var(--brand)' : 'transparent'}`, marginBottom: -1,
            color: tab === t.id ? 'var(--ink)' : 'var(--ink-2)', fontWeight: tab === t.id ? 600 : 450,
            fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 7,
          }}>
            <Icon name={t.icon} style={{ width: 15, height: 15 }} />{t.label}
            {t.count != null && <span style={{ fontSize: 11, padding: '0 6px', borderRadius: 99, background: tab === t.id ? 'var(--brand-050)' : 'var(--surface-2)', color: tab === t.id ? 'var(--brand-700)' : 'var(--ink-3)' }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* DOSSIER tab — checklist */}
      {tab === 'dossier' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 14 }}>
          <Card head={<>
            <div><div className="card__title">Pièces du dossier</div><div className="card__sub">Documents officiels requis pour la conformité CNJE</div></div>
            <div className="spacer"></div>
            {s.pct === 100 ? <Badge tone="ok" dot>Dossier complet</Badge> : <Badge tone="warn" dot>{s.missing + s.pending} à fournir</Badge>}
          </>} noBody>
            {DOC_TYPES.map((d, i) => {
              const v = m.docs[d.code] || 'missing';
              const sm = statusMap[v];
              return (
                <div key={d.code} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 17px', borderBottom: i < DOC_TYPES.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: sm.bg, display: 'grid', placeItems: 'center', color: sm.color, flex: '0 0 38px' }}>
                    <Icon name={d.icon} style={{ width: 18, height: 18 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 550, fontSize: 13 }}>{d.label} {!d.required && <span className="muted-2" style={{ fontWeight: 400, fontSize: 11 }}>· optionnel</span>}</div>
                    <div className="muted-2 mono" style={{ fontSize: 11 }}>{d.code} · {v === 'ok' ? `déposé le ${['12','08','21','02','14','30'][i]}/09/25 · PDF` : v === 'pending' ? 'en attente de validation' : 'aucune pièce'}</div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, background: sm.bg, color: sm.color, fontSize: 11.5, fontWeight: 600 }}>
                    <Icon name={sm.icon} style={{ width: 12, height: 12 }} />{sm.label}
                  </span>
                  {v === 'ok'
                    ? <div style={{ display: 'flex', gap: 4 }}><IconBtn icon="eye" style={{ width: 30, height: 30 }} /><IconBtn icon="download" style={{ width: 30, height: 30 }} /></div>
                    : <Btn size="sm" kind={v === 'missing' ? 'primary' : 'default'} icon={v === 'missing' ? 'upload' : 'check'}
                        onClick={() => setDocStatus(m.id, d.code, v === 'missing' ? 'pending' : 'ok')}>{v === 'missing' ? 'Ajouter' : 'Valider'}</Btn>}
                </div>
              );
            })}
            <div style={{ padding: '12px 17px', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: 'var(--ink-2)' }}>
              <Icon name="shield-check" style={{ width: 15, height: 15, color: 'var(--brand)' }} />
              Toutes les pièces sont stockées de façon chiffrée · accès tracé (audit trail)
            </div>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* completeness summary */}
            <Card title="Complétude du dossier">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Ring pct={s.pct} size={84} stroke={9} />
                <div style={{ flex: 1 }}>
                  {[
                    { k: 'Présentes', v: s.ok, c: 'var(--brand)' },
                    { k: 'En attente', v: s.pending, c: 'var(--warn)' },
                    { k: 'Manquantes', v: s.missing, c: 'var(--danger)' },
                  ].map(x => (
                    <div key={x.k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12.5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 3, background: x.c }}></span>
                      <span style={{ flex: 1 }} className="muted">{x.k}</span>
                      <span style={{ fontWeight: 650 }}>{x.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            {/* access / security */}
            <Card title="Accès & sécurité" sub="RBAC · SSO Google Workspace">
              {[
                { k: 'Niveau de confidentialité', v: 'Restreint · Bureau', ic: 'lock', tone: 'warn' },
                { k: 'Dernier accès', v: "Léa B. · aujourd'hui", ic: 'eye', tone: 'info' },
                { k: 'Stockage', v: 'Cloud chiffré · UE', ic: 'cloud', tone: 'ok' },
                { k: 'Sauvegarde', v: 'Quotidienne · OK', ic: 'database-backup', tone: 'ok' },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <Icon name={x.ic} style={{ width: 15, height: 15, color: x.tone === 'warn' ? 'var(--warn)' : x.tone === 'info' ? 'var(--info)' : 'var(--brand)' }} />
                  <span style={{ flex: 1, fontSize: 12.5 }} className="muted">{x.k}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 550 }}>{x.v}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {/* IDENTITE tab */}
      {tab === 'identite' && (
        <Card title="Identité complète" action={<Btn kind="ghost" size="sm" icon="edit-3">Éditer</Btn>} noBody>
          {[
            ['Prénom', m.first], ['Nom', m.last], ['Date de naissance', m.birth || '—'],
            ['Email JEECE', m.email], ['Téléphone', m.phone], ['Ville', m.city],
            ['Adresse', m.address || '—'], ['N° étudiant', m.studentId || '—'],
            ['École', 'ECE Paris'], ['Promotion', `${m.year} · diplôme ${m.promo}`],
            ['Identifiant JEECE', m.jeeceId || 'JE-2024-' + m.id.toUpperCase()],
          ].map(([k, v], i, arr) => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', padding: '11px 17px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 13 }}>
              <div className="muted">{k}</div>
              <div className={['N° étudiant', 'Identifiant JEECE'].includes(k) ? 'mono' : ''} style={{ fontSize: ['N° étudiant', 'Identifiant JEECE'].includes(k) ? 12 : 13 }}>{v}</div>
            </div>
          ))}
        </Card>
      )}

      {/* PARCOURS tab */}
      {tab === 'parcours' && (
        <Card title="Parcours JEECE" sub={`${mandates.length} mandat(s) · depuis ${m.joined}`} noBody>
          <div style={{ padding: '16px 20px' }}>
            {mandates.map((md, i) => (
              <div key={i} style={{ position: 'relative', paddingLeft: 26, paddingBottom: i < mandates.length - 1 ? 20 : 0 }}>
                {i < mandates.length - 1 && <span style={{ position: 'absolute', left: 5, top: 16, bottom: 0, width: 1.5, background: 'var(--border)' }}></span>}
                <span style={{ position: 'absolute', left: 0, top: 4, width: 11, height: 11, borderRadius: 99, background: md.current ? 'var(--brand)' : 'var(--ink-3)', border: '2px solid #fff', boxShadow: '0 0 0 1px var(--border)' }}></span>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{md.role}</div>
                <div className="muted-2" style={{ fontSize: 12 }}>{md.period}</div>
                {md.current && <Badge tone="ok" style={{ marginTop: 6 }}>Mandat en cours</Badge>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* HISTORIQUE tab */}
      {tab === 'historique' && (
        <Card head={<>
          <div><div className="card__title">Historique du dossier</div><div className="card__sub">Traçabilité complète · 24 entrées</div></div>
          <div className="spacer"></div><Btn kind="ghost" size="sm" icon="download">Exporter</Btn>
        </>} noBody>
          {audit.map((a, i) => {
            const w = memberById(a.who);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 17px', borderBottom: i < audit.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--ink-2)', flex: '0 0 30px' }}><Icon name={a.ic} style={{ width: 14, height: 14 }} /></div>
                <Avatar m={w} size={26} />
                <div style={{ flex: 1, fontSize: 12.5 }}><strong style={{ fontWeight: 600 }}>{w?.first} {w?.last}</strong> <span className="muted">{a.t}</span></div>
                <span className="muted-2 tabular" style={{ fontSize: 11 }}>{a.when}</span>
              </div>
            );
          })}
        </Card>
      )}
    </section>
  );
};

window.ScreenDossier = ScreenDossier;
