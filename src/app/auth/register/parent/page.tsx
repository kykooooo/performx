import type { Metadata } from "next";
import RegisterParentPage from "./register-parent-client";

export const metadata: Metadata = {
  title: "Inscription Parent",
  description: "Crée ton compte parent PerformX pour suivre la progression de ton enfant.",
};

export default function Page() {
  return <RegisterParentPage />;
}
