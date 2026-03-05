import { redirect } from "next/navigation";

export default function ClubRedirect() {
  redirect("/dashboard/parent");
}
