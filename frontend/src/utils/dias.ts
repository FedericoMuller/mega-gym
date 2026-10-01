export type DiaCodigo = "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom";

export const DIAS: { codigo: DiaCodigo; corto: string; largo: string }[] = [
  { codigo: "lun", corto: "Lun", largo: "Lunes" },
  { codigo: "mar", corto: "Mar", largo: "Martes" },
  { codigo: "mie", corto: "Mié", largo: "Miércoles" },
  { codigo: "jue", corto: "Jue", largo: "Jueves" },
  { codigo: "vie", corto: "Vie", largo: "Viernes" },
  { codigo: "sab", corto: "Sáb", largo: "Sábado" },
  { codigo: "dom", corto: "Dom", largo: "Domingo" },
];

export const nombreDia = (codigo: string) => DIAS.find((d) => d.codigo === codigo)?.largo ?? codigo;

const POR_INDICE_JS: DiaCodigo[] = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];

export const diaDeHoy = (): DiaCodigo => POR_INDICE_JS[new Date().getDay()];

interface ItemConDia {
  dia: string;
}

/** Agrupa los ejercicios de una rutina por día, en orden de semana (Lun → Dom). */
export function agruparPorDia<T extends ItemConDia>(items: T[]) {
  return DIAS.map((d) => ({ ...d, items: items.filter((i) => i.dia === d.codigo) })).filter(
    (d) => d.items.length > 0
  );
}
