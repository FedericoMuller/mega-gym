import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Check } from "lucide-react";
import { alternarCompletado, type RutinaItem } from "@/api/rutinas";

interface EstadoNavegacion {
  item: RutinaItem;
  fecha: string;
}

export function DetalleEjercicioPage() {
  const { state } = useLocation() as { state: EstadoNavegacion | null };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [completado, setCompletado] = useState(() => state?.item.completados.includes(state.fecha) ?? false);

  const alternar = useMutation({
    mutationFn: () => alternarCompletado(state!.item.id, state!.fecha),
    onSuccess: (data) => {
      setCompletado(data.completado);
      queryClient.invalidateQueries({ queryKey: ["rutinas"] });
    },
  });

  if (!state) {
    return (
      <div className="text-white/60">
        No se encontró el ejercicio #{id}.{" "}
        <button onClick={() => navigate(-1)} className="text-brand-accent underline">
          Volver
        </button>
      </div>
    );
  }

  const { item } = state;
  const ejercicio = item.ejercicio;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 text-white/60">
        ← Volver
      </button>

      <h1 className="mb-3 text-xl font-bold">{ejercicio.nombre_ejercicio}</h1>

      <div className="mb-4 aspect-video w-full overflow-hidden rounded-xl bg-white/10">
        {ejercicio.imagen && (
          <img src={ejercicio.imagen} alt={ejercicio.nombre_ejercicio} className="h-full w-full object-cover" />
        )}
      </div>

      {ejercicio.url_ejercicio && (
        <a
          href={ejercicio.url_ejercicio}
          target="_blank"
          rel="noreferrer"
          className="mb-4 block text-brand-accent underline"
        >
          Ver cómo realizar este ejercicio
        </a>
      )}

      <div className="space-y-2 rounded-xl bg-brand-surface p-4">
        <p>
          🔁 {item.series} series ・ {item.repeticiones} repeticiones
        </p>
        {ejercicio.accesorios.length > 0 && (
          <p>🛠️ {ejercicio.accesorios.map((a) => a.descripcion).join(", ")}</p>
        )}
      </div>

      <button
        onClick={() => alternar.mutate()}
        disabled={alternar.isPending}
        className={`mt-6 flex w-full items-center justify-center gap-2 rounded-lg py-3 font-semibold disabled:opacity-50 ${
          completado ? "bg-white/10 text-white" : "bg-brand-accent text-black"
        }`}
      >
        {completado && <Check size={18} strokeWidth={3} />}
        {completado ? "Realizado" : "Marcar como realizado"}
      </button>
    </div>
  );
}
