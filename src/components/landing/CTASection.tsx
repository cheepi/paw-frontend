"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-900 to-slate-800">
      <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
          Siap Membaca dan Berdiskusi?
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-white/70 max-w-2xl mx-auto">
          Bergabungan dengan ribuan mahasiswa lain yang sudah merasakan kemudahan perpustakaan digital Naratama
        </p>
        
        <Button asChild className="inline-block w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-bold py-3 sm:py-4 px-6 sm:px-10 rounded-lg transition-all duration-200">
          <Link href="/sign-up">
            Daftar Akun Sekarang
          </Link>
        </Button>
      </div>
    </section>
  )
}