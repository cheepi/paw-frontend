"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthDivider } from "@/components/auth/auth-divider";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RegisterPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			const response = await fetch(`${API_URL}/api/auth/register`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, email, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Registrasi gagal. Silakan coba lagi.");
			}

			// LOGIC FALLBACK OTP
			if (data.requiresOTP) {
				localStorage.setItem("temp_auth_email", email);
				if (data.demoOtp) {
					localStorage.setItem("temp_auth_demo_otp", data.demoOtp);
				} else {
					localStorage.removeItem("temp_auth_demo_otp");
				}
				router.push("/otp?flow=registration");
			} else {
				setError("Terjadi kesalahan alur registrasi. Silakan coba lagi.");
			}
		} catch (err: any) {
			setError(err.message || "Registrasi gagal. Silakan coba lagi.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSignUp = () => {
		setIsLoading(true);
		window.location.href = `${API_URL}/api/auth/google`;
	};

	const isFormValid = name && email && password;

	return (
		<AuthLayout>
			<AuthHeader title="Create Account" />

			<form onSubmit={handleRegister} className="flex flex-col gap-[10px]">
				{/* Input Full Name */}
				<div>
					<label className="text-sm font-semibold text-white/80 block mb-2">
						Full Name
					</label>
					<div className="relative">
						<User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
						<input
							type="text"
							placeholder="Enter your name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all placeholder-white/40 text-white"
							required
						/>
					</div>
				</div>

				{/* Input Email */}
				<div>
					<label className="text-sm font-semibold text-white/80 block mb-2">
						Email Address
					</label>
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

				{/* Input Password */}
				<div>
					<label className="text-sm font-semibold text-white/80 block mb-2">
						Password
					</label>
					<div className="relative">
						<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
						<input
							type={showPassword ? "text" : "password"}
							placeholder="Enter your password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full pl-10 pr-10 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all placeholder-white/40 text-white"
							required
							minLength={6}
						/>
						{/* toggle show/hide password */}
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute inset-y-0 right-0 px-3 flex items-center text-white/60"
						>
							{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
						</button>
					</div>
				</div>

				{/* Error message */}
				{error && (
					<p className="text-center text-red-400 text-sm">{error}</p>
				)}

				<Button
					type="submit"
					disabled={isLoading || !isFormValid}
					className="w-full mt-10 bg-gradient-to-r from-blue-500 via-cyan-400 hover:from-blue-600 hover:via-cyan-500 text-white font-bold py-3 px-8 text-lg rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isLoading ? "Creating account..." : "Create Account"}
				</Button>
			</form>

			<AuthDivider />

			<GoogleButton
				disabled={isLoading}
				onClick={handleGoogleSignUp}
				isLoading={isLoading}
			/>

			<p className="text-center text-sm text-white/70 mt-6">
				Already have an account?{" "}
				<a
					href="/sign-in"
					className="text-white font-semibold hover:text-white/80 transition-colors"
				>
					Sign In
				</a>
			</p>
		</AuthLayout>
	);
}
