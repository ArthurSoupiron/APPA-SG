// SG · Fiche membre — tabs fonctionnels
const TABS = [
  { id: 'identite',  k: 'Identité',  icon: 'user' },
  { id: 'parcours',  k: 'Parcours JEECE', icon: 'briefcase', count: (m) => m.mandates?.length || 1 },
  { id: 'documents', k: 'Documents', icon: 'file-text', count: () => 12 },
  { id: 'audit',     k: 'Audit trail', icon: 'history', count: () => 28 },
  { id: 'perms',     k: 'Permissions', icon: 'shield-check' },
];

const PERSO_DOCS = [
  { ic: 'file-text', t: 'Attestation de fonction · Président', s: 'PDF · 1 page · généré 12/09/25', tone: 'success', tag: 'Signée' },
  { ic: 'file-signature', t: 'Charte du membre 25–26', s: 'PDF · 4 pages · signée 14/09/25', tone: 'success', tag: 'Signée' },
  { ic: 'id-card', t: 'Carte étudiante 25–26', s: 'JPG · vérifiée 12/09/25', tone: 'success', tag: 'Vérif.' },
  { ic: 'banknote', t: 'RIB', s: 'PDF · ajouté 02/10/25', tone: 'neutral', tag: 'Privé' },
  { ic: 'shield', t: 'Attestation responsabilité civile', s: 'PDF · MAIF · valide jusqu’au 31/08/26', tone: 'warn', tag: 'J−112' },
  { ic: 'file-check-2', t: 'PV élection Président · 12/09/25', s: 'PDF · extrait AG · 2 pages', tone: 'success', tag: 'Signée' },
];

