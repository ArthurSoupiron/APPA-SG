// Dashboard RDI — vue d'accueil pour la VP RDI.
// Sections : KPIs hero · Pipeline funnel · Tâches RDI · NPS ES · Pool · Activity.

const DashboardScreen = () => {
  const t = RDI_TOKENS;
  return (
    <AppFrame
      active="dash"
      sub="Lundi 11 mai 2026"
      title="Bonjour Léa — voici l'état du mandat"
      topbarRight={
        <>
          <Btn kind="ghost" icon={<Icons.filter size={13} stroke={t.ink} />}>Mai 2026</Btn>
          <Btn kind="primary" icon={<Icons.plus size={13} stroke="#F4F8F2" />}>Nouvelle action</Btn>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 18 }}>
        <KpiTile label="Candidatures actives" value="47" trend={+12} hint="vs sem. dernière" spark={[8,11,9,14,12,16,18,21,17,22,25,28]} accent={t.forest} />
        <KpiTile label="Pool intervenants" value="23" suffix="/ 31" trend={+2} hint="actifs ce mois" spark={[18,19,19,20,21,21,22,23,23,22,23,23]} accent={t.blue} />
        <KpiTile label="NPS ES moyen" value="72" pill={<Pill tone="lime" dot>Excellent</Pill>} hint="34 réponses" spark={[58,62,64,61,67,69,71,68,70,72,74,72]} accent={t.lime} />
        <KpiTile label="Conformité CNJE" value="96" suffix="%" pill={<Pill tone="amber" dot>3 alertes</Pill>} hint="audit du 15/06" spark={[88,89,90,92,93,95,94,95,96,96,95,96]} accent={t.amber} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Pipeline funnel */}
        <Card pad={20}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Pipeline candidatures</div>
              <div style={{ fontSize: 12, color: t.ink2, marginTop: 2 }}>Conversion globale <span style={{ color: t.ink, fontWeight: 600 }}>34%</span> · objectif CDC 30%</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['7j','30j','Mandat'].map((p, i) => (
                <span key={p} style={{
                  fontSize: 11.5, padding: '4px 10px', borderRadius: 999,
                  background: i === 1 ? t.forest : 'transparent',
                  color: i === 1 ? '#F4F8F2' : t.ink2,
                  border: `1px solid ${i === 1 ? t.forest : t.line}`,
                }}>{p}</span>
              ))}
            </div>
          </div>
          <Funnel />
          <div style={{
            marginTop: 14, paddingTop: 14, borderTop: `1px dashed ${t.line}`,
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12,
          }}>
            {[
              { k: 'Délai pré-qualif', v: '2,4j', tone: 'forest', delta: '−0,6j' },
              { k: 'Délai entretien', v: '5,1j', tone: 'amber', delta: '+0,8j' },
              { k: 'Acceptation offre', v: '78%', tone: 'forest', delta: '+4 pts' },
              { k: 'Drop-off entretien', v: '22%', tone: 'rose', delta: '+3 pts' },
            ].map(s => (
              <div key={s.k}>
                <div style={{ fontSize: 11, color: t.ink3, marginBottom: 2 }}>{s.k}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: '"Instrument Serif", serif', fontSize: 22, color: t.ink }}>{s.v}</span>
                  <Pill tone={s.tone} style={{ fontSize: 10.5 }}>{s.delta}</Pill>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Tasks panel */}
        <Card pad={0} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${t.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Mes tâches RDI</div>
              <div style={{ fontSize: 11.5, color: t.ink2, marginTop: 2 }}>5 ouvertes · 2 en retard</div>
            </div>
            <Pill tone="rose" dot>2 retard</Pill>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { t: 'Valider entretien · M. Tessier (data)', meta: 'Mission #M-241 · Auj. 14:00', tone: 'rose', tag: 'Entretien' },
              { t: 'Relancer Plane · sprint sync', meta: 'Plane · il y a 2h', tone: 'amber', tag: 'Plane' },
              { t: 'Envoyer ES — mission Pernod Ricard', meta: 'Auto J+7 · 12 mai', tone: 'forest', tag: 'ES' },
              { t: 'Audit CNJE — 3 contrats à relire', meta: 'Avant 15/06', tone: 'amber', tag: 'Conformité' },
              { t: 'Onboarding · 2 nouveaux intervenants', meta: 'Cette semaine', tone: 'forest', tag: 'Pool' },
            ].map((x, i) => (
              <div key={i} style={{
                padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: i < 4 ? `1px solid ${t.line}` : 'none',
              }}>
                <span style={{
                  width: 16, height: 16, flex: '0 0 16px', borderRadius: 5,
                  border: `1.4px solid ${t.line2}`, background: t.surface,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: t.ink, marginBottom: 2 }}>{x.t}</div>
                  <div style={{ fontSize: 11, color: t.ink3 }}>{x.meta}</div>
                </div>
                <Pill tone={x.tone} style={{ fontSize: 10.5 }}>{x.tag}</Pill>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {/* NPS line */}
        <Card pad={18}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>NPS satisfaction ES</div>
            <Pill tone="forest" dot>+8 pts</Pill>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0 12px' }}>
            <span style={{ fontFamily: '"Instrument Serif", serif', fontSize: 38, color: t.ink, lineHeight: 1 }}>72</span>
            <span style={{ fontSize: 11, color: t.ink3 }}>moyenne 6 derniers mois</span>
          </div>
          <NpsChart />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10.5, color: t.ink3 }}>
            <span>Déc</span><span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span>
          </div>
        </Card>

        {/* Pool repartition */}
        <Card pad={18}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Pool — répartition compétences</div>
            <span style={{ fontSize: 11, color: t.ink3 }}>23 actifs</span>
          </div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <Donut />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { k: 'Stratégie', v: 9, c: t.forest },
                { k: 'Data / Analytics', v: 6, c: t.lime },
                { k: 'Communication', v: 4, c: t.amber },
                { k: 'Tech / Dev', v: 3, c: t.blue },
                { k: 'Design', v: 1, c: t.clay },
              ].map(r => (
                <div key={r.k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: r.c }} />
                  <span style={{ flex: 1, color: t.ink }}>{r.k}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', color: t.ink2 }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* CNJE compliance */}
        <Card pad={18}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Anomalies conformité</div>
            <Pill tone="amber" dot>3</Pill>
          </div>
          {[
            { t: 'Contrat M-238 sans signature numérique', s: 'Bloquant · audit', tone: 'rose' },
            { t: 'ES manquante · mission Decathlon', s: 'Échue depuis 4j', tone: 'amber' },
            { t: 'CV Y. Bernard non à jour', s: 'Soft · à relancer', tone: 'amber' },
          ].map((x, i) => (
            <div key={i} style={{
              padding: '10px 0', borderBottom: i < 2 ? `1px solid ${t.line}` : 'none',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <Icons.alert size={14} stroke={x.tone === 'rose' ? t.rose : t.amber} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: t.ink }}>{x.t}</div>
                <div style={{ fontSize: 10.5, color: t.ink3, marginTop: 2 }}>{x.s}</div>
              </div>
              <Icons.arrowRight size={13} stroke={t.ink3} />
            </div>
          ))}
        </Card>
      </div>
    </AppFrame>
  );
};

