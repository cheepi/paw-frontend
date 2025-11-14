import { typography } from "@/styles/typography"
import { colors } from "@/styles/colors"
import { Facebook, Twitter, Instagram } from "lucide-react"

export default function PublicFooter() {
  return (
    <footer 
      className="py-12"
      style={{ backgroundColor: colors.textPrimary }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:justify-between gap-10 text-slate-300">
          
          {/* DIV 1: Logo & Deskripsi */}
          <div className="space-y-4 md:w-1/3 lg:w-2/5">
            <div className="flex items-center gap-3">
              <img src="/logo-warna.png" alt="Naratama" className="h-12 w-auto p-1" />
              <span className={`${typography.h4} font-bold`} style={{ color: "white" }}>
                Digital Library
              </span>
            </div>
            <p 
              className={`${typography.bodySmall} mt-2`}
              style={{ color: colors.textTertiary }}
            >
              Sistem Perpustakaan Digital Modern. Pinjam buku, booking ruangan, dan dapatkan notifikasi.
            </p>
          </div>

          {/* DIV 2: Links and Socials */}
          <div className="flex flex-col sm:flex-row gap-10 md:gap-16">
            
            {/* Navigasi */}
            <div className="space-y-3">
              <h4 className="font-semibold text-white uppercase tracking-wider text-sm mb-4">Mulai Akses</h4>
              <ul className="space-y-2">
                <li><a href="/sign-in" className="hover:text-white transition-colors text-sm">Sign In</a></li>
                <li><a href="/sign-up" className="hover:text-white transition-colors text-sm">Create Account</a></li>
              </ul>
            </div>
          </div>
          
        </div>

        {/* Copyright */}
        <div className="max-w-7xl mx-auto mt-10 pt-8 border-t border-slate-700 text-center">
          <p 
            className={`${typography.bodySmall}`}
            style={{ color: colors.textTertiary }}
          >
            © 2025 Naratama Digital Library. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}