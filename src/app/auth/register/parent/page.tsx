import type { Metadata } from "next";
import dynamic from "next/dynamic";

const RegisterParentPage = dynamic(() => import("./register-parent-client"), {
  loading: () => <div className="px-container py-10"><div className="px-skeleton h-[500px]" /></div>,
});

export const metadata: Metadata = {
  title: "Inscription Parent",
  description: "Crée ton compte parent PerformX pour suivre la progression de ton enfant.",
};

export default function Page() {
  return <RegisterParentPage />;
}
