import { redirect } from "next/navigation";

// Root page redirects to dashboard (which has auth protection)
export default function Home() {
  redirect("/dashboard");
}
