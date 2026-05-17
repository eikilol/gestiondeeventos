import { useEffect, useState } from 'react';
import { clientesApi } from '../../../api/clientes.js';
import { ticketsApi } from '../../../api/tickets.js';
import { useToast } from '../../../context/ToastContext.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import GLoader from '../../../components/ui/GLoader.jsx';

const ESTADO_LABEL = {
  emitido    : 'Emitido',
  pagado     : 'Pagado',
  usado      : 'Asistió',
  reembolsado: 'Reembolsado',
  invalido   : 'Inválido',
};

const ESTADO_CLS = {
  emitido    : 'bg-warning/10 text-warning border-warning/20',
  pagado     : 'bg-success/10 text-success border-success/20',
  usado      : 'bg-text-1/10 text-text-1 border-border-2',
  reembolsado: 'bg-text-3/10 text-text-2 border-border',
  invalido   : 'bg-danger/10 text-danger border-danger/20',
};

export default function ClientesTab({ evento }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ]             = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const { success, error: toastErr } = useToast();

  const reload = async () => {
    setLoading(true);
    try {
      const d = await clientesApi.list(evento.id, {
        ...(q ? { q } : {}),
        ...(estadoFilter ? { estado: estadoFilter } : {}),
      });
      setData(d);
    } catch (e) { toastErr(e.message); }
    finally    { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(reload, q ? 300 : 0);
    return () => clearTimeout(t);
    /* eslint-disable-next-line */
  }, [evento.id, q, estadoFilter]);

  const cambiarEstado = async (ticketId, estado) => {
    try {
      await clientesApi.cambiarEstado(evento.id, ticketId, estado);
      success('Estado actualizado.');
      reload();
    } catch (e) { toastErr(e.message); }
  };

  const clientes = data?.clientes || [];
  const stats    = data?.stats    || { total: 0, ingresos: 0 };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-text-1 tracking-tight">Clientes</h2>
          <p className="text-sm text-text-2 mt-1">Personas que han reservado o comprado boletas para este evento.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportarCSV(clientes, evento)}
            disabled={clientes.length === 0}
            className="btn-secondary btn-sm"
            title="Descarga un CSV con todos los clientes (respeta filtros activos)">
            <DownloadIcon className="w-3.5 h-3.5" /> Exportar CSV
          </button>
          <button onClick={() => setImportOpen(true)} className="btn-secondary btn-sm">
            <UploadIcon className="w-3.5 h-3.5" /> Importar CSV
          </button>
        </div>
      </div>

      {/* Stats compactos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Total"        value={stats.total} />
        <StatBox label="Pagados"      value={stats.pagado || 0} />
        <StatBox label="Asistieron"   value={stats.usado || 0} />
        <StatBox label="Ingresos"     value={`$${Math.round(stats.ingresos).toLocaleString('es-CO')}`} hint={evento.currency} />
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none" />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre, email o código..."
            className="input rounded-2xl py-2.5 pl-10 text-sm"
          />
        </div>
        <select
          value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}
          className="input bg-surface-2 rounded-2xl py-2.5 text-sm w-auto"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <GLoader message="Cargando clientes..." />
      ) : clientes.length === 0 ? (
        <EmptyState hasFilter={Boolean(q || estadoFilter)} />
      ) : (
        <div className="rounded-3xl border border-border bg-surface/40 overflow-hidden">
          {clientes.map((c, i) => (
            <ClienteRow
              key={c.id}
              cliente={c}
              currency={evento.currency}
              onCambiarEstado={(e) => cambiarEstado(c.id, e)}
              style={{ animationDelay: `${i * 25}ms` }}
            />
          ))}
        </div>
      )}

      {importOpen && (
        <ImportModal
          eventoId={evento.id}
          onClose={() => setImportOpen(false)}
          onDone={(stats) => {
            setImportOpen(false);
            success(`${stats.creados} cliente${stats.creados === 1 ? '' : 's'} importado${stats.creados === 1 ? '' : 's'}.`);
            reload();
          }}
        />
      )}
    </div>
  );
}

function StatBox({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/40 px-4 py-3.5">
      <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold">{label}</p>
      <p className="text-2xl font-bold font-display text-text-1 tabular-nums mt-1 leading-none">{value}</p>
      {hint && <p className="text-[10px] text-text-3 mt-1 lowercase">{hint}</p>}
    </div>
  );
}

function ClienteRow({ cliente, currency, onCambiarEstado, style }) {
  const [openMenu, setOpenMenu] = useState(false);
  const nombre = cliente.usuario?.nombre || cliente.guest_nombre || cliente.guest_email;
  const email  = cliente.usuario?.email || cliente.guest_email;
  const initials = (nombre || 'U').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
  const fecha = new Date(cliente.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-0 hover:bg-surface-2/30 transition-colors animate-[fadeUp_0.3s_ease_both] group"
      style={style}
    >
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
        {cliente.usuario?.avatar_url
          ? <img src={cliente.usuario.avatar_url} alt="" className="w-full h-full object-cover" />
          : initials}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-1 truncate">{nombre}</p>
        <p className="text-xs text-text-3 truncate">{email}</p>
      </div>

      <div className="hidden md:block text-right">
        <p className="text-xs font-medium text-text-1">{cliente.tipo?.nombre || '—'}</p>
        <p className="text-[11px] text-text-3 tabular-nums">
          {cliente.precio_pagado != null
            ? (Number(cliente.precio_pagado) === 0 ? 'Gratis' : `$${Number(cliente.precio_pagado).toLocaleString('es-CO')} ${currency}`)
            : 'Pendiente'}
        </p>
      </div>

      <div className="hidden lg:block">
        <p className="text-[10px] uppercase tracking-wider text-text-3">Código</p>
        <p className="font-mono text-xs text-text-2 tabular-nums">{cliente.codigo}</p>
      </div>

      <div className="hidden sm:block text-right text-[11px] text-text-3 tabular-nums w-20">{fecha}</div>

      <span className={`text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full border ${ESTADO_CLS[cliente.estado] || ESTADO_CLS.emitido}`}>
        {ESTADO_LABEL[cliente.estado] || cliente.estado}
      </span>

      <div className="relative">
        <button
          onClick={() => setOpenMenu(v => !v)}
          aria-label="Acciones"
          className="w-8 h-8 rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <DotsIcon className="w-4 h-4" />
        </button>
        {openMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(false)} />
            <div className="absolute right-0 top-9 z-20 w-44 rounded-2xl border border-border-2 bg-surface shadow-2xl py-1 animate-[scaleIn_0.15s_ease_both] origin-top-right">
              {Object.entries(ESTADO_LABEL).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => { onCambiarEstado(k); setOpenMenu(false); }}
                  disabled={cliente.estado === k}
                  className="w-full px-3 py-2 text-left text-sm text-text-2 hover:text-text-1 hover:bg-surface-2 disabled:text-text-3 disabled:bg-surface-2/50 transition-colors"
                >
                  Marcar como {label.toLowerCase()}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ hasFilter }) {
  return (
    <div className="rounded-3xl border border-border bg-surface/40 px-6 py-16 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface border border-border mb-4">
        <UsersIcon className="w-6 h-6 text-text-2" />
      </div>
      <h2 className="text-lg font-bold font-display text-text-1 tracking-tight mb-1">
        {hasFilter ? 'Sin resultados' : 'Aún no hay clientes'}
      </h2>
      <p className="text-sm text-text-2 leading-relaxed max-w-sm mx-auto">
        {hasFilter
          ? 'Ningún cliente coincide con los filtros. Cambia la búsqueda o el estado.'
          : 'Cuando alguien reserve o compre una boleta, aparecerá aquí. Comparte el link de tu evento para empezar.'}
      </p>
    </div>
  );
}

/* ─────────── Import CSV modal ─────────── */
function ImportModal({ eventoId, onClose, onDone }) {
  const { error: toastErr } = useToast();
  const [tipos, setTipos]       = useState([]);
  const [tipoId, setTipoId]     = useState('');
  const [marcarPagado, setMarcarPagado] = useState(true);
  const [filas, setFilas]       = useState(null); // [{nombre, email, telefono}]
  const [working, setWorking]   = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    ticketsApi.list(eventoId)
      .then(d => {
        const list = d.tickets || [];
        setTipos(list);
        if (list.length === 1) setTipoId(list[0].id);
      })
      .catch(e => toastErr(e.message));
    /* eslint-disable-next-line */
  }, [eventoId]);

  const onFile = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.length === 0) throw new Error('El archivo no tiene filas válidas.');
      setFilas(parsed);
    } catch (e) { toastErr(e.message); }
  };

  const submit = async () => {
    if (!tipoId) { toastErr('Elegí el tipo de boleta.'); return; }
    if (!filas || filas.length === 0) { toastErr('Cargá un CSV primero.'); return; }
    setWorking(true);
    try {
      const r = await clientesApi.importar(eventoId, {
        ticket_type_id: tipoId,
        marcar_pagado : marcarPagado,
        rows          : filas,
      });
      setResultado(r);
      if (r.errores.length === 0) {
        onDone({ creados: r.creados });
      }
    } catch (e) { toastErr(e.response?.data?.error || e.message); }
    finally    { setWorking(false); }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-bg/70 backdrop-blur-md animate-[fadeIn_0.2s_ease_both]" onClick={onClose}>
      <div className="relative w-full max-w-2xl rounded-t-3xl sm:rounded-3xl border-t sm:border border-border-2 bg-surface shadow-2xl max-h-[88vh] overflow-y-auto animate-[authCardIn_0.35s_cubic-bezier(0.16,1,0.3,1)_both]"
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-surface px-5 py-4 border-b border-border flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-text-3 font-semibold">Importar</p>
            <h2 className="text-xl font-bold font-display tracking-tight text-text-1">Asistentes desde CSV</h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar"
            className="w-9 h-9 rounded-xl text-text-3 hover:text-text-1 hover:bg-surface-2 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {!resultado && (
            <>
              <div className="rounded-2xl bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-text-2 leading-relaxed">
                <p className="font-medium text-text-1 mb-1">Formato esperado</p>
                <p>El archivo debe tener columnas <code className="font-mono text-xs">nombre</code>, <code className="font-mono text-xs">email</code> y opcionalmente <code className="font-mono text-xs">telefono</code>. La primera fila puede ser encabezado.</p>
                <button onClick={() => downloadTemplate()} className="mt-2 text-xs text-primary-light hover:underline">Descargar plantilla CSV</button>
              </div>

              <div className="field">
                <label className="label">Tipo de boleta</label>
                <select value={tipoId} onChange={e => setTipoId(e.target.value)} className="input bg-surface-2 rounded-2xl py-3 text-base">
                  <option value="">— Selecciona —</option>
                  {tipos.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} {t.precio ? `· $${Number(t.precio).toLocaleString('es-CO')}` : '· Gratis'}
                    </option>
                  ))}
                </select>
                {tipos.length === 0 && (
                  <p className="text-xs text-warning mt-1">Primero creá tipos de boleta en la tab Tickets.</p>
                )}
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={marcarPagado} onChange={e => setMarcarPagado(e.target.checked)}
                  className="w-4 h-4 rounded mt-1" />
                <div>
                  <p className="text-sm text-text-1 font-medium">Marcar como pagados</p>
                  <p className="text-xs text-text-3 leading-relaxed">Las boletas se crean en estado <strong>pagado</strong>. Si no, quedan como <strong>emitido</strong> (sin pago confirmado).</p>
                </div>
              </label>

              <div className="field">
                <label className="label">Archivo CSV</label>
                <input type="file" accept=".csv,text/csv"
                  onChange={e => onFile(e.target.files?.[0])}
                  className="block w-full text-sm text-text-2 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary-light hover:file:bg-primary/20 file:cursor-pointer" />
              </div>

              {filas && (
                <div className="rounded-2xl border border-border bg-surface/40 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border bg-surface-2/40">
                    <p className="text-xs uppercase tracking-widest text-text-3 font-semibold">Preview · {filas.length} fila{filas.length === 1 ? '' : 's'}</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filas.slice(0, 20).map((f, i) => (
                      <div key={i} className="px-4 py-2 text-sm border-b border-border last:border-0 flex items-center gap-3">
                        <span className="text-xs text-text-3 tabular-nums w-6">{i + 1}</span>
                        <span className="text-text-1 truncate flex-1">{f.nombre}</span>
                        <span className="text-text-2 truncate flex-1">{f.email}</span>
                        {f.telefono && <span className="text-xs text-text-3 truncate">{f.telefono}</span>}
                      </div>
                    ))}
                    {filas.length > 20 && (
                      <div className="px-4 py-2 text-xs text-text-3 text-center">+{filas.length - 20} más</div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={onClose} className="btn-ghost btn-sm">Cancelar</button>
                <button onClick={submit} disabled={working || !filas || !tipoId} className="btn-primary btn-sm">
                  {working ? <><Spinner size="sm" /> Importando...</> : `Importar ${filas?.length || 0}`}
                </button>
              </div>
            </>
          )}

          {resultado && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3">
                <p className="text-base font-semibold text-success-light">{resultado.creados} boleta{resultado.creados === 1 ? '' : 's'} creada{resultado.creados === 1 ? '' : 's'}</p>
                {resultado.errores.length > 0 && (
                  <p className="text-xs text-text-2 mt-1">{resultado.errores.length} fila{resultado.errores.length === 1 ? '' : 's'} con errores (ver abajo).</p>
                )}
              </div>

              {resultado.errores.length > 0 && (
                <div className="rounded-2xl border border-danger/30 bg-danger/5 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-danger/20 bg-danger/10">
                    <p className="text-xs uppercase tracking-widest text-danger-light font-semibold">Errores</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {resultado.errores.map((er, i) => (
                      <div key={i} className="px-4 py-2 text-sm border-b border-danger/10 last:border-0">
                        <span className="text-xs text-text-3 mr-2">Fila {er.fila}:</span>
                        <span className="text-text-1">{er.motivo}</span>
                        {er.row?.email && <span className="text-xs text-text-3 ml-2">({er.row.email})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button onClick={() => onDone({ creados: resultado.creados })} className="btn-primary btn-sm">Cerrar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function parseCSV(text) {
  /* Parser simple. Soporta separador "," o ";", comillas dobles, encabezado opcional con nombre/email/telefono. */
  const sep = (text.match(/;/g)?.length || 0) > (text.match(/,/g)?.length || 0) ? ';' : ',';
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const parseLine = (line) => {
    const out = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === sep && !inQ) {
        out.push(cur); cur = '';
      } else cur += ch;
    }
    out.push(cur);
    return out.map(c => c.trim());
  };

  /* Detectar encabezado: si la primera línea contiene "email" o "@", la tratamos como header */
  const firstCells = parseLine(lines[0]).map(c => c.toLowerCase());
  const hasHeader = firstCells.some(c => c.includes('email') || c.includes('nombre') || c.includes('correo'));
  let nombreIdx = 0, emailIdx = 1, telIdx = 2;
  if (hasHeader) {
    nombreIdx = firstCells.findIndex(c => c.includes('nombre'));
    emailIdx  = firstCells.findIndex(c => c.includes('email') || c.includes('correo'));
    telIdx    = firstCells.findIndex(c => c.includes('tel') || c.includes('phone') || c.includes('celular'));
    if (nombreIdx === -1) nombreIdx = 0;
    if (emailIdx  === -1) emailIdx  = 1;
  }

  const rows = [];
  for (let i = hasHeader ? 1 : 0; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    if (cells.length === 0) continue;
    rows.push({
      nombre  : cells[nombreIdx] || '',
      email   : cells[emailIdx]  || '',
      telefono: telIdx >= 0 ? (cells[telIdx] || '') : '',
    });
  }
  return rows;
}

function downloadTemplate() {
  const csv = 'nombre,email,telefono\nJuan Pérez,juan@example.com,300 000 0000\nMaría García,maria@example.com,';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'plantilla-asistentes.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function exportarCSV(clientes, evento) {
  if (!clientes?.length) return;

  /* Headers + filas. Quote-escape básico (envolvemos siempre en comillas, escapamos las internas). */
  const headers = ['nombre', 'email', 'codigo', 'estado', 'tipo', 'precio_pagado', 'created_at', 'checked_in_at'];
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`;
  };
  const rows = clientes.map(c => [
    c.usuario?.nombre || c.guest_nombre || '',
    c.usuario?.email  || c.guest_email  || '',
    c.codigo,
    c.estado,
    c.tipo?.nombre || '',
    c.precio_pagado ?? '',
    c.created_at,
    c.checked_in_at || '',
  ].map(escape).join(','));

  /* BOM para que Excel respete UTF-8 */
  const csv = '﻿' + headers.join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });

  const slug = (evento?.slug || 'evento').replace(/[^a-z0-9-]/gi, '-');
  const fecha = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clientes-${slug}-${fecha}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

function DownloadIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 11l5 5m0 0l5-5m-5 5V4" /></svg>;
}

function UploadIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" /></svg>;
}

function SearchIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}
function UsersIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-3a4 4 0 11-8 0 4 4 0 018 0zm5-1a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function DotsIcon({ className }) {
  return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>;
}
