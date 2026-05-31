// JEECE · SG — Documents (GED) : catégories + recherche + preview live
const ScreenDocuments = ({ navigate }) => {
  useIcons();
  const [cat, setCat] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [sort, setSort] = React.useState('date');
  const [selId, setSelId] = React.useState('g1');
  const [sel, setSel] = React.useState(() => new Set());
  const toggleSel = (id) => setSel(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  let filtered = DOCS.slice();
  if (cat === 'fav') filtered = filtered.filter(d => d.fav);
  else if (cat === 'tosign') filtered = filtered.filter(d => d.status === 'pending');
  else if (cat !== 'all') filtered = filtered.filter(d => d.cat === cat);
  if (q.trim()) {
    const qq = q.toLowerCase();
    filtered = filtered.filter(d => d.title.toLowerCase().includes(qq) || d.ref.toLowerCase().includes(qq) || (d.tags || []).some(t => t.includes(qq)));
  }
  filtered.sort((a, b) => sort === 'date' ? b.dateAbs.localeCompare(a.dateAbs) : a.title.localeCompare(b.title));

  React.useEffect(() => {
    if (filtered.length && !filtered.find(d => d.id === selId)) setSelId(filtered[0].id);
  }, [filtered]);

  const sel = DOCS.find(d => d.id === selId) || filtered[0];
  const catLabel = cat === 'fav' ? 'les favoris' : cat === 'tosign' ? 'les documents à signer'
    : (GED_CATS.find(c => c.id === cat) || {}).label ? GED_CATS.find(c => c.id === cat).label.toLowerCase() : 'tous les documents';

  const statusBadge = { signed: { tone: 'ok', k: 'Signé' }, pending: { tone: 'warn', k: 'À signer' }, archived: { tone: 'info', k: 'Archivé' } };
  const docIcon = (d) => d.status === 'pending' ? 'file-clock' : ({ pvag: 'gavel', cr: 'clipboard-list', ri: 'book-open-text', statuts: 'scroll-text', pref: 'building-2', compta: 'receipt', ba: 'file-badge', contrats: 'file-signature' }[d.cat] || 'file-text');

  return (
    <section className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Documents officiels — GED</h1>
          <div className="page__sub">{DOCS.length} documents centralisés · stockage cloud chiffré · accès SSO tracé</div>
        </div>
        <div className="page__actions">
          <Btn icon="download" onClick={exportDocsCSV}>Exporter</Btn>
          <Btn icon="file-plus-2" onClick={() => openModal('generate')}>Générer depuis modèle</Btn>
          <Btn kind="primary" icon="upload" onClick={() => openModal('doc')}>Déposer un document</Btn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '232px 1fr 340px', gap: 13 }}>
        {/* categories */}
        <aside className="card" style={{ padding: 8, height: 'fit-content', alignSelf: 'start' }}>
          <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 10px 6px', fontWeight: 600 }}>Catégories</div>
          {GED_CATS.map(c => (
            <div key={c.id} onClick={() => setCat(c.id)} className="nav-item" style={{
              background: cat === c.id ? 'var(--brand-050)' : 'transparent',
              color: cat === c.id ? 'var(--brand-700)' : 'var(--ink-2)',
              fontWeight: cat === c.id ? 600 : 450,
            }}>
              <Icon name={c.icon} /><span style={{ flex: 1 }}>{c.label}</span>
              <span style={{ fontSize: 11, color: cat === c.id ? 'var(--brand-700)' : 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>{c.count}</span>
            </div>
          ))}
          <div style={{ height: 1, background: 'var(--border)', margin: '8px' }}></div>
          <div className="nav-item" onClick={() => setCat('tosign')}
            style={{ color: cat === 'tosign' ? 'var(--brand-700)' : 'var(--warn)', background: cat === 'tosign' ? 'var(--brand-050)' : 'transparent', fontWeight: cat === 'tosign' ? 600 : 450 }}>
            <Icon name="file-clock" /><span style={{ flex: 1 }}>À signer</span>
            <span style={{ fontSize: 11 }}>{DOCS.filter(d => d.status === 'pending').length}</span>
          </div>
          <div className="nav-item" onClick={() => setCat('fav')}
            style={{ color: cat === 'fav' ? 'var(--brand-700)' : 'var(--ink-2)', background: cat === 'fav' ? 'var(--brand-050)' : 'transparent', fontWeight: cat === 'fav' ? 600 : 450 }}>
            <Icon name="star" /><span style={{ flex: 1 }}>Favoris</span><span style={{ fontSize: 11 }}>{DOCS.filter(d => d.fav).length}</span>
          </div>
        </aside>

        {/* list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', alignSelf: 'start' }}>
          {sel.size > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px', borderBottom: '1px solid var(--border)', background: 'var(--brand-050)' }}>
              <Badge tone="brand">{sel.size} sélectionné(s)</Badge>
              <span className="spacer"></span>
              <Btn size="sm" icon="archive" onClick={() => { [...sel].forEach(id => setGedStatus(id, 'archived')); setSel(new Set()); }}>Archiver</Btn>
              <Btn size="sm" icon="trash-2" style={{ color: '#B23A33', borderColor: 'var(--danger-bg)' }} onClick={() => openModal('confirm', {
                danger: true, title: `Supprimer ${sel.size} document(s) ?`, confirmLabel: 'Supprimer',
                message: 'Les documents sélectionnés seront retirés définitivement de la GED.',
                onConfirm: () => { deleteGedDocs([...sel]); setSel(new Set()); },
              })}>Supprimer</Btn>
              <IconBtn icon="x" title="Désélectionner" style={{ width: 28, height: 28 }} onClick={() => setSel(new Set())} />
            </div>
          ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px', borderBottom: '1px solid var(--border)' }}>
            <div className="search" style={{ margin: 0, flex: 1, maxWidth: 'none' }}>
              <Icon name="search" /><input placeholder={`Rechercher dans ${catLabel}…`} value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Badge tone="brand">{filtered.length}</Badge>
            <Btn kind="ghost" size="sm" icon="arrow-down-up" onClick={() => setSort(s => s === 'date' ? 'title' : 'date')}>{sort === 'date' ? 'Date' : 'Titre'}</Btn>
          </div>
          )}
          {filtered.length === 0 ? <Empty /> : filtered.map((d, i) => {
            const author = memberById(d.author);
            const sb = statusBadge[d.status];
            return (
              <div key={d.id} onClick={() => setSelId(d.id)} style={{
                display: 'grid', gridTemplateColumns: 'auto auto 1fr auto', gap: 12, alignItems: 'center',
                padding: '12px 15px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer',
                background: sel.has(d.id) ? 'var(--brand-050)' : d.id === selId ? 'var(--brand-050)' : 'transparent',
              }}>
                <input type="checkbox" aria-label={`Sélectionner ${d.title}`} checked={sel.has(d.id)}
                  onClick={(e) => e.stopPropagation()} onChange={() => toggleSel(d.id)} />
                <div style={{ width: 38, height: 38, borderRadius: 9, background: d.id === selId ? '#fff' : 'var(--surface-2)', display: 'grid', placeItems: 'center', color: d.id === selId ? 'var(--brand)' : 'var(--ink-2)', flex: '0 0 38px' }}>
                  <Icon name={docIcon(d)} style={{ width: 17, height: 17 }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 550, fontSize: 13 }}>{d.title}</div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--ink-3)', marginTop: 2, flexWrap: 'wrap' }}>
                    <span>{d.format} · {d.pages} p.</span>
                    <span className="mono">{d.ref}</span>
                    {author && <span>· {author.first} {author.last[0]}.</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                  <Badge tone={sb.tone} dot>{sb.k}</Badge>
                  <span className="muted-2 tabular" style={{ fontSize: 10.5 }}>{d.date}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* preview */}
        {sel && <DocPreview doc={sel} statusBadge={statusBadge} />}
      </div>
    </section>
  );
};

const DocPreview = ({ doc, statusBadge }) => {
  useIcons();
  const author = memberById(doc.author);
  const signers = (doc.signers || []).map(memberById).filter(Boolean);
  const catLabel = GED_CATS.find(c => c.id === doc.cat)?.label || doc.cat;
  const sb = statusBadge[doc.status];
  const secTone = { 'Confidentiel': 'danger', 'Interne': 'warn', 'Public': 'ok' }[doc.security] || 'neutral';

  return (
    <aside className="card" key={doc.id} style={{ alignSelf: 'start', overflow: 'hidden', animation: 'rise .25s ease' }}>
      <div style={{ padding: '15px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 7, marginBottom: 8 }}>
          <Badge tone="brand">{catLabel}</Badge>
          <Badge tone={sb.tone} dot>{sb.k}</Badge>
          <span className="spacer"></span>
          <IconBtn icon="star" title={doc.fav ? 'Retirer des favoris' : 'Ajouter aux favoris'} onClick={() => toggleGedFav(doc.id)}
            style={{ width: 28, height: 28, color: doc.fav ? 'var(--warn)' : 'var(--ink-2)', borderColor: doc.fav ? 'var(--warn)' : 'var(--border)', background: doc.fav ? 'var(--warn-bg)' : 'var(--surface)' }} />
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.3 }}>{doc.title}</div>
        <div className="muted-2 mono" style={{ fontSize: 11, marginTop: 4 }}>{doc.ref} · {doc.date}</div>
      </div>

      {/* aperçu réel si un fichier a été déposé, sinon mock */}
      {doc.file ? (
        <div style={{ margin: 16, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <FilePreview file={doc.file} height={300} />
        </div>
      ) : (
      <div style={{ margin: 16, padding: 16, background: 'var(--surface-2)', border: '1px dashed var(--border-2)', borderRadius: 10, aspectRatio: '0.76', position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, color: 'var(--ink-2)', background: '#fff', padding: '2px 6px', borderRadius: 5, border: '1px solid var(--border)' }}>1 / {doc.pages}</span>
        <div style={{ fontSize: 9, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>JEECE · ECE Paris · Mandat {doc.mandat}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', margin: '6px 0 10px' }}>{doc.title}</div>
        {[100, 70, 88, 60, 92, 76, 100, 64].map((w, i) => (
          <div key={i} style={{ height: 4, width: `${w}%`, background: '#E2EAE4', borderRadius: 2, marginBottom: 6 }}></div>
        ))}
        <div style={{ marginTop: 12 }}>
          {[84, 92, 68].map((w, i) => <div key={i} style={{ height: 4, width: `${w}%`, background: '#E2EAE4', borderRadius: 2, marginBottom: 6 }}></div>)}
        </div>
        {doc.status === 'signed' && (
          <div style={{ position: 'absolute', bottom: 16, right: 16, width: 58, height: 58, border: '1.5px solid var(--brand)', borderRadius: 99, opacity: 0.6, transform: 'rotate(-12deg)', color: 'var(--brand)', display: 'grid', placeItems: 'center', fontSize: 8, fontWeight: 700, fontFamily: 'var(--mono)', textAlign: 'center', lineHeight: 1.2 }}>JEECE<br />signé</div>
        )}
        {doc.status === 'pending' && (
          <div style={{ position: 'absolute', bottom: 16, right: 16, width: 58, height: 58, border: '1.5px solid var(--warn)', borderRadius: 99, opacity: 0.55, transform: 'rotate(-12deg)', color: 'var(--warn)', display: 'grid', placeItems: 'center', fontSize: 8, fontWeight: 700, fontFamily: 'var(--mono)', textAlign: 'center', lineHeight: 1.2 }}>À<br />signer</div>
        )}
      </div>
      )}

      {/* meta */}
      <div style={{ padding: '4px 16px 14px' }}>
        {[
          ['Référence', <span className="mono" style={{ fontSize: 12 }}>{doc.ref}</span>],
          ['Format', `${doc.format} · ${doc.pages} pages · ${doc.size}`],
          ['Mandat', `20${doc.mandat.replace('–', '–20')}`],
          ['Confidentialité', <Badge tone={secTone} dot>{doc.security}</Badge>],
          ['Créé par', author ? <span className="row" style={{ gap: 6 }}><Avatar m={author} size={20} />{author.first} {author.last}</span> : '—'],
        ].map(([k, v], i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', padding: '7px 0', fontSize: 12.5, borderBottom: '1px solid var(--border)' }}>
            <div className="muted">{k}</div><div>{v}</div>
          </div>
        ))}
        {signers.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', padding: '7px 0', fontSize: 12.5 }}>
            <div className="muted">Signataires</div>
            <div style={{ display: 'flex', gap: -6, alignItems: 'center' }}>
              {signers.slice(0, 5).map((sgr, i) => <div key={sgr.id} style={{ marginLeft: i ? -7 : 0 }}><Avatar m={sgr} size={22} /></div>)}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
          {doc.tags.map(t => <Badge key={t}>{t}</Badge>)}
        </div>

        {/* notes internes du document */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="message-square" style={{ width: 13, height: 13 }} />Notes internes
            {(doc.notes || []).length > 0 && <Badge tone="brand">{doc.notes.length}</Badge>}
          </div>
          <NotesPanel kind="doc" id={doc.id} notes={doc.notes || []} />
        </div>
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {doc.status === 'pending'
            ? <Btn kind="primary" icon="pen-tool" onClick={() => setGedStatus(doc.id, 'signed')}>Signer</Btn>
            : doc.status === 'signed'
              ? <Btn icon="archive" onClick={() => setGedStatus(doc.id, 'archived')}>Archiver</Btn>
              : <Btn icon="rotate-ccw" onClick={() => setGedStatus(doc.id, 'pending')}>Réactiver</Btn>}
          <IconBtn icon="trash-2" title="Supprimer le document" style={{ width: '100%' }}
            onClick={() => openModal('confirm', { danger: true, title: 'Supprimer ce document ?', confirmLabel: 'Supprimer', message: `« ${doc.title} » sera retiré définitivement de la GED.`, onConfirm: () => deleteGedDoc(doc.id) })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Btn icon="eye" onClick={() => doc.file && window.open(doc.file.dataURL, '_blank')} title={doc.file ? '' : 'Aucun fichier joint'}>Ouvrir</Btn>
          <Btn kind="primary" icon="download" onClick={() => {
            if (!doc.file) return;
            const a = document.createElement('a'); a.href = doc.file.dataURL; a.download = doc.file.name;
            document.body.appendChild(a); a.click(); a.remove();
          }}>Télécharger</Btn>
        </div>
      </div>
    </aside>
  );
};

window.ScreenDocuments = ScreenDocuments;
