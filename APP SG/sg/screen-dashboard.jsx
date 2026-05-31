// SG · Dashboard screen — interactif (tâches checkables)
const ScreenDashboard = ({ navigate, search }) => {
  useLucideIcons();
  const [tasks, setTasks] = React.useState(TASKS);
  const toggle = (id) => setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const remaining = tasks.filter(t => !t.done).length;
  const late = tasks.filter(t => !t.done && t.dueTone === 'danger').length;

  // search filter applied to activity/deadlines/tasks
  const q = (search || '').trim().toLowerCase();
  const tasksShown = q ? tasks.filter(t => t.title.toLowerCase().includes(q) || t.meta.toLowerCase().includes(q)) : tasks;

  return (
    <section className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Bonjour Léa</h1>
          <div className="page__sub">Lundi 11 mai 2026 · vue d'ensemble du mandat</div>
        </div>
        <div className="page__actions">
          <Btn icon="download">Exporter état des lieux</Btn>
          <Btn kind="primary" icon="plus" onClick={() => navigate('annuaire')}>Nouveau membre</Btn>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="card kpi">
          <div className="kpi__label"><Icon name="users" />Membres actifs</div>
          <div className="kpi__value tabular">{MEMBERS.filter(m => m.status === 'active').length + 75}</div>
          <div className="kpi__hint kpi__hint--up"><Icon name="trending-up" style={{ width: 13, height: 13 }} />+6 depuis sept.</div>
        </div>
        <div className="card kpi">
          <div className="kpi__label"><Icon name="alert-triangle" />Alertes échéances</div>
          <div className="kpi__value tabular" style={{ color: 'var(--highlight)' }}>{DEADLINES.length + 1}</div>
          <div className="kpi__hint kpi__hint--warn">3 sous 30j · 2 critiques</div>
        </div>
        <div className="card kpi">
          <div className="kpi__label"><Icon name="file-signature" />Docs en attente signature</div>
          <div className="kpi__value tabular">12</div>
          <div className="kpi__hint">4 PV bureau · 5 attestations · 3 contrats</div>
        </div>
        <div className="card kpi">
          <div className="kpi__label"><Icon name="calendar-clock" />AG à venir</div>
          <div className="kpi__value">14 juin</div>
          <div className="kpi__hint">AG ordinaire · J−34</div>
        </div>
      </div>

      <div className="twocol">
        <Card
          head={
            <>
              <div>
                <div className="card__title">À traiter cette semaine</div>
                <div className="card__sub">{remaining} actions · {late} en retard</div>
              </div>
              <div className="spacer"></div>
              {late > 0 && <Badge tone="danger" dot>{late} retard</Badge>}
              <Btn kind="ghost" size="sm">Tout voir</Btn>
            </>
          }
        >
          {tasksShown.length === 0 && <Empty title="Aucune tâche correspondante" sub="Affinez votre recherche." />}
          {tasksShown.map(t => {
            const owner = memberById(t.owner);
            return (
              <div key={t.id} className="task" onClick={() => toggle(t.id)} style={{ cursor: 'pointer', opacity: t.done ? 0.55 : 1 }}>
                <div className={cls('check', t.done && 'check--on')}>
                  {t.done && <Icon name="check" style={{ width: 12, height: 12, color: '#fff' }} />}
                </div>
                <div>
                  <div className="task__title" style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</div>
                  <div className="task__meta">{t.meta}</div>
                </div>
                <Badge tone={t.dueTone} dot>{t.due}</Badge>
                <div className="task__owner">
                  {owner && <Avatar m={owner} size={22} />}
                </div>
              </div>
            );
          })}
        </Card>

        <Card
          head={
            <>
              <div>
                <div className="card__title">Échéances légales · 90 jours</div>
                <div className="card__sub">Préfecture, AG, mandats · auto-monitoring</div>
              </div>
              <div className="spacer"></div>
              <Btn kind="ghost" size="sm" icon="calendar">Calendrier</Btn>
            </>
          }
        >
          {DEADLINES.map((d, i) => (
            <div key={i} className={cls('deadline', d.tone && `deadline--${d.tone}`)}>
              <div className="deadline__date">
                <div className="deadline__date-day">{d.day}</div>
                <div className="deadline__date-mo">{d.mo}</div>
              </div>
              <div>
                <div className="deadline__title">{d.title}</div>
                <div className="deadline__sub">{d.sub}</div>
              </div>
              <Badge tone={d.tone === 'past' ? 'danger' : d.tone === 'soon' ? 'warn' : 'primary'} dot>{d.delta}</Badge>
            </div>
          ))}
        </Card>
      </div>

      <Card style={{ marginTop: 12 }}
        head={
          <>
            <div className="card__title">Activité récente</div>
            <div className="card__sub" style={{ marginLeft: 8 }}>audit trail · dernières 24h</div>
            <div className="spacer"></div>
            <Btn kind="ghost" size="sm">Voir l'audit complet</Btn>
          </>
        }
      >
        <div className="activity">
          {RECENT_ACTIVITY.map((a, i) => {
            const m = memberById(a.who);
            return (
              <div key={i} className="activity__row">
                <Avatar m={m} size={24} />
                <div>
                  <strong>{m?.first} {m?.last}</strong> <span dangerouslySetInnerHTML={{ __html: a.html }} />
                </div>
                <span className="activity__time">{a.when}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
};

window.ScreenDashboard = ScreenDashboard;
