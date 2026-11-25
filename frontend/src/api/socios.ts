import { api } from "./client";

export async function descargarCertificadoSocio() {
  const { data } = await api.get("/socios/certificado/", { responseType: "blob" });
  return data as Blob;
}
