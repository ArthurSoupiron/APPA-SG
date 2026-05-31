// SG · App — router + shell

// ===== Hash routing =====
const parseHash = () => {
  const h = (location.hash || '#/dashboard').replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  if (parts.length === 0) return { name: 'dashboard' };
  if (parts[0] === 'membre' && parts[1]) return { name: 'fiche', memberId: parts[1] };
  return { name: parts[0] };
};

const useRoute = () => {
  const [route, setRoute] = React.useState(parseHash());
  React.useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const navigate = (to) => { location.hash = `#/${to}`; };
  return [route, navigate];
};

const ROUTE_TITLES = {
  dashboard:    { crumbs: [{ k: 'Espace SG' }, { k: 'Dashboard' }] },
  annuaire:     { crumbs: [{ k: 'Espace SG' }, { k: 'Annuaire' }] },
  bibliotheque: { crumbs: [{ k: 'Espace SG' }, { k: 'Bibliothèque docs légaux' }] },
};

const App = () => {
  const [route, navigate] = useRoute();
  const [search, setSearch] = React.useState('');
  useLucideIcons();

  // Reset search when navigating between screens
  React.useEffect(() => { setSearch(''); }, [route.name, route.memberId]);

  let body, crumbs;
  if (route.name === 'fiche') {
    const m = memberById(route.memberId);
    crumbs = [
      { k: 'Espace SG' },
      { k: 'Annuaire', onClick: () => navigate('annuaire') },
      { k: m ? `${m.first} ${m.last}` : 'Membre' },
    ];
    body = <ScreenFiche navigate={navigate} memberId={route.memberId} />;
  } else if (route.name === 'annuaire') {
    crumbs = ROUTE_TITLES.annuaire.crumbs;
    body = <ScreenAnnuaire navigate={navigate} search={search} setSearch={setSearch} />;
  } else if (route.name === 'bibliotheque') {
    crumbs = ROUTE_TITLES.bibliotheque.crumbs;
    body = <ScreenBiblio navigate={navigate} />;
  } else {
    crumbs = ROUTE_TITLES.dashboard.crumbs;
    body = <ScreenDashboard navigate={navigate} search={search} />;
  }

  return (
    <div className="app">
      <Sidebar route={route} navigate={navigate} />
      <div className="main">
        <Header crumbs={crumbs} searchValue={search} onSearchChange={setSearch} />
        {body}
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
