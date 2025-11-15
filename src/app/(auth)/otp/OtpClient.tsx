"use client";

import { useState, useEffect, useRef, forwardRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthHeader } from "@/components/auth/auth-header";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { setAuthToken } from "@/lib/auth";

// InputOTPSlot
export interface InputOTPSlotProps {
  value: string;
  onChange: (val: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onPaste?: React.ClipboardEventHandler<HTMLInputElement>;
  className?: string;
  index?: number;
}

export const InputOTPSlot = forwardRef<HTMLInputElement, InputOTPSlotProps>(
  ({ value, onChange, onKeyDown, onPaste, className }, ref) => (
    <input
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      className={className}
    />
  )
);
InputOTPSlot.displayName = "InputOTPSlot";

// OtpClient Component
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function OtpClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flow = searchParams.get("flow") || "registration";

  const [otp, setOtp] = useState(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempEmail, setTempEmail] = useState<string | null>(null);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const storedEmail = localStorage.getItem("temp_auth_email");
    const storedDemoOtp = localStorage.getItem("temp_auth_demo_otp");

    if (storedEmail) setTempEmail(storedEmail);
    else setError("Sesi tidak ditemukan. Silakan kembali ke halaman sebelumnya.");

    if (storedDemoOtp) {
      setDemoOtp(storedDemoOtp);
      setOtp(storedDemoOtp.split(""));
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
      else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    else if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const otpArray = pastedData.split("").filter((char) => /^\d$/.test(char));
    const newOtp = [...otp];
    otpArray.forEach((char, index) => { if (index < 6) newOtp[index] = char });
    setOtp(newOtp);
    const lastIndex = Math.min(otpArray.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleVerify = async () => {
    setIsLoading(true);
    setError("");

    if (!tempEmail) {
      setError("Email tidak ditemukan.");
      setIsLoading(false);
      return;
    }

    const otpCode = otp.join("");
    const endpoint =
      flow === "login"
        ? `${API_URL}/api/auth/verify-login-otp`
        : `${API_URL}/api/auth/verify-registration-otp`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: tempEmail, otp: otpCode }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Kode OTP tidak valid");

      setAuthToken(data.token);
      localStorage.removeItem("temp_auth_email");
      localStorage.removeItem("temp_auth_demo_otp");
      alert("Verifikasi berhasil!");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Verifikasi gagal. Silakan coba lagi.");
    } finally { setIsLoading(false); }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError("");

    if (!tempEmail) {
      setError("Email tidak ditemukan untuk kirim ulang.");
      setIsResending(false);
      return;
    }

    const resendEndpoint =
      flow === "login"
        ? `${API_URL}/api/auth/resend-login-otp`
        : `${API_URL}/api/auth/resend-registration-otp`;

    try {
      const response = await fetch(resendEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: tempEmail }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal mengirim ulang OTP");

      if (data.demoOtp) {
        localStorage.setItem("temp_auth_demo_otp", data.demoOtp);
        setDemoOtp(data.demoOtp);
        setOtp(data.demoOtp.split(""));
        alert(`[DEV MODE] OTP Baru: ${data.demoOtp}`);
      } else alert("OTP baru telah dikirim!");
    } catch (err: any) {
      setError(err.message || "Gagal mengirim ulang OTP. Silakan coba lagi.");
    } finally { setIsResending(false); }
  };

  const title = flow === "login" ? "Verifikasi Login" : "Verifikasi Akun";
  const description = `Kami telah mengirimkan kode 6 digit ke ${tempEmail || "email Anda"}.`;

  return (
    <AuthLayout>
      <AuthHeader title={title} />
      <p className="text-center text-sm text-white/70 -mt-4 mb-6">{description}</p>

      {!tempEmail ? (
        <div className="text-center text-red-400 p-4 bg-red-900/50 rounded-lg">
          {error || "Sesi tidak ditemukan."}
          <Button onClick={() => router.push("/sign-in")} className="w-full mt-4 bg-white text-slate-900 hover:bg-slate-200">
            Kembali ke Sign In
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {demoOtp && (
            <div className="text-center text-yellow-300 p-3 bg-yellow-900/50 rounded-lg text-sm space-y-1">
              <p className="font-semibold">[DEV MODE AKTIF]</p>
              <p>OTP: <strong className="text-lg tracking-widest">{demoOtp}</strong></p>
            </div>
          )}

          <div className="flex justify-center gap-3">
            {otp.map((_, index) => (
              <InputOTPSlot
                key={index}
                index={index}
                ref={(el: HTMLInputElement | null) => { inputRefs.current[index] = el }}
                value={otp[index]}
                onChange={(val) => handleChange(index, val)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="h-12 w-12 border border-white/20 bg-white/[0.05] rounded-lg text-lg font-semibold text-white
                           placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400/50
                           focus:border-blue-400 focus:bg-white/[0.08] transition-all duration-200
                           backdrop-blur-sm text-center"
              />
            ))}
          </div>

          {error && <p className="text-center text-red-400 text-sm">{error}</p>}

          <Button
            onClick={handleVerify}
            disabled={isLoading || otp.join("").length < 6 || !tempEmail}
            className="w-full mt-10 bg-gradient-to-r from-blue-500 via-cyan-400 hover:from-blue-600 hover:via-cyan-500 text-white font-bold py-3 px-8 text-lg rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Verify Code"}
          </Button>

          <div className="text-center mt-4">
            <button
              onClick={handleResend}
              disabled={isResending || !tempEmail}
              className="text-white font-semibold hover:text-white/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? "Mengirim ulang..." : "Resend OTP"}
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
