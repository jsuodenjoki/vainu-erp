"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { EnvelopeIcon } from "@heroicons/react/24/outline";

function ResendVerificationContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setSent(true);
      else setError("Jotain meni pieleen. Yritä uudelleen.");
    } catch {
      setError("Jotain meni pieleen. Yritä uudelleen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-br from-indigo-50 to-white py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center mb-8">
          <img src="/logo.png" alt="Vaiku" className="h-10 w-auto object-contain" />
        </Link>

        <div className="bg-white py-10 px-6 shadow-lg rounded-lg">
          {sent ? (
            <div className="text-center">
              <EnvelopeIcon className="h-14 w-14 text-indigo-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Vahvistusviesti lähetetty!</h2>
              <p className="text-gray-600 mb-6">
                Tarkista sähköpostisi. Linkki on voimassa 24 tuntia.
              </p>
              <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
                Takaisin kirjautumiseen
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Lähetä vahvistusviesti</h2>
              <p className="text-sm text-gray-600 mb-6 text-center">
                Syötä rekisteröimäsi sähköpostiosoite ja lähetämme sinulle uuden vahvistuslinkin.
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-md px-3 py-2 mb-4 text-center">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sähköposti</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? "Lähetetään..." : "Lähetä vahvistusviesti"}
                </button>
              </form>
              <p className="text-center text-sm text-gray-600 mt-4">
                <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                  Takaisin kirjautumiseen
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResendVerificationPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    }>
      <ResendVerificationContent />
    </Suspense>
  );
}
