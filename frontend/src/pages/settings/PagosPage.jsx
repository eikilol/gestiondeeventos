import { PagosTab } from './SettingsPage.jsx';

export default function PagosPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-[fadeUp_0.4s_ease_both]">
      <div>
        <h1 className="text-2xl font-bold font-display text-text-1">Pagos</h1>
        <p className="text-sm text-text-2 mt-0.5">Tu plan y la conexión de cobros con Mercado Pago.</p>
      </div>
      <PagosTab />
    </div>
  );
}
