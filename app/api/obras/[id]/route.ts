import { requireAdmin } from "@/lib/services/current-user";
import {
  deactivateObra,
  updateObra,
  type ObraEstado,
  type UpdateObraInput,
} from "@/lib/db/obras";

const ESTADOS_VALIDOS: ObraEstado[] = ["ACTIVA", "PAUSADA", "FINALIZADA"];

interface ObraBody {
  nombre?: unknown;
  descripcion?: unknown;
  estado?: unknown;
  activo?: unknown;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;

  let body: ObraBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const input: UpdateObraInput = {};
  if (typeof body.nombre === "string") {
    input.nombre = body.nombre.trim();
  }
  if (typeof body.descripcion === "string") {
    input.descripcion = body.descripcion.trim();
  }
  if (typeof body.estado === "string" && ESTADOS_VALIDOS.includes(body.estado as ObraEstado)) {
    input.estado = body.estado as ObraEstado;
  }
  if (typeof body.activo === "boolean") {
    input.activo = body.activo;
  }

  const obra = await updateObra(id, input);
  if (!obra) {
    return Response.json({ error: "Obra no encontrada" }, { status: 404 });
  }

  return Response.json({ obra });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;

  const obra = await deactivateObra(id);
  if (!obra) {
    return Response.json({ error: "Obra no encontrada" }, { status: 404 });
  }

  return Response.json({ obra });
}
