import { requireAdmin } from "@/lib/services/current-user";
import { createObra, listObras, type ObraEstado } from "@/lib/db/obras";

const ESTADOS_VALIDOS: ObraEstado[] = ["ACTIVA", "PAUSADA", "FINALIZADA"];

interface ObraBody {
  nombre?: unknown;
  descripcion?: unknown;
  estado?: unknown;
}

export async function GET(request: Request) {
  const user = await requireAdmin();

  const url = new URL(request.url);
  const activas = url.searchParams.get("activas");
  const soloActivas =
    activas === "true" ? true : activas === "false" ? false : undefined;

  const obras = await listObras(user.id, { soloActivas });
  return Response.json({ obras });
}

export async function POST(request: Request) {
  const user = await requireAdmin();

  let body: ObraBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const descripcion =
    typeof body.descripcion === "string" ? body.descripcion.trim() : null;
  const estado: ObraEstado = ESTADOS_VALIDOS.includes(body.estado as ObraEstado)
    ? (body.estado as ObraEstado)
    : "ACTIVA";

  if (!nombre) {
    return Response.json(
      { error: "El nombre de la obra es obligatorio" },
      { status: 400 }
    );
  }

  const obra = await createObra(user.id, { nombre, descripcion, estado });

  return Response.json({ obra }, { status: 201 });
}
