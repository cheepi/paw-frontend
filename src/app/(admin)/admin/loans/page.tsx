"use client";

import { useEffect, useState, useMemo } from "react";
import { getAuthToken } from "@/lib/auth";
import { Loader2, CheckCircle, Clock, RotateCcw, Search, Filter } from "lucide-react";
import type { Loan } from "@/types";
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
  borrowed: { color: "text-cyan-800", icon: Clock, label: "Borrowed" },
  returned: { color: "text-green-800", icon: CheckCircle, label: "Returned" },
  late: { color: "text-red-800", icon: CheckCircle /* icon fallback */, label: "LATE (Fine)" },
};

const filterOptions = [
  { label: "All", value: "all" },
  { label: "Borrowed", value: "borrowed" },
  { label: "Returned", value: "returned" },
  { label: "Late", value: "late" },
];

const calculateBorrowedAt = (dueDateString?: string | null): Date | null => {
  if (!dueDateString) return null;
  try {
    const due = new Date(dueDateString as any);
    if (isNaN(due.getTime())) return null;
    return new Date(due.getTime() - 7 * 24 * 60 * 60 * 1000);
  } catch {
    return null;
  }
};

// helper: kembalikan date objek yang valid buat sorting/tampilan
const getBorrowDate = (loan: Loan): Date => {
  try {
    if (loan.borrowDate) {
      const d = new Date(loan.borrowDate as any);
      if (!isNaN(d.getTime())) return d;
    }
    const calc = calculateBorrowedAt((loan as any).dueDate);
    if (calc) return calc;
  } catch {}
  // fallback paling tua supaya muncul paling bawah saat sort desc
  return new Date(0);
};

// safe formatter tanggal
const formatDate = (input?: string | Date | null) => {
  if (!input) return "N/A";
  try {
    const d = new Date(input as any);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "N/A";
  }
};

export default function ManageLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const token = getAuthToken();

  async function fetchLoans() {
    setIsLoading(true);
    try {
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/loans`, { headers });
      if (!res.ok) {
        setLoans([]);
        return;
      }
      const data = await res.json();
      // accept either array or { data: [] }
      const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setLoans(arr);
    } catch (err) {
      setLoans([]);
      console.error("fetchLoans error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) fetchLoans();
    else setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleReturn = async (loanId: string) => {
    if (!confirm("yakin mau 'force return' buku ini?")) return;
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/loans/${loanId}/return`, { method: "POST", headers });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "return failed");
      }
      // refresh
      await fetchLoans();
      alert("return processed");
    } catch (err: any) {
      console.error("handleReturn error:", err);
      alert(err?.message || "failed to process return");
    }
  };

  // filtered + sorted (pakai fallback borrowedDate kalau backend ga ngirim borrowDate)
  const filteredLoans = useMemo(() => {
    const q = search.toLowerCase().trim();
    return loans
      .filter((l) => {
        if (filter === "all") return true;
        return l.status === filter;
      })
      .filter((l) => {
        if (!q) return true;
        return (
          (l.book?.title || "").toLowerCase().includes(q) ||
          (l.user?.email || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => getBorrowDate(b).getTime() - getBorrowDate(a).getTime());
  }, [loans, filter, search]);

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Loans</h1>
      </div>

      {/* search + filters */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-4">
        <div className="relative flex-1 sm:flex-none sm:w-64">
          <Search className="absolute z-0 left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama buku atau email user..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border transition-all focus:outline-none focus:ring-2 text-sm"
          />
        </div>

        {/* pill group desktop */}
        <div className="hidden sm:flex gap-2 flex-shrink-0">
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={filter === opt.value ? "primary" : "secondary"}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                filter === opt.value ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
              } capitalize`}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {/* dropdown mobile */}
        <div className="sm:hidden w-full">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="w-full justify-center px-3 py-2.5 rounded-md text-sm font-semibold flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span>Filter: {filterOptions.find((f) => f.value === filter)?.label || "all"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[calc(100vw-2rem)]">
              <DropdownMenuRadioGroup value={filter} onValueChange={(v) => setFilter(v)}>
                {filterOptions.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value} className="capitalize">
                    {opt.label}
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
                <th className="text-left p-4 font-semibold">Buku</th>
                <th className="text-left p-4 font-semibold">User (E-mail)</th>
                <th className="text-left p-4 font-semibold">Tanggal Pinjam</th>
                <th className="text-left p-4 font-semibold">Jatuh Tempo</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => {
                  const loanStatus = (loan.status as keyof typeof statusConfig) || "borrowed";
                  const statusInfo = statusConfig[loanStatus] ?? statusConfig.borrowed;
                  const StatusIcon = statusInfo.icon;
                  const isLate = loan.status === "late";
                  const isReturned = loan.status === "returned";
                  const isCancellable = !isReturned;

                  const borrowedDate = loan.borrowDate ? new Date(loan.borrowDate as any) : calculateBorrowedAt((loan as any).dueDate);

                  return (
                    <tr key={loan._id || loan.id} className="border-b hover:bg-slate-50">
                      <td className="p-4 align-top">{loan.book?.title || "buku dihapus"}</td>
                      <td className="p-4 align-top text-sm">{loan.user?.email || "user dihapus"}</td>
                      <td className="p-4 align-top">{formatDate(borrowedDate)}</td>
                      <td className={`p-4 align-top ${isLate ? "text-red-600 font-bold" : ""}`}>
                        {formatDate((loan as any).dueDate)}
                        {isLate && (loan as any).fineAmount ? (
                          <span className="text-xs block">(denda: rp {(loan as any).fineAmount.toLocaleString("id-ID")})</span>
                        ) : null}
                      </td>
                      <td className="p-4 align-top">
                        <span className={`flex items-center gap-1.5 text-xs font-semibold ${statusInfo.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-4 align-top">
                        {isCancellable && (
                          <button onClick={() => handleReturn(loan._id || loan.id)} className="text-blue-600 hover:text-blue-800" title="force return">
                            <RotateCcw className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-slate-500">
                    tidak ada data pinjaman yang cocok.
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
