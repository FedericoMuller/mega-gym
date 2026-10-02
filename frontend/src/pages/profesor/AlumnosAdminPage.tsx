import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import {
  crearAlumno,
  listarAlumnos,
  listarProfesores,
  modificarUsuario,
  obtenerStatsAlumnos,
} from "@/api/admin";

const PAGE_SIZE = 12;

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

function formatearFecha(fecha: string | null) {
  if (!fecha) return "-";
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

export function AlumnosAdminPage() {
  const queryClient = useQueryClient();

  const [busquedaInput, setBusquedaInput] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [pagina, setPagina] = useState(1);

  // debounce de la búsqueda para no disparar un request por tecla
  useEffect(() => {
    const t = setTimeout(() => {
      setBusqueda(busquedaInput);
      setPagina(1);
    }, 350);
    return () => clearTimeout(t);
  }, [busquedaInput]);

  const filtros = {
    search: busqueda || undefined,
    estado: estadoFiltro || undefined,
    page: pagina,
  };

  const { data: stats } = useQuery({
    queryKey: ["admin-alumnos-stats"],
    queryFn: obtenerStatsAlumnos,
  });

  const { data: pagina_datos, isLoading } = useQuery({
    queryKey: ["admin-alumnos", filtros],
    queryFn: () => listarAlumnos(filtros),
  });

  const { data: profesores } = useQuery({
    queryKey: ["admin-profesores-dropdown"],
    queryFn: listarProfesores,
  });

  // null = cerrado; { alumno: null } = alta; { alumno } = edición
  const [formulario, setFormulario] = useState<{ alumno: any | null } | null>(null);

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-alumnos"] });
    queryClient.invalidateQueries({ queryKey: ["admin-alumnos-stats"] });
  };

  const alumnos = pagina_datos?.results ?? [];
  const total = pagina_datos?.count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const desde = total === 0 ? 0 : (pagina - 1) * PAGE_SIZE + 1;
  const hasta = Math.min(pagina * PAGE_SIZE, total);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-3 text-xs text-white/40">
        Inicio <span className="mx-1">›</span> <span className="text-white/70">Alumnos</span>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Alumnos</h1>
          <p className="text-sm text-white/50">Gestioná los alumnos y su información.</p>
        </div>
        <button
          onClick={() => setFormulario({ alumno: null })}
          className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-black"
        >
          + Nuevo alumno
        </button>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TarjetaStat
          icono="🟢"
          iconoBg="bg-brand-accent/20"
          titulo="Alumnos activos"
          valor={stats?.activos ?? "-"}
          detalle={stats ? `de ${stats.total} registrados` : ""}
        />
        <TarjetaStat
          icono="⚪"
          iconoBg="bg-white/10"
          titulo="Alumnos inactivos"
          valor={stats?.inactivos ?? "-"}
          detalle={stats ? `de ${stats.total} registrados` : ""}
        />
      </div>

      {/* Búsqueda y filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={busquedaInput}
          onChange={(e) => setBusquedaInput(e.target.value)}
          placeholder="Buscar por nombre o DNI..."
          className="min-w-[220px] flex-1 rounded-lg bg-brand-surface px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-brand-accent"
        />
        <select
          value={estadoFiltro}
          onChange={(e) => {
            setEstadoFiltro(e.target.value);
            setPagina(1);
          }}
          className="rounded-lg bg-brand-surface px-3 py-2 text-sm outline-none ring-1 ring-white/10"
        >
          <option value="">Estado: Todos</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl bg-brand-surface">
        {isLoading ? (
          <p className="p-4 text-white/60">Cargando...</p>
        ) : alumnos.length === 0 ? (
          <p className="p-4 text-white/60">No hay alumnos que coincidan con la búsqueda.</p>
        ) : (
          <table className="w-full min-w-[760px] table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[23%]" />
              <col className="w-[13%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[18%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-white/10 text-white/50">
                <th className="px-4 py-3 font-medium">Alumno</th>
                <th className="px-4 py-3 font-medium">DNI</th>
                <th className="px-4 py-3 font-medium">F. nacimiento</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Rutina</th>
                <th className="px-4 py-3 font-medium">Profesor</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((a: any) => (
                <tr key={a.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 align-middle">
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
                  <td className="px-4 py-3 align-middle text-white/70">{a.dni}</td>
                  <td className="px-4 py-3 align-middle text-white/70">{formatearFecha(a.fecha_nacimiento)}</td>
                  <td className="px-4 py-3 align-middle">
                    <Pill
                      texto={a.estado === "activo" ? "Activo" : "Inactivo"}
                      tono={a.estado === "activo" ? "accent" : "gris"}
                    />
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <Pill texto={a.tiene_rutina ? "Asignada" : "Sin rutina"} tono={a.tiene_rutina ? "accent" : "gris"} />
                  </td>
                  <td className="px-4 py-3 align-middle text-white/70">
                    <span className={`truncate ${a.profesor_asignado_nombre ? "" : "text-white/35"}`}>
                      {a.profesor_asignado_nombre ?? "Sin asignar"}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <button
                      type="button"
                      onClick={() => setFormulario({ alumno: a })}
                      title="Editar alumno"
                      aria-label={`Editar ${a.first_name} ${a.apellido}`}
                      className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/50">
          <span>
            Mostrando {desde}-{hasta} de {total} alumnos
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="rounded-lg px-2 py-1 hover:bg-white/5 disabled:opacity-30"
            >
              ‹
            </button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPagina(p)}
                className={`h-7 w-7 rounded-lg text-xs ${
                  p === pagina ? "bg-brand-accent font-semibold text-black" : "hover:bg-white/5"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              className="rounded-lg px-2 py-1 hover:bg-white/5 disabled:opacity-30"
            >
              ›
            </button>
          </div>
        </div>
      )}

      {formulario && (
        <FormAlumno
          alumno={formulario.alumno}
          profesores={profesores}
          onCerrar={() => setFormulario(null)}
          onGuardado={() => {
            invalidar();
            setFormulario(null);
          }}
        />
      )}
    </div>
  );
}

function FormAlumno({
  alumno,
  profesores,
  onCerrar,
  onGuardado,
}: {
  alumno: any | null;
  profesores: any[] | undefined;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const editando = alumno !== null;
  const [form, setForm] = useState({
    username: alumno?.username ?? "",
    password: "",
    first_name: alumno?.first_name ?? "",
    apellido: alumno?.apellido ?? "",
    dni: alumno?.dni ?? "",
    fecha_nacimiento: alumno?.fecha_nacimiento ?? "",
    email: alumno?.email ?? "",
    estado: alumno?.estado ?? "activo",
    profesor_asignado: alumno?.profesor_asignado ? String(alumno.profesor_asignado) : "",
  });

  const guardar = useMutation({
    mutationFn: () => {
      const profesor_asignado = form.profesor_asignado || null;
      if (editando) {
        const { username, password, ...datos } = form;
        return modificarUsuario(alumno.id, { ...datos, profesor_asignado });
      }
      return crearAlumno({ ...form, profesor_asignado });
    },
    onSuccess: onGuardado,
  });

  const campo =
    "w-full rounded-lg bg-brand-bg px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-brand-accent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          guardar.mutate();
        }}
        className="max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto rounded-xl bg-brand-surface p-5"
      >
        <h2 className="text-lg font-bold">{editando ? "Editar alumno" : "Nuevo alumno"}</h2>

        {!editando && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Usuario" value={form.username} onChange={(v) => setForm({ ...form, username: v })} />
            <Input
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Nombre" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} />
          <Input label="Apellido" value={form.apellido} onChange={(v) => setForm({ ...form, apellido: v })} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="DNI" value={form.dni} onChange={(v) => setForm({ ...form, dni: v })} />
          <Input
            label="Fecha de nacimiento"
            type="date"
            required={!editando}
            value={form.fecha_nacimiento}
            onChange={(v) => setForm({ ...form, fecha_nacimiento: v })}
          />
        </div>

        <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />

        <div className={`grid grid-cols-1 gap-3 ${editando ? "sm:grid-cols-2" : ""}`}>
          {editando && (
            <label className="block text-sm">
              <span className="mb-1 block text-white/50">Estado</span>
              <select
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                className={campo}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </label>
          )}
          <SelectorProfesor
            valor={form.profesor_asignado}
            profesores={profesores}
            onChange={(v) => setForm({ ...form, profesor_asignado: v })}
          />
        </div>

        {guardar.isError && (
          <p className="text-sm text-red-400">No se pudo guardar el alumno. Revisá los datos e intentá de nuevo.</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={guardar.isPending}
            className="flex-1 rounded-lg bg-brand-accent py-2.5 font-semibold text-black disabled:opacity-50"
          >
            {guardar.isPending ? "Guardando..." : editando ? "Guardar cambios" : "Guardar alumno"}
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

function TarjetaStat({
  icono,
  iconoBg,
  titulo,
  valor,
  detalle,
}: {
  icono: string;
  iconoBg: string;
  titulo: string;
  valor: number | string;
  detalle: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-brand-surface p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconoBg}`}>
        <span>{icono}</span>
      </div>
      <div>
        <p className="text-xs text-white/50">{titulo}</p>
        <p className="text-xl font-bold">{valor}</p>
        <p className="text-xs text-white/40">{detalle}</p>
      </div>
    </div>
  );
}

function Pill({ texto, tono }: { texto: string; tono: "accent" | "gris" }) {
  const clases =
    tono === "accent" ? "bg-brand-accent/20 text-brand-accent" : "bg-white/10 text-white/50";
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${clases}`}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {texto}
    </span>
  );
}

function SelectorProfesor({
  valor,
  profesores,
  onChange,
}: {
  valor: string;
  profesores: any[] | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-white/50">Profesor asignado</span>
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-brand-bg px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-brand-accent"
      >
        <option value="">Sin asignar</option>
        {(profesores ?? []).map((p: any) => (
          <option key={p.id} value={p.id}>
            {p.first_name} {p.apellido}
          </option>
        ))}
      </select>
    </label>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-white/50">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-brand-bg px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-brand-accent"
        required={required}
      />
    </label>
  );
}
