import { calcularHoras } from "./horarios";

export interface PeriodoReporte {
  id: string;
  empleadoId: string;
  obraId: string;
  ingresoAt: Date;
  egresoAt: Date | null;
}

export interface ReporteSemanal {
  inicioSemana: Date;
  finSemana: Date;
  porObra: Record<string, Record<string, number>>;
}

export function inicioDeSemana(fecha: Date): Date {
  const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const dia = inicio.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  inicio.setDate(inicio.getDate() + diff);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
}

export function finDeSemana(fecha: Date): Date {
  const fin = inicioDeSemana(fecha);
  fin.setDate(fin.getDate() + 7);
  return fin;
}

export function formatearFechaLocal(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export function sumarSemanas(fechaISO: string, semanas: number): string {
  const fecha = new Date(`${fechaISO}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) {
    return fechaISO;
  }
  fecha.setDate(fecha.getDate() + semanas * 7);
  return formatearFechaLocal(fecha);
}

function interseccion(
  periodo: PeriodoReporte,
  inicioSemana: Date,
  finSemana: Date
): { ingresoAt: Date; egresoAt: Date } | null {
  const desde = Math.max(periodo.ingresoAt.getTime(), inicioSemana.getTime());
  const hasta = Math.min(
    periodo.egresoAt?.getTime() ?? finSemana.getTime(),
    finSemana.getTime()
  );
  if (hasta <= desde) {
    return null;
  }
  return { ingresoAt: new Date(desde), egresoAt: new Date(hasta) };
}

export function generarReporteSemanal(
  periodos: PeriodoReporte[],
  inicioSemana: Date,
  finSemana: Date
): ReporteSemanal {
  const porObra: Record<string, Record<string, number>> = {};

  for (const periodo of periodos) {
    const recorte = interseccion(periodo, inicioSemana, finSemana);
    if (!recorte) {
      continue;
    }
    const horas = calcularHoras(recorte.ingresoAt, recorte.egresoAt);
    const porEmpleado = (porObra[periodo.obraId] ??= {});
    porEmpleado[periodo.empleadoId] =
      Math.round(((porEmpleado[periodo.empleadoId] ?? 0) + horas) * 100) / 100;
  }

  return { inicioSemana, finSemana, porObra };
}
