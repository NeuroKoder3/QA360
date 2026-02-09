import Analytics from './pages/Analytics';
import Audits from './pages/Audits';
import Coaching from './pages/Coaching';
import Dashboard from './pages/Dashboard';
import Evaluations from './pages/Evaluations';
import Incidents from './pages/Incidents';
import Scorecards from './pages/Scorecards';
import Settings from './pages/Settings';
import TeamPerformance from './pages/TeamPerformance';
import Teams from './pages/Teams';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "Audits": Audits,
    "Coaching": Coaching,
    "Dashboard": Dashboard,
    "Evaluations": Evaluations,
    "Incidents": Incidents,
    "Scorecards": Scorecards,
    "Settings": Settings,
    "TeamPerformance": TeamPerformance,
    "Teams": Teams,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};