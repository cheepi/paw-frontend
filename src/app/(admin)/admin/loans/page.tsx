"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getAuthToken } from "@/lib/auth";
import { Loader2, CheckCircle, Clock, RotateCcw, Search, Filter, X } from "lucide-react";
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
import { colors } from "@/styles/colors";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const statusConfig = {
  borrowed: { color: colors.warning, icon: Clock, label: "Borrowed" },
  returned: { color: colors.success, icon: CheckCircle, label: "Returned" },
  late: { color: colors.danger, icon: CheckCircle, label: "LATE (Fine)" },
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

const getBorrowDate = (loan: Loan): Date => {
  try {
    if (loan.borrowDate) {
      const d = new Date(loan.borrowDate as any);
      if (!isNaN(d.getTime())) return d;
    }
    const calc = calculateBorrowedAt((loan as any).dueDate);
    if (calc) return calc;
  } catch {}
  return new Date(0);
};

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
  }, [token]);

  const handleReturn = async (loanId: string) => {
    if (!confirm("Yakin mau 'Force Return' buku ini?")) return;
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/loans/${loanId}/return`, { method: "POST", headers });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "return failed");
      }
      await fetchLoans();
      alert("Return berhasil diproses");
    } catch (err: any) {
      console.error("handleReturn error:", err);
      alert(err?.message || "Gagal memproses return");
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setFilter("all");
  };

  const hasActiveFilters = filter !== "all" || search !== "";

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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
          Manage Loans
        </h1>
      </div>

      {/* Search + Filters */}
      <div className="py-6 space-y-4 mb-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
          {/* Search bar */}
          <div className="relative flex-1 min-w-0 sm:flex-auto">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 flex-shrink-0" 
              style={{ color: colors.textSecondary }}
            />
            <Input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Cari buku atau email user..." 
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-lg border transition-all focus:outline-none focus:ring-2 text-sm"
              style={{
                backgroundColor: colors.bgPrimary,
                color: colors.textPrimary,
                borderColor: colors.bgTertiary,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.bgTertiary;
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Filter buttons desktop */}
          <div className="hidden sm:flex gap-2 flex-shrink-0">
            {filterOptions.map((opt) => (
              <Button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className="px-3 py-1.5 rounded-md text-sm font-semibold transition-colors capitalize"
                style={{
                  backgroundColor: filter === opt.value ? colors.primary : colors.bgSecondary,
                  color: filter === opt.value ? "white" : colors.textPrimary,
                  borderColor: filter === opt.value ? colors.primary : colors.bgTertiary,
                  borderWidth: "1px",
                }}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          {/* Filter dropdown mobile */}
          <div className="sm:hidden w-full">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  className="w-full justify-center px-3 py-2.5 rounded-md text-sm font-semibold flex items-center gap-2 transition-all"
                  style={{
                    backgroundColor: colors.bgPrimary,
                    color: colors.textSecondary,
                    borderColor: colors.bgTertiary,
                    borderWidth: "1px",
                  }}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filter: {filterOptions.find((f) => f.value === filter)?.label || "All"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-[calc(100vw-2rem)]"
                style={{
                  backgroundColor: colors.bgPrimary,
                  borderColor: colors.bgTertiary,
                }}
              >
                <DropdownMenuRadioGroup value={filter} onValueChange={(v) => setFilter(v)}>
                  {filterOptions.map((opt) => (
                    <DropdownMenuRadioItem 
                      key={opt.value} 
                      value={opt.value} 
                      className="capitalize"
                      style={{ color: colors.textPrimary }}
                    >
                      {opt.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Clear button */}
          {hasActiveFilters && (
            <Button
              onClick={handleClearFilters}
              className="px-3 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap transition-all text-sm"
              style={{
                backgroundColor: colors.bgPrimary,
                color: colors.danger,
                border: `1px solid ${colors.danger}40`,
              }}
            >
              <X className="w-5 h-5 flex-shrink-0" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div 
        className="rounded-lg border shadow-sm overflow-hidden"
        style={{
          backgroundColor: colors.bgPrimary,
          borderColor: colors.bgTertiary,
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead 
              className="border-b"
              style={{
                backgroundColor: colors.bgSecondary,
                borderColor: colors.bgTertiary,
              }}
            >
              <tr>
                <th 
                  className="text-left p-4 font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Buku
                </th>
                <th 
                  className="text-left p-4 font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  User (Email)
                </th>
                <th 
                  className="text-left p-4 font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Tanggal Pinjam
                </th>
                <th 
                  className="text-left p-4 font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Jatuh Tempo
                </th>
                <th 
                  className="text-left p-4 font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Status
                </th>
                <th 
                  className="text-left p-4 font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Actions
                </th>
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
                    <tr 
                      key={loan._id || loan.id} 
                      className="border-b transition-colors hover:opacity-80"
                      style={{
                        borderColor: colors.bgTertiary,
                        backgroundColor: colors.bgPrimary,
                      }}
                    >
                      <td 
                        className="p-4 align-top"
                        style={{ color: colors.textPrimary }}
                      >
                        {loan.book?.title || "Buku dihapus"}
                      </td>
                      <td 
                        className="p-4 align-top text-sm"
                        style={{ color: colors.textPrimary }}
                      >
                        {loan.user?.email || "User dihapus"}
                      </td>
                      <td 
                        className="p-4 align-top"
                        style={{ color: colors.textPrimary }}
                      >
                        {formatDate(borrowedDate)}
                      </td>
                      <td 
                        className="p-4 align-top"
                        style={{ color: isLate ? colors.danger : colors.textPrimary, fontWeight: isLate ? "bold" : "normal" }}
                      >
                        {formatDate((loan as any).dueDate)}
                        {isLate && (loan as any).fineAmount ? (
                          <span className="text-xs block" style={{ color: colors.danger }}>
                            (Denda: Rp {(loan as any).fineAmount.toLocaleString("id-ID")})
                          </span>
                        ) : null}
                      </td>
                      <td className="p-4 align-top">
                        <span 
                          className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: statusInfo.color }}
                        >
                          <StatusIcon className="w-4 h-4" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-4 align-top">
                        {isCancellable && (
                          <button 
                            onClick={() => handleReturn(loan._id || loan.id)} 
                            className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                            style={{
                              backgroundColor: `${colors.info}15`,
                              color: colors.info,
                            }}
                            title="Force Return"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td 
                    colSpan={6} 
                    className="text-center p-8"
                    style={{ color: colors.textSecondary }}
                  >
                    Tidak ada data pinjaman yang cocok.
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
