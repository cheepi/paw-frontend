"use client";

import { useEffect, useState, useMemo } from "react";
import { getAuthToken } from "@/lib/auth";
import { Loader2, CheckCircle, Clock, RotateCcw, Search, AlertCircle, Filter, X } from "lucide-react";
import type { Loan } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { colors } from "@/styles/colors";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const statusConfig = {
  borrowed: { color: colors.warning, icon: Clock, label: 'Borrowed' },
  returned: { color: colors.success, icon: CheckCircle, label: 'Returned' },
  late: { color: colors.danger, icon: AlertCircle, label: 'LATE' }
};

export default function ManageLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const token = getAuthToken();

  async function fetchLoans() {
    setIsLoading(true);
    const res = await fetch(`${API_URL}/api/loans`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setLoans(data || []);
    } else {
      setLoans([]);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    if (token) {
      fetchLoans();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const handleReturn = async (loanId: string) => {
    if (!confirm("Yakin mau 'Force Return' buku ini?")) return;
    
    await fetch(`${API_URL}/api/loans/${loanId}/return`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    fetchLoans(); // Refresh list
  };

  const handleClearFilters = () => {
    setSearch("");
    setFilter("all");
  };

  const hasActiveFilters = filter !== "all" || search !== "";

  const filteredLoans = useMemo(() => {
    return loans
      .filter(l => {
        if (filter === 'all') return true;
        return l.status === filter;
      })
      .filter(l => {
        const query = search.toLowerCase();
        if (!query) return true;
        return (
          (l.book?.title || '').toLowerCase().includes(query) ||
          (l.user?.email || '').toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime());
  }, [loans, filter, search]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

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
                {['all', 'borrowed', 'returned'].map(status => ( 
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
                <th className="text-left p-4 font-semibold" style={{ color: colors.textPrimary }}>
                  Buku
                </th>
                <th className="text-left p-4 font-semibold" style={{ color: colors.textPrimary }}>
                  User (Email)
                </th>
                <th className="text-left p-4 font-semibold" style={{ color: colors.textPrimary }}>
                  Tanggal Pinjam
                </th>
                <th className="text-left p-4 font-semibold" style={{ color: colors.textPrimary }}>
                  Jatuh Tempo
                </th>
                <th className="text-left p-4 font-semibold" style={{ color: colors.textPrimary }}>
                  Status
                </th>
                <th className="text-left p-4 font-semibold" style={{ color: colors.textPrimary }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => {
                  const statusInfo = statusConfig[loan.status] || statusConfig.borrowed;
                  const isOverdue = loan.status === 'borrowed' && loan.dueDate && new Date(loan.dueDate) < new Date();
                  return (
                    <tr 
                      key={loan._id || loan.id} 
                      className="border-b transition-colors hover:opacity-80"
                      style={{
                        borderColor: colors.bgTertiary,
                        backgroundColor: colors.bgPrimary,
                      }}
                    >
                      <td className="p-4 align-top" style={{ color: colors.textPrimary }}>
                        {loan.book?.title || 'Buku Dihapus'}
                      </td>
                      <td className="p-4 align-top text-sm" style={{ color: colors.textPrimary }}>
                        {loan.user?.email || 'User Dihapus'}
                      </td>
                      <td className="p-4 align-top" style={{ color: colors.textPrimary }}>
                        {formatDate(loan.borrowDate)}
                      </td>
                      <td 
                        className="p-4 align-top font-semibold"
                        style={{ color: isOverdue ? colors.danger : colors.textPrimary }}
                      >
                        {formatDate(loan.dueDate)}
                        {isOverdue && (
                          <span className="text-xs block" style={{ color: colors.danger }}>
                            (OVERDUE)
                          </span>
                        )}
                      </td>
                      <td className="p-4 align-top">
                        <span 
                          className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: statusInfo.color }}
                        >
                          <statusInfo.icon className="w-4 h-4" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-4 align-top">
                        {loan.status === 'borrowed' && (
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
                  <td colSpan={6} className="text-center p-8" style={{ color: colors.textSecondary }}>
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