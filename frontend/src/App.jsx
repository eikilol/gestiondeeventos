import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import GLoader from './components/ui/GLoader.jsx';

import PublicLayout       from './components/layout/PublicLayout.jsx';
import AppLayout          from './components/layout/AppLayout.jsx';

/* Páginas livianas que aparecen primero — carga directa */
import LandingHomePage    from './pages/public/LandingHomePage.jsx';
import AuthPage           from './pages/AuthPage.jsx';

/* El resto se carga on-demand (code splitting por ruta) */
const ComoFuncionaPage   = lazy(() => import('./pages/public/ComoFuncionaPage.jsx'));
const ProductoPage       = lazy(() => import('./pages/public/ProductoPage.jsx'));
const ExplorarPage       = lazy(() => import('./pages/public/ExplorarPage.jsx'));
const EventoPublicoPage  = lazy(() => import('./pages/public/EventoPublicoPage.jsx'));
const MiTicketPage       = lazy(() => import('./pages/public/MiTicketPage.jsx'));
const PlanesPage         = lazy(() => import('./pages/public/PlanesPage.jsx'));
const FAQPage            = lazy(() => import('./pages/public/FAQPage.jsx'));

const RecuperarPage      = lazy(() => import('./pages/RecuperarPage.jsx'));
const ResetPasswordPage  = lazy(() => import('./pages/ResetPasswordPage.jsx'));
const ConfirmarPage      = lazy(() => import('./pages/ConfirmarPage.jsx'));
const CompletarPerfilPage= lazy(() => import('./pages/CompletarPerfilPage.jsx'));
const DashboardPage      = lazy(() => import('./pages/DashboardPage.jsx'));
const EventsListPage     = lazy(() => import('./pages/events/EventsListPage.jsx'));
const EventCreatePage    = lazy(() => import('./pages/events/EventCreatePage.jsx'));
const EventDetailPage    = lazy(() => import('./pages/events/EventDetailPage.jsx'));
const EventEditPage      = lazy(() => import('./pages/events/EventEditPage.jsx'));
const UsersPage          = lazy(() => import('./pages/users/UsersPage.jsx'));
const SettingsPage       = lazy(() => import('./pages/settings/SettingsPage.jsx'));

function AuthLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <GLoader size="lg" />
    </div>
  );
}

function PrivateRoute({ children, allowIncomplete = false }) {
  const { token, loading, usuario } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <AuthLoader />;
  if (!token) return <Navigate to="/login" replace />;

  /* Si el perfil está incompleto (típico de signup con Google), forzamos
     pasar por /completar-perfil antes de entrar a la app. */
  if (!allowIncomplete && usuario && !usuario.perfilCompleto && pathname !== '/completar-perfil') {
    return <Navigate to="/completar-perfil" replace />;
  }
  return children;
}

function PublicOnlyRoute({ children }) {
  const { token, loading, usuario } = useAuth();
  if (loading) return <AuthLoader />;
  if (!token) return children;
  /* Si está logueado pero falta completar perfil, mándalo allí. */
  if (usuario && !usuario.perfilCompleto) return <Navigate to="/completar-perfil" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Suspense fallback={<AuthLoader />}>
          <Routes>
            {/* Public site */}
            <Route element={<PublicLayout />}>
              <Route path="/"                  element={<LandingHomePage />} />
              <Route path="/como-funciona"     element={<ComoFuncionaPage />} />
              <Route path="/producto"          element={<ProductoPage />} />
              <Route path="/explorar"          element={<ExplorarPage />} />
              <Route path="/explorar/:slug"    element={<EventoPublicoPage />} />
              <Route path="/mi-ticket/:codigo" element={<MiTicketPage />} />
              <Route path="/planes"            element={<PlanesPage />} />
              <Route path="/faq"               element={<FAQPage />} />
            </Route>

            {/* Auth pages (unified with panel-swap animation) */}
            <Route path="/login"        element={<PublicOnlyRoute><AuthPage /></PublicOnlyRoute>} />
            <Route path="/register"     element={<PublicOnlyRoute><AuthPage /></PublicOnlyRoute>} />
            <Route path="/acceder"      element={<Navigate to="/login" replace />} />
            <Route path="/recuperar"        element={<RecuperarPage />} />
            <Route path="/restablecer"      element={<ResetPasswordPage />} />
            <Route path="/confirmar"        element={<ConfirmarPage />} />
            <Route path="/completar-perfil" element={
              <PrivateRoute allowIncomplete><CompletarPerfilPage /></PrivateRoute>
            } />

            {/* App protegida */}
            <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route path="/dashboard"        element={<DashboardPage />} />
              <Route path="/eventos"          element={<EventsListPage />} />
              <Route path="/eventos/nuevo"      element={<EventCreatePage />} />
              <Route path="/eventos/:id"        element={<EventDetailPage />} />
              <Route path="/eventos/:id/editar" element={<EventEditPage />} />
              <Route path="/usuarios"         element={<UsersPage />} />
              <Route path="/configuracion"    element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
