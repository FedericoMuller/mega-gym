import { api } from "./client";

export interface Ejercicio {
  id: number;
  nombre_ejercicio: string;
  url_ejercicio: string | null;
  imagen: string | null;
  categoria: string;
  tipo: string;
  equipamiento: string;
  accesorios: { id: number; descripcion: string }[];
}

// Un ejercicio de la rutina para un día de la semana, con sus series y repeticiones.
export interface RutinaItem {
  id: number;
  dia: string;
  orden: number;
  series: number;
  repeticiones: string;
  ejercicio: Ejercicio;
}

export interface Rutina {
  id: number;
  usuario: number;
  nombre: string;
  fecha_inicio: string;
  objetivo: string;
  nivel: string;
  estado: string;
  items: RutinaItem[];
}

// RF.13: visualizar rutina (filtrado por usuario en el backend según el rol)
export async function listarRutinas() {
  const { data } = await api.get("/rutinas/");
  return (data.results ?? data) as Rutina[];
}

export async function obtenerRutina(id: number) {
  const { data } = await api.get(`/rutinas/${id}/`);
  return data as Rutina;
}
