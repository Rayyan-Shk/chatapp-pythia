import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In - Pythia Conversations",
  description: "Sign in to your Pythia account to access team conversations",
};

export default function LoginPage() {
  return <LoginForm />;
} 