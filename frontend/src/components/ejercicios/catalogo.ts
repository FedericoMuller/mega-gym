import { useMemo, useState } from "react";
import {
  BicepsFlexed,
  Dumbbell,
  Flame,
  Footprints,
  HeartPulse,
  PersonStanding,
  Shirt,
  type LucideIcon,
} from "lucide-react";

export const CATEGORIAS: { valor: string; label: string; Icono: LucideIcon }[] = [
  { valor: "pecho", label: "Pecho", Icono: Shirt },
  { valor: "espalda", label: "Espalda", Icono: PersonStanding },
  { valor: "piernas", label: "Piernas", Icono: Footprints },
  { valor: "hombros", label: "Hombros", Icono: Dumbbell },
  { valor: "brazos", label: "Brazos", Icono: BicepsFlexed },
  { valor: "core", label: "Core", Icono: Flame },
  { valor: "cardio", label: "Cardio", Icono: HeartPulse },
];

export const TIPOS = [
  { valor: "compuesto", label: "Compuesto" },
  { valor: "aislamiento", label: "Aislamiento" },
];

export const EQUIPAMIENTOS = [
  { valor: "maquina", label: "Máquina" },
  { valor: "mancuernas", label: "Mancuernas" },
  { valor: "barra", label: "Barra" },
  { valor: "polea", label: "Polea" },
  { valor: "peso_corporal", label: "Peso corporal" },
  { valor: "otro", label: "Otro" },
];

export const etiqueta = (lista: { valor: string; label: string }[], valor: string) =>
  lista.find((i) => i.valor === valor)?.label ?? "";

const PALABRAS_VACIAS = new Set(["de", "del", "la", "el", "los", "las", "en", "con", "y", "a"]);

export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export type Orden = "relevancia" | "az" | "za";

/** Búsqueda, filtros y orden del catálogo (se resuelven en el cliente). */
export function useFiltroCatalogo(lista: any[]) {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [equipos, setEquipos] = useState<string[]>([]);
  const [orden, setOrden] = useState<Orden>("relevancia");

  const conteoCategorias = useMemo(() => {
    const c: Record<string, number> = {};
    lista.forEach((e) => (c[e.categoria] = (c[e.categoria] ?? 0) + 1));
    return c;
  }, [lista]);

  const conteoEquipos = useMemo(() => {
    const c: Record<string, number> = {};
    lista.forEach((e) => (c[e.equipamiento] = (c[e.equipamiento] ?? 0) + 1));
    return c;
  }, [lista]);

  const consulta = normalizar(busqueda);

  const resultados = useMemo(() => {
    const tokens = consulta.split(/\s+/).filter((t) => t && !PALABRAS_VACIAS.has(t));

    const puntuar = (e: any) => {
      const nombre = normalizar(e.nombre_ejercicio);
      const resto = normalizar(
        `${etiqueta(CATEGORIAS, e.categoria)} ${etiqueta(TIPOS, e.tipo)} ${etiqueta(EQUIPAMIENTOS, e.equipamiento)}`
      );
      const pajar = `${nombre} ${resto}`;
      if (!tokens.every((t) => pajar.includes(t))) return -1;
      if (!consulta) return 0;
      let p = tokens.filter((t) => nombre.includes(t)).length * 10 + tokens.length;
      if (nombre === consulta) p += 100;
      else if (nombre.startsWith(consulta)) p += 80;
      else if (nombre.includes(consulta)) p += 60;
      return p;
    };

    const filtrados = lista
      .filter((e) => !categoria || e.categoria === categoria)
      .filter((e) => equipos.length === 0 || equipos.includes(e.equipamiento))
      .map((e) => ({ e, puntaje: puntuar(e) }))
      .filter((x) => x.puntaje >= 0);

    filtrados.sort((a, b) => {
      const porNombre = a.e.nombre_ejercicio.localeCompare(b.e.nombre_ejercicio, "es");
      if (orden === "az") return porNombre;
      if (orden === "za") return -porNombre;
      return b.puntaje - a.puntaje || porNombre;
    });
    return filtrados.map((x) => x.e);
  }, [lista, consulta, categoria, equipos, orden]);

  function alternarEquipo(valor: string) {
    setEquipos((prev) => (prev.includes(valor) ? prev.filter((v) => v !== valor) : [...prev, valor]));
  }

  function limpiarFiltros() {
    setBusqueda("");
    setCategoria("");
    setEquipos([]);
  }

  return {
    busqueda, setBusqueda,
    categoria, setCategoria,
    equipos, alternarEquipo,
    orden, setOrden,
    consulta,
    conteoCategorias, conteoEquipos,
    resultados,
    limpiarFiltros,
    hayFiltros: Boolean(busqueda || categoria || equipos.length > 0),
    total: lista.length,
  };
}

export type FiltroCatalogo = ReturnType<typeof useFiltroCatalogo>;

// Colores por categoría (clases completas para que Tailwind las detecte).
export const COLOR_CATEGORIA: Record<string, { chip: string; punto: string }> = {
  pecho: { chip: "bg-rose-500/15 text-rose-300", punto: "bg-rose-400" },
  espalda: { chip: "bg-sky-500/15 text-sky-300", punto: "bg-sky-400" },
  piernas: { chip: "bg-violet-500/15 text-violet-300", punto: "bg-violet-400" },
  hombros: { chip: "bg-amber-500/15 text-amber-300", punto: "bg-amber-400" },
  brazos: { chip: "bg-emerald-500/15 text-emerald-300", punto: "bg-emerald-400" },
  core: { chip: "bg-orange-500/15 text-orange-300", punto: "bg-orange-400" },
  cardio: { chip: "bg-pink-500/15 text-pink-300", punto: "bg-pink-400" },
};

export const COLOR_SIN_CATEGORIA = { chip: "bg-white/10 text-white/70", punto: "bg-white/50" };
