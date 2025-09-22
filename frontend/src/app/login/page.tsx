"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "../../hooks/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(username, password); // mock auth
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow">
        <h1 className="mb-4 text-center text-2xl font-semibold">SafeTrack Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Username</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              className="w-full rounded-md border px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="w-full rounded-md border px-3 py-2 font-medium hover:bg-gray-50">
            Log in
          </button>
          <p className="text-xs text-gray-500">Placeholder only — real UWA SSO will replace this.</p>
        </form>
      </div>
    </div>
  );
}
