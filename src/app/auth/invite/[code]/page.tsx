import type { Metadata } from "next";
import InviteClient from "./invite-client";

export const metadata: Metadata = {
  title: "Invitation parent · PerformX",
  description: "Accepte l'invitation de ton parent pour lier vos comptes.",
};

export default function InvitePage() {
  return <InviteClient />;
}
