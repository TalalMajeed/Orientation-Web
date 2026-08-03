import { redirect } from "next/navigation";

// The scanner moved to the Socials portal. Keep /scan as a permanent alias so
// old links (and the previous login landing) still work.
export default function ScanPage() {
  redirect("/socials");
}
