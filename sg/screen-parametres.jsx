// JEECE · SG — Paramètres (types de pièces, catégories GED, données)
const ScreenParametres = ({ navigate }) => {
  useIcons();
  const fileRef = React.useRef();

  const doExport = () => {
    downloadBlob(`sauvegarde-jeece-sg-${new Date().toISOString().slice(0, 10)}.json`, exportBackup(), 'application/json');
    toast('Sauvegarde téléchargée', 'ok');
  };
  const onImportFile = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const n = Array.isArray(data.MEMBERS) ? data.MEMBERS.length : 0;
      openModal('confirm', {
        title: 'Restaurer cette sauvegarde ?',
        confirmLabel: 'Restaurer',
        message: `Le fichier contient ${n} dossier(s) membre. Les données actuelles seront remplacées.`,
        onConfirm: () => { try { importBackup(data); } catch (e) { toast('Fichier invalide', 'danger'); } },
      });
    } catch (e) { toast('Fichier JSON illisible', 'danger'); }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <section className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Paramètres</h1>
          <div className="page__sub">Configuration des dossiers, de la GED et des données</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Types de pièces requises */}
        <Card head={<>
          <div><div className="card__title">Pièces du dossier membre</div><div className="card__sub">Documents officiels suivis dans chaque dossier</div></div>
          <div className="spacer"></div>
          <Btn kind="primary" size="sm" icon="plus" onClick={() => openModal('docType')}>Ajouter</Btn>
        </>} noBody>
          {DOC_TYPES.map((d, i) => (
            <div key={d.code} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 17px', borderBottom: i < DOC_TYPES.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--ink-2)', flex: '0 0 34px' }}>
                <Icon name={d.icon} style={{ width: 16, height: 16 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 550, fontSize: 13 }}>{d.label}</div>
                <div className="muted-2 mono" style={{ fontSize: 11 }}>{d.code}</div>
              </div>
              <button className={cls('btn', 'btn--sm')} onClick={() => toggleDocRequired(d.code)}
                style={{ background: d.required ? 'var(--brand-050)' : 'var(--surface)', color: d.required ? 'var(--brand-700)' : 'var(--ink-2)', borderColor: d.required ? 'var(--brand-200)' : 'var(--border-2)' }}>
                {d.required ? 'Obligatoire' : 'Optionnel'}
              </button>
              <IconBtn icon="trash-2" title="Supprimer ce type" style={{ width: 30, height: 30 }}
                onClick={() => openModal('confirm', { danger: true, title: 'Supprimer ce type de pièce ?', confirmLabel: 'Supprimer', message: `« ${d.label} » ne sera plus suivi dans les dossiers. Les pièces déjà déposées restent dans les données.`, onConfirm: () => { removeDocType(d.code); toast('Type de pièce supprimé', 'warn'); } })} />
            </div>
          ))}
        </Card>

        {/* Catégories GED */}
        <Card head={<>
          <div><div className="card__title">Catégories de la GED</div><div className="card__sub">Classement des documents officiels</div></div>
          <div className="spacer"></div>
          <Btn kind="primary" size="sm" icon="plus" onClick={() => openModal('cat')}>Ajouter</Btn>
        </>} noBody>
          {GED_CATS.filter(c => c.id !== 'all').map((c, i, arr) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 17px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', color: 'var(--ink-2)', flex: '0 0 34px' }}>
                <Icon name={c.icon} style={{ width: 16, height: 16 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 550, fontSize: 13 }}>{c.label}</div>
                <div className="muted-2 mono" style={{ fontSize: 11 }}>{c.id} · {gedCount(c.id)} document(s)</div>
              </div>
              <IconBtn icon="trash-2" title="Supprimer cette catégorie" style={{ width: 30, height: 30 }}
                onClick={() => openModal('confirm', { danger: true, title: 'Supprimer cette catégorie ?', confirmLabel: 'Supprimer', message: `« ${c.label} » sera retirée. Les documents associés resteront accessibles via « Tous les documents ».`, onConfirm: () => { removeCat(c.id); toast('Catégorie supprimée', 'warn'); } })} />
            </div>
          ))}
        </Card>
      </div>

      {/* Sécurité / SSO (vitrine) + données */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <Card title="Accès & SSO" sub="Authentification de l'espace SG">
          {[
            { k: 'SSO Google Workspace', v: 'Activé', ic: 'shield-check', tone: 'ok' },
            { k: "Contrôle d'accès (RBAC)", v: 'Bureau · Pôles', ic: 'lock', tone: 'info' },
            { k: 'Stockage', v: 'Cloud chiffré · UE', ic: 'cloud', tone: 'ok' },
            { k: 'Sauvegarde', v: 'Quotidienne', ic: 'database-backup', tone: 'ok' },
          ].map((x, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <Icon name={x.ic} style={{ width: 15, height: 15, color: x.tone === 'info' ? 'var(--info)' : 'var(--brand)' }} />
              <span style={{ flex: 1, fontSize: 12.5 }} className="muted">{x.k}</span>
              <Badge tone={x.tone}>{x.v}</Badge>
            </div>
          ))}
        </Card>

        <Card title="Données & sauvegarde" sub="Stockées localement dans ce navigateur">
          <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 12 }}>
            Vos modifications sont enregistrées automatiquement dans ce navigateur. Exportez une
            sauvegarde complète (JSON) pour la conserver ou la transférer sur un autre poste,
            puis restaurez-la quand vous voulez.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Btn kind="primary" icon="download" onClick={doExport}>Exporter (JSON)</Btn>
            <Btn icon="upload" onClick={() => fileRef.current && fileRef.current.click()}>Restaurer</Btn>
            <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={(e) => onImportFile(e.target.files[0])} />
            <Btn icon="rotate-ccw" onClick={() => openModal('confirm', { danger: true, title: 'Réinitialiser la démo ?', confirmLabel: 'Tout réinitialiser', message: "Toutes les modifications locales seront effacées et les données d'origine restaurées. Cette action est irréversible.", onConfirm: () => sgReset() })}>Réinitialiser</Btn>
          </div>
        </Card>
      </div>
    </section>
  );
};

window.ScreenParametres = ScreenParametres;
