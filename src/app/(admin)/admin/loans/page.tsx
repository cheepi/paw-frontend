// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuRadioGroup,
//   DropdownMenuRadioItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";const filterOptions = [
//   { label: "All", value: "all" },
//   { label: "Borrowed", value: "borrowed" },
//   { label: "Returned", value: "returned" },
//   { label: "Late", value: "late" },
// ];
"use client";

import { useEffect, useState, useMemo } from "react";
import { getAuthToken } from "@/lib/auth";
import { Loader2, CheckCircle, Clock, RotateCcw, Search, Filter, X } from "lucide-react";
import type { Loan } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { colors } from "@/styles/colors";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const statusConfig = {
  borrowed: { color: colors.warning, icon: Clock, label: "Borrowed" },
  returned: { color: colors.success, icon: CheckCircle, label: "Returned" },
  late: { color: colors.danger, icon: CheckCircle, label: "LATE (Fine)" },
};

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
  const [showFilters, setShowFilters] = useState(false);

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
    
    // Cari loan data dulu untuk dapetin book ID
    const loan = loans.find(l => (l._id || l.id) === loanId);
    if (!loan) {
      alert("Loan data tidak ditemukan");
      return;
    }

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      // 1. Process return
      const res = await fetch(`${API_URL}/api/loans/${loanId}/return`, { 
        method: "POST", 
        headers 
      });
      
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "return failed");
      }

      const bookId = loan.book?.id || (loan.book as any)?._id;
      if (bookId) {
        try {
          // Ambil data buku dulu
          const bookResponse = await fetch(`${API_URL}/api/books/${bookId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (bookResponse.ok) {
            const bookData = await bookResponse.json();
            const currentBook = bookData.data || bookData;
            const currentStock = currentBook.stock || 0;
            
            // Update stock +1
            await fetch(`${API_URL}/api/books/${bookId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                ...currentBook,
                stock: currentStock + 1
              })
            });
            
            console.log(`✅ Stock updated: ${currentStock} → ${currentStock + 1}`);
          }
        } catch (stockErr) {
          console.error("⚠️ Failed to update stock:", stockErr);
          // Jangan throw error, biar return tetap sukses
        }
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
        // const currentFilterLabel = filterOptions.find(opt => opt.value === filter)?.label || "Filter";

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

  // const currentFilterLabel = filterOptions.find(opt => opt.value === filter)?.label || "Filter";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
          Manage Loans
        </h1>
      </div>

      {/* Filter Bar - Mobile/Tablet Optimized */}
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
              placeholder="Cari buku atau email..." 
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-lg border transition-all focus:outline-none focus:ring-2 text-sm"
              style={{
                backgroundColor: colors.bgPrimary,
                color: colors.textPrimary,
                borderColor: colors.bgTertiary,
              }}
              onFocus={(e: any) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
              }}
              onBlur={(e: any) => {
                e.currentTarget.style.borderColor = colors.bgTertiary;
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Filter button */}
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 sm:px-4 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap text-sm"
            style={{
              backgroundColor: showFilters ? colors.primary : colors.bgPrimary,
              color: showFilters ? "white" : colors.textSecondary,
              border: `1px solid ${showFilters ? colors.primary : colors.bgTertiary}`,
              minHeight: "42px",
              padding: "10px 12px",
            }}
          >
            <Filter className="w-5 h-5 flex-shrink-0" />
            <span className="hidden sm:inline">Filters</span>
          </Button>

          {/* Clear button */}
          {hasActiveFilters && (
            <Button
              onClick={handleClearFilters}
              className="px-3 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap transition-all text-sm"
              style={{
                backgroundColor: colors.bgPrimary,
                color: colors.danger,
                border: `1px solid ${colors.danger}40`,
                minHeight: "42px",
                padding: "10px 12px",
              }}
            >
              <X className="w-5 h-5 flex-shrink-0" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div
            className="rounded-lg p-4 sm:p-6 border space-y-4"
            style={{
              backgroundColor: colors.bgPrimary,
              borderColor: colors.bgTertiary,
            }}
          >
            <div>
              <p className="text-sm uppercase mb-3 font-bold" style={{ color: colors.textPrimary }}>
                Status
              </p>
              <div className="flex flex-wrap gap-2">
                {['all', 'borrowed', 'returned', 'late'].map(status => ( 
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all border whitespace-nowrap capitalize"
                    style={{
                      backgroundColor: filter === status ? colors.primary : colors.bgSecondary,
                      color: filter === status ? "white" : colors.textPrimary,
                      borderColor: filter === status ? colors.primary : colors.bgTertiary,
                      borderWidth: "1px",
                    }}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

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
                  className="text-center p-4 font-semibold"
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
                          <span className="text-xs block mt-1" style={{ color: colors.danger }}>
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
                      <td className="p-4 align-top text-center">
                        {isCancellable && (
                          <button
                            onClick={() => handleReturn(loan._id || loan.id)}
                            className="p-1.5 rounded-lg transition-colors hover:opacity-80 inline-flex"
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