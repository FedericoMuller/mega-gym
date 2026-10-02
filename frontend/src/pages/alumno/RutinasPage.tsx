import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Calendar, Check, ChevronDown, ChevronRight, ChevronUp, Dumbbell } from "lucide-react";
import { alternarCompletado, listarRutinas, type Rutina, type RutinaItem } from "@/api/rutinas";
import { Miniatura } from "@/components/ejercicios/piezas";
import { DIAS, fechaDeHoyISO, semanaDe, type DiaConFecha } from "@/utils/dias";

function estanTodosCompletados(items: RutinaItem[], fecha: string) {
  return items.length > 0 && items.every((i) => i.completados.includes(fecha));
}

export function RutinasPage() {
  const { data: rutinas, isLoading } = useQuery({
    queryKey: ["rutinas"],
    queryFn: listarRutinas,
  });

  const semana = useMemo(() => semanaDe(), []);
  const hoy = fechaDeHoyISO();
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
  const [abierto, setAbierto] = useState(true);
  const [verTodos, setVerTodos] = useState(false);

  if (isLoading) return <p className="text-white/60">Cargando rutinas...</p>;

  if (!rutinas || rutinas.length === 0) {
    // CU13 - Flujo de excepción: usuario sin rutinas asignadas
    return (
      <div className="rounded-lg bg-brand-surface p-6 text-center text-white/70">
        No tenés rutinas asignadas. Contactá a tu profesor.
      </div>
    );
  }

  const rutina = rutinas[0]; // rutina activa más reciente
  const diaSeleccionado = semana.find((d) => d.fecha === fechaSeleccionada) ?? semana[0];
  const itemsDelDia = rutina.items
    .filter((i) => i.dia === diaSeleccionado.codigo)
    .sort((a, b) => a.orden - b.orden);

  const diasConEjercicios = DIAS.filter((d) => rutina.items.some((i) => i.dia === d.codigo));

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Mis rutinas</h1>

      <TiraDeDias semana={semana} fechaSeleccionada={fechaSeleccionada} onSeleccionar={setFechaSeleccionada} />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          {itemsDelDia.length === 0 ? (
            <div className="rounded-xl bg-brand-surface p-6 text-center text-white/60">
              No tenés entrenamiento programado para el {diaSeleccionado.largo.toLowerCase()}. Descansá 💪
            </div>
          ) : (
            <TarjetaRutinaDelDia
              rutina={rutina}
              items={itemsDelDia}
              dia={diaSeleccionado}
              diasPorSemana={diasConEjercicios.length}
              abierto={abierto}
              onAlternarAbierto={() => setAbierto((v) => !v)}
              onVerTodos={() => setVerTodos(true)}
            />
          )}
        </div>

        <div className="space-y-3">
          <TarjetaProximoEntrenamiento
            rutina={rutina}
            diasConEjercicios={diasConEjercicios}
            semana={semana}
            fechaSeleccionada={fechaSeleccionada}
            onSeleccionar={setFechaSeleccionada}
          />
          <TarjetaProgresoSemanal rutina={rutina} diasConEjercicios={diasConEjercicios} semana={semana} />
        </div>
      </div>

      {verTodos && (
        <ModalTodosLosEjercicios rutina={rutina} semana={semana} onCerrar={() => setVerTodos(false)} />
      )}
    </div>
  );
}

function TiraDeDias({
  semana,
  fechaSeleccionada,
  onSeleccionar,
}: {
  semana: DiaConFecha[];
  fechaSeleccionada: string;
  onSeleccionar: (fecha: string) => void;
}) {
  const hoy = fechaDeHoyISO();
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {semana.map((d) => {
        const activo = d.fecha === fechaSeleccionada;
        return (
          <button
            key={d.fecha}
            onClick={() => onSeleccionar(d.fecha)}
            className={`flex min-w-[56px] shrink-0 flex-col items-center rounded-xl px-3 py-2 text-sm transition-colors ${
              activo ? "bg-brand-accent font-semibold text-black" : "bg-brand-surface text-white/60 hover:bg-white/10"
            }`}
          >
            <span>{d.corto}</span>
            <span className={`text-base ${activo ? "" : "text-white"}`}>{d.numeroDia}</span>
            {d.fecha === hoy && (
              <span className={`mt-0.5 h-1 w-1 rounded-full ${activo ? "bg-black/60" : "bg-brand-accent"}`} />
            )}
          </button>
        );
      })}
    </div>
  );
}

