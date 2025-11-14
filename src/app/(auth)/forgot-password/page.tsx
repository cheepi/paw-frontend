"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthHeader } from "@/components/auth/auth-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const endpoint = `${API_URL}/api/auth/forgot-password` 

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset link.")
      }
      
      setEmailSent(true)

    } catch (err: any) {
      setError(err.message || "Failed to connect to the server.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push("/sign-in")
  }

  const handleResendEmail = () => {
    setEmailSent(false)
    setError(null)
  }

  return (
    <AuthLayout>
      {!emailSent ? (
        <>
          <AuthHeader title="Forgot Password" />
          {/* <p className="text-center text-white/60 text-sm mb-4">
              Enter your email to reset your password</p> */}

          <div className="space-y-4">

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-2 uppercase tracking-wider">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-white/[0.05] border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all duration-200 font-medium backdrop-blur-sm"
              />
            </div>

            <div className="mt-4 mb-8">
              <p className="text-xs text-white/60 text-center">
                We'll send you an email with instructions to reset your password.
              </p>
            </div>

            {/* Tampilkan Error */}
            {error && (
              <p className="text-center text-red-400 text-sm mt-10">{error}</p>
            )}

            <div>
              <form onSubmit={handleSubmit}>
                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full mt-10 bg-gradient-to-r from-blue-500 via-cyan-400 hover:from-blue-600 hover:via-cyan-500 text-white font-bold py-3 px-8 text-lg rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </div>

            <p className="text-center text-sm text-white/70 font-medium">
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => router.push("/sign-in")}
                className="text-white font-semibold hover:text-white/80 transition-colors bg-transparent border-none cursor-pointer"
              >
                Sign in
              </button>
            </p>
          </div>
        </>
      ) : (
        <>
          <AuthHeader title="Check Your Email" />

          <p className="text-center text-white/60 text-sm mb-4">
            Password reset link sent successfully
          </p>

          <div className="space-y-4">

            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-500/20 border border-green-500/40 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div className="text-center space-y-2 mb-6">
              <p className="text-white/80">We've sent a password reset link to</p>
              <p className="font-semibold text-white">{email}</p>
              <p className="text-xs text-white/60">
                Check your email and follow the instructions to reset your password. The link will expire in 24 hours.
              </p>
            </div>

            <Button
              onClick={handleBackToLogin}
              className="w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-green-500 hover:from-blue-600 hover:via-cyan-500 hover:to-green-600 text-white font-bold py-3 rounded-lg transition-all duration-200 active:scale-95 text-base"
            >
              Back to Sign In Page
            </Button>

            <p className="text-center text-sm text-white/70 font-medium">
              Didn't receive the email?{" "}
              <button
                onClick={handleResendEmail}
                className="text-white font-semibold hover:text-white/80 transition-colors bg-transparent border-none cursor-pointer"
              >
                Try again
              </button>
            </p>

          </div>
        </>
      )}
    </AuthLayout>
  )
}
