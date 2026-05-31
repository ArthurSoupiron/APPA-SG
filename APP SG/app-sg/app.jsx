// JEECE · SG — app shell + routing
const parseHash = () => {
  const h = (location.hash || '#/dashboard').replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  if (parts.length === 0) return { name: 'dashboard' };
  if (parts[0] === 'dossier' && parts[1]) return { name: 'dossier', memberId: parts[1] };
  return { name: parts[0] };
};

const App = () => {
  const [route, setRoute] = React.useState(parseHash());
  const [search, setSearch] = React.useState('');
  useIcons();
  useStore(); // re-render l'app entière à chaque mutation persistée

  React.useEffect(() => {
    const onHash = () => { setRoute(parseHash()); setSearch(''); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onHash);
    const onQuota = () => alert("Stockage local plein : le dernier fichier n'a pas pu être sauvegardé.\nUtilisez des fichiers plus légers (max 1,5 Mo) ou videz d'anciennes données.");
    window.addEventListener('sg:quota', onQuota);
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('sg:quota', onQuota); };
  }, []);
  const navigate = (to) => { location.hash = `#/${to}`; };

  let body, crumbs;
  if (route.name === 'dossier') {
    const m = memberById(route.memberId);
    crumbs = [{ k: 'SG' }, { k: 'Membres', onClick: () => navigate('membres') }, { k: m ? `${m.first} ${m.last}` : 'Dossier' }];
    body = <ScreenDossier navigate={navigate} memberId={route.memberId} />;
  } else if (route.name === 'membres') {
    crumbs = [{ k: 'SG' }, { k: 'Membres & dossiers' }];
    body = <ScreenMembres navigate={navigate} />;
  } else if (route.name === 'documents') {
    crumbs = [{ k: 'SG' }, { k: 'Documents (GED)' }];
    body = <ScreenDocuments navigate={navigate} />;
  } else if (route.name === 'conformite') {
    crumbs = [{ k: 'SG' }, { k: 'Conformité' }];
    body = <ScreenConformite navigate={navigate} />;
  } else if (route.name === 'stats') {
    crumbs = [{ k: 'SG' }, { k: 'Statistiques' }];
    body = <ScreenStats navigate={navigate} />;
  } else if (route.name === 'journal') {
    crumbs = [{ k: 'SG' }, { k: "Journal d'audit" }];
    body = <ScreenJournal navigate={navigate} />;
  } else if (route.name === 'archives') {
    crumbs = [{ k: 'SG' }, { k: 'Archives mandats' }];
    body = <ScreenArchives navigate={navigate} />;
  } else if (route.name === 'parametres') {
    crumbs = [{ k: 'SG' }, { k: 'Paramètres' }];
    body = <ScreenParametres navigate={navigate} />;
  } else {
    crumbs = [{ k: 'SG' }, { k: 'Tableau de bord' }];
    body = <ScreenDashboard navigate={navigate} />;
  }

  return (
    <div className="app">
      <Sidebar route={route} navigate={navigate} />
      <div className="main">
        <Header crumbs={crumbs} search={search} setSearch={setSearch} navigate={navigate} />
        {body}
      </div>
      <ModalHost navigate={navigate} />
      <ToastHost />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
