// Workflow ES — Enquêtes Satisfaction (cycle de vie + analyse).

const WorkflowEsScreen = () => {
  const t = RDI_TOKENS;
  return (
    <AppFrame
      active="es"
      sub="Enquêtes Satisfaction · cycle automatisé J+7 / J+30"
      title="Workflow ES"
      topbarRight={
        <>
          <Btn kind="ghost" icon={<Icons.filter size={13} stroke={t.ink} />}>Mandat 25–26</Btn>
          <Btn kind="ghost" icon={<Icons.download size={13} stroke={t.ink} />}>Export CNJE</Btn>
          <Btn kind="primary" icon={<Icons.plus size={13} stroke="#F4F8F2" />}>Lancer une ES</Btn>
        </>
      }
    >
      {/* Stage strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, marginBottom: 18, border: `1px solid ${t.line}`, borderRadius: 14, overflow: 'hidden', background: t.surface }}>
        {[
          { n: '01', k: 'Génération', d: 'Auto J+1 fin de mission', count: 6, mini: 'Tally', tone: 'neutral', state: 'auto' },
          { n: '02', k: 'Envoi client', d: 'Email + signature CNJE', count: 4, mini: 'Mail', tone: 'blue', state: 'envoyé' },
          { n: '03', k: 'Relance', d: 'J+7 si pas répondu', count: 3, mini: 'Auto', tone: 'amber', state: 'relancé' },
          { n: '04', k: 'Analyse & archivage', d: 'NPS, verbatims, push KPI', count: 21, mini: 'Auto', tone: 'forest', state: 'archivé', last: true },
        ].map((s, i) => (
          <div key={s.n} style={{
            position: 'relative', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8,
            borderRight: !s.last ? `1px solid ${t.line}` : 'none',
            background: t.surface,
          }}>
            {!s.last && (
              <svg width="14" height="20" viewBox="0 0 14 20" style={{ position: 'absolute', right: -7, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
                <path d="M1 1l10 9-10 9" fill="none" stroke={t.line} strokeWidth="1" />
              </svg>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: t.ink3 }}>{s.n}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{s.k}</span>
              <span style={{ flex: 1 }} />
              <Pill tone={s.tone} dot>{s.count}</Pill>
            </div>
            <div style={{ fontSize: 11.5, color: t.ink2 }}>{s.d}</div>
            <div style={{ fontSize: 10.5, color: t.ink3, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 5, height: 5, borderRadius: 999,
                background: s.tone === 'forest' ? t.forest : s.tone === 'amber' ? t.amber : s.tone === 'blue' ? t.blue : t.ink3,
              }} />
              {s.mini} · {s.state}
            </div>
          </div>
        ))}
      </div>

      {/* 2 cols */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
        {/* Active surveys table */}
        <Card pad={0}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px 12px', borderBottom: `1px solid ${t.line}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Enquêtes en cours</div>
              <div style={{ fontSize: 11, color: t.ink3, marginTop: 2 }}>13 actives · 4 en attente de réponse · 3 à relancer</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <Pill tone="rose" dot>2 retard</Pill>
              <Pill tone="amber" dot>3 relance</Pill>
              <Pill tone="forest" dot>8 ok</Pill>
            </div>
          </div>
          {/* table head */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2.6fr 1.4fr 1.6fr 0.9fr 0.6fr',
            padding: '8px 18px', fontSize: 10.5, color: t.ink3, textTransform: 'uppercase',
            letterSpacing: '0.06em', borderBottom: `1px solid ${t.line}`, background: t.surfaceWarm,
          }}>
            <span>Mission · Client</span>
            <span>Intervenant</span>
            <span>Étape</span>
            <span style={{ textAlign: 'right' }}>NPS</span>
            <span></span>
          </div>
          {[
            { m: 'Pernod Ricard · Packaging premium', cli: 'Marion Tessier', step: 3, stepK: 'Relance · J+9', tone: 'amber', nps: '—' },
            { m: 'BNP Paribas · Cartographie data', cli: 'M. Tessier · Y. Belkacem', step: 4, stepK: 'Archivée', tone: 'forest', nps: 71 },
            { m: 'Decathlon · Benchmark e-com', cli: 'M. Tessier', step: 4, stepK: 'Archivée', tone: 'forest', nps: 80 },
            { m: 'Sephora · Stratégie D2C', cli: 'L. Petit · A. Diop', step: 2, stepK: 'Envoyée · J+3', tone: 'blue', nps: '—' },
            { m: 'Total Energies · Étude transition', cli: 'J. Maréchal', step: 3, stepK: 'Relance · J+12', tone: 'rose', nps: '—' },
            { m: 'Maison Hermès · Audit retail', cli: 'S. Halimi', step: 1, stepK: 'Génération auto', tone: 'neutral', nps: '—' },
            { m: 'Capgemini · Étude IA générative', cli: 'N. Lambert · Y. Belkacem', step: 2, stepK: 'Envoyée · J+1', tone: 'blue', nps: '—' },
          ].map((r, i, arr) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '2.6fr 1.4fr 1.6fr 0.9fr 0.6fr',
              padding: '11px 18px', alignItems: 'center', fontSize: 12.5,
              borderBottom: i < arr.length - 1 ? `1px solid ${t.line}` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 6, background: t.surfaceWarm,
                  color: t.ink2, fontFamily: '"Instrument Serif", serif', fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 26px',
                }}>{r.m[0]}</div>
                <span style={{ color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.m}</span>
              </div>
              <div style={{ color: t.ink2, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.cli}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StageDots step={r.step} tone={r.tone} />
                <span style={{ fontSize: 11.5, color: r.tone === 'rose' ? t.rose : t.ink2 }}>{r.stepK}</span>
              </div>
              <div style={{
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
                color: r.nps === '—' ? t.ink3 : (r.nps >= 70 ? t.forest : t.amber),
                fontWeight: r.nps === '—' ? 400 : 600,
              }}>{r.nps}</div>
              <div style={{ textAlign: 'right' }}><Icons.more size={14} stroke={t.ink3} /></div>
            </div>
          ))}
        </Card>

        {/* Right column: NPS dist + Verbatims */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* NPS distribution */}
          <Card pad={18}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Distribution NPS</div>
                <div style={{ fontSize: 11, color: t.ink3, marginTop: 2 }}>34 réponses · 6 derniers mois</div>
              </div>
              <span style={{ fontFamily: '"Instrument Serif", serif', fontSize: 30, lineHeight: 1, color: t.ink }}>72</span>
            </div>
            <NpsBars />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${t.line}`, gap: 8 }}>
              {[
                { k: 'Promoteurs', v: '76%', c: t.forest },
                { k: 'Passifs', v: '20%', c: t.amber },
                { k: 'Détracteurs', v: '4%', c: t.rose },
              ].map(b => (
                <div key={b.k}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: t.ink3, marginBottom: 2 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: b.c }} />
                    {b.k}
                  </div>
                  <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 22, color: t.ink, lineHeight: 1 }}>{b.v}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Verbatims */}
          <Card pad={18}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Verbatims récents</div>
              <span style={{ fontSize: 11, color: t.ink3 }}>auto-tagging IA</span>
            </div>
            {[
              { v: 'Livrable très clair, recommandations actionnables. À refaire.', cli: 'BNP Paribas', tag: 'Promoteur', tone: 'forest', n: 9 },
              { v: 'Bon rythme. Le brief initial aurait gagné à être plus cadré.', cli: 'Decathlon', tag: 'Promoteur', tone: 'forest', n: 8 },
              { v: 'Délai de réponse un peu long en milieu de mission.', cli: 'L\'Oréal', tag: 'Passif', tone: 'amber', n: 7 },
            ].map((v, i, arr) => (
              <div key={i} style={{
                padding: '10px 0', borderBottom: i < arr.length - 1 ? `1px solid ${t.line}` : 'none',
                display: 'flex', flexDirection: 'column', gap: 5,
              }}>
                <div style={{
                  fontFamily: '"Instrument Serif", serif', fontSize: 14.5, lineHeight: 1.4,
                  color: t.ink, fontStyle: 'italic',
                }}>« {v.v} »</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: t.ink3 }}>
                  <span>{v.cli}</span>
                  <span>·</span>
                  <Pill tone={v.tone} dot>{v.tag} · {v.n}/10</Pill>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </AppFrame>
  );
};

const StageDots = ({ step, tone }) => {
  const t = RDI_TOKENS;
  const c = tone === 'rose' ? t.rose : tone === 'amber' ? t.amber : tone === 'blue' ? t.blue : tone === 'forest' ? t.forest : t.ink3;
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1,2,3,4].map(i => (
        <span key={i} style={{
          width: 14, height: 4, borderRadius: 1.5,
          background: i <= step ? c : t.surfaceWarm,
        }} />
      ))}
    </div>
  );
};

const NpsBars = () => {
  const t = RDI_TOKENS;
  // 0..10 distribution
  const dist = [0, 0, 0, 1, 0, 1, 1, 4, 6, 11, 10];
  const max = Math.max(...dist);
  const colorFor = (i) => i >= 9 ? t.forest : i >= 7 ? t.lime : i >= 5 ? t.amber : t.rose;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 84, paddingTop: 4 }}>
      {dist.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 9.5, color: t.ink3, fontVariantNumeric: 'tabular-nums' }}>{v || ''}</span>
          <div style={{
            width: '100%', height: `${(v / max) * 64 + (v ? 4 : 2)}px`,
            background: v ? colorFor(i) : t.surfaceWarm,
            borderRadius: 3,
            opacity: v ? 1 : 0.5,
          }} />
          <span style={{ fontSize: 10, color: t.ink3, fontVariantNumeric: 'tabular-nums' }}>{i}</span>
        </div>
      ))}
    </div>
  );
};

window.WorkflowEsScreen = WorkflowEsScreen;