const ScreenFiche = ({ navigate, memberId }) => {
  useLucideIcons();
  const [tab, setTab] = React.useState('identite');
  const m = memberById(memberId) || memberById('hm');
  if (!m) return <div className="page"><Empty title="Membre introuvable" /></div>;

  const mandates = m.mandates || [{ role: m.role, period: `Depuis ${m.joined}`, current: true, tags: [POLES[m.pole]?.k] }];
  const audit = memberAudit(m.id);

  return (
    <section className="page">
      <div className="card" style={{ marginBottom: 8 }}>
        <div className="member-head">
          <div className="member-head__avatar">
            <Avatar m={m} size={56} />
            {m.status === 'active' && <span className="status-dot" title="Actif"></span>}
          </div>
          <div>
            <div className="member-head__name">
              <h1>{m.first} {m.last}</h1>
              <Badge tone={STATUS[m.status]?.tone} dot>{STATUS[m.status]?.k}</Badge>
              <Badge tone="primary">{POLES[m.pole]?.k}</Badge>
              <Badge>Mandat 25–26</Badge>
            </div>
            <div className="muted" style={{ marginTop: 4 }}>
              {m.role} · {m.school || 'ECE Paris'} · Promo {m.promo} · membre depuis {m.joined}
            </div>
            <div className="member-head__contact">
              <span className="row"><Icon name="mail" />{m.email}</span>
              <span className="row"><Icon name="phone" />{m.phone}</span>
              {m.address && <span className="row"><Icon name="map-pin" />{m.address.split(',').slice(-1)[0].trim()}</span>}
              <span className="row"><Icon name="hash" /><code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5 }}>{m.jeeceId || 'JE-2024-' + m.id.toUpperCase()}</code></span>
            </div>
          </div>
          <div className="member-head__actions">
            <Btn icon="mail">Contacter</Btn>
            <Btn icon="file-plus-2">Générer un doc</Btn>
            <Btn kind="primary" icon="edit-3">Modifier</Btn>
          </div>
        </div>
        <div className="substats">
          <div><div className="substats__label">Mandats effectués</div><div className="substats__value tabular">{mandates.length}</div></div>
          <div><div className="substats__label">Documents personnels</div><div className="substats__value tabular">12</div></div>
          <div><div className="substats__label">Dernière connexion</div><div className="substats__value">Il y a 2h</div></div>
          <div><div className="substats__label">Conformité dossier</div><div className="substats__value" style={{ color: 'var(--success)' }}>Complet · 8/8</div></div>
        </div>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t.id}
            className={cls('tab', tab === t.id && 'tab--active')}
            onClick={() => setTab(t.id)}>
            <Icon name={t.icon} />{t.k}
            {t.count && <span className="count">{t.count(m)}</span>}
          </button>
        ))}
      </div>

      {tab === 'identite' && (
        <div className="grid-3">
          <Card title="Identité complète"
            action={<Btn kind="ghost" size="sm" icon="edit-3">Éditer</Btn>}
            noBody>
            <div className="field"><div className="field__k">Prénom</div><div className="field__v">{m.first}</div></div>
            <div className="field"><div className="field__k">Nom</div><div className="field__v">{m.last}</div></div>
            {m.birth && <div className="field"><div className="field__k">Date de naissance</div><div className="field__v">{m.birth}</div></div>}
            <div className="field"><div className="field__k">Email JEECE</div><div className="field__v">{m.email}</div></div>
            <div className="field"><div className="field__k">Téléphone</div><div className="field__v">{m.phone}</div></div>
            {m.address && <div className="field"><div className="field__k">Adresse</div><div className="field__v">{m.address}</div></div>}
            {m.studentId && <div className="field"><div className="field__k">N° étudiant</div><div className="field__v"><code>{m.studentId}</code></div></div>}
            <div className="field"><div className="field__k">École</div><div className="field__v">{m.school || 'ECE Paris'}</div></div>
            <div className="field"><div className="field__k">Promotion</div><div className="field__v">{m.year} · diplôme {m.promo}</div></div>
            {m.jeeceId && <div className="field"><div className="field__k">Identifiant JEECE</div><div className="field__v"><code>{m.jeeceId}</code></div></div>}
          </Card>

          <Card title="Parcours JEECE" sub={`${mandates.length} mandats · depuis ${m.joined}`} noBody
            foot={
              <div className="row" style={{ fontSize: 12, color: 'var(--text-2)' }}>
                <Icon name="award" style={{ width: 14, height: 14, color: 'var(--accent)' }} />
                <span>Membre exemplaire · 0 incident · 100% présence Bureau</span>
              </div>
            }>
            <div className="timeline">
              {mandates.map((md, i) => (
                <div key={i} className={cls('tl-item', !md.current && 'tl-item--past')}>
                  <div className="tl-item__title">{md.role}</div>
                  <div className="tl-item__sub">{md.period}</div>
                  <div className="tl-item__tags">
                    {md.tags?.map((t, j) => (
                      <Badge key={j} tone={md.current && j === 0 ? 'primary' : md.current && j === 1 ? 'accent' : 'neutral'}>{t}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Documents personnels" sub="12 docs"
            action={<Btn kind="ghost" size="sm" icon="plus">Ajouter</Btn>}
            noBody>
            {PERSO_DOCS.map((d, i) => (
              <div key={i} className="docs-row">
                <div className="doc-icon"><Icon name={d.ic} /></div>
                <div>
                  <div className="docs-row__title">{d.t}</div>
                  <div className="docs-row__sub">{d.s}</div>
                </div>
                <Badge tone={d.tone} dot>{d.tag}</Badge>
                <IconBtn icon="download" style={{ width: 28, height: 28 }} />
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === 'parcours' && (
        <Card title="Parcours JEECE complet" sub={`${mandates.length} mandats`} noBody>
          <div className="timeline" style={{ padding: 20 }}>
            {mandates.map((md, i) => (
              <div key={i} className={cls('tl-item', !md.current && 'tl-item--past')} style={{ paddingBottom: 22 }}>
                <div className="tl-item__title">{md.role}</div>
                <div className="tl-item__sub">{md.period}</div>
                <div className="tl-item__tags">
                  {md.tags?.map((t, j) => <Badge key={j} tone={md.current && j === 0 ? 'primary' : 'neutral'}>{t}</Badge>)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'documents' && (
        <Card title="Documents personnels · 12" noBody>
          {PERSO_DOCS.map((d, i) => (
            <div key={i} className="docs-row">
              <div className="doc-icon"><Icon name={d.ic} /></div>
              <div>
                <div className="docs-row__title">{d.t}</div>
                <div className="docs-row__sub">{d.s}</div>
              </div>
              <Badge tone={d.tone} dot>{d.tag}</Badge>
              <IconBtn icon="download" style={{ width: 28, height: 28 }} />
            </div>
          ))}
        </Card>
      )}

      {(tab === 'audit' || tab === 'identite') && (
        <Card style={{ marginTop: 12 }}
          head={
            <>
              <div className="card__title">Audit trail · modifications de la fiche</div>
              <div className="card__sub" style={{ marginLeft: 8 }}>28 entrées · 90 derniers jours</div>
              <div className="spacer"></div>
              <Btn kind="ghost" size="sm" icon="filter">Filtrer</Btn>
              <Btn kind="ghost" size="sm" icon="download">Exporter</Btn>
            </>
          } noBody>
          {audit.map((a, i) => {
            const who = memberById(a.who);
            return (
              <div key={i} className="audit">
                <Avatar m={who} size={24} />
                <div className="audit__action">
                  <strong>{who?.first} {who?.last}</strong> <span dangerouslySetInnerHTML={{ __html: a.html }} />
                </div>
                <span className="audit__time">{a.when}</span>
              </div>
            );
          })}
        </Card>
      )}

      {tab === 'perms' && (
        <Card title="Permissions & accès" noBody>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            {[
              { k: 'Rôle système', v: 'Président · accès complet', tone: 'primary' },
              { k: 'Accès Annuaire', v: 'Lecture + écriture', tone: 'success' },
              { k: 'Accès Bibliothèque', v: 'Lecture · pas de suppression', tone: 'success' },
              { k: 'Génération docs', v: 'Tous les templates', tone: 'success' },
              { k: 'Signature numérique', v: 'Activée · DocuSign', tone: 'accent' },
              { k: 'Données sensibles', v: 'RBAC niveau 3 · audit obligatoire', tone: 'warn' },
            ].map((p, i) => (
              <div key={i} style={{ padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div className="muted" style={{ fontSize: 11.5, marginBottom: 4 }}>{p.k}</div>
                <Badge tone={p.tone} dot>{p.v}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </section>
  );
};

window.ScreenFiche = ScreenFiche;
