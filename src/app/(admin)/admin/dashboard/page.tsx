"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
// import Image from "next/image";
import { getAuthToken } from "@/lib/auth";
import { 
  Loader2, Users, Book, Box, 
  DoorOpen, Hourglass, AlarmClock, Send, CalendarCheck
} from "lucide-react";
import type { Loan, Room, Booking } from "@/types"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface AdminStats {
  users: number;
  books: number;
  loans: number;
  availableRooms: number;
  pendingBookings: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [allLoans, setAllLoans] = useState<Loan[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllStats = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        const [usersRes, booksRes, loansRes, roomsRes, bookingsRes] = await Promise.all([
          fetch(`${API_URL}/api/users`, {
            headers: { "Authorization": `Bearer ${token}` }
          }),
          fetch(`${API_URL}/api/books?`, {
             headers: { "Authorization": `Bearer ${token}` }
          }), 
          fetch(`${API_URL}/api/loans`, { 
            headers: { "Authorization": `Bearer ${token}` }
          }),
          fetch(`${API_URL}/api/rooms`, {
            headers: { "Authorization": `Bearer ${token}` }
          }),
          fetch(`${API_URL}/api/rooms/bookings/list`, {
            headers: { "Authorization": `Bearer ${token}` }
          })
        ]);

        const usersData = await usersRes.json();
        const booksData = await booksRes.json();
        const loansData: Loan[] = await loansRes.json();
        const roomsData: Room[] = await roomsRes.json();
        const bookingsData: Booking[] = await bookingsRes.json();

        const availableRoomsCount = roomsData.filter(room => room.status === 'available').length;
        const pendingBookingsCount = bookingsData.filter(b => b.status === 'pending_payment').length;

        setStats({
          users: (usersData || []).length,
          books: (booksData.total || (booksData.data || []).length),
          loans: (loansData || []).length,
          availableRooms: availableRoomsCount,
          pendingBookings: pendingBookingsCount,
        });

        setAllLoans(loansData || []);

      } catch (err) {
        console.error("Gagal fetch admin stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto w-full">
      {/* Header
      <div className="flex items-center gap-3 mb-8">
        <Image
          src="/logo(min).png"
          alt="Naratama Logo"
          width={40}
          height={40}
          className="object-contain"
        />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div> */}
      
      {/* Stats Grid */}
      {isLoading ? (
        <div className="flex items-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="ml-3 font-medium text-slate-700">Loading stats...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <Link href="/admin/users">
            <StatCard 
              title="Total Users" 
              value={stats?.users?.toString() ?? '...'} 
              icon={<Users className="w-6 h-6 text-blue-500" />}
            />
          </Link>
          <Link href="/admin/books">
            <StatCard 
              title="Total Books" 
              value={stats?.books?.toString() ?? '...'} 
              icon={<Book className="w-6 h-6 text-green-500" />} 
            />
          </Link>
          <Link href="/admin/loans">
            <StatCard 
              title="Total Loans" 
              value={stats?.loans?.toString() ?? '...'} 
              icon={<Box className="w-6 h-6 text-indigo-500" />} 
            />
          </Link>
          <Link href="/admin/rooms">
            <StatCard 
              title="Available Rooms" 
              value={stats?.availableRooms?.toString() ?? '...'} 
              icon={<DoorOpen className="w-6 h-6 text-cyan-500" />} 
            />
          </Link>
          <Link href="/admin/bookings">
            <StatCard 
              title="Pending Bookings" 
              value={stats?.pendingBookings?.toString() ?? '...'} 
              icon={<Hourglass className="w-6 h-6 text-amber-500" />} 
            />
          </Link>
        </div>
      )}

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <UpcomingDueDatesPanel loans={allLoans} />
        </div>
        <div className="lg:col-span-1">
          <QuickAnnouncementPanel />
        </div>
      </div>
    </div>
  );
}


function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-5 rounded-lg border shadow-sm flex flex-col justify-between 
                    h-32 transition-all hover:shadow-lg hover:border-blue-400 cursor-pointer">
      {/* Div atas: Title */}
      <div className="text-sm font-medium text-slate-500 mb-2">
        {title}
      </div>
      {/* Div bawah: Icon & Value */}
      <div className="flex items-center justify-between">
        <div className="bg-slate-100 p-3 rounded-full flex-shrink-0"> {/* Ikon */}
          {icon}
        </div>
        <div className="text-4xl font-bold text-slate-900 ml-4"> {/* Value */}
          {value}
        </div>
      </div>
    </div>
  );
}

// Panel: Upcoming Due Dates 
function UpcomingDueDatesPanel({ loans }: { loans: Loan[] }) {
  const upcomingLoans = useMemo(() => {
    // Filter out loans that don't have a valid dueDate
    return loans
      .filter(loan => 
        loan.status === 'borrowed' && 
        loan.dueDate && 
        !isNaN(new Date(loan.dueDate).getTime()) // Pastiin tanggalnya valid
      ) 
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [loans]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date"; // Fallback jika tanggal tidak valid
      }
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return "Invalid Date"; // Fallback jika ada error parsing
    }
  };

  const isOverdue = (dueDateString: string) => {
    if (!dueDateString || isNaN(new Date(dueDateString).getTime())) return false; // Not overdue if date is invalid
    return new Date(dueDateString).getTime() < Date.now();
  };

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm h-full">
      <h3 className="text-xl font-bold text-slate-900 mb-4">Upcoming Due Dates</h3>
      {upcomingLoans.length > 0 ? (
        <ul className="space-y-3">
          {upcomingLoans.map(loan => (
            <li 
              key={loan._id || loan.id} 
              className={`flex justify-between items-center p-3 rounded-lg border 
                          ${isOverdue(loan.dueDate) ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}
            >
              <div>
                <p className="font-semibold">{loan.book.title}</p>
                <p className="text-sm text-slate-500">
                  oleh {loan.book.author}
                </p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className={`font-semibold flex items-center gap-1.5 ${isOverdue(loan.dueDate) ? 'text-red-700' : 'text-slate-600'}`}>
                  {isOverdue(loan.dueDate) ? <CalendarCheck className="w-4 h-4" /> : <AlarmClock className="w-4 h-4" />}
                  {formatDate(loan.dueDate)}
                </p>
                <p className="text-sm text-slate-500">{loan.user.email}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-slate-500">Tidak ada pinjaman aktif yang akan jatuh tempo.</p>
      )}
    </div>
  );
}

// Panel: Quick Announcement (BIARIN AJA)
function QuickAnnouncementPanel() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const token = getAuthToken();

    try {
      const res = await fetch(`${API_URL}/api/announcements`, { 
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: title, 
          message: message
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Gagal mengirim pengumuman.");
      }

      setSuccess("Pengumuman berhasil dikirim ke semua user!");
      setTitle("");
      setMessage("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm h-full">
      <h3 className="text-xl font-bold text-slate-900 mb-4">Quick Announcement</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Judul Pengumuman</label>
          <Input 
            name="title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
            placeholder="Misal: Perpus Tutup"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Isi Pesan</label>
          <textarea 
            name="message" 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            required 
            rows={4}
            placeholder="Isi pengumumannya..."
            className="w-full h-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <Button type="submit" variant="primary" className="w-full !mt-6 !py-3 flex items-center gap-2" disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {loading ? "Mengirim..." : "Kirim ke Semua User"}
        </Button>
      </form>
    </div>
  );
}