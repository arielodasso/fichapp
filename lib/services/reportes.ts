import {
  finDeSemana,
  formatearFechaLocal,
  generarReporteSemanal,
  inicioDeSemana,
} from "@/lib/domain/reportes";
import { listPeriodosEntre } from "@/lib/db/fichadas";
import { listEmpleados } from "@/lib/db/empleados";
import { listObras } from "@/lib/db/obras";

export interface FilaEmpleadoReporte {
  empleadoId: string;
  nombre: string;
  apellido: string;
  horas: number;
}

export interface FilaObraReporte {
  obraId: string;
  obraNombre: string;
  empleados: FilaEmpleadoReporte[];
}

export interface ReporteSemanalDTO {
  inicioSemana: string;
  finSemana: string;
  porObra: FilaObraReporte[];
}

export async function getReporteSemanal(
  fechaBase: Date
): Promise<ReporteSemanalDTO> {
  const inicio = inicioDeSemana(fechaBase);
  const fin = finDeSemana(inicio);

  const [periodos, obras, empleados] = await Promise.all([
    listPeriodosEntre(inicio, fin),
    listObras(),
    listEmpleados(),
  ]);

  const reporte = generarReporteSemanal(
    periodos.map((p) => ({
      id: p.id,
      empleadoId: p.empleadoId,
      obraId: p.obraId,
      ingresoAt: p.ingresoAt,
      egresoAt: p.egresoAt,
    })),
    inicio,
    fin
  );

  const obraNombre = new Map(obras.map((o) => [o.id, o.nombre]));
  const empleadoInfo = new Map(
    empleados.map((e) => [e.id, { nombre: e.nombre, apellido: e.apellido }])
  );

  const porObra: FilaObraReporte[] = Object.entries(reporte.porObra)
    .map(([obraId, porEmpleado]) => ({
      obraId,
      obraNombre: obraNombre.get(obraId) ?? "Desconocida",
      empleados: Object.entries(porEmpleado)
        .map(([empleadoId, horas]) => {
          const info =
            empleadoInfo.get(empleadoId) ?? { nombre: "Desconocido", apellido: "" };
          return {
            empleadoId,
            nombre: info.nombre,
            apellido: info.apellido,
            horas,
          };
        })
        .sort(
          (a, b) =>
            a.apellido.localeCompare(b.apellido) ||
            a.nombre.localeCompare(b.nombre)
        ),
    }))
    .sort((a, b) => a.obraNombre.localeCompare(b.obraNombre));

  return {
    inicioSemana: formatearFechaLocal(inicio),
    finSemana: formatearFechaLocal(fin),
    porObra,
  };
}
