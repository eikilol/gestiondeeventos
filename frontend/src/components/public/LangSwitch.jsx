/* Selector de idioma (público). Cambia el idioma global de i18n. */
import { useT, IDIOMAS } from '../../lib/i18n.js';

export default function LangSwitch({ className = '' }) {
  const { lang, setLang, t } = useT();
  return (
    <label className={`inline-flex items-center gap-1.5 text-xs text-text-3 ${className}`}>
      <span className="sr-only">{t('comun.idioma')}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" strokeLinecap="round" />
      </svg>
      <select
        value={lang}
        onChange={e => setLang(e.target.value)}
        className="bg-transparent border border-border rounded-lg px-1.5 py-1 text-text-2
                   focus:outline-none focus:border-primary/60 cursor-pointer"
      >
        {IDIOMAS.map(i => <option key={i.code} value={i.code}>{i.label}</option>)}
      </select>
    </label>
  );
}
