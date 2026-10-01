import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, ImagePlus, Pencil, Trash2 } from "lucide-react";
import {
  crearEjercicio,
  eliminarEjercicio,
  listarEjerciciosAdmin,
  modificarEjercicio,
} from "@/api/admin";
import { ModalConfirmacion } from "@/components/ui/ModalConfirmacion";
import { CATEGORIAS, EQUIPAMIENTOS, TIPOS, useFiltroCatalogo } from "@/components/ejercicios/catalogo";
import { BarraResultados, ChipsEjercicio, Miniatura, PanelFiltros } from "@/components/ejercicios/piezas";

export function EjerciciosAdminPage() {
  const queryClient = useQueryClient();
  const { data: ejercicios, isLoading } = useQuery({
    queryKey: ["admin-ejercicios"],
    queryFn: listarEjerciciosAdmin,
  });
  const lista: any[] = ejercicios ?? [];
  const f = useFiltroCatalogo(lista);

  // null = formulario cerrado; { ejercicio: null } = alta; { ejercicio } = edición
  const [formulario, setFormulario] = useState<{ ejercicio: any | null } | null>(null);
  const [ejercicioAEliminar, setEjercicioAEliminar] = useState<any | null>(null);

  const eliminar = useMutation({
    mutationFn: (id: number) => eliminarEjercicio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ejercicios"] });
      queryClient.invalidateQueries({ queryKey: ["rutinas-de-alumno"] });
      setEjercicioAEliminar(null);
    },
  });

  return (
    <div>
      <div className="mb-3 text-xs text-white/40">
        Inicio <span className="mx-1">›</span> <span className="text-white/70">Ejercicios</span>
      </div>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ejercicios</h1>
          <p className="text-sm text-white/50">Buscá un ejercicio del catálogo o cargá uno nuevo.</p>
        </div>
        <button
          onClick={() => setFormulario({ ejercicio: null })}
          className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-black"
        >
          + Nuevo ejercicio
        </button>
      </div>

      <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-white/10 bg-brand-surface md:grid-cols-[250px_1fr]">
        <aside className="border-b border-white/10 p-4 md:border-b-0 md:border-r">
          <PanelFiltros f={f} />
        </aside>

        <section className="bg-brand-bg/40 p-4">
          <BarraResultados f={f} />

          {isLoading ? (
            <p className="text-white/60">Cargando...</p>
          ) : f.resultados.length === 0 ? (
            <div className="rounded-xl bg-brand-surface p-6 text-center text-sm text-white/50">
              <p>{lista.length === 0 ? "Todavía no hay ejercicios cargados." : "No se encontraron ejercicios con esos filtros."}</p>
              {f.hayFiltros && (
                <button onClick={f.limpiarFiltros} className="mt-2 text-brand-accent hover:underline">
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {f.resultados.map((e, i) => (
                <TarjetaEjercicio
                  key={e.id}
                  ejercicio={e}
                  destacada={!!f.consulta && i === 0}
                  onEditar={() => setFormulario({ ejercicio: e })}
                  onEliminar={() => {
                    eliminar.reset();
                    setEjercicioAEliminar(e);
                  }}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      {formulario && (
        <FormEjercicio ejercicio={formulario.ejercicio} onCerrar={() => setFormulario(null)} />
      )}

      {ejercicioAEliminar && (
        <ModalConfirmacion
          titulo="¿Eliminar ejercicio?"
          mensaje={`¿Estás seguro de que querés eliminar "${ejercicioAEliminar.nombre_ejercicio}"? También se va a quitar de las rutinas que lo usen. Esta acción no se puede deshacer.`}
          cargando={eliminar.isPending}
          error={eliminar.isError ? "No se pudo eliminar el ejercicio. Intentá de nuevo." : undefined}
          onConfirmar={() => eliminar.mutate(ejercicioAEliminar.id)}
          onCancelar={() => setEjercicioAEliminar(null)}
        />
      )}
    </div>
  );
}

function TarjetaEjercicio({
  ejercicio,
  destacada,
  onEditar,
  onEliminar,
}: {
  ejercicio: any;
  destacada: boolean;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  return (
    <li
      className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
        destacada
          ? "border-brand-accent bg-brand-accent/10"
          : "border-white/10 bg-brand-surface hover:border-white/25"
      }`}
    >
      <Miniatura imagen={ejercicio.imagen} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{ejercicio.nombre_ejercicio}</p>
        <ChipsEjercicio ejercicio={ejercicio} />
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {ejercicio.url_ejercicio && (
          <a
            href={ejercicio.url_ejercicio}
            target="_blank"
            rel="noreferrer"
            title="Ver técnica"
            className="mr-1 flex items-center gap-1 text-xs text-white/50 hover:text-brand-accent"
          >
            <span className="hidden sm:inline">Ver técnica</span> <ExternalLink size={14} />
          </a>
        )}
        <button
          type="button"
          onClick={onEditar}
          title="Editar ejercicio"
          aria-label={`Editar ${ejercicio.nombre_ejercicio}`}
          className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          onClick={onEliminar}
          title="Eliminar ejercicio"
          aria-label={`Eliminar ${ejercicio.nombre_ejercicio}`}
          className="rounded-lg p-2 text-white/50 hover:bg-red-500/15 hover:text-red-400"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  );
}

function FormEjercicio({ ejercicio, onCerrar }: { ejercicio: any | null; onCerrar: () => void }) {
  const queryClient = useQueryClient();
  const editando = ejercicio !== null;
  const [form, setForm] = useState({
    nombre_ejercicio: ejercicio?.nombre_ejercicio ?? "",
    categoria: ejercicio?.categoria ?? "",
    tipo: ejercicio?.tipo ?? "",
    equipamiento: ejercicio?.equipamiento ?? "",
    url_ejercicio: ejercicio?.url_ejercicio ?? "",
  });
  const [imagen, setImagen] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(ejercicio?.imagen ?? null);

  useEffect(() => {
    if (!imagen) {
      setPreview(ejercicio?.imagen ?? null);
      return;
    }
    const url = URL.createObjectURL(imagen);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imagen, ejercicio]);

  const guardar = useMutation({
    mutationFn: () => {
      const datos = new FormData();
      Object.entries(form).forEach(([clave, valor]) => {
        // Al editar se envían también los vacíos para poder borrar la URL.
        if (valor || editando) datos.append(clave, valor as string);
      });
      if (imagen) datos.append("imagen", imagen);
      return editando ? modificarEjercicio(ejercicio.id, datos) : crearEjercicio(datos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ejercicios"] });
      queryClient.invalidateQueries({ queryKey: ["rutinas-de-alumno"] });
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
        <h2 className="text-lg font-bold">{editando ? "Editar ejercicio" : "Nuevo ejercicio"}</h2>

        <label className="block text-sm">
          <span className="mb-1 block text-white/50">Nombre</span>
          <input
            required
            value={form.nombre_ejercicio}
            onChange={(e) => setForm({ ...form, nombre_ejercicio: e.target.value })}
            className={campo}
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SelectCampo label="Categoría" valor={form.categoria} opciones={CATEGORIAS} onChange={(v) => setForm({ ...form, categoria: v })} clase={campo} />
          <SelectCampo label="Tipo" valor={form.tipo} opciones={TIPOS} onChange={(v) => setForm({ ...form, tipo: v })} clase={campo} />
          <SelectCampo label="Equipamiento" valor={form.equipamiento} opciones={EQUIPAMIENTOS} onChange={(v) => setForm({ ...form, equipamiento: v })} clase={campo} />
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-white/50">URL (video/instrucciones)</span>
          <input
            type="url"
            value={form.url_ejercicio}
            onChange={(e) => setForm({ ...form, url_ejercicio: e.target.value })}
            className={campo}
          />
        </label>

        <div className="text-sm">
          <span className="mb-1 block text-white/50">Imagen</span>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-brand-bg p-2 ring-1 ring-white/10 hover:ring-brand-accent">
            <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded bg-brand-surface">
              {preview ? (
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus size={22} className="text-white/30" />
              )}
            </div>
            <span className="truncate text-white/60">
              {imagen ? imagen.name : preview ? "Cambiar imagen..." : "Elegir imagen..."}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImagen(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {guardar.isError && (
          <p className="text-sm text-red-400">No se pudo guardar el ejercicio. Revisá los datos e intentá de nuevo.</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={guardar.isPending}
            className="flex-1 rounded-lg bg-brand-accent py-2.5 font-semibold text-black disabled:opacity-50"
          >
            {guardar.isPending ? "Guardando..." : editando ? "Guardar cambios" : "Guardar ejercicio"}
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

function SelectCampo({
  label,
  valor,
  opciones,
  onChange,
  clase,
}: {
  label: string;
  valor: string;
  opciones: { valor: string; label: string }[];
  onChange: (v: string) => void;
  clase: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-white/50">{label}</span>
      <select required value={valor} onChange={(e) => onChange(e.target.value)} className={clase}>
        <option value="">Elegir...</option>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
