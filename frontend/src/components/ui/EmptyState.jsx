export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="relative flex flex-col items-center justify-center py-24 text-center animate-[fadeUp_0.5s_cubic-bezier(0.16,1,0.3,1)_both] overflow-hidden rounded-3xl border border-border bg-surface/40">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute -bottom-32 right-1/4 w-80 h-80 rounded-full bg-accent/6 blur-[120px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40' width='40' height='40' fill='none' stroke='%23ffffff'%3e%3cpath d='M0 .5H39.5V40'/%3e%3c/svg%3e\")" }} />
      </div>

      <div className="relative z-10">
        <div className="relative mb-6 mx-auto w-fit">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/20 flex items-center justify-center backdrop-blur-sm shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] animate-[float_4s_ease-in-out_infinite]">
            {Icon
              ? <Icon className="w-11 h-11 text-primary-light" />
              : <DefaultIcon />}
          </div>
          <div className="absolute -inset-4 rounded-full bg-primary/10 blur-2xl pointer-events-none animate-[pulseSoft_3s_ease-in-out_infinite]" />
        </div>
        <h3 className="text-xl font-bold font-display text-text-1 tracking-tight mb-2">{title}</h3>
        {description && (
          <p className="text-base text-text-2 max-w-sm leading-relaxed mx-auto">{description}</p>
        )}
        {action && <div className="mt-7">{action}</div>}
      </div>
    </div>
  );
}

function DefaultIcon() {
  return (
    <svg className="w-11 h-11 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}
