import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FichApp · Fichero de Empleados y Obras",
    short_name: "FichApp",
    description:
      "Registro de ingreso/egreso y reporte semanal de horas por obra",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0f0c",
    theme_color: "#059669",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
