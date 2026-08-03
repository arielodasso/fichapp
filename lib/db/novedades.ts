import { pool } from "./client";

export interface Novedad {
  id: string;
  obraId: string;
  autorId: string;
  autorNombre: string;
  contenido: string;
  createdAt: Date;
}

export interface CreateNovedadInput {
  obraId: string;
  autorId: string;
  contenido: string;
}

interface NovedadRow {
  id: string;
  obra_id: string;
  autor_id: string;
  autor_nombre: string;
  contenido: string;
  created_at: Date;
}

function mapNovedad(row: NovedadRow): Novedad {
  return {
    id: row.id,
    obraId: row.obra_id,
    autorId: row.autor_id,
    autorNombre: row.autor_nombre,
    contenido: row.contenido,
    createdAt: row.created_at,
  };
}

export async function listNovedadesDeObra(obraId: string): Promise<Novedad[]> {
  const { rows } = await pool.query<NovedadRow>(
    `SELECT n.id,
            n.obra_id,
            n.autor_id,
            u.name AS autor_nombre,
            n.contenido,
            n.created_at
     FROM novedades_obra n
     JOIN users u ON u.id = n.autor_id
     WHERE n.obra_id = $1
     ORDER BY n.created_at DESC`,
    [obraId]
  );
  return rows.map(mapNovedad);
}

export async function createNovedad(
  input: CreateNovedadInput
): Promise<Novedad> {
  const { rows } = await pool.query<NovedadRow>(
    `INSERT INTO novedades_obra (obra_id, autor_id, contenido)
     VALUES ($1, $2, $3)
     RETURNING id,
               obra_id,
               autor_id,
               (SELECT name FROM users WHERE id = $2) AS autor_nombre,
               contenido,
               created_at`,
    [input.obraId, input.autorId, input.contenido]
  );
  return mapNovedad(rows[0]);
}

export async function findNovedadById(
  id: string
): Promise<Novedad | null> {
  const { rows } = await pool.query<NovedadRow>(
    `SELECT n.id,
            n.obra_id,
            n.autor_id,
            u.name AS autor_nombre,
            n.contenido,
            n.created_at
     FROM novedades_obra n
     JOIN users u ON u.id = n.autor_id
     WHERE n.id = $1`,
    [id]
  );
  return rows[0] ? mapNovedad(rows[0]) : null;
}

export async function deleteNovedad(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM novedades_obra WHERE id = $1`,
    [id]
  );
  return (rowCount ?? 0) > 0;
}
