// SG · Bibliothèque — catégories + recherche + preview live
const STATUS_BADGE = {
  signed: { tone: 'success', k: 'Signé' },
  pending: { tone: 'warn', k: 'À signer' },
  archived: { tone: 'neutral', k: 'Archivé' },
};

const docIcon = (d) => d.status === 'pending' ? 'file-warning' : (d.cat === 'pv-ag' ? 'file-check-2' : 'file-text');

const ScreenBiblio = ({ navigate }) => {
  useLucideIcons();
  const [cat, setCat] = React.useState('pv-ag');
  const [mandat, setMandat] = React.useState(null);
  const [q, setQ] = React.useState('');
  const [sort, setSort] = React.useState('date-desc');
  const [selId, setSelId] = React.useState('d1');

  const filtered = React.useMemo(() => {
    let xs = DOCS.slice();
    if (cat !== 'all') xs = xs.filter(d => d.cat === cat);
    if (mandat) xs = xs.filter(d => d.mandat === mandat);
    if (q.trim()) {
      const qq = q.toLowerCase();
      xs = xs.filter(d => d.title.toLowerCase().includes(qq) || d.ref.toLowerCase().includes(qq) || d.tags.some(t => t.includes(qq)));
    }
    xs.sort((a, b) => sort === 'date-desc' ? b.dateAbs.localeCompare(a.dateAbs) : a.title.localeCompare(b.title));
    return xs;
  }, [cat, mandat, q, sort]);

  React.useEffect(() => {
    // ensure selected doc is in the filtered set; else pick first
    if (filtered.length && !filtered.find(d => d.id === selId)) setSelId(filtered[0].id);
  }, [filtered]);

  const sel = DOCS.find(d => d.id === selId) || filtered[0];
  const catObj = DOC_CATEGORIES.find(c => c.id === cat) || DOC_CATEGORIES[0];

  return (
    <section className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Bibliothèque docs légaux</h1>
          <div className="page__sub">{DOCS.length + 298} documents · classés par type et par mandat · accès SG &amp; CDM</div>
        </div>
        <div className="page__actions">
          <Btn icon="upload">Importer</Btn>
          <Btn icon="file-plus-2">Générer depuis template</Btn>
          <Btn kind="primary" icon="plus">Nouveau document</Btn>
        </div>
      </div>

      <div className="lib">
        {/* Sidebar catégories */}
        <aside className="lib-side">
          <div className="lib-side__h">Catégories</div>
          {DOC_CATEGORIES.map(c => (
            <div key={c.id} className={cls('cat', cat === c.id && 'cat--active')}
              onClick={() => { setCat(c.id); setMandat(null); }}>
              <Icon name={c.icon} /><span>{c.k}</span>
              <span className="cat__count">{c.count}</span>
            </div>
          ))}
          <div className="lib-side__sep"></div>
          <div className="lib-side__h">Mandats</div>
          {[
            { v: '25-26', k: '2025–2026', n: 82 },
            { v: '24-25', k: '2024–2025', n: 76 },
            { v: '23-24', k: '2023–2024', n: 71 },
          ].map(m => (
            <div key={m.v} className={cls('cat', mandat === m.v && 'cat--active')} onClick={() => setMandat(mandat === m.v ? null : m.v)}>
              <Icon name="dot" /><span>{m.k}</span>
              <span className="cat__count">{m.n}</span>
            </div>
          ))}
          <div className="lib-side__sep"></div>
          <div className="cat" style={{ color: 'var(--accent)' }}><Icon name="bookmark" /><span>Mes favoris</span><span className="cat__count">9</span></div>
          <div className="cat" style={{ color: 'var(--highlight)' }} onClick={() => setCat('all')}><Icon name="alert-triangle" /><span>À signer</span><span className="cat__count">{DOCS.filter(d => d.status === 'pending').length}</span></div>
        </aside>

        {/* List */}
        <div className="card lib-list" style={{ padding: 0 }}>
          <div className="toolbar">
            <Icon name="search" style={{ width: 14, height: 14, color: 'var(--text-3)' }} />
            <input placeholder={`Rechercher dans ${catObj.k}…`} value={q} onChange={(e) => setQ(e.target.value)} />
            <Badge tone="primary">{filtered.length} docs</Badge>
            <Btn kind="ghost" size="sm" icon="arrow-down-up"
              onClick={() => setSort(s => s === 'date-desc' ? 'title-asc' : 'date-desc')}>
              {sort === 'date-desc' ? 'Date · récents' : 'Titre · A→Z'}
            </Btn>
            <Btn kind="ghost" size="sm" icon="filter">Filtres</Btn>
          </div>

          {filtered.length === 0 && <Empty />}
          {filtered.map(d => {
            const author = memberById(d.author);
            const sb = STATUS_BADGE[d.status];
            return (
              <div key={d.id} className={cls('doc-item', d.id === selId && 'doc-item--active')}
                onClick={() => setSelId(d.id)}>
                <div className="doc-item__icon"><Icon name={docIcon(d)} /></div>
                <div>
                  <div className="doc-item__title">{d.title}</div>
                  <div className="doc-item__sub">
                    <span>{d.format} · {d.pages} pages</span>
                    <span>Mandat {d.mandat}</span>
                    <span><code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{d.ref}</code></span>
                  </div>
                </div>
                <Badge tone={sb.tone} dot>{sb.k}</Badge>
                <div className="doc-item__author">
                  {author && <Avatar m={author} size={22} />}
                  {author ? `${author.first} ${author.last[0]}.` : <span className="muted-2">—</span>}
                </div>
                <div className="doc-item__date">{d.date}</div>
              </div>
            );
          })}

          {filtered.length > 0 && (
            <div className="pagination" style={{ borderTop: '1px solid var(--border)' }}>
              <span>Affichage <strong>1–{filtered.length}</strong> sur {catObj.count} {catObj.k}</span>
              <div className="row" style={{ gap: 4 }}>
                <button className="page-btn page-btn--muted"><Icon name="chevron-left" style={{ width: 14, height: 14 }} /></button>
                <button className="page-btn page-btn--active">1</button>
                <button className="page-btn">2</button>
                <button className="page-btn">3</button>
                <button className="page-btn"><Icon name="chevron-right" style={{ width: 14, height: 14 }} /></button>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        {sel && <DocPreview doc={sel} />}
      </div>
    </section>
  );
};

const DocPreview = ({ doc }) => {
  useLucideIcons();
  const sb = STATUS_BADGE[doc.status];
  const author = memberById(doc.author);
  const signers = (doc.signers || []).map(memberById).filter(Boolean);
  const catLabel = DOC_CATEGORIES.find(c => c.id === doc.cat)?.k || doc.cat;

  return (
    <aside className="preview" key={doc.id}>
      <div className="preview__head">
        <div className="row" style={{ gap: 8, marginBottom: 6 }}>
          <Badge tone="primary">{catLabel}</Badge>
          <Badge tone={sb.tone} dot>{sb.k}</Badge>
          <div className="spacer"></div>
          <IconBtn icon="bookmark" style={{ width: 28, height: 28 }} />
          <IconBtn icon="more-horizontal" style={{ width: 28, height: 28 }} />
        </div>
        <div className="preview__title">{doc.title}</div>
        <div className="preview__sub">JEECE · {doc.date} · Réf. {doc.ref}</div>
      </div>

      <div className="preview__doc">
        <span className="preview__page-pill">1 / {doc.pages}</span>
        <div className="preview__doc-head">JEECE · ECE Paris · Mandat {doc.mandat}</div>
        <div className="preview__doc-title">{doc.title}</div>
        <div className="preview__doc-line preview__doc-line--mid"></div>
        <div className="preview__doc-line preview__doc-line--short"></div>
        <div className="preview__doc-block">
          <div className="preview__doc-line"></div>
          <div className="preview__doc-line preview__doc-line--mid"></div>
          <div className="preview__doc-line preview__doc-line--short"></div>
          <div className="preview__doc-line"></div>
          <div className="preview__doc-line preview__doc-line--mid"></div>
        </div>
        <div className="preview__doc-block">
          <div className="preview__doc-line"></div>
          <div className="preview__doc-line preview__doc-line--mid"></div>
          <div className="preview__doc-line"></div>
          <div className="preview__doc-line preview__doc-line--short"></div>
        </div>
        {doc.status === 'signed' && (
          <div className="preview__doc-stamp">JEECE<br />signé<br />{doc.date.replace(/\s+/g, '-')}</div>
        )}
        {doc.status === 'pending' && (
          <div className="preview__doc-stamp" style={{ borderColor: 'var(--highlight)', color: 'var(--highlight)' }}>
            À<br />signer
          </div>
        )}
      </div>

      <div className="preview__meta">
        <div className="meta-row"><span className="meta-row__k">Référence</span><span className="meta-row__v"><code>{doc.ref}</code></span></div>
        <div className="meta-row"><span className="meta-row__k">Catégorie</span><span className="meta-row__v">{catLabel}</span></div>
        <div className="meta-row"><span className="meta-row__k">Mandat</span><span className="meta-row__v">20{doc.mandat.replace('-', '–20')}</span></div>
        <div className="meta-row"><span className="meta-row__k">Format</span><span className="meta-row__v">{doc.format} · {doc.pages} pages · {doc.size}</span></div>
        <div className="meta-row"><span className="meta-row__k">Créé par</span>
          <span className="meta-row__v row">
            {author ? <><Avatar m={author} size={18} />{author.first} {author.last}</> : <span className="muted">—</span>}
          </span>
        </div>
        {signers.length > 0 && (
          <div className="meta-row"><span className="meta-row__k">Signé par</span>
            <span className="meta-row__v row" style={{ flexWrap: 'wrap', gap: 4 }}>
              {signers.slice(0, 4).map(s => <Avatar key={s.id} m={s} size={18} />)}
              {signers.length > 4 && <span className="muted">+{signers.length - 4}</span>}
            </span>
          </div>
        )}
        <div className="meta-row"><span className="meta-row__k">Tags</span>
          <span className="meta-row__v row" style={{ flexWrap: 'wrap', gap: 4 }}>
            {doc.tags.map((t, i) => <Badge key={i}>{t}</Badge>)}
          </span>
        </div>
      </div>

      <div className="preview__actions">
        <Btn icon="external-link">Ouvrir</Btn>
        <Btn kind="primary" icon="download">Télécharger</Btn>
      </div>

      <div className="audit-mini">
        <div className="audit-mini__h">Historique</div>
        {[
          { who: doc.author, t: 'a finalisé le document.', when: `${doc.date} · 19:14` },
          ...(signers[0] ? [{ who: signers[0].id, t: 'a signé numériquement.', when: `${doc.date} · 18:52` }] : []),
          { who: doc.author, t: 'a généré le doc depuis un template.', when: `${doc.date} · 16:30` },
        ].map((a, i) => {
          const w = memberById(a.who);
          return (
            <div key={i} className="audit-mini__row">
              <Avatar m={w} size={22} />
              <div>
                <div><strong>{w?.first} {w?.last}</strong> {a.t}</div>
                <div className="audit-mini__time">{a.when}</div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

window.ScreenBiblio = ScreenBiblio;