function TarjetaRutinaDelDia({
  rutina,
  items,
  dia,
  diasPorSemana,
  abierto,
  onAlternarAbierto,
  onVerTodos,
}: {
  rutina: Rutina;
  items: RutinaItem[];
  dia: DiaConFecha;
  diasPorSemana: number;
  abierto: boolean;
  onAlternarAbierto: () => void;
  onVerTodos: () => void;
}) {
  const completados = items.filter((i) => i.completados.includes(dia.fecha)).length;
  const progreso = items.length > 0 ? (completados / items.length) * 100 : 0;

  return (
    <div className="rounded-xl bg-brand-surface">
      <button onClick={onAlternarAbierto} className="flex w-full items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Dumbbell size={18} className="shrink-0 text-brand-accent" />
          <span className="truncate font-semibold">{rutina.nombre || "Rutina"}</span>
          <PillEstado activa={rutina.estado === "activa"} />
        </div>
        {abierto ? <ChevronUp size={18} className="text-white/50" /> : <ChevronDown size={18} className="text-white/50" />}
      </button>

      {abierto && (
        <div className="px-4 pb-4">
          <div className="mb-3 flex items-center justify-between text-sm text-white/50">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> {diasPorSemana} día{diasPorSemana === 1 ? "" : "s"}/semana
            </span>
            <span className="font-medium text-white/70">
              {completados}/{items.length}
            </span>
          </div>
          <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-brand-accent transition-all"
              style={{ width: `${progreso}%` }}
            />
          </div>

          <ul className="space-y-2">
            {items.map((item) => (
              <FilaEjercicio key={item.id} item={item} fecha={dia.fecha} />
            ))}
          </ul>

          <button
            onClick={onVerTodos}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-accent py-2.5 text-sm font-semibold text-black"
          >
            Ver todos los ejercicios <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function PillEstado({ activa }: { activa: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        activa ? "bg-brand-accent/20 text-brand-accent" : "bg-white/10 text-white/50"
      }`}
    >
      {activa ? "Activa" : "Inactiva"}
    </span>
  );
}

function FilaEjercicio({ item, fecha }: { item: RutinaItem; fecha: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const completado = item.completados.includes(fecha);

  const alternar = useMutation({
    mutationFn: () => alternarCompletado(item.id, fecha),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rutinas"] }),
  });

  const categoriaTipo = [item.ejercicio.categoria, item.ejercicio.tipo]
    .filter(Boolean)
    .map((v) => v[0].toUpperCase() + v.slice(1))
    .join(" • ");

  return (
    <li className="flex items-center gap-3 rounded-lg bg-brand-bg p-2.5">
      <button
        onClick={() => navigate(`/rutinas/ejercicio/${item.ejercicio.id}`, { state: { item, fecha } })}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <Miniatura imagen={item.ejercicio.imagen} className="h-12 w-14" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.ejercicio.nombre_ejercicio}</p>
          {categoriaTipo && <p className="truncate text-xs text-white/50">{categoriaTipo}</p>}
        </div>
      </button>
      <span className="shrink-0 text-sm font-semibold text-brand-accent">
        {item.series} x {item.repeticiones}
      </span>
      <button
        onClick={() => alternar.mutate()}
        disabled={alternar.isPending}
        aria-label={completado ? `Marcar ${item.ejercicio.nombre_ejercicio} como pendiente` : `Marcar ${item.ejercicio.nombre_ejercicio} como realizado`}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors disabled:opacity-50 ${
          completado ? "border-brand-accent bg-brand-accent text-black" : "border-white/20 text-transparent hover:border-white/40"
        }`}
      >
        <Check size={14} strokeWidth={3} />
      </button>
    </li>
  );
}

function TarjetaProximoEntrenamiento({
  rutina,
  diasConEjercicios,
  semana,
  fechaSeleccionada,
  onSeleccionar,
}: {
  rutina: Rutina;
  diasConEjercicios: typeof DIAS;
  semana: DiaConFecha[];
  fechaSeleccionada: string;
  onSeleccionar: (fecha: string) => void;
}) {
  const proximo = useMemo(() => {
    if (diasConEjercicios.length === 0) return null;
    const hoyIdx = DIAS.findIndex((d) => d.codigo === semana.find((s) => s.fecha === fechaDeHoyISO())?.codigo);
    const siguiente = diasConEjercicios.find((d) => DIAS.findIndex((x) => x.codigo === d.codigo) > hoyIdx);
    const dia = siguiente ?? diasConEjercicios[0];
    const enEstaSemana = semana.find((s) => s.codigo === dia.codigo)!;
    const esFuturoEstaSemana = DIAS.findIndex((d) => d.codigo === dia.codigo) > hoyIdx;
    let fecha = enEstaSemana.fecha;
    if (!esFuturoEstaSemana) {
      const f = new Date(enEstaSemana.fecha);
      f.setDate(f.getDate() + 7);
      fecha = f.toISOString().slice(0, 10);
    }
    return { dia, fecha };
  }, [diasConEjercicios, semana]);

  if (!proximo) return null;

  const [, mes, numero] = proximo.fecha.split("-");
  const esSeleccionado = proximo.fecha === fechaSeleccionada;

  return (
    <button
      onClick={() => onSeleccionar(proximo.fecha)}
      className={`flex w-full items-center gap-3 rounded-xl p-4 text-left transition-colors ${
        esSeleccionado ? "bg-brand-accent/15 ring-1 ring-brand-accent/50" : "bg-brand-surface hover:bg-white/5"
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-accent/15 text-brand-accent">
        <Calendar size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-white/50">Próximo entrenamiento</p>
        <p className="truncate text-sm font-semibold">
          {proximo.dia.largo} {Number(numero)}/{mes}
        </p>
        <p className="truncate text-xs text-white/50">{rutina.nombre || "Rutina"}</p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-white/30" />
    </button>
  );
}

function TarjetaProgresoSemanal({
  rutina,
  diasConEjercicios,
  semana,
}: {
  rutina: Rutina;
  diasConEjercicios: typeof DIAS;
  semana: DiaConFecha[];
}) {
  const total = diasConEjercicios.length;
  const completados = diasConEjercicios.filter((d) => {
    const fecha = semana.find((s) => s.codigo === d.codigo)!.fecha;
    const items = rutina.items.filter((i) => i.dia === d.codigo);
    return estanTodosCompletados(items, fecha);
  }).length;
  const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

  const radio = 26;
  const circunferencia = 2 * Math.PI * radio;

  return (
    <div className="rounded-xl bg-brand-surface p-4">
      <p className="mb-3 text-sm font-semibold">Tu progreso semanal</p>
      <div className="flex items-center gap-4">
        <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90 shrink-0">
          <circle cx="32" cy="32" r={radio} fill="none" stroke="currentColor" strokeWidth="6" className="text-white/10" />
          <circle
            cx="32"
            cy="32"
            r={radio}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circunferencia}
            strokeDashoffset={circunferencia * (1 - porcentaje / 100)}
            className="text-brand-accent transition-all"
          />
        </svg>
        <div>
          <p className="text-xl font-bold">{porcentaje}%</p>
          <p className="text-xs text-white/50">
            {completados}/{total} rutinas completadas
          </p>
        </div>
      </div>
    </div>
  );
}

function ModalTodosLosEjercicios({
  rutina,
  semana,
  onCerrar,
}: {
  rutina: Rutina;
  semana: DiaConFecha[];
  onCerrar: () => void;
}) {
  const grupos = DIAS.map((d) => ({
    ...d,
    fecha: semana.find((s) => s.codigo === d.codigo)!.fecha,
    items: rutina.items.filter((i) => i.dia === d.codigo).sort((a, b) => a.orden - b.orden),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-brand-bg">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold">Todos los ejercicios</h2>
            <p className="text-sm text-white/50">{rutina.nombre || "Rutina"}</p>
          </div>
          <button onClick={onCerrar} className="rounded-lg px-3 py-1.5 text-sm text-white/60 hover:bg-white/5">
            Cerrar
          </button>
        </header>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {grupos.map((g) => (
            <div key={g.codigo}>
              <h3 className="mb-2 text-sm font-semibold text-white/70">{g.largo}</h3>
              <ul className="space-y-2">
                {g.items.map((item) => (
                  <FilaEjercicio key={item.id} item={item} fecha={g.fecha} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
