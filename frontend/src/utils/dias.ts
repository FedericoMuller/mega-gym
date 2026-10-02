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

function aISO(fecha: Date) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export const fechaDeHoyISO = () => aISO(new Date());

export interface DiaConFecha {
  codigo: DiaCodigo;
  corto: string;
  largo: string;
  fecha: string; // ISO yyyy-mm-dd
  numeroDia: number; // día del mes, para mostrar en la botonera
}

/** Lunes a domingo de la semana que contiene `referencia` (hoy por defecto). */
export function semanaDe(referencia: Date = new Date()): DiaConFecha[] {
  const lunes = new Date(referencia);
  const diasDesdeElLunes = (lunes.getDay() + 6) % 7; // domingo (0) -> 6
  lunes.setDate(lunes.getDate() - diasDesdeElLunes);

  return DIAS.map((d, i) => {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + i);
    return { ...d, fecha: aISO(fecha), numeroDia: fecha.getDate() };
  });
}

interface ItemConDia {
  dia: string;
}

/** Agrupa los ejercicios de una rutina por día, en orden de semana (Lun → Dom). */
export function agruparPorDia<T extends ItemConDia>(items: T[]) {
  return DIAS.map((d) => ({ ...d, items: items.filter((i) => i.dia === d.codigo) })).filter(
    (d) => d.items.length > 0
  );
}
