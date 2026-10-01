import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import {
  listarAlumnos,
  listarRutinasDeAlumno,
  listarSeguimientoDeAlumno,
  modificarUsuario,
} from "@/api/admin";
import { agruparPorDia } from "@/utils/dias";
import { NIVEL_LABEL, formatearFecha } from "@/utils/formato";
import { DetalleRutinaModal } from "./DetalleRutinaModal";
import { FormRutina } from "./FormRutina";

const COLORES_AVATAR = [
  "bg-pink-500/20 text-pink-400",
  "bg-purple-500/20 text-purple-400",
  "bg-brand-accent/20 text-brand-accent",
  "bg-blue-500/20 text-blue-400",
  "bg-orange-500/20 text-orange-400",
  "bg-cyan-500/20 text-cyan-400",
];

function colorAvatar(id: number) {
  return COLORES_AVATAR[id % COLORES_AVATAR.length];
}

function iniciales(nombre: string, apellido: string) {
  return `${nombre?.[0] ?? ""}${apellido?.[0] ?? ""}`.toUpperCase() || "?";
}

export function RutinasAdminPage() {
  const queryClient = useQueryClient();

  const [busquedaInput, setBusquedaInput] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [alumnoId, setAlumnoId] = useState<number | null>(null);
  const [tab, setTab] = useState<"rutinas" | "datos" | "historial">("rutinas");
  // null = cerrado; { rutina: null } = nueva rutina; { rutina } = edición
  const [formRutina, setFormRutina] = useState<{ rutina: any | null } | null>(null);
  const [rutinaDetalleId, setRutinaDetalleId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setBusqueda(busquedaInput), 350);
    return () => clearTimeout(t);
  }, [busquedaInput]);

  const { data: paginaAlumnos, isLoading: cargandoAlumnos } = useQuery({
    queryKey: ["rutinas-admin-alumnos", busqueda, estadoFiltro],
    queryFn: () => listarAlumnos({ search: busqueda || undefined, estado: estadoFiltro || undefined }),
  });
  const alumnos = paginaAlumnos?.results ?? [];

  // Selecciona el primer alumno de la lista automáticamente
  useEffect(() => {
    if (!alumnoId && alumnos.length > 0) {
      setAlumnoId(alumnos[0].id);
    }
  }, [alumnos, alumnoId]);

  const alumno = alumnos.find((a: any) => a.id === alumnoId) ?? null;

  const { data: rutinas } = useQuery({
    queryKey: ["rutinas-de-alumno", alumnoId],
    queryFn: () => listarRutinasDeAlumno(alumnoId as number),
    enabled: !!alumnoId,
  });
  const rutinaActual = rutinas?.[0] ?? null;
  const rutinaDetalle = rutinas?.find((r: any) => r.id === rutinaDetalleId) ?? null;

  function seleccionarAlumno(id: number) {
    setAlumnoId(id);
    setTab("rutinas");
    setRutinaDetalleId(null);
  }

  return (
    <div>
      <div className="mb-3 text-xs text-white/40">
        Rutinas <span className="mx-1">›</span> <span className="text-white/70">Alumnos</span>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rutinas por alumno</h1>
          <p className="text-sm text-white/50">Consultá las rutinas y visualizá el detalle de cada alumno.</p>
        </div>
        <button
          onClick={() => setFormRutina({ rutina: null })}
          disabled={!alumnoId}
          className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          + Nueva rutina
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
        {/* Columna izquierda: buscador + tabla de alumnos */}
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <input
              type="text"
              value={busquedaInput}
              onChange={(e) => setBusquedaInput(e.target.value)}
              placeholder="Buscar alumno..."
              className="min-w-[200px] flex-1 rounded-lg bg-brand-surface px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-brand-accent"
            />
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="rounded-lg bg-brand-surface px-3 py-2 text-sm outline-none ring-1 ring-white/10"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-xl bg-brand-surface">
            {cargandoAlumnos ? (
              <p className="p-4 text-white/60">Cargando...</p>
            ) : alumnos.length === 0 ? (
              <p className="p-4 text-white/60">No hay alumnos que coincidan con la búsqueda.</p>
            ) : (
              <table className="w-full table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-[52%]" />
                  <col className="w-[26%]" />
                  <col className="w-[22%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-white/10 text-white/50">
                    <th className="px-4 py-3 font-medium">Alumno</th>
                    <th className="px-4 py-3 font-medium">DNI</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnos.map((a: any) => (
                    <tr
                      key={a.id}
                      onClick={() => seleccionarAlumno(a.id)}
                      className={`cursor-pointer border-b border-white/5 border-l-2 ${
                        a.id === alumnoId
                          ? "border-l-brand-accent bg-brand-accent/10"
                          : "border-l-transparent hover:bg-white/5"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${colorAvatar(a.id)}`}
                          >
                            {iniciales(a.first_name, a.apellido)}
                          </div>
                          <span className="truncate">
                            {a.first_name} {a.apellido}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/70">{a.dni}</td>
                      <td className="px-4 py-3">
                        <Pill
                          texto={a.estado === "activo" ? "Activo" : "Inactivo"}
                          tono={a.estado === "activo" ? "accent" : "gris"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Columna derecha: detalle del alumno seleccionado */}
        <div className="rounded-xl bg-brand-surface p-4">
          {!alumno ? (
            <p className="text-white/50">Seleccioná un alumno para ver su información.</p>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-semibold ${colorAvatar(alumno.id)}`}
                >
                  {iniciales(alumno.first_name, alumno.apellido)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {alumno.first_name} {alumno.apellido}
                  </p>
                  <p className="text-xs text-white/50">DNI {alumno.dni}</p>
                </div>
              </div>
              <div className="mb-4">
                <Pill
                  texto={alumno.estado === "activo" ? "Activo" : "Inactivo"}
                  tono={alumno.estado === "activo" ? "accent" : "gris"}
                />
              </div>

              <div className="mb-4 flex gap-1 border-b border-white/10 text-sm">
                {(["rutinas", "datos", "historial"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTab(t);
                      setRutinaDetalleId(null);
                    }}
                    className={`px-3 py-2 capitalize ${
                      tab === t
                        ? "border-b-2 border-brand-accent text-brand-accent"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {tab === "rutinas" && (
                <PanelRutinaActual
                  rutina={rutinaActual}
                  onVerCompleta={() => setRutinaDetalleId(rutinaActual.id)}
                  onEditar={() => setFormRutina({ rutina: rutinaActual })}
                />
              )}

              {tab === "datos" && <PanelDatos alumno={alumno} onGuardado={() =>
                queryClient.invalidateQueries({ queryKey: ["rutinas-admin-alumnos"] })
              } />}

              {tab === "historial" && <PanelHistorial alumnoId={alumno.id} />}
            </>
          )}
        </div>
      </div>

      {rutinaDetalle && alumno && (
        <DetalleRutinaModal
          rutina={rutinaDetalle}
          alumnoNombre={`${alumno.first_name} ${alumno.apellido}`}
          onCerrar={() => setRutinaDetalleId(null)}
          onEditar={() => {
            setRutinaDetalleId(null);
            setFormRutina({ rutina: rutinaDetalle });
          }}
        />
      )}

      {formRutina && alumno && (
        <FormRutina
          usuarioId={alumno.id}
          alumnoNombre={`${alumno.first_name} ${alumno.apellido}`}
          rutina={formRutina.rutina}
          onCerrar={() => setFormRutina(null)}
          onGuardada={() => {
            setFormRutina(null);
            setRutinaDetalleId(null);
            queryClient.invalidateQueries({ queryKey: ["rutinas-de-alumno", alumno.id] });
          }}
        />
      )}
    </div>
  );
}

function PanelRutinaActual({
  rutina,
  onVerCompleta,
  onEditar,
}: {
  rutina: any;
  onVerCompleta: () => void;
  onEditar: () => void;
}) {
  if (!rutina) {
    return (
      <p className="text-white/50">
        Este alumno todavía no tiene una rutina asignada. Usá "+ Nueva rutina" para crearla.
      </p>
    );
  }
  const grupos = agruparPorDia(rutina.items ?? []);
  const dias = grupos.length;
  const ejercicios = rutina.items?.length ?? 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/70">Rutina actual</h2>
        <span className="text-xs text-white/40">Inicio: {formatearFecha(rutina.fecha_inicio)}</span>
      </div>
      <div className="rounded-lg bg-brand-bg p-4">
        <div className="mb-3 flex items-start gap-2">
          <span className="text-xl">🏋️</span>
          <div className="min-w-0">
            <p className="font-semibold">{rutina.nombre || "Rutina"}</p>
            {rutina.objetivo && <p className="text-xs text-white/50">{rutina.objetivo}</p>}
          </div>
        </div>
        {dias > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {grupos.map((g) => (
              <span key={g.codigo} className="rounded-full bg-brand-accent/20 px-2.5 py-0.5 text-xs text-brand-accent">
                {g.corto}
              </span>
            ))}
          </div>
        )}
        <ul className="mb-4 space-y-1.5 text-sm text-white/70">
          <li>📅 {dias} día{dias === 1 ? "" : "s"} por semana</li>
          <li>🏋 {ejercicios} ejercicio{ejercicios === 1 ? "" : "s"}</li>
          <li>📈 Nivel {NIVEL_LABEL[rutina.nivel] ?? rutina.nivel}</li>
          <li>
            <Pill texto={rutina.estado === "activa" ? "Activa" : "Inactiva"} tono={rutina.estado === "activa" ? "accent" : "gris"} />
          </li>
        </ul>
        <div className="space-y-2">
          <button
            onClick={onVerCompleta}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-accent py-2.5 text-sm font-semibold text-brand-accent hover:bg-brand-accent/10"
          >
            👁 Ver rutina completa ›
          </button>
          <button
            onClick={onEditar}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 py-2.5 text-sm font-semibold hover:bg-white/15"
          >
            <Pencil size={14} /> Editar rutina
          </button>
        </div>
      </div>
    </div>
  );
}

function PanelDatos({ alumno, onGuardado }: { alumno: any; onGuardado: () => void }) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    first_name: alumno.first_name ?? "",
    apellido: alumno.apellido ?? "",
    dni: alumno.dni ?? "",
    fecha_nacimiento: alumno.fecha_nacimiento ?? "",
    email: alumno.email ?? "",
  });

  const guardar = useMutation({
    mutationFn: () => modificarUsuario(alumno.id, form),
    onSuccess: () => {
      onGuardado();
      setEditando(false);
    },
  });

  if (!editando) {
    return (
      <div className="space-y-2 text-sm">
        <FilaDato label="Nombre" valor={`${alumno.first_name} ${alumno.apellido}`} />
        <FilaDato label="DNI" valor={alumno.dni} />
        <FilaDato label="Fecha de nacimiento" valor={formatearFecha(alumno.fecha_nacimiento)} />
        <FilaDato label="Email" valor={alumno.email || "-"} />
        <button
          onClick={() => setEditando(true)}
          className="mt-2 w-full rounded-lg bg-brand-accent py-2.5 text-sm font-semibold text-black"
        >
          Editar datos
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        guardar.mutate();
      }}
      className="space-y-2"
    >
      <CampoEdicion label="Nombre" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} />
      <CampoEdicion label="Apellido" value={form.apellido} onChange={(v) => setForm({ ...form, apellido: v })} />
      <CampoEdicion label="DNI" value={form.dni} onChange={(v) => setForm({ ...form, dni: v })} />
      <CampoEdicion
        label="Fecha de nacimiento"
        type="date"
        value={form.fecha_nacimiento}
        onChange={(v) => setForm({ ...form, fecha_nacimiento: v })}
      />
      <CampoEdicion label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={guardar.isPending}
          className="flex-1 rounded-lg bg-brand-accent py-2.5 text-sm font-semibold text-black disabled:opacity-50"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="rounded-lg px-3 py-2.5 text-sm text-white/60 hover:bg-white/5"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function PanelHistorial({ alumnoId }: { alumnoId: number }) {
  const { data: planes, isLoading } = useQuery({
    queryKey: ["seguimiento-de-alumno", alumnoId],
    queryFn: () => listarSeguimientoDeAlumno(alumnoId),
  });

  if (isLoading) return <p className="text-white/50">Cargando...</p>;
  if (!planes?.length) return <p className="text-white/50">Sin planes de seguimiento cargados.</p>;

  return (
    <div className="space-y-4 text-sm">
      {planes.map((plan: any) => (
        <div key={plan.id} className="rounded-lg bg-brand-bg p-3">
          <p className="mb-1 font-medium">{plan.objetivo}</p>
          <p className="mb-2 text-xs text-white/50">
            Peso actual {plan.peso_actual}kg → objetivo {plan.peso_objetivo}kg
          </p>
          {plan.lineas?.length ? (
            <ul className="space-y-1 border-t border-white/10 pt-2">
              {plan.lineas.map((l: any) => (
                <li key={l.id} className="flex justify-between text-white/60">
                  <span>{formatearFecha(l.fecha_actualizacion)}</span>
                  <span>{l.peso_actualizacion}kg</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-white/40">Sin actualizaciones registradas.</p>
          )}
        </div>
      ))}
    </div>
  );
}

function FilaDato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex justify-between border-b border-white/5 pb-1.5">
      <span className="text-white/50">{label}</span>
      <span>{valor}</span>
    </div>
  );
}

function CampoEdicion({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-white/50">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-brand-bg px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-brand-accent"
      />
    </label>
  );
}

function Pill({ texto, tono }: { texto: string; tono: "accent" | "gris" }) {
  const clases = tono === "accent" ? "bg-brand-accent/20 text-brand-accent" : "bg-white/10 text-white/50";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${clases}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {texto}
    </span>
  );
}
