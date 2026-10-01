export function formatearFecha(fecha: string | null) {
  if (!fecha) return "-";
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

export const NIVEL_LABEL: Record<string, string> = {
  adaptativo: "Adaptativo",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};
