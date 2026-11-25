import { api } from "./client";

// --- Usuarios (alumnos) ---
export interface FiltrosAlumnos {
  search?: string;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  page_size?: number;
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

// --- Accesorios / equipamiento (RF.9: lista abierta, el profesor puede sumar nuevos) ---
export async function listarAccesorios() {
  const { data } = await api.get("/ejercicios/accesorios/", { params: { page_size: 500 } });
  return data.results ?? data;
}

export async function crearAccesorio(descripcion: string) {
  const { data } = await api.post("/ejercicios/accesorios/", { descripcion });
  return data;
}

export async function eliminarAccesorio(id: number) {
  await api.delete(`/ejercicios/accesorios/${id}/`);
}

// JSON (no multipart): permite enviar la lista vacía sin ambigüedad al desmarcar todo.
export async function actualizarAccesoriosEjercicio(id: number, accesorio_ids: number[]) {
  const { data } = await api.patch(`/ejercicios/${id}/`, { accesorio_ids });
  return data;
}

// RF.11: asociar máquinas a un ejercicio (mismo motivo que accesorios: JSON aparte).
export async function actualizarMaquinasEjercicio(id: number, maquina_ids: number[]) {
  const { data } = await api.patch(`/ejercicios/${id}/`, { maquina_ids });
  return data;
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

export async function crearTipoRutina(nombre: string) {
  const { data } = await api.post("/rutinas/tipos/", { nombre });
  return data;
}

// --- Cronograma (RF.16, RF.17): día/enfoque de una rutina ---
export async function listarCronograma(rutinaId: number) {
  const { data } = await api.get("/rutinas/cronograma/", { params: { rutina: rutinaId } });
  return data.results ?? data;
}

export async function crearCronograma(payload: { rutina: number; dia: string; enfoque: string }) {
  const { data } = await api.post("/rutinas/cronograma/", payload);
  return data;
}

export async function eliminarCronograma(id: number) {
  await api.delete(`/rutinas/cronograma/${id}/`);
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

// --- Socios (RF.27, RF.28) ---
export async function listarSocios() {
  const { data } = await api.get("/socios/");
  return data.results ?? data;
}

export async function crearSocio(payload: any) {
  const { data } = await api.post("/socios/", payload);
  return data;
}

export async function modificarSocio(id: number, payload: any) {
  const { data } = await api.patch(`/socios/${id}/`, payload);
  return data;
}

// --- Descuentos (RF.21): se gestionan desde el formulario de Socios ---
export async function listarDescuentos() {
  const { data } = await api.get("/socios/descuentos/");
  return data.results ?? data;
}

export async function crearDescuento(payload: any) {
  const { data } = await api.post("/socios/descuentos/", payload);
  return data;
}
