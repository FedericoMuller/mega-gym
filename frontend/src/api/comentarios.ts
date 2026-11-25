import { api } from "./client";

export interface Comentario {
  id: number;
  usuario: number;
  comentario: string;
  fecha: string;
}

export async function listarComentarios(usuarioId?: number) {
  const { data } = await api.get("/usuarios/comentarios/", {
    params: usuarioId ? { usuario: usuarioId } : {},
  });
  return (data.results ?? data) as Comentario[];
}

export async function crearComentario(comentario: string) {
  const { data } = await api.post("/usuarios/comentarios/", { comentario });
  return data as Comentario;
}
