"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div className="text-center">
        <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Virheellinen linkki</h2>
        <p className="text-sm text-gray-500 mb-6">Salasanan vaihtolinkki puuttuu tai on virheellinen.</p>
        <Link href="/auth/forgot-password" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
          Pyydä uusi linkki
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Salasanan täytyy olla vähintään 8 merkkiä.");
      return;
    }
    if (password !== confirm) {
      setError("Salasanat eivät täsmää.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "invalid-or-expired") {
          setError("Linkki on vanhentunut tai virheellinen. Pyydä uusi linkki.");
        } else if (data.error === "password-too-short") {
          setError("Salasanan täytyy olla vähintään 8 merkkiä.");
        } else {
          setError("Jokin meni pieleen. Yritä uudelleen.");
        }
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Jokin meni pieleen. Yritä uudelleen.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Salasana vaihdettu!</h2>
        <p className="text-sm text-gray-500 mb-6">
          Salasanasi on vaihdettu onnistuneesti. Sinut ohjataan kirjautumissivulle...
        </p>
        <Link href="/login" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
          Kirjaudu sisään →
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Vaihda salasana</h2>
      <p className="text-sm text-gray-500 mb-6">
        Syötä uusi salasana. Vähintään 8 merkkiä.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Uusi salasana</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Vähintään 8 merkkiä"
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vahvista salasana</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Toista salasana"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "Vaihdetaan..." : "Vaihda salasana"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        Linkki vanhentunut?{" "}
        <Link href="/auth/forgot-password" className="text-indigo-600 hover:text-indigo-500 font-medium">
          Pyydä uusi
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-br from-indigo-50 to-white py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center mb-6">
          <img src="/logo.png" alt="Vaiku" className="h-10 w-auto object-contain" />
        </Link>
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-gray-100">
          <Suspense fallback={<div className="text-center text-sm text-gray-400">Ladataan...</div>}>
            <ResetPasswordContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
