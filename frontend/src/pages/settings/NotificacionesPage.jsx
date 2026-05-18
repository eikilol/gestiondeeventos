import { NotificacionesTab } from './SettingsPage.jsx';

export default function NotificacionesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-[fadeUp_0.4s_ease_both]">
      <div>
        <h1 className="text-2xl font-bold font-display text-text-1">Notificaciones</h1>
        <p className="text-sm text-text-2 mt-0.5">Push, recordatorios y avisos de la plataforma.</p>
      </div>
      <NotificacionesTab />
    </div>
  );
}
