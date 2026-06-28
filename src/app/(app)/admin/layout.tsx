import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Guard da area administrativa: so usuarios com role "admin" entram. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/dashboard");
  return <>{children}</>;
}
