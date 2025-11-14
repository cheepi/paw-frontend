"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthHeader } from "@/components/auth/auth-header"
import { AuthDivider } from "@/components/auth/auth-divider"
import { GoogleButton } from "@/components/auth/google-button"
import { Button } from "@/components/ui/button"
import { Mail, Lock } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Login gagal. Periksa email atau password.")
      }

      if (data.demoOtp) {
        alert(`MODE DEMO (Email Gagal Terkirim):\nKode OTP Anda adalah: ${data.demoOtp}`);
      } else {
        alert("Login credentials verified. Please check your email.");
      }
      
      localStorage.setItem("loginEmail", email);
      router.push("/otp?flow=login");

    } catch (err: any) {
      setError(err.message || "Login gagal. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    setIsLoading(true)
    window.location.href = `${API_URL}/api/auth/google`
  }

  return (
    <AuthLayout>
      <AuthHeader title="Welcome Back" />

      <form onSubmit={handleLogin} className="flex flex-col gap-[10px]">
        <div>
          <label className="text-sm font-semibold text-white/80 block mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all placeholder-white/40 text-white"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-white/80 block mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all placeholder-white/40 text-white"
              required
            />
          </div>
        </div>

        {error && <p className="text-center text-red-400 text-sm">{error}</p>}

        <div className="text-right">
          <a href="/forgot-password" className="text-sm text-white hover:text-red-500 transition-colors">
            Forgot Password?
          </a>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !email || !password}
          className="w-full mt-10 bg-gradient-to-r from-blue-500 via-cyan-400 hover:from-blue-600 hover:via-cyan-500 text-white font-bold py-3 px-8 text-lg rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <AuthDivider />

      <GoogleButton disabled={isLoading} onClick={handleGoogleSignIn} isLoading={isLoading} />

      <p className="text-center text-sm text-white/70 mt-6">
        Don't have an account?{" "}
        <a href="/sign-up" className="text-white font-semibold hover:text-white/80 transition-colors">
          Create one
        </a>
      </p>
    </AuthLayout>
  )
}