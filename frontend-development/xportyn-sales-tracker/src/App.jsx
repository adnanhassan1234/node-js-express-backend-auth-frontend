import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { NotificationProvider } from './context/NotificationContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Replies from './pages/Replies';
import Templates from './pages/Templates';
import Settings from './pages/Settings';

/** Protected page ko Layout ke andar wrap karne ka shortcut */
const Protected = ({ children }) => (
  <ProtectedRoute>
    {/* Socket sirf login ke baad jurta hai */}
    <NotificationProvider>
      <Layout>{children}</Layout>
    </NotificationProvider>
  </ProtectedRoute>
);

const App = () => (
  <Routes>
    {/* Public */}
    <Route path="/login" element={<Login />} />

    {/* Protected */}
    <Route
      path="/dashboard"
      element={
        <Protected>
          <Dashboard />
        </Protected>
      }
    />
    <Route
      path="/contacts"
      element={
        <Protected>
          <Contacts />
        </Protected>
      }
    />
    <Route
      path="/replies"
      element={
        <Protected>
          <Replies />
        </Protected>
      }
    />
    <Route
      path="/templates"
      element={
        <Protected>
          <Templates />
        </Protected>
      }
    />
    <Route
      path="/settings"
      element={
        <Protected>
          <Settings />
        </Protected>
      }
    />

    {/* Default + unknown routes */}
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default App;
