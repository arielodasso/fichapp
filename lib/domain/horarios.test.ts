import { describe, expect, it } from "vitest";
import {
  EgresoAnteriorAIngresoError,
  PeriodoActivoExistenteError,
  SinPeriodoActivoError,
  calcularHoras,
  validarEgreso,
  validarIngreso,
  type PeriodoActivo,
} from "./horarios";

const periodoActivo: PeriodoActivo = {
  id: "p-1",
  empleadoId: "e-1",
  obraId: "o-1",
  ingresoAt: new Date("2026-08-03T08:00:00Z"),
};

describe("horarios: validación de ingreso (doble fichada)", () => {
  it("permite el ingreso cuando no hay período abierto", () => {
    expect(() => validarIngreso(null)).not.toThrow();
  });

  it("rechaza el ingreso cuando ya existe un período abierto", () => {
    expect(() => validarIngreso(periodoActivo)).toThrow(
      PeriodoActivoExistenteError
    );
  });
});

describe("horarios: validación de egreso", () => {
  it("permite el egreso cuando hay período abierto", () => {
    expect(() => validarEgreso(periodoActivo)).not.toThrow();
  });

  it("rechaza el egreso sin período abierto", () => {
    expect(() => validarEgreso(null)).toThrow(SinPeriodoActivoError);
  });
});

describe("horarios: cálculo de horas en UTC", () => {
  it("calcula horas de un período completo", () => {
    const horas = calcularHoras(
      new Date("2026-08-03T08:00:00Z"),
      new Date("2026-08-03T17:30:00Z")
    );
    expect(horas).toBe(9.5);
  });

  it("calcula períodos que cruzan la medianoche", () => {
    const horas = calcularHoras(
      new Date("2026-08-03T22:00:00Z"),
      new Date("2026-08-04T02:15:00Z")
    );
    expect(horas).toBe(4.25);
  });

  it("devuelve 0 horas si ingreso y egreso son iguales", () => {
    const momento = new Date("2026-08-03T08:00:00Z");
    expect(calcularHoras(momento, momento)).toBe(0);
  });

  it("rechaza un egreso anterior al ingreso", () => {
    expect(() =>
      calcularHoras(
        new Date("2026-08-03T17:00:00Z"),
        new Date("2026-08-03T08:00:00Z")
      )
    ).toThrow(EgresoAnteriorAIngresoError);
  });
});
