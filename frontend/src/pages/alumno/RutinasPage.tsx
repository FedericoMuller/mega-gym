import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { listarRutinas } from "@/api/rutinas";
import { Miniatura } from "@/components/ejercicios/piezas";
import { agruparPorDia, diaDeHoy } from "@/utils/dias";

export function RutinasPage() {
  const { data: rutinas, isLoading } = useQuery({
    queryKey: ["rutinas"],
    queryFn: listarRutinas,
  });
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

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
  const grupos = agruparPorDia(rutina.items);

  if (grupos.length === 0) {
    return (
      <div className="rounded-lg bg-brand-surface p-6 text-center text-white/70">
        Tu rutina todavía no tiene ejercicios cargados. Contactá a tu profesor.
      </div>
    );
  }

  const hoy = diaDeHoy();
  const codigoActivo = diaSeleccionado ?? (grupos.find((g) => g.codigo === hoy) ?? grupos[0]).codigo;
  const grupoActivo = grupos.find((g) => g.codigo === codigoActivo) ?? grupos[0];

  return (
    <div>
      <h1 className="text-xl font-bold">Mis rutinas</h1>
      <p className="mb-4 text-sm text-white/50">{rutina.nombre || "Rutina"}</p>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {grupos.map((g) => (
          <button
            key={g.codigo}
            onClick={() => setDiaSeleccionado(g.codigo)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${
              grupoActivo.codigo === g.codigo
                ? "bg-brand-accent font-semibold text-black"
                : "bg-brand-surface text-white/60"
            }`}
          >
            {g.largo}
            {g.codigo === hoy && <span className="ml-1.5 text-xs opacity-70">· hoy</span>}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {grupoActivo.items.map((item) => (
          <Link
            key={item.id}
            to={`/rutinas/ejercicio/${item.ejercicio.id}`}
            state={{ ejercicio: item.ejercicio, series: item.series, repeticiones: item.repeticiones }}
            className="flex items-center gap-3 rounded-xl bg-brand-surface p-3"
          >
            <Miniatura imagen={item.ejercicio.imagen} className="h-14 w-14" />
            <div className="flex-1">
              <p className="font-medium">{item.ejercicio.nombre_ejercicio}</p>
              <p className="text-xs text-white/50">
                {item.series} series x {item.repeticiones} repeticiones
              </p>
            </div>
            <span className="text-white/30">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
