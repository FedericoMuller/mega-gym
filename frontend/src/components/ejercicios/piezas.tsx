import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Dumbbell, LayoutGrid, Plus, Search, Trash2, X, type LucideIcon } from "lucide-react";
import { crearAccesorio, eliminarAccesorio, listarAccesorios } from "@/api/admin";
import { ModalConfirmacion } from "@/components/ui/ModalConfirmacion";
import { CATEGORIAS, TIPOS, etiqueta, type FiltroCatalogo, type Orden } from "./catalogo";

export function Miniatura({ imagen, className = "h-16 w-24" }: { imagen?: string | null; className?: string }) {
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-bg ${className}`}>
      {imagen ? (
        <img src={imagen} alt="" className="h-full w-full object-cover" />
      ) : (
        <Dumbbell size={22} className="text-white/25" />
      )}
    </div>
  );
}

export function Chip({ texto }: { texto: string }) {
  return (
    <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[11px] font-medium text-sky-300">{texto}</span>
  );
}

/** "Pecho • Compuesto" */
export function ChipsEjercicio({ ejercicio }: { ejercicio: any }) {
  const categoria = etiqueta(CATEGORIAS, ejercicio.categoria);
  const tipo = etiqueta(TIPOS, ejercicio.tipo);
  if (!categoria && !tipo) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {categoria && <Chip texto={categoria} />}
      {categoria && tipo && <span className="text-white/30">•</span>}
      {tipo && <Chip texto={tipo} />}
    </div>
  );
}

function ItemCategoria({
  activo,
  onClick,
  Icono,
  label,
  cantidad,
}: {
  activo: boolean;
  onClick: () => void;
  Icono: LucideIcon;
  label: string;
  cantidad: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
        activo ? "bg-brand-accent font-semibold text-black" : "text-white/80 hover:bg-white/5"
      }`}
    >
      <span className="flex items-center gap-2.5">
        <Icono size={17} />
        {label}
      </span>
      <span className={activo ? "text-black/70" : "text-white/50"}>{cantidad}</span>
    </button>
  );
}

