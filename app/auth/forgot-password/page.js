"use client";

import { useState } from "react";
import Link from "next/link";
import { EnvelopeIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError("Syötä sähköpostiosoite."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError("Jokin meni pieleen. Yritä uudelleen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-br from-indigo-50 to-white py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center mb-6">
          <img src="/logo.png" alt="Vaiku" className="h-10 w-auto object-contain" />
        </Link>

        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-gray-100">
          {sent ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircleIcon className="h-12 w-12 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Linkki lähetetty!</h2>
              <p className="text-sm text-gray-500 mb-6">
                Jos sähköposti löytyy järjestelmästä, lähetimme sinulle salasanan vaihtolinkin.
                Tarkista myös roskapostikansio.
              </p>
              <Link
                href="/login"
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                ← Takaisin kirjautumiseen
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Unohditko salasanan?</h2>
              <p className="text-sm text-gray-500 mb-6">
                Syötä sähköpostiosoitteesi niin lähetämme sinulle salasanan vaihtolinkin.
              </p>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sähköposti
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="sinä@esimerkki.fi"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? "Lähetetään..." : "Lähetä vaihtoinkki"}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-gray-500">
                <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                  ← Takaisin kirjautumiseen
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
