import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  crearSeguimiento,
  listarSeguimiento,
  modificarSeguimiento,
} from "@/api/seguimiento";
import { crearComentario, listarComentarios } from "@/api/comentarios";
import { formatearFecha } from "@/utils/formato";

const OBJETIVOS = [
  { value: "perdida_peso", label: "Pérdida de peso" },
  { value: "incremento_muscular", label: "Incremento muscular" },
  { value: "recomposicion_corporal", label: "Recomposición corporal" },
  { value: "mantenimiento", label: "Mantenimiento" },
];

export function SeguimientoPage() {
  const queryClient = useQueryClient();
  const { data: planes, isLoading } = useQuery({
    queryKey: ["seguimiento"],
    queryFn: listarSeguimiento,
  });

  const [form, setForm] = useState({
    objetivo: "perdida_peso",
    peso_actual: "",
    peso_objetivo: "",
    fecha_inicio: new Date().toISOString().slice(0, 10),
    fecha_objetivo: "",
  });

  const plan = planes?.[0];

  const guardar = useMutation({
    mutationFn: () => {
      const payload = {
        objetivo: form.objetivo,
        peso_actual: Number(form.peso_actual),
        peso_objetivo: Number(form.peso_objetivo),
        fecha_inicio: form.fecha_inicio,
        fecha_objetivo: form.fecha_objetivo,
      };
      return plan ? modificarSeguimiento(plan.id, payload) : crearSeguimiento(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seguimiento"] }),
  });

  if (isLoading) return <p className="text-white/60">Cargando...</p>;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Mi seguimiento</h1>

      {!plan && (
        <p className="mb-4 text-white/70">
          No hay plan de seguimiento asociado a este usuario.
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          guardar.mutate();
        }}
        className="space-y-3"
      >
        <select
          value={form.objetivo}
          onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
          className="w-full rounded-lg bg-brand-surface px-4 py-3 outline-none"
        >
          {OBJETIVOS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <input
          type="number"
          step="0.1"
          placeholder="Peso actual (kg)"
          value={form.peso_actual}
          onChange={(e) => setForm({ ...form, peso_actual: e.target.value })}
          className="w-full rounded-lg bg-brand-surface px-4 py-3 placeholder-white/40 outline-none"
          required
        />

        <input
          type="number"
          step="0.1"
          placeholder="Peso objetivo (kg)"
          value={form.peso_objetivo}
          onChange={(e) => setForm({ ...form, peso_objetivo: e.target.value })}
          className="w-full rounded-lg bg-brand-surface px-4 py-3 placeholder-white/40 outline-none"
          required
        />

        <input
          type="date"
          value={form.fecha_objetivo}
          onChange={(e) => setForm({ ...form, fecha_objetivo: e.target.value })}
          className="w-full rounded-lg bg-brand-surface px-4 py-3 outline-none"
          required
        />

        <button
          type="submit"
          disabled={guardar.isPending}
          className="w-full rounded-lg bg-brand-accent py-3 font-semibold text-black disabled:opacity-50"
        >
          {plan ? "Guardar cambios" : "Nuevo plan de seguimiento"}
        </button>
      </form>

      <PanelComentarios />
    </div>
  );
}

function PanelComentarios() {
  const queryClient = useQueryClient();
  const { data: comentarios, isLoading } = useQuery({
    queryKey: ["mis-comentarios"],
    queryFn: () => listarComentarios(),
  });
  const [texto, setTexto] = useState("");

  const guardar = useMutation({
    mutationFn: () => crearComentario(texto.trim()),
    onSuccess: () => {
      setTexto("");
      queryClient.invalidateQueries({ queryKey: ["mis-comentarios"] });
    },
  });

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-lg font-bold">Comentarios</h2>
      <p className="mb-3 text-sm text-white/50">
        Dejale una nota a tu profesor sobre cómo vas con tu entrenamiento.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (texto.trim()) guardar.mutate();
        }}
        className="mb-4 flex gap-2"
      >
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribí un comentario..."
          required
          className="flex-1 rounded-lg bg-brand-surface px-4 py-2.5 text-sm placeholder-white/40 outline-none ring-1 ring-white/10 focus:ring-brand-accent"
        />
        <button
          type="submit"
          disabled={guardar.isPending}
          className="rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
        >
          Enviar
        </button>
      </form>

      {isLoading ? (
        <p className="text-sm text-white/50">Cargando...</p>
      ) : !comentarios?.length ? (
        <p className="text-sm text-white/40">Todavía no dejaste ningún comentario.</p>
      ) : (
        <ul className="space-y-2">
          {comentarios.map((c) => (
            <li key={c.id} className="rounded-lg bg-brand-surface p-3 text-sm">
              <p className="mb-1 text-white/50">{formatearFecha(c.fecha)}</p>
              <p>{c.comentario}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
