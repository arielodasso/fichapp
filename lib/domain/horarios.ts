export const MS_POR_HORA = 3_600_000;

export class PeriodoActivoExistenteError extends Error {
  constructor() {
    super("El empleado ya tiene un período de trabajo abierto");
    this.name = "PeriodoActivoExistenteError";
  }
}

export class SinPeriodoActivoError extends Error {
  constructor() {
    super("El empleado no tiene un período de trabajo abierto");
    this.name = "SinPeriodoActivoError";
  }
}

export class EgresoAnteriorAIngresoError extends Error {
  constructor() {
    super("El egreso no puede ser anterior al ingreso");
    this.name = "EgresoAnteriorAIngresoError";
  }
}

export interface PeriodoActivo {
  id: string;
  empleadoId: string;
  obraId: string;
  ingresoAt: Date;
}

export function validarIngreso(periodoActivo: PeriodoActivo | null): void {
  if (periodoActivo) {
    throw new PeriodoActivoExistenteError();
  }
}

export function validarEgreso(
  periodoActivo: PeriodoActivo | null
): asserts periodoActivo is PeriodoActivo {
  if (!periodoActivo) {
    throw new SinPeriodoActivoError();
  }
}

export function calcularHoras(ingresoAt: Date, egresoAt: Date): number {
  const inicio = ingresoAt.getTime();
  const fin = egresoAt.getTime();
  if (Number.isNaN(inicio) || Number.isNaN(fin)) {
    throw new Error("Fechas inválidas");
  }
  if (fin < inicio) {
    throw new EgresoAnteriorAIngresoError();
  }
  const horas = (fin - inicio) / MS_POR_HORA;
  return Math.round(horas * 100) / 100;
}
