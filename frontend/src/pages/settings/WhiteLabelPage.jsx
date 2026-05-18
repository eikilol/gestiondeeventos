import { WhiteLabelTab } from './SettingsPage.jsx';

export default function WhiteLabelPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-[fadeUp_0.4s_ease_both]">
      <div>
        <h1 className="text-2xl font-bold font-display text-text-1">White-label</h1>
        <p className="text-sm text-text-2 mt-0.5">
          Personaliza cómo se ven tus páginas públicas: marca, colores, fondo,
          tipografía, bordes y modo claro/oscuro.
        </p>
      </div>
      <WhiteLabelTab />
    </div>
  );
}
