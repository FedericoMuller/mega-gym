import { ChevronDown, Dumbbell, LayoutGrid, Search, X, type LucideIcon } from "lucide-react";
import {
  CATEGORIAS,
  EQUIPAMIENTOS,
  TIPOS,
  etiqueta,
  type FiltroCatalogo,
  type Orden,
} from "./catalogo";

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
        <h2 className="mb-2 text-sm font-semibold">Equipamiento</h2>
        <div className="space-y-1">
          {EQUIPAMIENTOS.map((eq) => (
            <label
              key={eq.valor}
              className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-sm text-white/80 hover:bg-white/5"
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={f.equipos.includes(eq.valor)}
                  onChange={() => f.alternarEquipo(eq.valor)}
                  className="checkbox-brand"
                />
                {eq.label}
              </span>
              <span className="text-white/50">{f.conteoEquipos[eq.valor] ?? 0}</span>
            </label>
          ))}
        </div>
      </div>
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
