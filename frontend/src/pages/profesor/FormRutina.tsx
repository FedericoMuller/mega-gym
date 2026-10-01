import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, ClipboardList, Dumbbell, Minus, Plus, Trash2, X } from "lucide-react";
import { crearRutina, modificarRutina } from "@/api/admin";
import { SelectorEjercicios } from "@/components/ejercicios/SelectorEjercicios";
import { ChipsEjercicio, Miniatura } from "@/components/ejercicios/piezas";
import { DIAS, nombreDia, type DiaCodigo } from "@/utils/dias";

interface ItemForm {
  ejercicio: any;
  dia: DiaCodigo;
  series: number;
  repeticiones: string;
}

const SERIES_POR_DEFECTO = 3;
const REPETICIONES_POR_DEFECTO = "10";
const MAX_DESCRIPCION = 200;

function repeticionesValidas(valor: string) {
  const m = valor.replace(/\s/g, "").match(/^(\d{1,3})(?:-(\d{1,3}))?$/);
  if (!m) return false;
  const minimo = Number(m[1]);
  return minimo >= 1 && (m[2] === undefined || Number(m[2]) >= minimo);
}

function mensajesError(err: any): string[] {
  const salida: string[] = [];
  const recorrer = (v: any) => {
    if (typeof v === "string") salida.push(v);
    else if (Array.isArray(v)) v.forEach(recorrer);
    else if (v && typeof v === "object") Object.values(v).forEach(recorrer);
  };
  recorrer(err?.response?.data);
  return salida.length ? salida : ["No se pudo guardar la rutina. Revisá la conexión e intentá de nuevo."];
}

interface Props {
  usuarioId: number;
  alumnoNombre: string;
  rutina: any | null; // null = nueva rutina
  onCerrar: () => void;
  onGuardada: () => void;
}

