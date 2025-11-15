import { typography } from "@/styles/typography"
import { colors } from "@/styles/colors"
// import { Facebook, Twitter, Instagram } from "lucide-react"

export default function Footer() {
  return (
    <footer 
      className="py-12"
      style={{ backgroundColor: colors.textPrimary }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:justify-between gap-10 text-slate-300">
          
          {/* DIV 1: Logo & Deskripsi (Kiri) */}
          <div className="space-y-4 md:w-1/3 lg:w-2/5">
            <div className="flex items-center gap-3">
              <img src="/logo-warna.png" alt="Naratama" className="h-10 w-auto bg-white rounded-md p-1" />
              <span className={`${typography.h4} font-bold`} style={{ color: "white" }}>
                Digital Library
              </span>
            </div>
            <p 
              className={`${typography.bodySmall} mt-2`}
              style={{ color: colors.textTertiary }}
            >
              Sistem Perpustakaan Digital Modern. Jelajahi buku, pesan ruangan, dan tetap terupdate.
            </p>
          </div>

          {/* DIV 2: Navigasi & Sosmed (Kanan) */}
          <div className="flex flex-row flex-wrap gap-10 md:gap-16">
            
            {/* Navigasi  */}
            <div className="space-y-3 min-w-[120px]">
              <h4 className="font-semibold text-white uppercase tracking-wider text-sm mb-4">Navigasi</h4>
              <ul className="space-y-2">
                <li><a href="/books" className="hover:text-white transition-colors text-sm">Books</a></li>
                <li><a href="/rooms" className="hover:text-white transition-colors text-sm">Rooms</a></li>
                <li><a href="/announcements" className="hover:text-white transition-colors text-sm">Announcements</a></li>
                <li><a href="/loans" className="hover:text-white transition-colors text-sm">My Loans</a></li>
              </ul>
            </div>

            {/* Follow Us */}
            {/* <div className="space-y-3 min-w-[120px]">
              <h4 className="font-semibold text-white uppercase tracking-wider text-sm mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" aria-label="Facebook" className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors">
                  <Facebook className="w-4 h-4 text-white" />
                </a>
                <a href="#" aria-label="Twitter" className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors">
                  <Twitter className="w-4 h-4 text-white" />
                </a>
                <a href="#" aria-label="Instagram" className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors">
                  <Instagram className="w-4 h-4 text-white" />
                </a>
              </div>
            </div> */}
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