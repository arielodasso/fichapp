import { hashPassword } from "./auth";
import {
  createUser,
  findUserByEmail,
  updateUser,
  type User,
} from "@/lib/db/users";

export const SUPERADMIN_EMAIL = "superadmin@fichapp.com";
export const SUPERADMIN_PASSWORD = "superadmin2026";
export const SUPERADMIN_NAME = "Superadmin";

export async function ensureSuperadminUser(): Promise<User> {
  let user = await findUserByEmail(SUPERADMIN_EMAIL);
  if (!user) {
    return createUser({
      email: SUPERADMIN_EMAIL,
      passwordHash: await hashPassword(SUPERADMIN_PASSWORD),
      name: SUPERADMIN_NAME,
      role: "SUPERADMIN",
    });
  }
  if (user.role !== "SUPERADMIN") {
    user = await updateUser(user.id, { name: SUPERADMIN_NAME, role: "SUPERADMIN" });
    if (!user) {
      throw new Error("No se pudo actualizar la cuenta de superadmin");
    }
  }
  return user;
}
