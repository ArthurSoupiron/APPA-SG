// Fiche intervenant — vue détail consultant.

const IntervenantScreen = () => {
  const t = RDI_TOKENS;
  return (
    <AppFrame
      active="intervenants"
      sub="Pool · Intervenants actifs"
      title="Marion Tessier"
      topbarRight={
        <>
          <Btn kind="ghost" icon={<Icons.mail size={13} stroke={t.ink} />}>Contacter</Btn>
          <Btn kind="ghost" icon={<Icons.external size={13} stroke={t.ink} />}>Plane</Btn>
          <Btn kind="primary" icon={<Icons.plus size={13} stroke="#F4F8F2" />}>Affecter à mission</Btn>
        </>
      }
    >
      {/* Header card */}
      <Card pad={0} style={{ marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 18, padding: '20px 22px', borderBottom: `1px solid ${t.line}` }}>
          <div style={{ position: 'relative' }}>
            <Avatar name="Marion Tessier" size={64} hue={32} />
            <span style={{
              position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 999,
              background: t.forest, border: `2.5px solid ${t.surface}`,
            }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: 30, lineHeight: 1, color: t.ink, margin: 0, letterSpacing: '-0.01em', fontWeight: 400 }}>Marion Tessier</h1>
              <Pill tone="forest" dot>Active</Pill>
              <Pill tone="lime">Sénior · 4 missions</Pill>
            </div>
            <div style={{ fontSize: 12.5, color: t.ink2, marginBottom: 10 }}>
              HEC Paris · M2 Stratégie · Promo 26 · <span style={{ color: t.ink3 }}>Membre depuis sep. 2024</span>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: t.ink2 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icons.mail size={12} stroke={t.ink3} /> marion.t@hec-je.fr</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icons.phone size={12} stroke={t.ink3} /> +33 6 12 34 56 78</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icons.link size={12} stroke={t.ink3} /> linkedin.com/in/mtessier</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icons.globe size={12} stroke={t.ink3} /> Paris · dispo en remote</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: t.ink3, marginBottom: 4 }}>Score RDI</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end' }}>
              <span style={{ fontFamily: '"Instrument Serif", serif', fontSize: 38, lineHeight: 1, color: t.ink }}>92</span>
              <span style={{ fontSize: 13, color: t.ink3 }}>/100</span>
            </div>
            <div style={{ fontSize: 11, color: t.forest, marginTop: 2 }}>Top 10% du pool</div>
          </div>
        </div>
        {/* Sub-stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', borderTop: 0 }}>
          {[
            { k: 'Missions réalisées', v: '4' },
            { k: 'CA généré', v: '8 240 €' },
            { k: 'NPS reçu', v: '74' },
            { k: 'Délai moy. réponse', v: '4h' },
            { k: 'Disponibilité', v: '60%', pill: 'forest' },
          ].map((s, i) => (
            <div key={s.k} style={{
              padding: '14px 18px',
              borderRight: i < 4 ? `1px solid ${t.line}` : 'none',
            }}>
              <div style={{ fontSize: 10.5, color: t.ink3, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{s.k}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: '"Instrument Serif", serif', fontSize: 22, color: t.ink, lineHeight: 1 }}>{s.v}</span>
                {s.pill && <Pill tone={s.pill} dot>active</Pill>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${t.line}`, marginBottom: 14 }}>
        {[
          { k: 'Profil', active: true },
          { k: 'Missions', count: 4 },
          { k: 'Compétences' },
          { k: 'ES reçues', count: 4 },
          { k: 'Documents', count: 6 },
          { k: 'Historique' },
        ].map(tab => (
          <button key={tab.k} style={{
            padding: '8px 14px', background: 'transparent', border: 'none',
            borderBottom: `2px solid ${tab.active ? t.ink : 'transparent'}`,
            marginBottom: -1, cursor: 'pointer', color: tab.active ? t.ink : t.ink2,
            fontSize: 12.5, fontWeight: tab.active ? 600 : 400, fontFamily: 'Geist, sans-serif',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            {tab.k}
            {tab.count != null && (
              <span style={{ fontSize: 10.5, color: t.ink3, fontVariantNumeric: 'tabular-nums' }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Body — 2 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 14 }}>
        {/* Missions list */}
        <Card pad={0}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${t.line}` }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Missions</div>
            <span style={{ fontSize: 11, color: t.ink3 }}>4 missions · 8 240 € de CA</span>
          </div>
          {[
            { k: 'Pernod Ricard · Étude packaging premium', date: 'Avr 26 → en cours', role: 'Lead consultant', nps: 78, ca: '2 800 €', tone: 'forest' },
            { k: 'BNP Paribas · Cartographie data org', date: 'Fév 26 → Mar 26', role: 'Consultant', nps: 71, ca: '2 100 €', tone: 'forest' },
            { k: 'Decathlon · Benchmark e-commerce', date: 'Nov 25 → Jan 26', role: 'Consultant', nps: 80, ca: '1 940 €', tone: 'forest' },
            { k: 'L\'Oréal · Brief stratégique D2C', date: 'Sep 25 → Oct 25', role: 'Consultant junior', nps: 68, ca: '1 400 €', tone: 'amber' },
          ].map((m, i) => (
            <div key={i} style={{
              padding: '14px 18px', borderBottom: i < 3 ? `1px solid ${t.line}` : 'none',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: m.tone === 'forest' ? t.forestSoft : t.amberSoft,
                color: m.tone === 'forest' ? t.forest : '#7E5A12',
                fontFamily: '"Instrument Serif", serif', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flex: '0 0 36px',
              }}>{m.k[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: t.ink, fontWeight: 500, marginBottom: 2 }}>{m.k}</div>
                <div style={{ fontSize: 11, color: t.ink3 }}>{m.date} · {m.role}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: t.ink2, fontVariantNumeric: 'tabular-nums' }}>{m.ca}</div>
                <div style={{ fontSize: 10.5, color: m.nps >= 70 ? t.forest : t.amber, marginTop: 1 }}>NPS {m.nps}</div>
              </div>
              <Icons.arrowRight size={13} stroke={t.ink3} />
            </div>
          ))}
        </Card>

        {/* Right rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Skills */}
          <Card pad={18}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Compétences clés</div>
            {[
              { k: 'Stratégie', v: 5, n: 4 },
              { k: 'Analyse de données', v: 4, n: 3 },
              { k: 'Recherche utilisateur', v: 4, n: 2 },
              { k: 'Présentation client', v: 5, n: 4 },
              { k: 'Modélisation financière', v: 3, n: 1 },
            ].map(s => (
              <div key={s.k} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ flex: 1, fontSize: 12, color: t.ink }}>{s.k}</div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[1,2,3,4,5].map(i => (
                    <span key={i} style={{
                      width: 10, height: 10, borderRadius: 2,
                      background: i <= s.v ? t.forest : t.surfaceWarm,
                    }} />
                  ))}
                </div>
                <span style={{ width: 36, fontSize: 10.5, color: t.ink3, textAlign: 'right' }}>{s.n} miss.</span>
              </div>
            ))}
            <div style={{
              marginTop: 6, paddingTop: 12, borderTop: `1px dashed ${t.line}`,
              display: 'flex', flexWrap: 'wrap', gap: 5,
            }}>
              {['Python','SQL','Tableau','Figma','Notion','English C1','Espagnol B2'].map(s => (
                <Pill key={s} tone="neutral">{s}</Pill>
              ))}
            </div>
          </Card>

          {/* Conformity */}
          <Card pad={18}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Conformité dossier</div>
              <Pill tone="forest" dot>5 / 6 OK</Pill>
            </div>
            {[
              { k: 'Carte étudiante 25–26', s: 'Vérifiée 12/09/25', ok: true },
              { k: 'Convention CNJE signée', s: 'PDF · 2 pages', ok: true },
              { k: 'Charte qualité RDI', s: 'Signée 14/09/25', ok: true },
              { k: 'CV à jour', s: 'Mis à jour il y a 2j', ok: true },
              { k: 'Attestation responsabilité civile', s: 'Manquante · relancer', ok: false },
              { k: 'RIB', s: 'Vérifié 02/10/25', ok: true },
            ].map((d, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
                borderBottom: i < 5 ? `1px solid ${t.line}` : 'none',
              }}>
                <span style={{
                  width: 16, height: 16, borderRadius: 999,
                  background: d.ok ? t.forestSoft : t.claySoft,
                  color: d.ok ? t.forest : t.clay,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flex: '0 0 16px',
                }}>
                  {d.ok ? <Icons.check size={10} stroke={t.forest} strokeWidth={2.4} /> : <Icons.alert size={10} stroke={t.clay} />}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: t.ink }}>{d.k}</div>
                  <div style={{ fontSize: 10.5, color: t.ink3 }}>{d.s}</div>
                </div>
                <Icons.doc size={13} stroke={t.ink3} />
              </div>
            ))}
          </Card>

          {/* Activity */}
          <Card pad={18}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Activité récente</div>
            <div style={{ position: 'relative', paddingLeft: 14 }}>
              <div style={{ position: 'absolute', left: 4, top: 4, bottom: 4, width: 1, background: t.line }} />
              {[
                { t: 'ES Pernod Ricard · NPS 78', s: '12 mai · 14:32', dot: t.forest },
                { t: 'Affectée à mission Pernod Ricard', s: '4 mai · Plane', dot: t.lime },
                { t: 'Évaluation 360° complétée', s: '28 avr · auto', dot: t.blue },
                { t: 'Disponibilité mise à jour : 60%', s: '14 avr', dot: t.ink3 },
              ].map((a, i) => (
                <div key={i} style={{ position: 'relative', paddingBottom: i < 3 ? 12 : 0 }}>
                  <span style={{
                    position: 'absolute', left: -14, top: 4, width: 9, height: 9, borderRadius: 999,
                    background: a.dot, border: `2px solid ${t.surface}`, boxShadow: `0 0 0 1px ${t.line}`,
                  }} />
                  <div style={{ fontSize: 12, color: t.ink }}>{a.t}</div>
                  <div style={{ fontSize: 10.5, color: t.ink3 }}>{a.s}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppFrame>
  );
};

window.IntervenantScreen = IntervenantScreen;
