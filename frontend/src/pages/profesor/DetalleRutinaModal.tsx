import { useEffect, useState } from "react";
import { Dumbbell, ExternalLink, Pencil, X } from "lucide-react";
import {
  CATEGORIAS,
  COLOR_CATEGORIA,
  COLOR_SIN_CATEGORIA,
  EQUIPAMIENTOS,
  TIPOS,
  etiqueta,
} from "@/components/ejercicios/catalogo";
import { Miniatura } from "@/components/ejercicios/piezas";
import { agruparPorDia } from "@/utils/dias";
import { NIVEL_LABEL, formatearFecha } from "@/utils/formato";

interface Props {
  rutina: any;
  alumnoNombre: string;
  onCerrar: () => void;
  onEditar: () => void;
}

export function DetalleRutinaModal({ rutina, alumnoNombre, onCerrar, onEditar }: Props) {
  const grupos = agruparPorDia(rutina.items ?? []);
  const [codigoDia, setCodigoDia] = useState<string>(grupos[0]?.codigo ?? "");
  const grupo = grupos.find((g) => g.codigo === codigoDia) ?? grupos[0];

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  const seriesDelDia = grupo ? grupo.items.reduce((total: number, i: any) => total + i.series, 0) : 0;
  const totalEjercicios = rutina.items?.length ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ejercicios de la rutina"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-brand-bg"
      >
        <header className="flex items-start gap-3 border-b border-white/10 px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-accent/60 text-brand-accent">
            <Dumbbell size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold">Ejercicios de la rutina</h2>
            <p className="truncate text-sm text-white/50">
              {rutina.nombre || "Rutina"} · {alumnoNombre}
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

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mb-4 rounded-xl border border-white/10 bg-brand-surface p-3 text-sm">
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-white/70">
              <span>
                <span className="text-white/40">Nivel:</span> {NIVEL_LABEL[rutina.nivel] ?? rutina.nivel}
              </span>
              <span>
                <span className="text-white/40">Inicio:</span> {formatearFecha(rutina.fecha_inicio)}
              </span>
              <span>
                <span className="text-white/40">Estado:</span>{" "}
                <span className={rutina.estado === "activa" ? "text-brand-accent" : "text-white/50"}>
                  {rutina.estado === "activa" ? "Activa" : "Inactiva"}
                </span>
              </span>
            </div>
            {rutina.objetivo && <p className="mt-1.5 text-white/50">{rutina.objetivo}</p>}
          </div>

          {!grupo ? (
            <p className="rounded-xl bg-brand-surface p-6 text-center text-sm text-white/50">
              Esta rutina todavía no tiene ejercicios cargados.
            </p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {grupos.map((g) => (
                    <button
                      key={g.codigo}
                      type="button"
                      aria-pressed={g.codigo === grupo.codigo}
                      onClick={() => setCodigoDia(g.codigo)}
                      className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                        g.codigo === grupo.codigo
                          ? "bg-brand-accent font-semibold text-black"
                          : "bg-brand-surface text-white/70 ring-1 ring-white/10 hover:ring-white/30"
                      }`}
                    >
                      {g.largo} <span className="opacity-60">· {g.items.length}</span>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-white/50">
                  {grupo.items.length} ejercicio{grupo.items.length === 1 ? "" : "s"} ·{" "}
                  <span className="text-sky-300">
                    {seriesDelDia} serie{seriesDelDia === 1 ? "" : "s"} totales
                  </span>
                </p>
              </div>

              <ul className="space-y-3">
                {grupo.items.map((item: any) => {
                  const e = item.ejercicio;
                  const color = COLOR_CATEGORIA[e.categoria] ?? COLOR_SIN_CATEGORIA;
                  const categoria = etiqueta(CATEGORIAS, e.categoria);
                  const tipo = etiqueta(TIPOS, e.tipo);
                  const equipo = etiqueta(EQUIPAMIENTOS, e.equipamiento);
                  return (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-brand-surface p-3"
                    >
                      <Miniatura imagen={e.imagen} className="h-[72px] w-24" />

                      <div className="min-w-[160px] flex-1">
                        <p className="font-semibold">{e.nombre_ejercicio}</p>
                        {(categoria || tipo) && (
                          <p className="text-xs text-white/50">{[categoria, tipo].filter(Boolean).join(" • ")}</p>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {categoria && (
                            <span className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ${color.chip}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${color.punto}`} />
                              {categoria}
                            </span>
                          )}
                          {equipo && (
                            <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/70">
                              {equipo}
                            </span>
                          )}
                          {(e.accesorios ?? []).map((a: any) => (
                            <span
                              key={a.id}
                              className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/70"
                            >
                              {a.descripcion}
                            </span>
                          ))}
                          {e.url_ejercicio && (
                            <a
                              href={e.url_ejercicio}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-1 flex items-center gap-1 text-[11px] text-white/50 hover:text-brand-accent"
                            >
                              Ver técnica <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <ValorFijo titulo="Series" valor={String(item.series)} />
                        <ValorFijo titulo="Repeticiones" valor={item.repeticiones.replace("-", " - ")} ancho="min-w-[92px]" />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-3">
          <p className="text-sm text-white/50">
            {grupos.length} día{grupos.length === 1 ? "" : "s"} · {totalEjercicios} ejercicio
            {totalEjercicios === 1 ? "" : "s"} en la rutina
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onEditar}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              <Pencil size={14} /> Editar rutina
            </button>
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg bg-brand-accent px-5 py-2 text-sm font-semibold text-black"
            >
              Cerrar
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ValorFijo({ titulo, valor, ancho = "min-w-[72px]" }: { titulo: string; valor: string; ancho?: string }) {
  return (
    <div>
      <span className="mb-1 block text-xs text-white/50">{titulo}</span>
      <div className={`rounded-lg bg-brand-bg px-4 py-2.5 text-center text-sm font-medium ring-1 ring-white/10 ${ancho}`}>
        {valor}
      </div>
    </div>
  );
}
