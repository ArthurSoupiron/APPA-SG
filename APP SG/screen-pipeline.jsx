// Pipeline RDI — vue Kanban des candidatures intervenants.

const PipelineScreen = () => {
  const t = RDI_TOKENS;
  return (
    <AppFrame
      active="pipeline"
      sub="Pipeline · 47 candidatures actives · mandat 25–26"
      title="Pipeline candidatures"
      topbarRight={
        <>
          <Btn kind="ghost" icon={<Icons.filter size={13} stroke={t.ink} />}>Toutes campagnes</Btn>
          <Btn kind="ghost" icon={<Icons.download size={13} stroke={t.ink} />}>Exporter</Btn>
          <Btn kind="primary" icon={<Icons.plus size={13} stroke="#F4F8F2" />}>Nouveau candidat</Btn>
        </>
      }
    >
      {/* Filter strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <Pill tone="forest" dot>Campagne automne · 47</Pill>
        <Pill tone="neutral">Compétence · Toutes</Pill>
        <Pill tone="neutral">Source · Toutes</Pill>
        <Pill tone="neutral">Référent · Tous</Pill>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11.5, color: t.ink3 }}>SLA pré-qualif <span style={{ color: t.ink, fontWeight: 600 }}>2,4j</span> · entretien <span style={{ color: t.amber, fontWeight: 600 }}>5,1j ↑</span></span>
      </div>

      {/* Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, height: 'calc(100% - 44px)' }}>
        <KanbanColumn
          tone="neutral"
          title="Candidature reçue"
          count={138}
          new={12}
          slaLabel="< 24h pour qualifier"
          cards={[
            { name: 'Marion Tessier', school: 'HEC · M1', skills: ['Data', 'Strat'], days: 1, score: 86, src: 'Forms', sla: 'ok' },
            { name: 'Yanis Belkacem', school: 'X · M2', skills: ['Tech', 'IA'], days: 2, score: 92, src: 'Forms', sla: 'ok', star: true },
            { name: 'Camille Roy', school: 'ESCP · M1', skills: ['Strat'], days: 3, score: 71, src: 'Référent', sla: 'warn' },
            { name: 'T. Nakamura', school: 'Sciences Po', skills: ['Com', 'Strat'], days: 0, score: 78, src: 'Forms', sla: 'ok' },
            { name: 'Élise Fournier', school: 'Centrale · M1', skills: ['Tech'], days: 4, score: 64, src: 'LinkedIn', sla: 'late' },
          ]}
        />
        <KanbanColumn
          tone="amber"
          title="Pré-qualification"
          count={89}
          new={5}
          slaLabel="Entretien à planifier"
          cards={[
            { name: 'Léo Petit', school: 'EM Lyon · M2', skills: ['Strat', 'Com'], days: 2, score: 81, src: 'Plane' },
            { name: 'Anaïs Diop', school: 'Dauphine', skills: ['Data'], days: 4, score: 88, src: 'Forms', star: true },
            { name: 'M. Lefebvre', school: 'Audencia', skills: ['Com'], days: 5, score: 70, src: 'Référent', sla: 'warn' },
            { name: 'Hugo Vasseur', school: 'INSA · M1', skills: ['Tech', 'IA'], days: 6, score: 75, src: 'Forms', sla: 'late' },
          ]}
        />
        <KanbanColumn
          tone="lime"
          title="Entretien"
          count={61}
          new={3}
          slaLabel="Décision sous 48h"
          cards={[
            { name: 'Jules Maréchal', school: 'HEC · M2', skills: ['Strat', 'Data'], days: 1, score: 91, src: 'Forms', star: true, interview: '14:00 auj.' },
            { name: 'Sarah Halimi', school: 'Sciences Po', skills: ['Com', 'Design'], days: 2, score: 84, src: 'Référent', interview: 'Demain 10h' },
            { name: 'P. Da Silva', school: 'EDHEC', skills: ['Strat'], days: 3, score: 76, src: 'Forms', interview: 'J+2' },
          ]}
        />
        <KanbanColumn
          tone="forest"
          title="Validation pool"
          count={47}
          new={2}
          slaLabel="Onboarding · contrat à signer"
          cards={[
            { name: 'Nina Lambert', school: 'X · M2', skills: ['Tech', 'Data'], days: 0, score: 94, src: 'Forms', star: true, status: 'Contrat envoyé' },
            { name: 'Tom Aubert', school: 'ESCP · M2', skills: ['Strat'], days: 1, score: 87, src: 'Référent', status: 'Onboarding J1' },
            { name: 'Inès Bensaïd', school: 'Centrale', skills: ['Tech'], days: 2, score: 82, src: 'Forms', status: 'Contrat signé' },
          ]}
        />
      </div>
    </AppFrame>
  );
};

const KanbanColumn = ({ tone, title, count, new: nNew, slaLabel, cards }) => {
  const t = RDI_TOKENS;
  const accents = {
    neutral: { dot: t.ink3, soft: t.surfaceWarm, head: t.line },
    amber: { dot: t.amber, soft: t.amberSoft, head: t.amber },
    lime: { dot: '#8DA01F', soft: t.limeSoft, head: t.lime },
    forest: { dot: t.forest, soft: t.forestSoft, head: t.forest },
  }[tone];
  return (
    <div style={{
      background: t.surfaceWarm, borderRadius: 14, border: `1px solid ${t.line}`,
      display: 'flex', flexDirection: 'column', minHeight: 0,
    }}>
      <div style={{ padding: '12px 12px 10px', borderBottom: `1px solid ${t.line}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: accents.dot }} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: t.ink }}>{title}</span>
          <span style={{ fontSize: 11, color: t.ink3, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
          <span style={{ flex: 1 }} />
          {nNew > 0 && <Pill tone={tone} dot>{nNew} new</Pill>}
          <Icons.more size={14} stroke={t.ink3} />
        </div>
        <div style={{ marginTop: 6, fontSize: 10.5, color: t.ink3 }}>{slaLabel}</div>
      </div>
      <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden', flex: 1 }}>
        {cards.map((c, i) => <CandidateCard key={i} c={c} tone={tone} />)}
        <button style={{
          padding: '8px', border: `1px dashed ${t.line2}`, borderRadius: 10,
          background: 'transparent', color: t.ink3, fontSize: 11.5,
          fontFamily: 'Geist, sans-serif', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <Icons.plus size={12} stroke={t.ink3} />
          Ajouter manuellement
        </button>
      </div>
    </div>
  );
};

const CandidateCard = ({ c, tone }) => {
  const t = RDI_TOKENS;
  const slaColor = c.sla === 'late' ? t.rose : c.sla === 'warn' ? t.amber : t.ink3;
  const skillTone = { Strat: 'forest', Data: 'blue', Tech: 'lime', Com: 'amber', Design: 'clay', IA: 'rose' };
  return (
    <div style={{
      background: t.surface, borderRadius: 10, padding: 11,
      border: `1px solid ${t.line}`, display: 'flex', flexDirection: 'column', gap: 8,
      boxShadow: '0 1px 0 rgba(20,32,26,0.02)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <Avatar name={c.name} size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
            {c.star && <Icons.star size={11} stroke={t.amber} fill={t.amber} />}
          </div>
          <div style={{ fontSize: 10.5, color: t.ink3 }}>{c.school}</div>
        </div>
        <ScoreCircle v={c.score} />
      </div>

      {c.interview && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
          background: t.limeSoft, borderRadius: 6, fontSize: 11, color: '#5A6815',
        }}>
          <Icons.clock size={11} stroke="#5A6815" />
          <span>Entretien · {c.interview}</span>
        </div>
      )}
      {c.status && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
          background: t.forestSoft, borderRadius: 6, fontSize: 11, color: t.forest,
        }}>
          <Icons.check size={11} stroke={t.forest} />
          <span>{c.status}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {c.skills.map(s => <Pill key={s} tone={skillTone[s] || 'neutral'} style={{ fontSize: 10.5 }}>{s}</Pill>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10.5, color: t.ink3, paddingTop: 4, borderTop: `1px dashed ${t.line}` }}>
        <span>{c.src}</span>
        <span style={{ color: slaColor, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <Icons.clock size={10} stroke={slaColor} />
          {c.days === 0 ? 'auj.' : `J+${c.days}`}
        </span>
      </div>
    </div>
  );
};

const ScoreCircle = ({ v }) => {
  const t = RDI_TOKENS;
  const c = v >= 85 ? t.forest : v >= 75 ? t.lime : v >= 65 ? t.amber : t.clay;
  const fg = v >= 85 ? '#F4F8F2' : v >= 75 ? '#3F4D10' : v >= 65 ? '#7E5A12' : '#F4F8F2';
  return (
    <div style={{
      width: 30, height: 30, borderRadius: 999, background: c, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
      flex: '0 0 30px',
    }}>{v}</div>
  );
};

window.PipelineScreen = PipelineScreen;