// ---------- Sub-components ----------
const KpiTile = ({ label, value, suffix, hint, trend, pill, spark = [], accent }) => {
  const t = RDI_TOKENS;
  const max = Math.max(...spark);
  const min = Math.min(...spark);
  const w = 88, h = 28;
  const pts = spark.map((v, i) => {
    const x = (i / (spark.length - 1)) * w;
    const y = h - ((v - min) / Math.max(max - min, 1)) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <Card pad={18} style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11.5, color: t.ink3, letterSpacing: '0.02em' }}>{label}</span>
        {trend != null && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11, color: trend >= 0 ? t.forest : t.rose, fontVariantNumeric: 'tabular-nums' }}>
            {trend >= 0 ? <Icons.arrowUp size={11} stroke={t.forest} /> : <Icons.arrowDown size={11} stroke={t.rose} />}
            {Math.abs(trend)}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
        <span style={{ fontFamily: '"Instrument Serif", serif', fontSize: 44, lineHeight: 1, color: t.ink, letterSpacing: '-0.02em' }}>{value}</span>
        {suffix && <span style={{ fontSize: 16, color: t.ink2 }}>{suffix}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontSize: 11, color: t.ink3 }}>{pill || hint}</div>
        <svg width={w} height={h} style={{ display: 'block' }}>
          <polyline points={pts} fill="none" stroke={accent} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={w} cy={h - ((spark[spark.length - 1] - min) / Math.max(max - min, 1)) * h} r="2.5" fill={accent} />
        </svg>
      </div>
    </Card>
  );
};

