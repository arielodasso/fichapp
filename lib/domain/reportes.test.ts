import { describe, expect, it } from "vitest";
import {
  finDeSemana,
  generarReporteSemanal,
  inicioDeSemana,
  type PeriodoReporte,
} from "./reportes";

const lunes = new Date(2026, 7, 3);

function periodo(overrides: Partial<PeriodoReporte>): PeriodoReporte {
  return {
    id: "p",
    empleadoId: "e-1",
    obraId: "o-1",
    ingresoAt: new Date(2026, 7, 3, 8),
    egresoAt: new Date(2026, 7, 3, 17, 30),
    ...overrides,
  };
}

describe("reportes: límites de la semana (lunes a domingo)", () => {
  it("el inicio de semana de un miércoles cae en el lunes anterior", () => {
    const miercoles = new Date(2026, 7, 5, 15);
    expect(inicioDeSemana(miercoles)).toEqual(lunes);
  });

  it("el inicio de semana de un domingo cae en el lunes de esa semana", () => {
    const domingoNoche = new Date(2026, 7, 9, 23);
    expect(inicioDeSemana(domingoNoche)).toEqual(lunes);
  });

  it("el inicio de semana de un lunes es ese mismo lunes", () => {
    expect(inicioDeSemana(lunes)).toEqual(lunes);
  });

  it("el fin de semana es el lunes siguiente (exclusivo)", () => {
    const siguienteLunes = new Date(2026, 7, 10);
    expect(finDeSemana(lunes)).toEqual(siguienteLunes);
  });
});

describe("reportes: agrupación por obra y empleado", () => {
  it("agrupa horas por obra y por empleado", () => {
    const reporte = generarReporteSemanal(
      [
        periodo({
          id: "p-1",
          obraId: "o-1",
          empleadoId: "e-1",
          ingresoAt: new Date(2026, 7, 3, 8),
          egresoAt: new Date(2026, 7, 3, 17, 30),
        }),
        periodo({
          id: "p-2",
          obraId: "o-2",
          empleadoId: "e-1",
          ingresoAt: new Date(2026, 7, 4, 9),
          egresoAt: new Date(2026, 7, 4, 14),
        }),
      ],
      lunes,
      finDeSemana(lunes)
    );

    expect(reporte.porObra).toEqual({
      "o-1": { "e-1": 9.5 },
      "o-2": { "e-1": 5 },
    });
  });

  it("suma varios períodos del mismo empleado y obra", () => {
    const reporte = generarReporteSemanal(
      [
        periodo({ id: "p-1", ingresoAt: new Date(2026, 7, 3, 8), egresoAt: new Date(2026, 7, 3, 12) }),
        periodo({ id: "p-2", ingresoAt: new Date(2026, 7, 4, 8), egresoAt: new Date(2026, 7, 4, 12) }),
      ],
      lunes,
      finDeSemana(lunes)
    );

    expect(reporte.porObra["o-1"]["e-1"]).toBe(8);
  });

  it("separa horas de empleados distintos en la misma obra", () => {
    const reporte = generarReporteSemanal(
      [
        periodo({ id: "p-1", empleadoId: "e-1", ingresoAt: new Date(2026, 7, 3, 8), egresoAt: new Date(2026, 7, 3, 10) }),
        periodo({ id: "p-2", empleadoId: "e-2", ingresoAt: new Date(2026, 7, 3, 8), egresoAt: new Date(2026, 7, 3, 12) }),
      ],
      lunes,
      finDeSemana(lunes)
    );

    expect(reporte.porObra["o-1"]).toEqual({ "e-1": 2, "e-2": 4 });
  });
});

describe("reportes: recorte de períodos que cruzan la semana", () => {
  it("recorta un período que empieza antes del lunes", () => {
    const reporte = generarReporteSemanal(
      [
        periodo({
          id: "p-1",
          ingresoAt: new Date(2026, 7, 2, 22),
          egresoAt: new Date(2026, 7, 3, 2),
        }),
      ],
      lunes,
      finDeSemana(lunes)
    );

    expect(reporte.porObra["o-1"]["e-1"]).toBe(2);
  });

  it("recorta un período que termina después del domingo", () => {
    const reporte = generarReporteSemanal(
      [
        periodo({
          id: "p-1",
          ingresoAt: new Date(2026, 7, 9, 22),
          egresoAt: new Date(2026, 7, 10, 2),
        }),
      ],
      lunes,
      finDeSemana(lunes)
    );

    expect(reporte.porObra["o-1"]["e-1"]).toBe(2);
  });

  it("un período abierto (sin egreso) se corta al fin de semana", () => {
    const reporte = generarReporteSemanal(
      [periodo({ id: "p-1", egresoAt: null })],
      lunes,
      finDeSemana(lunes)
    );

    expect(reporte.porObra["o-1"]["e-1"]).toBe(160);
  });
});

describe("reportes: exclusión de períodos fuera de la semana", () => {
  it("ignora períodos anteriores a la semana", () => {
    const reporte = generarReporteSemanal(
      [
        periodo({
          id: "p-1",
          ingresoAt: new Date(2026, 7, 2, 8),
          egresoAt: new Date(2026, 7, 2, 17),
        }),
      ],
      lunes,
      finDeSemana(lunes)
    );

    expect(reporte.porObra).toEqual({});
  });

  it("ignora períodos posteriores a la semana", () => {
    const reporte = generarReporteSemanal(
      [
        periodo({
          id: "p-1",
          ingresoAt: new Date(2026, 7, 10, 8),
          egresoAt: new Date(2026, 7, 10, 17),
        }),
      ],
      lunes,
      finDeSemana(lunes)
    );

    expect(reporte.porObra).toEqual({});
  });

  it("un período largo que abarca dos semanas solo cuenta el recorte", () => {
    const reporte = generarReporteSemanal(
      [
        periodo({
          id: "p-1",
          ingresoAt: new Date(2026, 7, 3, 8),
          egresoAt: new Date(2026, 7, 12, 17),
        }),
      ],
      lunes,
      finDeSemana(lunes)
    );

    expect(reporte.porObra["o-1"]["e-1"]).toBe(160);

    const semanaSiguiente = finDeSemana(lunes);
    const reporte2 = generarReporteSemanal(
      [
        periodo({
          id: "p-1",
          ingresoAt: new Date(2026, 7, 3, 8),
          egresoAt: new Date(2026, 7, 12, 17),
        }),
      ],
      semanaSiguiente,
      finDeSemana(semanaSiguiente)
    );

    expect(reporte2.porObra["o-1"]["e-1"]).toBe(65);
  });
});
