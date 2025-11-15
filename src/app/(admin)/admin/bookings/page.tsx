"use client";

import { useEffect, useState, useMemo } from "react";
import { getAuthToken } from "@/lib/auth";
import { Loader2, XCircle, CheckCircle, Hourglass, Search, Filter } from "lucide-react";
import type { Booking } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const statusConfig = {
  confirmed: { color: 'text-emerald-800', icon: CheckCircle, label: 'Confirmed' },
  pending_payment: { color: 'text-amber-800', icon: Hourglass, label: 'Pending Payment' },
  cancelled: { color: 'text-red-800', icon: XCircle, label: 'Cancelled' },
  completed: { color: 'text-slate-600', icon: CheckCircle, label: 'Completed' },
};

const filterOptions = [
  { label: "All", value: "all" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Pending Payment", value: "pending_payment" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Completed", value: "completed" },
];

const checkIfCompleted = (booking: Booking): boolean => {
    if (booking.status !== 'confirmed') return false;
    
    const bookingEndDateTime = new Date(booking.date);
    const [hours, minutes] = booking.endTime.split(':').map(Number);
    bookingEndDateTime.setHours(hours, minutes, 0, 0);

    return new Date().getTime() > bookingEndDateTime.getTime();
};

export default function ManageBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const token = getAuthToken();

  async function fetchBookings() {
    setIsLoading(true);
    const res = await fetch(`${API_URL}/api/rooms/bookings/list`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setBookings(data || []);
    } else {
      setBookings([]);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    if (token) {
      fetchBookings();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Yakin mau cancel booking user ini?")) return;
    
    await fetch(`${API_URL}/api/rooms/bookings/${bookingId}/cancel`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` }
    });
    fetchBookings(); 
  };

  const filteredBookings = useMemo(() => {
    return bookings
      .map(b => ({
          ...b,
          displayStatus: checkIfCompleted(b) ? 'completed' : b.status,
      }))
      .filter(b => {
        const statusFilter = (b as any).displayStatus as string;
        if (filter === 'all') return true;
        return statusFilter === filter;
      })
      .filter(b => {
        const query = search.toLowerCase();
        if (!query) return true;
        return (
          (b.room?.name || '').toLowerCase().includes(query) ||
          (b.user?.email || '').toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bookings, filter, search]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }
  
  const formatDate = (date: string | Date | undefined | null) => { 
    if (!date) return 'N/A';
    try {
        return new Date(date).toLocaleDateString('id-ID'); 
    } catch {
        return 'Invalid Date';
    }
  };

  const currentFilterLabel = filterOptions.find(opt => opt.value === filter)?.label || "Filter";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Bookings</h1>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-4">
        {/* Search Bar */}
        <div className="relative flex-1 sm:flex-none sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 flex-shrink-0" />
          <Input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Cari ruangan atau email..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border transition-all focus:outline-none focus:ring-2 text-sm"
          />
        </div>
        
        {/* PILL GROUP (Desktop) */}
        <div className="hidden sm:flex gap-2 flex-shrink-0">
          {filterOptions.map(option => ( 
            <Button
              key={option.value}
              variant={filter === option.value ? 'primary' : 'secondary'}
              onClick={() => setFilter(option.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                filter === option.value
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              } capitalize`}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* DROPDOWN (Mobile) */}
        <div className="sm:hidden w-full">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="w-full justify-center px-3 py-2.5 rounded-md text-sm font-semibold flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span>Filter: {currentFilterLabel}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[calc(100vw-2rem)]">
              <DropdownMenuRadioGroup value={filter} onValueChange={setFilter}>
                {filterOptions.map(option => (
                  <DropdownMenuRadioItem key={option.value} value={option.value} className="capitalize">
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left p-4 font-semibold">Ruangan</th>
                <th className="text-left p-4 font-semibold">User (Email)</th>
                <th className="text-left p-4 font-semibold">Tanggal</th>
                <th className="text-left p-4 font-semibold">Waktu</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => {
                  const displayStatus = (booking as any).displayStatus as keyof typeof statusConfig;
                  const statusInfo = statusConfig[displayStatus] || statusConfig.cancelled;
                  
                  const isCancellable = (booking.status === 'pending_payment' || booking.status === 'confirmed') && displayStatus !== 'completed';

                  return (
                    <tr key={booking._id || booking.id} className="border-b hover:bg-slate-50">
                      <td className="p-4 align-top">{booking.room?.name || 'Ruangan Dihapus'}</td>
                      <td className="p-4 align-top text-sm">{booking.user?.email || 'User Dihapus'}</td>
                      <td className="p-4 align-top">{formatDate(booking.date)}</td>
                      <td className="p-4 align-top">{booking.startTime} - {booking.endTime}</td>
                      <td className="p-4 align-top">
                        <span className={`flex items-center gap-1.5 text-xs font-semibold ${statusInfo.color}`}>
                          <statusInfo.icon className="w-4 h-4" />
                          {statusInfo.label}
                        </span>
                        {booking.status === 'cancelled' && booking.cancelledAt && (
                             <span className="text-xs text-red-400 block mt-1">
                                (Canceled on {formatDate(booking.cancelledAt)}) 
                            </span>
                        )}
                      </td>
                      <td className="p-4 align-top">
                        {isCancellable && (
                          <Button 
                            onClick={() => handleCancel(booking._id || booking.id)} 
                            variant="danger" 
                            className="p-1 h-auto"
                            title="Cancel Booking"
                          >
                            <XCircle className="w-5 h-5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-slate-500">
                    Tidak ada data booking yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}