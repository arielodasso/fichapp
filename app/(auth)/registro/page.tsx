import { normalizarCodigo } from "@/lib/domain/invitaciones";
import { findInvitacionVigentePorCodigo } from "@/lib/db/invitaciones";
import { RegistroScreen } from "./registro-screen";

interface Props {
  searchParams: Promise<{ invitacion?: string }>;
}

export default async function RegistroPage({ searchParams }: Props) {
  const sp = await searchParams;
  const codigo = normalizarCodigo(sp.invitacion ?? "");
  const invitacion = codigo
    ? await findInvitacionVigentePorCodigo(codigo)
    : null;

  return (
    <RegistroScreen
      codigo={codigo}
      valida={!!invitacion}
      empleadoNombre={
        invitacion
          ? `${invitacion.empleadoNombre ?? ""} ${invitacion.empleadoApellido ?? ""}`.trim()
          : null
      }
      empleadoVinculado={invitacion?.empleadoVinculado ?? false}
    />
  );
}
