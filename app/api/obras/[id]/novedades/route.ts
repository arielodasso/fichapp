import { requireUser } from "@/lib/services/current-user";
import { isValidUUID } from "@/lib/utils";
import { findObraById } from "@/lib/db/obras";
import {
  createNovedad,
  listNovedadesDeObra,
} from "@/lib/db/novedades";

const MAX_CONTENIDO = 500;

interface NovedadBody {
  contenido?: unknown;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireUser();
  const { id } = await params;
  if (!isValidUUID(id)) {
    return Response.json({ error: "Id de obra inválido" }, { status: 400 });
  }

  const obra = await findObraById(id);
  if (!obra) {
    return Response.json({ error: "Obra no encontrada" }, { status: 404 });
  }

  const novedades = await listNovedadesDeObra(id);
  return Response.json({
    novedades: novedades.map((n) => ({
      id: n.id,
      obraId: n.obraId,
      autorId: n.autorId,
      autorNombre: n.autorNombre,
      contenido: n.contenido,
      createdAt: n.createdAt,
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await params;
  if (!isValidUUID(id)) {
    return Response.json({ error: "Id de obra inválido" }, { status: 400 });
  }

  const obra = await findObraById(id);
  if (!obra) {
    return Response.json({ error: "Obra no encontrada" }, { status: 404 });
  }

  let body: NovedadBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const contenido = typeof body.contenido === "string" ? body.contenido.trim() : "";
  if (!contenido) {
    return Response.json(
      { error: "La novedad no puede estar vacía" },
      { status: 400 }
    );
  }
  if (contenido.length > MAX_CONTENIDO) {
    return Response.json(
      { error: `La novedad no puede superar los ${MAX_CONTENIDO} caracteres` },
      { status: 400 }
    );
  }

  const novedad = await createNovedad({
    obraId: id,
    autorId: user.id,
    contenido,
  });

  return Response.json(
    {
      novedad: {
        id: novedad.id,
        obraId: novedad.obraId,
        autorId: novedad.autorId,
        autorNombre: novedad.autorNombre,
        contenido: novedad.contenido,
        createdAt: novedad.createdAt,
      },
    },
    { status: 201 }
  );
}
