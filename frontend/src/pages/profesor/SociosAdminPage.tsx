import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import {
  crearDescuento,
  crearSocio,
  listarAlumnos,
  listarDescuentos,
  listarSocios,
  modificarSocio,
} from "@/api/admin";
import { TablaResponsive } from "@/components/ui/TablaResponsive";
import { formatearFecha } from "@/utils/formato";

const ESTADOS = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
];

export function SociosAdminPage() {
  const { data: socios, isLoading } = useQuery({ queryKey: ["admin-socios"], queryFn: listarSocios });
  const { data: alumnos } = useQuery({
    queryKey: ["admin-alumnos-todos"],
    queryFn: () => listarAlumnos({ page_size: 500 }),
  });
  const { data: descuentos } = useQuery({ queryKey: ["descuentos"], queryFn: listarDescuentos });

  const [formulario, setFormulario] = useState<{ socio: any | null } | null>(null);

  const listaSocios: any[] = socios ?? [];
  const listaDescuentos: any[] = descuentos ?? [];

  const alumnosDisponibles = useMemo(() => {
    const idsConSocio = new Set(listaSocios.map((s) => s.usuario));
    return (alumnos?.results ?? []).filter((a: any) => !idsConSocio.has(a.id));
  }, [alumnos, listaSocios]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Socios</h1>
          <p className="text-sm text-white/50">Membresías, vencimientos y descuentos.</p>
        </div>
        <button
          onClick={() => setFormulario({ socio: null })}
          className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-black"
        >
          + Nuevo socio
        </button>
      </div>

      {isLoading ? (
        <p className="text-white/60">Cargando...</p>
      ) : (
        <TablaResponsive
          items={listaSocios}
          keyExtractor={(s: any) => s.id}
          vacio="Todavía no hay socios cargados."
          columnas={[
            { header: "Nombre", render: (s: any) => `${s.nombre} ${s.apellido}` },
            { header: "DNI", render: (s: any) => s.dni },
            { header: "Vencimiento", render: (s: any) => formatearFecha(s.fecha_vencimiento) },
            {
              header: "Estado",
              render: (s: any) => (
                <span className={s.estado === "activo" ? "text-brand-accent" : "text-white/50"}>
                  {s.estado === "activo" ? "Activo" : "Inactivo"}
                </span>
              ),
            },
            {
              header: "Descuento",
              render: (s: any) =>
                listaDescuentos.find((d) => d.id === s.descuento)?.nombre ?? "—",
            },
            {
              header: "",
              render: (s: any) => (
                <button
                  type="button"
                  onClick={() => setFormulario({ socio: s })}
                  title="Editar socio"
                  aria-label={`Editar ${s.nombre} ${s.apellido}`}
                  className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
                >
                  <Pencil size={16} />
                </button>
              ),
            },
          ]}
        />
      )}

      {formulario && (
        <FormSocio
          socio={formulario.socio}
          alumnosDisponibles={alumnosDisponibles}
          descuentos={listaDescuentos}
          onCerrar={() => setFormulario(null)}
        />
      )}
    </div>
  );
}

