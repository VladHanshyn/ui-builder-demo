"use client";

// Redirect to home page (Agent is now at root)
import { redirect } from "next/navigation";

export default function AgentRoute() {
  redirect("/");
}
