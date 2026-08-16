import { redirect } from "next/navigation";

export default function LiaisonLoginPage() {
  redirect("/login?next=/liaison");
}
