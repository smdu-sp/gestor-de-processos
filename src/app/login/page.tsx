import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { passwordlessDevelopment } from "@/lib/auth-mode";
export default async function Login() {
  if (await currentUser()) redirect("/");
  return <LoginForm passwordOptional={passwordlessDevelopment()} />;
}
