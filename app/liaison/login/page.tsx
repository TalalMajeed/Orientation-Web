import { redirect } from "next/navigation";

// The OG team signs in through the shared staff login with LIAISON_USERNAME /
// LIAISON_PASSWORD. Kept as a permanent alias so the old bookmark still works.
export default function LiaisonLoginPage() {
  redirect("/login?next=/liaison");
}
