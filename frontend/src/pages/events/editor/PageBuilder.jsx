import { useState, useEffect, useMemo } from 'react';
import { confirmDialog } from '../../../components/ui/Confirm.jsx';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { eventosApi } from '../../../api/eventos.js';
import { useToast } from '../../../context/ToastContext.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import { BLOCKS, BLOCK_TYPES_SISTEMA, BLOCK_TYPES_CUSTOM } from './blocks.jsx';
import { TemplatesPicker, instanciarTemplate } from './templates.jsx';

function uid(prefix = 'b') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function defaultPages() {
  return [{
    id: uid('p'),
    nombre: 'Inicio',
    blocks: BLOCK_TYPES_SISTEMA.map(type => ({ id: uid(), type, data: {} })),
  }];
}

export default function PageBuilder({ evento, onClose }) {
  /* page_json puede ser v1 ({blocks:[]}) o v2 ({pages:[]}). Normalizamos. */
  const initialPages = useMemo(() => {
    const pj = evento.page_json;
    if (pj?.pages && Array.isArray(pj.pages) && pj.pages.length > 0) return pj.pages;
    if (Array.isArray(pj?.blocks)) {
      return [{ id: uid('p'), nombre: 'Inicio', blocks: pj.blocks }];
    }
    return defaultPages();
    /* eslint-disable-next-line */
  }, []);

  const [pages,    setPages]    = useState(initialPages);
  const [activeId, setActiveId] = useState(initialPages[0]?.id);
  const [saving,   setSaving]   = useState(false);
  const [dirty,    setDirty]    = useState(false);
  const [adding,   setAdding]   = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const { success, error: toastErr } = useToast();

  useEffect(() => {
    setDirty(JSON.stringify(pages) !== JSON.stringify(initialPages));
    /* eslint-disable-next-line */
  }, [pages]);

  const activePage = pages.find(p => p.id === activeId) || pages[0];

  /* ─── Operaciones sobre la página activa ─── */
  const updateActiveBlocks = (updater) => {
    setPages(prev => prev.map(p => p.id === activeId ? { ...p, blocks: typeof updater === 'function' ? updater(p.blocks) : updater } : p));
  };
  const addBlock = (type) => {
    updateActiveBlocks(blocks => [...blocks, { id: uid(), type, data: structuredClone(BLOCKS[type].defaults) }]);
  };
  const updateBlock = (id, data) => {
    updateActiveBlocks(blocks => blocks.map(b => b.id === id ? { ...b, data } : b));
  };
  const removeBlock = (id) => {
    updateActiveBlocks(blocks => blocks.filter(b => b.id !== id));
  };
  const duplicateBlock = (id) => {
    updateActiveBlocks(blocks => {
      const idx = blocks.findIndex(b => b.id === id);
      if (idx < 0) return blocks;
      const copy = { ...blocks[idx], id: uid(), data: structuredClone(blocks[idx].data) };
      return [...blocks.slice(0, idx + 1), copy, ...blocks.slice(idx + 1)];
    });
  };
  const onDragEnd = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    updateActiveBlocks(blocks => {
      const oldIdx = blocks.findIndex(b => b.id === active.id);
      const newIdx = blocks.findIndex(b => b.id === over.id);
      return arrayMove(blocks, oldIdx, newIdx);
    });
  };

  /* ─── Operaciones sobre páginas ─── */
  const addPage = (nombre) => {
    if (!nombre?.trim()) return;
    const id = uid('p');
    setPages(p => [...p, { id, nombre: nombre.trim(), blocks: [] }]);
    setActiveId(id);
    setAdding(false);
  };
  const renamePage = (id, nombre) => {
    if (!nombre?.trim()) return;
    setPages(p => p.map(x => x.id === id ? { ...x, nombre: nombre.trim() } : x));
  };
  const removePage = async (id) => {
    if (pages.length <= 1) { toastErr('No puedes borrar la única página.'); return; }
    if (!(await confirmDialog({ message:('¿Borrar esta página y todos sus bloques?'), danger:true }))) return;
    setPages(p => p.filter(x => x.id !== id));
    if (activeId === id) setActiveId(pages.find(p => p.id !== id)?.id);
  };

  const aplicarTemplate = async (template) => {
    if (!(await confirmDialog({ message:(`¿Reemplazar la página actual "${activePage?.nombre}" con la plantilla "${template.nombre}"? Los bloques existentes se borrarán.`), danger:true }))) return;
    const nuevasPages = instanciarTemplate(template);
    /* Reemplazamos solo la página activa con la primera página del template,
       agregando el resto como páginas nuevas. */
    const [first, ...rest] = nuevasPages;
    setPages(prev => {
      const updated = prev.map(p => p.id === activeId ? { ...p, blocks: first.blocks } : p);
      return [...updated, ...rest];
    });
    setTemplatesOpen(false);
    success(`Plantilla "${template.nombre}" aplicada.`);
  };

  const onGuardar = async () => {
    setSaving(true);
    try {
      await eventosApi.update(evento.id, { page_json: { pages } });
      success('Página guardada.');
      setDirty(false);
    } catch (e) { toastErr(e.message); }
    finally    { setSaving(false); }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  return (
    <div className="space-y-4">
      {/* Toolbar superior sticky */}
      <div className="flex items-center justify-between gap-3 flex-wrap rounded-2xl border border-border bg-surface/90 backdrop-blur-md px-4 py-3 sticky top-0 z-20">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold">Editor visual</p>
          <p className="text-sm text-text-2 mt-0.5">
            {pages.length} página{pages.length !== 1 ? 's' : ''} · {activePage?.blocks.length || 0} bloque{(activePage?.blocks.length || 0) !== 1 ? 's' : ''}
            {dirty && <span className="ml-2 text-warning">· cambios sin guardar</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTemplatesOpen(true)} className="btn-secondary btn-sm" title="Empezar con una plantilla pre-armada">
            <TemplateIcon /> Plantillas
          </button>
          {onClose && <button onClick={onClose} className="btn-ghost btn-sm">Volver al preview</button>}
          <button onClick={onGuardar} disabled={saving || !dirty} className="btn-gradient btn-sm">
            {saving ? <><Spinner size="sm" /> Guardando...</> : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Tabs de páginas */}
      <div className="rounded-2xl border border-border bg-surface/40 p-2 flex items-center gap-1 flex-wrap">
        {pages.map(p => (
          <PageTab
            key={p.id}
            page={p}
            active={p.id === activeId}
            onClick={() => setActiveId(p.id)}
            onRename={(n) => renamePage(p.id, n)}
            onRemove={() => removePage(p.id)}
            canRemove={pages.length > 1}
          />
        ))}
        {adding ? (
          <AddPageInline onSubmit={addPage} onCancel={() => setAdding(false)} />
        ) : (
          <button onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-text-2 hover:text-text-1 hover:bg-surface-2 transition-colors">
            <PlusIcon /> Nueva página
          </button>
        )}
      </div>

      {/* Layout 2 columnas: canvas (left) + paleta sticky (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Canvas */}
        <div>
          {activePage?.blocks.length === 0 ? (
            <EmptyState onAdd={addBlock} />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={activePage.blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {activePage.blocks.map(block => (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      evento={evento}
                      onChange={(d) => updateBlock(block.id, d)}
                      onRemove={() => removeBlock(block.id)}
                      onDuplicate={() => duplicateBlock(block.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Paleta sticky a la derecha */}
        <aside className="hidden lg:block">
          <div className="rounded-2xl border border-border bg-surface/40 p-3 space-y-4 sticky top-32">
            <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold px-1">Agregar bloque</p>
            <PaletteRow label="Bloques del evento" types={BLOCK_TYPES_SISTEMA} blocks={activePage?.blocks || []} onAdd={addBlock} />
            <PaletteRow label="Contenido custom"   types={BLOCK_TYPES_CUSTOM}  blocks={activePage?.blocks || []} onAdd={addBlock} />
          </div>
        </aside>

        {/* Paleta inline en mobile */}
        <div className="lg:hidden rounded-2xl border border-border bg-surface/40 p-3 space-y-3">
          <PaletteRow label="Bloques del evento" types={BLOCK_TYPES_SISTEMA} blocks={activePage?.blocks || []} onAdd={addBlock} />
          <PaletteRow label="Contenido custom"   types={BLOCK_TYPES_CUSTOM}  blocks={activePage?.blocks || []} onAdd={addBlock} />
        </div>
      </div>

      {templatesOpen && (
        <TemplatesPicker onPick={aplicarTemplate} onCancel={() => setTemplatesOpen(false)} />
      )}
    </div>
  );
}

function TemplateIcon() { return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>; }

/* ─────────── Tab de página ─────────── */

function PageTab({ page, active, onClick, onRename, onRemove, canRemove }) {
  const [editing, setEditing] = useState(false);
  const [nombre, setNombre] = useState(page.nombre);

  if (editing) {
    return (
      <form onSubmit={e => { e.preventDefault(); onRename(nombre); setEditing(false); }}
        className="flex items-center gap-1">
        <input
          value={nombre} onChange={e => setNombre(e.target.value)} autoFocus
          onBlur={() => { onRename(nombre); setEditing(false); }}
          className="px-3 py-1.5 rounded-xl bg-surface-2 border border-primary/30 text-sm text-text-1 outline-none w-32"
        />
      </form>
    );
  }

  return (
    <div className={`group flex items-center rounded-xl transition-all ${active ? 'bg-text-1 text-bg' : 'hover:bg-surface-2'}`}>
      <button onClick={onClick} onDoubleClick={() => setEditing(true)}
        className="px-3.5 py-2 text-sm font-medium">
        {page.nombre}
      </button>
      {active && (
        <>
          <button onClick={() => setEditing(true)} aria-label="Renombrar"
            className="px-1 py-1 opacity-50 hover:opacity-100" title="Renombrar (doble click)">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          {canRemove && (
            <button onClick={onRemove} aria-label="Borrar página"
              className="px-2 py-1 opacity-50 hover:opacity-100">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </>
      )}
    </div>
  );
}

function AddPageInline({ onSubmit, onCancel }) {
  const [nombre, setNombre] = useState('');
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(nombre); }} className="flex items-center gap-1">
      <input
        value={nombre} onChange={e => setNombre(e.target.value)} autoFocus
        placeholder="Nombre"
        className="px-3 py-1.5 rounded-xl bg-surface-2 border border-primary/30 text-sm text-text-1 outline-none w-28"
      />
      <button type="submit" className="text-[11px] text-bg bg-text-1 hover:bg-white px-2.5 py-1.5 rounded-lg font-semibold">OK</button>
      <button type="button" onClick={onCancel} className="text-[11px] text-text-3 hover:text-text-2 px-1 py-1">×</button>
    </form>
  );
}

/* ─────────── Paleta de bloques ─────────── */

function PaletteRow({ label, types, blocks = [], onAdd }) {
  /* Cuenta uso por tipo en la página activa */
  const counts = blocks.reduce((m, b) => { m[b.type] = (m[b.type] || 0) + 1; return m; }, {});

  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-text-3 font-semibold mb-2 px-1">{label}</p>
      <div className="flex flex-col gap-1.5 lg:gap-1">
        {types.map(t => {
          const B = BLOCKS[t];
          const Icon = B.icon;
          const used = counts[t] || 0;
          return (
            <button key={t} onClick={() => onAdd(t)}
              className={`group inline-flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs font-medium transition-all justify-between
                ${used > 0
                  ? 'border-success/30 bg-success/10 text-text-1 hover:bg-success/15'
                  : 'border-border bg-surface hover:bg-surface-2 hover:border-border-2 text-text-2 hover:text-text-1'}
              `}
              title={used > 0 ? `Usado ${used} vez${used > 1 ? 'es' : ''}` : 'Click para agregar'}
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <Icon />
                <span className="truncate">{B.label}</span>
              </span>
              {used > 0 && (
                <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-success/25 text-success text-[10px] font-bold tabular-nums">
                  {used}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────── Bloque sortable ─────────── */

function SortableBlock({ block, evento, onChange, onRemove, onDuplicate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const B = BLOCKS[block.type];
  if (!B) return null;
  const Editor = B.Editor;
  const Icon = B.icon;

  return (
    <div ref={setNodeRef} style={style}
      className={`rounded-3xl border bg-surface/40 transition-all ${isDragging ? 'border-primary shadow-xl' : 'border-border hover:border-border-2'}`}>
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <button {...attributes} {...listeners} aria-label="Arrastrar"
            className="w-7 h-7 rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-2 flex items-center justify-center cursor-grab active:cursor-grabbing">
            <DragIcon />
          </button>
          <Icon />
          <span className="text-xs uppercase tracking-widest text-text-3 font-semibold">{B.label}</span>
          {block.data?.oculto && <span className="text-[10px] uppercase tracking-widest text-warning ml-1">oculto</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onDuplicate} aria-label="Duplicar" title="Duplicar"
            className="w-7 h-7 rounded-lg text-text-3 hover:text-text-1 hover:bg-surface-2 flex items-center justify-center">
            <CopyIcon />
          </button>
          <button onClick={onRemove} aria-label="Borrar" title="Borrar"
            className="w-7 h-7 rounded-lg text-text-3 hover:text-danger hover:bg-danger/10 flex items-center justify-center">
            <TrashIcon />
          </button>
        </div>
      </div>
      <div className="p-5">
        <Editor data={block.data || {}} onChange={onChange} evento={evento} />
      </div>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
      <h3 className="text-xl font-bold font-display text-text-1 tracking-tight mb-2">Página vacía</h3>
      <p className="text-sm text-text-2 max-w-sm mx-auto mb-5">Agrega un bloque desde la paleta de arriba para empezar.</p>
      <button onClick={() => onAdd('texto')} className="btn-primary btn-sm">Agregar texto</button>
    </div>
  );
}

function PlusIcon()  { return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>; }
function DragIcon()  { return <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><circle cx="9" cy="5" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="5" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="15" cy="19" r="1.5" /></svg>; }
function CopyIcon()  { return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>; }
function TrashIcon() { return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>; }
