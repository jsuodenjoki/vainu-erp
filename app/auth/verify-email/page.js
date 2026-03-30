"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading"); // loading | success | error | expired

  useEffect(() => {
    if (!token) { setStatus("error"); return; }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setStatus("success");
        else if (data.error === "invalid-or-expired") setStatus("expired");
        else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-br from-indigo-50 to-white py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center mb-8">
          <img src="/logo.png" alt="Vaiku" className="h-10 w-auto object-contain" />
        </Link>

        <div className="bg-white py-10 px-6 shadow-lg rounded-lg text-center">
          {status === "loading" && (
            <>
              <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Vahvistetaan sähköpostia...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircleIcon className="h-14 w-14 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Sähköposti vahvistettu!</h2>
              <p className="text-gray-600 mb-6">Tilisi on nyt aktiivinen. Voit kirjautua sisään.</p>
              <Link href="/login"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                Kirjaudu sisään
              </Link>
            </>
          )}

          {status === "expired" && (
            <>
              <XCircleIcon className="h-14 w-14 text-orange-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Linkki on vanhentunut</h2>
              <p className="text-gray-600 mb-6">Vahvistuslinkki on vanhentunut tai käytetty. Pyydä uusi.</p>
              <Link href="/auth/resend-verification"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                Lähetä uusi vahvistusviesti
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <XCircleIcon className="h-14 w-14 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Vahvistus epäonnistui</h2>
              <p className="text-gray-600 mb-6">Jotain meni pieleen. Yritä uudelleen tai ota yhteyttä tukeen.</p>
              <Link href="/auth/resend-verification"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                Lähetä uusi vahvistusviesti
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
