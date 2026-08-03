import { requireAdmin } from "@/lib/services/current-user";
import { createEmpleado, listEmpleados } from "@/lib/db/empleados";

interface EmpleadoBody {
  nombre?: unknown;
  apellido?: unknown;
  documento?: unknown;
  rol?: unknown;
  userId?: unknown;
}

export async function GET(request: Request) {
  await requireAdmin();

  const url = new URL(request.url);
  const activos = url.searchParams.get("activos");
  const soloActivos =
    activos === "true" ? true : activos === "false" ? false : undefined;

  const empleados = await listEmpleados({ soloActivos });
  return Response.json({ empleados });
}

export async function POST(request: Request) {
  await requireAdmin();

  let body: EmpleadoBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const apellido =
    typeof body.apellido === "string" ? body.apellido.trim() : "";
  const documento =
    typeof body.documento === "string" ? body.documento.trim() : "";
  const rol = typeof body.rol === "string" ? body.rol.trim() : "OBRERO";
  const userId =
    typeof body.userId === "string" && body.userId.length > 0 ? body.userId : null;

  if (!nombre || !apellido || !documento) {
    return Response.json(
      { error: "Nombre, apellido y documento son obligatorios" },
      { status: 400 }
    );
  }

  const empleado = await createEmpleado({
    nombre,
    apellido,
    documento,
    rol,
    userId,
  });

  return Response.json({ empleado }, { status: 201 });
}