/** Buscador + categorías + equipamiento (panel izquierdo del catálogo). */
export function PanelFiltros({ f }: { f: FiltroCatalogo }) {
  const queryClient = useQueryClient();
  const { data: accesorios } = useQuery({
    queryKey: ["accesorios"],
    queryFn: listarAccesorios,
  });
  const [agregando, setAgregando] = useState(false);

  return (
    <>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={f.busqueda}
          onChange={(e) => f.setBusqueda(e.target.value)}
          placeholder="Buscar ejercicio..."
          className="w-full rounded-lg bg-brand-bg py-2 pl-9 pr-8 text-sm outline-none ring-1 ring-white/10 focus:ring-brand-accent"
        />
        {f.busqueda && (
          <button
            type="button"
            onClick={() => f.setBusqueda("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <nav className="space-y-1">
        <ItemCategoria
          activo={f.categoria === ""}
          onClick={() => f.setCategoria("")}
          Icono={LayoutGrid}
          label="Todos"
          cantidad={f.total}
        />
        {CATEGORIAS.map((c) => (
          <ItemCategoria
            key={c.valor}
            activo={f.categoria === c.valor}
            onClick={() => f.setCategoria(c.valor)}
            Icono={c.Icono}
            label={c.label}
            cantidad={f.conteoCategorias[c.valor] ?? 0}
          />
        ))}
      </nav>

      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Equipamiento</h2>
          <button
            type="button"
            onClick={() => setAgregando(true)}
            aria-label="Agregar equipamiento o accesorio"
            title="Agregar equipamiento o accesorio"
            className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent text-black hover:brightness-110"
          >
            <Plus size={14} strokeWidth={3} />
          </button>
        </div>
        <ListaAccesorios
          accesorios={accesorios}
          estaSeleccionado={(id) => f.equipos.includes(String(id))}
          onAlternar={(id) => f.alternarEquipo(String(id))}
        />
      </div>

      {agregando && (
        <ModalNuevoAccesorio
          onCerrar={() => setAgregando(false)}
          onCreado={() => {
            queryClient.invalidateQueries({ queryKey: ["accesorios"] });
            setAgregando(false);
          }}
        />
      )}
    </>
  );
}

export function ModalNuevoAccesorio({ onCerrar, onCreado }: { onCerrar: () => void; onCreado: () => void }) {
  const [descripcion, setDescripcion] = useState("");

  const guardar = useMutation({
    mutationFn: () => crearAccesorio(descripcion.trim()),
    onSuccess: onCreado,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          guardar.mutate();
        }}
        className="w-full max-w-sm space-y-3 rounded-xl bg-brand-surface p-5"
      >
        <h2 className="text-lg font-bold">Nuevo equipamiento</h2>
        <label className="block text-sm">
          <span className="mb-1 block text-white/50">Descripción o nombre del equipamiento/accesorio</span>
          <input
            autoFocus
            required
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Banco plano"
            className="w-full rounded-lg bg-brand-bg px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-brand-accent"
          />
        </label>

        {guardar.isError && (
          <p className="text-sm text-red-400">No se pudo guardar. Intentá de nuevo.</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={guardar.isPending}
            className="flex-1 rounded-lg bg-brand-accent py-2.5 text-sm font-semibold text-black disabled:opacity-50"
          >
            {guardar.isPending ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg px-4 py-2.5 text-sm text-white/60 hover:bg-white/5"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Checklist de equipamiento/accesorios (RF.9), con un tacho que solo aparece
 * al pasar el mouse por esa fila y confirma antes de borrar.
 */
export function ListaAccesorios({
  accesorios,
  estaSeleccionado,
  onAlternar,
}: {
  accesorios: any[] | undefined;
  estaSeleccionado: (id: number) => boolean;
  onAlternar: (id: number) => void;
}) {
  const queryClient = useQueryClient();
  const [aEliminar, setAEliminar] = useState<any | null>(null);

  const eliminar = useMutation({
    mutationFn: (id: number) => eliminarAccesorio(id),
    onSuccess: (_datos, id) => {
      // Si estaba tildado (acá o en el formulario), lo destilda para no dejar
      // una selección apuntando a un equipamiento que ya no existe.
      if (estaSeleccionado(id)) onAlternar(id);
      queryClient.invalidateQueries({ queryKey: ["accesorios"] });
      queryClient.invalidateQueries({ queryKey: ["admin-ejercicios"] });
      setAEliminar(null);
    },
  });

  return (
    <>
      <div className="space-y-0.5">
        {(accesorios ?? []).length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-white/40">Todavía no hay equipamiento cargado.</p>
        ) : (
          accesorios!.map((ac) => (
            <div
              key={ac.id}
              className="group flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/5"
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={estaSeleccionado(ac.id)}
                  onChange={() => onAlternar(ac.id)}
                  className="checkbox-brand shrink-0"
                />
                <span className="truncate">{ac.descripcion}</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  eliminar.reset();
                  setAEliminar(ac);
                }}
                aria-label={`Borrar ${ac.descripcion}`}
                title="Borrar equipamiento"
                className="shrink-0 rounded p-1 text-white/40 opacity-0 transition-opacity hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {aEliminar && (
        <ModalConfirmacion
          titulo="¿Borrar equipamiento?"
          mensaje={`¿Estás seguro de borrar este equipamiento? "${aEliminar.descripcion}" se va a quitar de los ejercicios que lo tengan asignado.`}
          textoConfirmar="Borrar"
          cargando={eliminar.isPending}
          error={eliminar.isError ? "No se pudo borrar. Intentá de nuevo." : undefined}
          onConfirmar={() => eliminar.mutate(aEliminar.id)}
          onCancelar={() => setAEliminar(null)}
        />
      )}
    </>
  );
}

/** "Resultados (N)" + selector de orden. */
export function BarraResultados({ f }: { f: FiltroCatalogo }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-white/80">Resultados ({f.resultados.length})</h2>
      <div className="relative">
        <select
          value={f.orden}
          onChange={(e) => f.setOrden(e.target.value as Orden)}
          className="appearance-none rounded-lg bg-brand-surface py-1.5 pl-3 pr-8 text-sm outline-none ring-1 ring-white/10"
        >
          <option value="relevancia">Más relevantes</option>
          <option value="az">Nombre (A-Z)</option>
          <option value="za">Nombre (Z-A)</option>
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50" />
      </div>
    </div>
  );
}