const Funnel = () => {
  const t = RDI_TOKENS;
  const stages = [
    { k: 'Candidature reçue', n: 138, p: 100, c: t.forestSoft, fg: t.forest },
    { k: 'Pré-qualification', n: 89, p: 64, c: '#CDDCC8', fg: t.forest },
    { k: 'Entretien', n: 61, p: 44, c: t.lime, fg: '#3F4D10' },
    { k: 'Validation pool', n: 47, p: 34, c: t.forest, fg: '#F4F8F2' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {stages.map((s, i) => (
        <div key={s.k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 130, fontSize: 12, color: t.ink2, flex: '0 0 130px' }}>{s.k}</div>
          <div style={{ flex: 1, height: 30, background: t.surfaceWarm, borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: `${s.p}%`,
              background: s.c, borderRadius: 6, display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '0 10px',
              color: s.fg, fontSize: 12, fontWeight: 500,
            }}>
              <span style={{ fontFamily: '"Instrument Serif", serif', fontSize: 18, lineHeight: 1 }}>{s.n}</span>
              <span style={{ fontSize: 11, opacity: 0.85 }}>{s.p}%</span>
            </div>
          </div>
          <div style={{ width: 70, fontSize: 11, color: t.ink3, textAlign: 'right' }}>
            {i === 0 ? '—' : `−${stages[i-1].n - s.n}`}
          </div>
        </div>
      ))}
    </div>
  );
};

const NpsChart = () => {
  const t = RDI_TOKENS;
  const data = [58, 62, 65, 67, 70, 72];
  const w = 280, h = 80;
  const max = 80, min = 50;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return [x, y];
  });
  const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block', height: 80 }}>
      <defs>
        <linearGradient id="npsg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={t.forest} stopOpacity="0.16" />
          <stop offset="100%" stopColor={t.forest} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[20, 40, 60].map(y => <line key={y} x1="0" x2={w} y1={y} y2={y} stroke={t.line} strokeDasharray="2 4" />)}
      <path d={area} fill="url(#npsg)" />
      <path d={path} fill="none" stroke={t.forest} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 3.5 : 2} fill={t.forest} />)}
    </svg>
  );
};

const Donut = () => {
  const t = RDI_TOKENS;
  const data = [
    { v: 9, c: t.forest },
    { v: 6, c: t.lime },
    { v: 4, c: t.amber },
    { v: 3, c: t.blue },
    { v: 1, c: t.clay },
  ];
  const total = data.reduce((s, d) => s + d.v, 0);
  const r = 42, c = 50, sw = 14;
  let acc = 0;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="116" height="116" viewBox="0 0 100 100" style={{ flex: '0 0 116px' }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke={t.surfaceWarm} strokeWidth={sw} />
      {data.map((d, i) => {
        const len = (d.v / total) * circ;
        const dash = `${len} ${circ - len}`;
        const offset = circ * 0.25 - acc;
        acc += len;
        return <circle key={i} cx={c} cy={c} r={r} fill="none" stroke={d.c} strokeWidth={sw}
          strokeDasharray={dash} strokeDashoffset={offset} />;
      })}
      <text x={c} y={c - 1} textAnchor="middle" fontSize="18" fontFamily="Instrument Serif, serif" fill={t.ink}>23</text>
      <text x={c} y={c + 11} textAnchor="middle" fontSize="6" fill={t.ink3} letterSpacing="0.5">ACTIFS</text>
    </svg>
  );
};

window.DashboardScreen = DashboardScreen;
