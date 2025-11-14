"use client";

import { BookOpen, Home, Bell, Users } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Katalog Buku Digital",
    description: "Cari dan temukan koleksi buku terlengkap. Bayar deposit sekali dan dapatkan akses unlimited.",
  },
  {
    icon: Home,
    title: "Smart Room Booking",
    description: "Booking ruangan diskusi dengan mudah. Lihat ketersediaan real-time dan dominasi jadwal Anda.",
  },
  {
    icon: Bell,
    title: "Denda & Notifikasi",
    description: "Dapatkan notifikasi real-time untuk setiap update pengembalian buku dan informasi penting lainnya.",
  },
  {
    icon: Users,
    title: "Manajemen Anggota",
    description: "Kelola profil, riwayat peminjaman, dan interaksi dengan komunitas pengguna lainnya.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Fitur Unggulan Kami
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto px-2">
            Dibangun dengan teknologi modern untuk pengalaman perpustakaan yang seamless.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div 
                key={index}
                className="p-6 sm:p-8 bg-slate-50 rounded-xl border border-slate-100 hover:border-cyan-400 transition-all duration-300 hover:shadow-lg"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}