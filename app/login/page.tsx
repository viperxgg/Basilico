import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getInternalHomePath, getServerSession } from "@/lib/auth/server";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession();
  const { next } = await searchParams;
  const nextPath =
    typeof next === "string" && next.startsWith("/") ? next : "/portal";

  if (session) {
    redirect(getInternalHomePath(session));
  }

  return <LoginForm nextPath={nextPath} />;
}
