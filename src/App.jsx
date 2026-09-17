import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SecurityEvents from './pages/SecurityEvents';
import ThreatDetection from './pages/ThreatDetection';
import Alerts from './pages/Alerts';
import RiskAssessment from './pages/RiskAssessment';
import ResponseWorkflow from './pages/ResponseWorkflow';
import AttackPath from './pages/AttackPath';
import HandlerRestoration from './pages/HandlerRestoration';
import DemoApp from './pages/DemoApp';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/demo" element={<DemoApp />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="events" element={<SecurityEvents />} />
          <Route path="detection" element={<ThreatDetection />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="attack-path" element={<AttackPath />} />
          <Route path="risk" element={<RiskAssessment />} />
          <Route path="response" element={<ResponseWorkflow />} />
          <Route path="handler" element={<HandlerRestoration />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
