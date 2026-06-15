// JEECE · SG — Conformité (vue dédiée CNJE / légal)
const ScreenConformite = ({ navigate }) => {
  useIcons();
  const r = rollups();

  const dossierCheck = { id: '__dossiers', k: 'Dossiers membres complets', s: `${r.complete}/${r.membersTotal} conformes · ${r.incomplete.length} à régulariser`, state: r.incomplete.length ? 'pending' : 'ok', ref: null, computed: true };
  const checks = [...CONFORMITE, dossierCheck];
  const stateMap = {
    ok: { tone: 'ok', label: 'Conforme', icon: 'check-circle', color: 'var(--brand)', bg: 'var(--ok-bg)' },
    pending: { tone: 'warn', label: 'En cours', icon: 'clock', color: 'var(--warn)', bg: 'var(--warn-bg)' },
    todo: { tone: 'danger', label: 'À faire', icon: 'circle-alert', color: 'var(--danger)', bg: 'var(--danger-bg)' },
  };
  const okCount = checks.filter(c => c.state === 'ok').length;
  const pct = Math.round((okCount / checks.length) * 100);

  const stateLabel = { ok: 'Conforme', pending: 'En cours', todo: 'À faire' };
  const downloadReport = () => {
    const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const rows = checks.map(c => `<tr><td>${c.k}</td><td>${c.s || ''}</td><td style="white-space:nowrap">${stateLabel[c.state] || c.state}</td></tr>`).join('');
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Rapport de conformité — JEECE</title>
      <style>
        body{font-family:Georgia,'Times New Roman',serif;color:#14271C;max-width:760px;margin:40px auto;padding:0 32px;line-height:1.5}
        .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1A9E55;padding-bottom:16px;margin-bottom:24px}
        .brand{font-family:Arial,sans-serif;font-weight:700;font-size:20px;color:#0F6E39}
        .brand small{display:block;font-weight:400;font-size:11px;color:#587065}
        .meta{font-family:Arial,sans-serif;font-size:12px;color:#587065;text-align:right}
        h1{font-size:20px;margin:0 0 6px}
        .score{font-family:Arial,sans-serif;font-size:14px;margin:0 0 20px;color:#0F6E39;font-weight:700}
        table{width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:12.5px}
        th{text-align:left;background:#EBF9F0;color:#0F6E39;padding:8px 10px;border-bottom:1px solid #B4E6C8}
        td{padding:8px 10px;border-bottom:1px solid #E4ECE6;vertical-align:top}
        @media print{body{margin:0}}
      </style></head><body>
      <div class="head"><div class="brand">JEECE<small>Junior-Entreprise · ECE Paris</small></div>
        <div class="meta">Paris, le ${today}<br>Mandat 2025–2026</div></div>
      <h1>Rapport de conformité</h1>
      <p class="score">Score global : ${pct}% · ${okCount}/${checks.length} points conformes</p>
      <table><thead><tr><th>Obligation</th><th>Détail</th><th>État</th></tr></thead><tbody>${rows}</tbody></table>
      <p style="font-family:Arial,sans-serif;font-size:11px;color:#8AA093;margin-top:28px">Document généré automatiquement depuis l'espace SG · suivi du label CNJE.</p>
    </body></html>`;
    downloadBlob(`rapport-conformite-jeece-${new Date().toISOString().slice(0, 10)}.html`, html, 'text/html;charset=utf-8');
    toast('Rapport de conformité téléchargé', 'ok');
  };

  const runAudit = () => {
    logActivity({ who: 'lb', action: 'a lancé un audit de conformité', target: `score ${pct}%`, ctx: `${okCount}/${checks.length} points conformes`, icon: 'shield-check', tone: 'brand' });
    sgCommit();
    const open = checks.length - okCount;
    toast(open ? `Audit terminé : ${open} point(s) à régulariser` : 'Audit terminé : tout est conforme ✅', open ? 'warn' : 'ok');
  };

  return (
    <section className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Conformité & sécurité</h1>
          <div className="page__sub">Suivi des obligations légales · label CNJE · audit du 15 juin 2026</div>
        </div>
        <div className="page__actions">
          <Btn icon="download" onClick={downloadReport}>Rapport de conformité</Btn>
          <Btn kind="primary" icon="shield-check" onClick={runAudit}>Lancer un audit</Btn>
        </div>
      </div>

      {/* score band */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 13, marginBottom: 14 }}>
        <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16, gridColumn: 'span 1' }}>
          <Ring pct={pct} size={72} stroke={8} />
          <div><div style={{ fontSize: 13, fontWeight: 600 }}>Score global</div><div className="muted-2" style={{ fontSize: 12, marginTop: 2 }}>{okCount}/{checks.length} points conformes</div></div>
        </div>
        {[
          { ic: 'folder-check', label: 'Dossiers conformes', v: `${r.completePct}%`, tone: 'brand' },
          { ic: 'file-clock', label: 'Documents à signer', v: String(DOCS.filter(d => d.status === 'pending').length), tone: 'warn' },
          { ic: 'calendar-clock', label: 'Échéances < 30j', v: String(DEADLINES.filter(d => { const i = deadlineInfo(d); return i.days >= 0 && i.days <= 30; }).length), tone: 'danger' },
        ].map((x, i) => (
          <div key={i} className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: x.tone === 'brand' ? 'var(--brand-050)' : x.tone === 'warn' ? 'var(--warn-bg)' : 'var(--danger-bg)', display: 'grid', placeItems: 'center', color: x.tone === 'brand' ? 'var(--brand)' : x.tone === 'warn' ? 'var(--warn)' : 'var(--danger)' }}>
                <Icon name={x.ic} style={{ width: 15, height: 15 }} />
              </div>
              <span className="muted" style={{ fontSize: 12 }}>{x.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{x.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
        <Card head={<>
          <div><div className="card__title">Checklist de conformité</div><div className="card__sub">Obligations légales & associatives</div></div>
          <div className="spacer"></div>
          <Badge tone="ok" dot>{okCount} OK</Badge><Badge tone="warn" dot>{checks.filter(c=>c.state==='pending').length} en cours</Badge>
        </>} noBody>
          {checks.map((c, i) => {
            const sm = stateMap[c.state];
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 17px', borderBottom: i < checks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: sm.bg, display: 'grid', placeItems: 'center', color: sm.color, flex: '0 0 32px' }}><Icon name={sm.icon} style={{ width: 16, height: 16 }} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 550, fontSize: 13 }}>{c.k}</div>
                  <div className="muted-2" style={{ fontSize: 11.5 }}>{c.s}{c.ref && <span className="mono"> · {c.ref}</span>}</div>
                </div>
                <Badge tone={sm.tone} dot>{sm.label}</Badge>
                {c.state !== 'ok' && <Btn size="sm" icon="arrow-right"
                  onClick={() => c.computed ? navigate('membres') : advanceCheck(c.id)}>Traiter</Btn>}
              </div>
            );
          })}
        </Card>

        <Card head={<>
          <div><div className="card__title">Prochaines échéances</div><div className="card__sub">Calendrier réglementaire</div></div>
          <div className="spacer"></div>
          <Btn kind="ghost" size="sm" icon="calendar-plus" onClick={() => openModal('deadline')}>Ajouter</Btn>
        </>} noBody>
          {DEADLINES.map((d, i) => {
            const info = deadlineInfo(d);
            return (
            <div key={d.id || i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 12, alignItems: 'center', padding: '12px 17px', borderBottom: i < DEADLINES.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 46, textAlign: 'center', border: '1px solid var(--border)', borderRadius: 9, padding: '6px 2px', background: info.tone === 'warn' ? 'var(--warn-bg)' : 'var(--surface-2)' }}>
                <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1, color: info.tone === 'warn' ? '#9A6212' : 'var(--ink)' }}>{info.day}</div>
                <div style={{ fontSize: 9.5, color: 'var(--ink-3)', textTransform: 'uppercase', marginTop: 2 }}>{info.mo}</div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 550 }}>{d.title}</div>
                <div className="muted-2" style={{ fontSize: 11 }}><Badge style={{ marginRight: 4 }}>{d.kind}</Badge>{d.sub}</div>
              </div>
              <Badge tone={info.tone === 'warn' ? 'warn' : info.tone === 'info' ? 'info' : info.tone === 'danger' ? 'danger' : 'neutral'}>{info.delta}</Badge>
              <IconBtn icon="trash-2" title="Supprimer l'échéance" style={{ width: 28, height: 28 }} onClick={() => deleteDeadline(d.id)} />
            </div>
            );
          })}
        </Card>
      </div>
    </section>
  );
};

window.ScreenConformite = ScreenConformite;
