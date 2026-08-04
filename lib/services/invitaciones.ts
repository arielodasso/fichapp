import {
  createInvitacion,
  findInvitacionPendientePorEmpleado,
} from "@/lib/db/invitaciones";
import {
  expiracionInvitacion,
  generarCodigoInvitacion,
} from "@/lib/domain/invitaciones";

export interface InvitacionGenerada {
  id: string;
  codigo: string;
  expiraEn: string;
  link: string;
}

export async function generarInvitacionEmpleado(
  empleadoId: string,
  creadoPor: string,
  origin: string
): Promise<InvitacionGenerada> {
  const pendiente = await findInvitacionPendientePorEmpleado(empleadoId);
  const invitacion =
    pendiente ??
    (await createInvitacion({
      empleadoId,
      creadoPor,
      codigo: generarCodigoInvitacion(),
      expiraEn: expiracionInvitacion(new Date()),
    }));
  return {
    id: invitacion.id,
    codigo: invitacion.codigo,
    expiraEn: invitacion.expiraEn?.toISOString() ?? new Date().toISOString(),
    link: `${origin}/registro?invitacion=${invitacion.codigo}`,
  };
}
