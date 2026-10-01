import { useQuery } from "@tanstack/react-query";
import { Check, Plus, X } from "lucide-react";
import { listarEjerciciosAdmin } from "@/api/admin";
import { useFiltroCatalogo } from "./catalogo";
import { BarraResultados, ChipsEjercicio, Miniatura, PanelFiltros } from "./piezas";

interface Props {
  dia: string;
  yaAgregados: Set<number>;
  onAgregar: (ejercicio: any) => void;
  onCerrar: () => void;
}

export function SelectorEjercicios({ dia, yaAgregados, onAgregar, onCerrar }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-ejercicios"],
    queryFn: listarEjerciciosAdmin,
  });
  const lista: any[] = data ?? [];
  const f = useFiltroCatalogo(lista);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3 sm:p-6">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-brand-bg">
        <header className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-accent text-black">
            <Plus size={22} strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold">Agregar ejercicio</h2>
            <p className="truncate text-sm text-white/50">
              Buscá un ejercicio y agregalo a tu rutina · <span className="text-white/70">{dia}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[250px_1fr]">
          <aside className="overflow-y-auto border-b border-white/10 bg-brand-surface p-4 md:border-b-0 md:border-r">
            <PanelFiltros f={f} />
          </aside>

          <section className="min-h-0 overflow-y-auto p-4">
            <BarraResultados f={f} />

            {isLoading ? (
              <p className="text-white/60">Cargando...</p>
            ) : f.resultados.length === 0 ? (
              <div className="rounded-xl bg-brand-surface p-6 text-center text-sm text-white/50">
                <p>
                  {lista.length === 0
                    ? "Todavía no hay ejercicios cargados. Cargalos desde la sección Ejercicios."
                    : "No se encontraron ejercicios con esos filtros."}
                </p>
                {f.hayFiltros && (
                  <button onClick={f.limpiarFiltros} className="mt-2 text-brand-accent hover:underline">
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <ul className="space-y-3">
                {f.resultados.map((e, i) => {
                  const agregado = yaAgregados.has(e.id);
                  const destacada = !!f.consulta && i === 0;
                  return (
                    <li
                      key={e.id}
                      className={`flex items-center gap-3 rounded-xl border p-3 ${
                        destacada ? "border-brand-accent bg-brand-accent/10" : "border-white/10 bg-brand-surface"
                      }`}
                    >
                      <Miniatura imagen={e.imagen} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{e.nombre_ejercicio}</p>
                        <ChipsEjercicio ejercicio={e} />
                      </div>
                      {agregado ? (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/50">
                          <Check size={14} /> Agregado
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAgregar(e)}
                          aria-label={`Agregar ${e.nombre_ejercicio}`}
                          className="shrink-0 rounded-full bg-brand-accent px-4 py-1.5 text-sm font-semibold text-black hover:brightness-110"
                        >
                          Agregar +
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <footer className="flex justify-end border-t border-white/10 px-5 py-3">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg bg-white/10 px-5 py-2 text-sm font-semibold hover:bg-white/15"
          >
            Listo
          </button>
        </footer>
      </div>
    </div>
  );
}
