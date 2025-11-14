"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthHeader } from "@/components/auth/auth-header"
import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { setAuthToken } from "@/lib/auth"
// import { useSelector, useDispatch } from "react-redux"
// import { RootState } from "@/lib/store/store"
// import { clearTempEmail } from "@/lib/store/authSlice"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function OtpClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const flow = searchParams.get("flow") || "register"

  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")

  const [email, setEmail] = useState("")
  const emailStorageKey = flow === "login" ? "loginEmail" : "registrationEmail"

  useEffect(() => {
    const storedEmail = localStorage.getItem(emailStorageKey)
    if (storedEmail) {
      setEmail(storedEmail)
    } else {
      setError("Sesi tidak ditemukan. Silakan kembali ke halaman utama.")
    }
  }, [flow, emailStorageKey])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!email) {
      setError("Email tidak ditemukan.")
      setIsLoading(false)
      return
    }

    const endpoint =
      flow === "login"
        ? `${API_URL}/api/auth/verify-login-otp`
        : `${API_URL}/api/auth/verify-registration-otp`

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Kode OTP tidak valid")

      setAuthToken(data.token)
      localStorage.removeItem(emailStorageKey); // <-- PAKE INI
      // dispatch(clearTempEmail()) // HAPUS

      alert("Verifikasi berhasil!")
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Verifikasi gagal. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    setError("")

    if (!email) {
        setError("Email tidak ditemukan.")
        setIsResending(false)
        return
    }

    const endpoint =
      flow === "login"
        ? `${API_URL}/api/auth/resend-login-otp`
        : `${API_URL}/api/auth/resend-registration-otp`

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Gagal mengirim ulang kode")

      // ALERT FALLBACK DEMOOTP 
      if (data.demoOtp) {
          alert(`MODE DEMO (Email Gagal Terkirim):\nKode OTP BARU Anda adalah: ${data.demoOtp}`);
      } else {
          alert("Kode OTP baru telah 'dikirim'.");
      }

    } catch (err: any) {
      setError(err.message || "Gagal mengirim ulang kode.")
    } finally {
      setIsResending(false)
    }
  }

  const headerTitle = flow === "login" ? "Login Verification" : "Email Verification"

  return (
    <AuthLayout>
      <AuthHeader title={headerTitle} />

      {email && (
        <p className="text-center text-white/60 text-sm mb-4">
          We sent a 6-digit code to{" "}
          <span className="text-white font-semibold">{email}</span>
        </p>
      )}

      {error && !email ? (
        <div className="space-y-4 text-center">
          <p className="text-red-400">{error}</p>
          <Button onClick={() => router.push("/sign-in")} className="w-full">
            Kembali
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup className="gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    // --- BALIKIN STYLING YANG BENER ---
                    className="h-12 w-12 border border-white/20 bg-white/[0.05] rounded-lg text-lg font-semibold text-white 
                              placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400/50 
                              focus:border-blue-400 focus:bg-white/[0.08] transition-all duration-200 
                              backdrop-blur-sm text-center"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && <p className="text-center text-red-400 text-sm">{error}</p>}

          <form onSubmit={handleVerify}>
            <Button
              type="submit"
              disabled={isLoading || otp.length !== 6 || !email}
              className="w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-green-500 hover:from-blue-600 hover:via-cyan-500 hover:to-green-600 text-white font-bold py-3 rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={handleResend}
              disabled={isResending || !email}
              className="text-white font-semibold hover:text-white/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? "Resending..." : "Resend OTP"}
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}