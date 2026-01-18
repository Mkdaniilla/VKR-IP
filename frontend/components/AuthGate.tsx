// frontend/components/AuthGate.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { clearToken, getToken } from "@/lib/api";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}

export function LogoutBtn() {
  const router = useRouter();
  function onLogout() {
    clearToken();
    router.push("/login");
  }
  return (
    <button
      onClick={onLogout}
      className="text-sm underline text-gray-700 hover:text-black"
    >
      Выйти
    </button>
  );
}
