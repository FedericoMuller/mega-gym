import { api } from "./client";

// --- Usuarios (alumnos) ---
export interface FiltrosAlumnos {
  search?: string;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
}

export interface PaginaAlumnos {
  count: number;
  next: string | null;
  previous: string | null;
  results: any[];
}

export async function listarAlumnos(filtros: FiltrosAlumnos = {}) {
  const { data } = await api.get("/usuarios/", {
    params: { rol: "alumno", ...filtros },
  });
  return data as PaginaAlumnos;
}

export async function obtenerStatsAlumnos() {
  const { data } = await api.get("/usuarios/stats/", { params: { rol: "alumno" } });
  return data as { total: number; activos: number; inactivos: number; nuevos_ultima_semana: number };
}

export async function crearAlumno(payload: any) {
  const { data } = await api.post("/usuarios/", { ...payload, rol: "alumno" });
  return data;
}

export async function modificarUsuario(id: number, payload: any) {
  const { data } = await api.patch(`/usuarios/${id}/`, payload);
  return data;
}

// --- Profesores (solo gestionables por el super admin) ---
export async function listarProfesores() {
  const { data } = await api.get("/usuarios/?rol=profesor");
  return data.results ?? data;
}

export async function crearProfesor(payload: any) {
  const { data } = await api.post("/usuarios/", { ...payload, rol: "profesor" });
  return data;
}

// --- Ejercicios ---
export async function listarEjerciciosAdmin() {
  const { data } = await api.get("/ejercicios/", { params: { page_size: 500 } });
  return data.results ?? data;
}

// FormData: permite subir la imagen junto con el resto de los campos.
export async function crearEjercicio(payload: FormData) {
  const { data } = await api.post("/ejercicios/", payload);
  return data;
}

export async function modificarEjercicio(id: number, payload: FormData) {
  const { data } = await api.patch(`/ejercicios/${id}/`, payload);
  return data;
}

export async function eliminarEjercicio(id: number) {
  await api.delete(`/ejercicios/${id}/`);
}

// --- Máquinas ---
export async function listarMaquinas() {
  const { data } = await api.get("/maquinas/");
  return data.results ?? data;
}

export async function crearMaquina(payload: { nombre_maquina: string; estado: string }) {
  const { data } = await api.post("/maquinas/", payload);
  return data;
}

export async function modificarMaquina(id: number, payload: any) {
  const { data } = await api.patch(`/maquinas/${id}/`, payload);
  return data;
}

// --- Rutinas (admin) ---
export async function listarTiposRutina() {
  const { data } = await api.get("/rutinas/tipos/");
  return data.results ?? data;
}

export async function listarRutinasDeAlumno(usuarioId: number) {
  const { data } = await api.get("/rutinas/", { params: { usuario: usuarioId } });
  return data.results ?? data;
}

export async function obtenerRutina(id: number) {
  const { data } = await api.get(`/rutinas/${id}/`);
  return data;
}

export async function crearRutina(payload: any) {
  const { data } = await api.post("/rutinas/", payload);
  return data;
}

export async function modificarRutina(id: number, payload: any) {
  const { data } = await api.patch(`/rutinas/${id}/`, payload);
  return data;
}

// --- Seguimiento (historial de un alumno) ---
export async function listarSeguimientoDeAlumno(usuarioId: number) {
  const { data } = await api.get("/seguimiento/", { params: { usuario: usuarioId } });
  return data.results ?? data;
}