export function FormRutina({ usuarioId, alumnoNombre, rutina, onCerrar, onGuardada }: Props) {
  const editando = rutina !== null;

  const [form, setForm] = useState({
    nombre: rutina?.nombre ?? "",
    objetivo: rutina?.objetivo ?? "",
    fecha_inicio: rutina?.fecha_inicio ?? new Date().toISOString().slice(0, 10),
    nivel: rutina?.nivel ?? "adaptativo",
    estado: rutina?.estado ?? "activa",
  });
  const [items, setItems] = useState<ItemForm[]>(
    (rutina?.items ?? []).map((i: any) => ({
      ejercicio: i.ejercicio,
      dia: i.dia,
      series: i.series,
      repeticiones: i.repeticiones,
    }))
  );
  const [dia, setDia] = useState<DiaCodigo>(
    DIAS.find((d) => (rutina?.items ?? []).some((i: any) => i.dia === d.codigo))?.codigo ?? "lun"
  );
  const [abierto, setAbierto] = useState(true);
  const [selector, setSelector] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);

  const itemsDia = items.filter((i) => i.dia === dia);
  const seriesDelDia = itemsDia.reduce((total, i) => total + i.series, 0);
  const diasConEjercicios = new Set(items.map((i) => i.dia));

  function actualizar(item: ItemForm, cambios: Partial<ItemForm>) {
    setErrores([]);
    setItems((prev) => prev.map((i) => (i === item ? { ...i, ...cambios } : i)));
  }

  function agregar(ejercicio: any) {
    setErrores([]);
    setItems((prev) => [
      ...prev,
      { ejercicio, dia, series: SERIES_POR_DEFECTO, repeticiones: REPETICIONES_POR_DEFECTO },
    ]);
  }

  function quitar(item: ItemForm) {
    setErrores([]);
    setItems((prev) => prev.filter((i) => i !== item));
  }

  function mover(item: ItemForm, delta: -1 | 1) {
    setItems((prev) => {
      const delDia = prev.filter((i) => i.dia === item.dia);
      const vecino = delDia[delDia.indexOf(item) + delta];
      if (!vecino) return prev;
      const copia = [...prev];
      const a = copia.indexOf(item);
      const b = copia.indexOf(vecino);
      [copia[a], copia[b]] = [copia[b], copia[a]];
      return copia;
    });
  }

  const guardar = useMutation({
    mutationFn: () => {
      const datos = {
        usuario: usuarioId,
        ...form,
        items: items.map((i) => ({
          ejercicio: i.ejercicio.id,
          dia: i.dia,
          series: i.series,
          repeticiones: i.repeticiones.replace(/\s/g, ""),
        })),
      };
      return editando ? modificarRutina(rutina.id, datos) : crearRutina(datos);
    },
    onSuccess: onGuardada,
    onError: (err) => setErrores(mensajesError(err)),
  });

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      setErrores(["Agregá al menos un ejercicio en algún día de la semana."]);
      return;
    }
    const invalido = items.find((i) => !repeticionesValidas(i.repeticiones));
    if (invalido) {
      setDia(invalido.dia);
      setErrores([
        `Revisá las repeticiones de "${invalido.ejercicio.nombre_ejercicio}" (${nombreDia(invalido.dia)}): usá un número (10) o un rango (8-10).`,
      ]);
      return;
    }
    setErrores([]);
    guardar.mutate();
  }

  const campo =
    "w-full rounded-lg bg-brand-bg px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-brand-accent";
  const tarjeta = "rounded-xl border border-white/10 border-l-2 border-l-brand-accent bg-brand-surface";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6">
        <form
          onSubmit={enviar}
          className="flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-brand-bg"
        >
          <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold">{editando ? "Editar rutina" : "Nueva rutina"}</h2>
              <p className="truncate text-sm text-white/50">Alumno: {alumnoNombre}</p>
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

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            {/* Información de la rutina */}
            <section className={`${tarjeta} p-4`}>
              <h3 className="mb-4 flex items-center gap-2.5 font-semibold">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-accent/50 text-brand-accent">
                  <ClipboardList size={17} />
                </span>
                Información de la rutina
              </h3>

              <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                <label className="block text-sm">
                  <span className="mb-1.5 block text-white/70">
                    Nombre de la rutina <span className="text-brand-accent">*</span>
                  </span>
                  <input
                    required
                    maxLength={100}
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Ej: Rutina Full Body"
                    className={campo}
                  />
                </label>

                <div className="text-sm">
                  <span className="mb-1.5 block text-white/70">Días de la semana</span>
                  <div className="flex flex-wrap gap-2">
                    {DIAS.map((d) => {
                      const activo = d.codigo === dia;
                      const tiene = diasConEjercicios.has(d.codigo);
                      return (
                        <button
                          key={d.codigo}
                          type="button"
                          aria-pressed={activo}
                          onClick={() => setDia(d.codigo)}
                          title={tiene ? `${d.largo}: con ejercicios` : d.largo}
                          className={`relative min-w-[46px] rounded-full px-3.5 py-2 text-sm transition-colors ${
                            activo
                              ? "bg-brand-accent font-semibold text-black"
                              : "bg-brand-surface text-white/70 ring-1 ring-white/10 hover:ring-white/30"
                          }`}
                        >
                          {d.corto}
                          {tiene && (
                            <span
                              className={`absolute right-1.5 top-1 h-1.5 w-1.5 rounded-full ${
                                activo ? "bg-black/60" : "bg-brand-accent"
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <label className="mb-4 block text-sm">
                <span className="mb-1.5 block text-white/70">Descripción (opcional)</span>
                <textarea
                  rows={3}
                  maxLength={MAX_DESCRIPCION}
                  value={form.objetivo}
                  onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
                  placeholder="Ej: Rutina enfocada en mejorar la fuerza y la técnica."
                  className={`${campo} resize-none`}
                />
                <span className="mt-1 block text-right text-xs text-white/40">
                  {form.objetivo.length}/{MAX_DESCRIPCION}
                </span>
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="block text-sm">
                  <span className="mb-1.5 block text-white/70">Fecha de inicio</span>
                  <input
                    type="date"
                    required
                    value={form.fecha_inicio}
                    onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                    className={campo}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-white/70">Nivel</span>
                  <select value={form.nivel} onChange={(e) => setForm({ ...form, nivel: e.target.value })} className={campo}>
                    <option value="adaptativo">Adaptativo</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-white/70">Estado</span>
                  <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className={campo}>
                    <option value="activa">Activa</option>
                    <option value="inactiva">Inactiva</option>
                  </select>
                </label>
              </div>
            </section>

            {/* Ejercicios del día seleccionado */}
            <section className={tarjeta}>
              <button
                type="button"
                onClick={() => setAbierto((v) => !v)}
                aria-expanded={abierto}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <span className="flex items-center gap-2.5 font-semibold">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-accent/50 text-brand-accent">
                    <Dumbbell size={17} />
                  </span>
                  Ejercicios del {nombreDia(dia)}
                </span>
                <span className="flex items-center gap-2 text-sm text-white/60">
                  <span className="hidden sm:inline">
                    {itemsDia.length} ejercicio{itemsDia.length === 1 ? "" : "s"} ·{" "}
                    <span className="text-sky-300">
                      {seriesDelDia} serie{seriesDelDia === 1 ? "" : "s"} totales
                    </span>
                  </span>
                  <ChevronUp size={18} className={`transition-transform ${abierto ? "" : "rotate-180"}`} />
                </span>
              </button>

              {abierto && (
                <div className="space-y-3 px-4 pb-4">
                  {itemsDia.length === 0 ? (
                    <p className="rounded-xl bg-brand-bg p-5 text-center text-sm text-white/50">
                      Todavía no agregaste ejercicios para el {nombreDia(dia)}.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {itemsDia.map((item, indice) => (
                        <li
                          key={`${item.dia}-${item.ejercicio.id}`}
                          className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-brand-bg p-3"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-surface text-sm text-white/70">
                            {indice + 1}
                          </span>
                          <Miniatura imagen={item.ejercicio.imagen} className="h-14 w-20" />
                          <div className="min-w-[140px] flex-1">
                            <p className="truncate text-sm font-semibold">{item.ejercicio.nombre_ejercicio}</p>
                            <ChipsEjercicio ejercicio={item.ejercicio} />
                          </div>

                          <div className="flex items-end gap-4">
                            <div>
                              <span className="mb-1 block text-xs text-white/50">Series</span>
                              <div className="flex items-center overflow-hidden rounded-lg bg-brand-surface ring-1 ring-white/10">
                                <button
                                  type="button"
                                  aria-label={`Menos series de ${item.ejercicio.nombre_ejercicio}`}
                                  onClick={() => actualizar(item, { series: Math.max(1, item.series - 1) })}
                                  className="px-2.5 py-2 text-white/70 hover:bg-white/10"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-8 text-center text-sm font-medium">{item.series}</span>
                                <button
                                  type="button"
                                  aria-label={`Más series de ${item.ejercicio.nombre_ejercicio}`}
                                  onClick={() => actualizar(item, { series: Math.min(20, item.series + 1) })}
                                  className="px-2.5 py-2 text-white/70 hover:bg-white/10"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>

                            <div>
                              <span className="mb-1 block text-xs text-white/50">Repeticiones</span>
                              <input
                                value={item.repeticiones}
                                onChange={(e) => actualizar(item, { repeticiones: e.target.value })}
                                placeholder="8-10"
                                maxLength={9}
                                aria-label={`Repeticiones de ${item.ejercicio.nombre_ejercicio}`}
                                className={`w-24 rounded-lg bg-brand-surface px-3 py-2 text-center text-sm outline-none ring-1 ${
                                  item.repeticiones && !repeticionesValidas(item.repeticiones)
                                    ? "ring-red-500/70"
                                    : "ring-white/10 focus:ring-brand-accent"
                                }`}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <div className="flex flex-col">
                              <button
                                type="button"
                                onClick={() => mover(item, -1)}
                                disabled={indice === 0}
                                aria-label="Subir ejercicio"
                                className="rounded p-0.5 text-white/40 hover:text-white disabled:opacity-20"
                              >
                                <ChevronUp size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => mover(item, 1)}
                                disabled={indice === itemsDia.length - 1}
                                aria-label="Bajar ejercicio"
                                className="rounded p-0.5 text-white/40 hover:text-white disabled:opacity-20"
                              >
                                <ChevronDown size={16} />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => quitar(item)}
                              aria-label={`Quitar ${item.ejercicio.nombre_ejercicio}`}
                              className="rounded-lg p-2 text-white/50 hover:bg-red-500/15 hover:text-red-400"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelector(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-accent/50 py-3 text-sm font-semibold text-brand-accent hover:bg-brand-accent/10"
                  >
                    <Plus size={16} /> Agregar ejercicio al {nombreDia(dia)}
                  </button>
                </div>
              )}
            </section>
          </div>

          <footer className="border-t border-white/10 px-5 py-3">
            {errores.length > 0 && (
              <ul className="mb-2 space-y-0.5 text-sm text-red-400">
                {errores.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-white/50">
                {diasConEjercicios.size} día{diasConEjercicios.size === 1 ? "" : "s"} ·{" "}
                {items.length} ejercicio{items.length === 1 ? "" : "s"} en la rutina
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCerrar}
                  className="rounded-lg px-4 py-2.5 text-sm text-white/60 hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardar.isPending}
                  className="rounded-lg bg-brand-accent px-6 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
                >
                  {guardar.isPending ? "Guardando..." : editando ? "Guardar cambios" : "Guardar rutina"}
                </button>
              </div>
            </div>
          </footer>
        </form>
      </div>

      {selector && (
        <SelectorEjercicios
          dia={nombreDia(dia)}
          yaAgregados={new Set(itemsDia.map((i) => i.ejercicio.id))}
          onAgregar={agregar}
          onCerrar={() => setSelector(false)}
        />
      )}
    </>
  );
}
