import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Sign Up - Pythia Conversations",
  description: "Create your Pythia account to start collaborating with your team",
};

export default function RegisterPage() {
  return <RegisterForm />;
} 