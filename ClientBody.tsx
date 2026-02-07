"use client";

import { useEffect } from "react";
import { UserProvider } from "@/components/UserContext";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.body.className = "antialiased";
  }, []);

  return (
    <UserProvider>
      <div className="antialiased">{children}</div>
    </UserProvider>
  );
}