function FormSocio({
  socio,
  alumnosDisponibles,
  descuentos,
  onCerrar,
}: {
  socio: any | null;
  alumnosDisponibles: any[];
  descuentos: any[];
  onCerrar: () => void;
}) {
  const queryClient = useQueryClient();
  const editando = socio !== null;
  const [agregandoDescuento, setAgregandoDescuento] = useState(false);
  const [form, setForm] = useState({
    usuario: socio?.usuario ? String(socio.usuario) : "",
    nombre: socio?.nombre ?? "",
    apellido: socio?.apellido ?? "",
    dni: socio?.dni ?? "",
    fecha_inicio: socio?.fecha_inicio ?? new Date().toISOString().slice(0, 10),
    fecha_vencimiento: socio?.fecha_vencimiento ?? "",
    estado: socio?.estado ?? "activo",
    descuento: socio?.descuento ? String(socio.descuento) : "",
  });

  function alElegirAlumno(id: string) {
    const alumno = alumnosDisponibles.find((a) => String(a.id) === id);
    setForm((f) => ({
      ...f,
      usuario: id,
      nombre: alumno?.first_name ?? f.nombre,
      apellido: alumno?.apellido ?? f.apellido,
      dni: alumno?.dni ?? f.dni,
    }));
  }

  const guardar = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        usuario: Number(form.usuario),
        descuento: form.descuento ? Number(form.descuento) : null,
      };
      return editando ? modificarSocio(socio.id, payload) : crearSocio(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-socios"] });
      onCerrar();
    },
  });

  const campo = "w-full rounded-lg bg-brand-bg px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-brand-accent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          guardar.mutate();
        }}
        className="max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto rounded-xl bg-brand-surface p-5"
      >
        <h2 className="text-lg font-bold">{editando ? "Editar socio" : "Nuevo socio"}</h2>

        {!editando && (
          <label className="block text-sm">
            <span className="mb-1 block text-white/50">Alumno</span>
            <select required value={form.usuario} onChange={(e) => alElegirAlumno(e.target.value)} className={campo}>
              <option value="">Elegir...</option>
              {alumnosDisponibles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.apellido}, {a.first_name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-white/50">Nombre</span>
            <input
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={campo}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-white/50">Apellido</span>
            <input
              required
              value={form.apellido}
              onChange={(e) => setForm({ ...form, apellido: e.target.value })}
              className={campo}
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-white/50">DNI</span>
          <input
            required
            value={form.dni}
            onChange={(e) => setForm({ ...form, dni: e.target.value })}
            className={campo}
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-white/50">Fecha de inicio</span>
            <input
              type="date"
              required
              value={form.fecha_inicio}
              onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
              className={campo}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-white/50">Vencimiento</span>
            <input
              type="date"
              required
              value={form.fecha_vencimiento}
              onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })}
              className={campo}
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-white/50">Estado</span>
          <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className={campo}>
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </label>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm text-white/50">Descuento</span>
            <button
              type="button"
              onClick={() => setAgregandoDescuento(true)}
              aria-label="Agregar descuento"
              title="Agregar descuento"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent text-black hover:brightness-110"
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          </div>
          <select
            value={form.descuento}
            onChange={(e) => setForm({ ...form, descuento: e.target.value })}
            className={campo}
          >
            <option value="">Sin descuento</option>
            {descuentos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre} ({d.codigo_descuento})
              </option>
            ))}
          </select>
        </div>

        {guardar.isError && (
          <p className="text-sm text-red-400">No se pudo guardar el socio. Revisá los datos e intentá de nuevo.</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={guardar.isPending}
            className="flex-1 rounded-lg bg-brand-accent py-2.5 font-semibold text-black disabled:opacity-50"
          >
            {guardar.isPending ? "Guardando..." : editando ? "Guardar cambios" : "Guardar socio"}
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

      {agregandoDescuento && (
        <ModalNuevoDescuento
          onCerrar={() => setAgregandoDescuento(false)}
          onCreado={(nuevo) => {
            queryClient.invalidateQueries({ queryKey: ["descuentos"] });
            setForm((f) => ({ ...f, descuento: String(nuevo.id) }));
            setAgregandoDescuento(false);
          }}
        />
      )}
    </div>
  );
}

function ModalNuevoDescuento({
  onCerrar,
  onCreado,
}: {
  onCerrar: () => void;
  onCreado: (descuento: any) => void;
}) {
  const [form, setForm] = useState({ nombre: "", codigo_descuento: "", fecha_inicio: "", fecha_fin: "" });

  const guardar = useMutation({
    mutationFn: () => crearDescuento(form),
    onSuccess: onCreado,
  });

  const campo = "w-full rounded-lg bg-brand-bg px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-brand-accent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          guardar.mutate();
        }}
        className="w-full max-w-sm space-y-3 rounded-xl bg-brand-surface p-5"
      >
        <h2 className="text-lg font-bold">Nuevo descuento</h2>

        <label className="block text-sm">
          <span className="mb-1 block text-white/50">Nombre</span>
          <input
            autoFocus
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej: Descuento estudiantes"
            className={campo}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-white/50">Código</span>
          <input
            required
            value={form.codigo_descuento}
            onChange={(e) => setForm({ ...form, codigo_descuento: e.target.value })}
            placeholder="Ej: EST2026"
            className={campo}
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-white/50">Desde</span>
            <input
              type="date"
              required
              value={form.fecha_inicio}
              onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
              className={campo}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-white/50">Hasta</span>
            <input
              type="date"
              required
              value={form.fecha_fin}
              onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
              className={campo}
            />
          </label>
        </div>

        {guardar.isError && <p className="text-sm text-red-400">No se pudo guardar. Intentá de nuevo.</p>}

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
