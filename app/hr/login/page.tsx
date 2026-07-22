import { redirect } from "next/navigation";

export default function HrLoginPage() {
  redirect("/login?next=/hr");
}
