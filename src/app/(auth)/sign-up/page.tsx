"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { AuthHeader } from "@/components/auth/auth-header"
import { AuthDivider } from "@/components/auth/auth-divider"
import { GoogleButton } from "@/components/auth/google-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Phone, Mail, Lock, CheckCircle } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function RegisterPage() {
  const [username, setUsername] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("") 
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    setIsLoading(true)
    setError("") 

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: username, 
          phone: phone, 
          email: email,
          password: password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Registrasi gagal. Silakan coba lagi.")
      }

      if (data.demoOtp) {
        alert(`MODE DEMO (Email Gagal Terkirim):\nKode OTP Anda adalah: ${data.demoOtp}`);
      } else {
        alert("Registration initiated. Please check your email.");
      }
      
      localStorage.setItem("registrationEmail", email);
      router.push("/otp?flow=register");

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = () => {
    setIsLoading(true)
    window.location.href = `${API_URL}/api/auth/google`
  }

  const isFormValid = username && phone && email && password && confirmPassword && password === confirmPassword

  return (
    <AuthLayout>
      <AuthHeader title="Create Account" />

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-white/80 mb-2 uppercase tracking-wider">Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              type="text"
              placeholder="Your full name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all placeholder-white/40 text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/80 mb-2 uppercase tracking-wider">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              type="tel"
              placeholder="Your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all placeholder-white/40 text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/80 mb-2 uppercase tracking-wider">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all placeholder-white/40 text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/80 mb-2 uppercase tracking-wider">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all placeholder-white/40 text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/80 mb-2 uppercase tracking-wider">Confirm Password</label>
          <div className="relative">
            <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`w-full pl-10 pr-4 py-2 bg-white/10 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder-white/40 text-white ${
                confirmPassword && password !== confirmPassword 
                  ? "border-red-500 focus:ring-red-400" 
                  : "border-white/20 focus:ring-cyan-400"
              }`}
            />
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
          )}
        </div>

        {error && (
          <p className="text-center text-red-400 text-sm">{error}</p>
        )}

        <form onSubmit={handleRegister}>
          <Button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="w-full mt-10 bg-gradient-to-r from-blue-500 via-cyan-400 hover:from-blue-600 hover:via-cyan-500 text-white font-bold py-3 px-8 text-lg rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing..." : "Create Account"}
          </Button>
        </form>

        <AuthDivider />

        <GoogleButton 
          disabled={isLoading} 
          onClick={handleGoogleSignUp} 
          isLoading={isLoading} 
        />

        <p className="text-center text-sm text-white/70 font-medium">
          Already have an account?{" "}
          <a href="/sign-in" className="text-white font-semibold hover:text-white/80 transition-colors">
            Sign in
          </a>
        </p>
      </div>
    </AuthLayout>
  )
}