import { countAdmins } from "@/lib/db/users";
import { LoginScreen } from "./login-screen";

export default async function LoginPage() {
  const admins = await countAdmins();
  return <LoginScreen registroAbierto={admins === 0} />;
}
