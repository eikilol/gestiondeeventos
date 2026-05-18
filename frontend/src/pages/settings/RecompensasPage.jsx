import { RecompensasTab } from './SettingsPage.jsx';

export default function RecompensasPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-[fadeUp_0.4s_ease_both]">
      <div>
        <h1 className="text-2xl font-bold font-display text-text-1">Recompensas</h1>
        <p className="text-sm text-text-2 mt-0.5">Define premios canjeables por puntos para tus clientes y equipo.</p>
      </div>
      <RecompensasTab />
    </div>
  );
}
