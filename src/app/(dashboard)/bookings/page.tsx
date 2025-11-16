"use client"

import { Button } from "@/components/ui/button"
import { Plus, Search, Loader2, Calendar, AlertCircle, Filter, X } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { typography } from "@/styles/typography"
import { BookingCard } from "@/components/bookings/BookingCard"
import type { Booking } from "@/types"
import { getAuthToken } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { colors } from "@/styles/colors"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "cancelled">("all")
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<"dateDesc" | "dateAsc">("dateDesc")

  useEffect(() => {
    let cancelled = false

    const fetchMyBookings = async () => {
      setIsLoading(true)
      setError(null)

      const token = getAuthToken()
      if (!token) {
        setError("Authentication required. Please login.")
        setIsLoading(false)
        return
      }

      try {
        const endpoints = [
          `${API_URL}/api/rooms/bookings/my`,
          `${API_URL}/api/rooms/bookings/list?mine=true`,
          `${API_URL}/api/rooms/bookings/user/me`
        ]

        let data: Booking[] | null = null

        for (const ep of endpoints) {
          try {
            const res = await fetch(ep, { headers: { Authorization: `Bearer ${token}` } })
            if (!res.ok) continue

            const body = await res.json()

            if (Array.isArray(body)) {
              data = body
              break
            }

            if (body && Array.isArray(body.data)) {
              data = body.data
              break
            }
          } catch {}
        }

        if (!data) {
          throw new Error("Failed to fetch user bookings")
        }

        if (!cancelled) {
          setBookings(data)
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load bookings")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchMyBookings()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredBookings = useMemo(() => {
    let list = bookings.slice()

    if (filter !== "all") {
      list = list.filter((booking) => {
        if (filter === "confirmed") return booking.status === "confirmed"
        if (filter === "pending") return booking.status === "pending_payment"
        if (filter === "cancelled") return booking.status === "cancelled"
        return false
      })
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      list = list.filter((booking) => (booking.room?.name || "").toLowerCase().includes(q))
    }

    return list
  }, [bookings, filter, searchTerm])

  const sortedBookings = useMemo(() => {
    const copy = [...filteredBookings]
    copy.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime()
      const dateB = new Date(b.date || b.createdAt || 0).getTime()
      if (sortBy === "dateDesc") return dateB - dateA
      return dateA - dateB
    })
    return copy
  }, [filteredBookings, sortBy])

  const hasActiveFilters = filter !== "all" || searchTerm !== ""

  const handleClearFilters = () => {
    setSearchTerm("")
    setFilter("all")
    setSortBy("dateDesc")
  }

  const filterOptions = [
    { label: "All", value: "all" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Pending Payment", value: "pending" },
    { label: "Cancelled", value: "cancelled" },
  ]

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-center">
        <h1 className={`${typography.h1} text-gray-900`}>My Bookings</h1>
        <Button
          onClick={() => router.push("/rooms")}
          className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Book Room
        </Button>
      </header>

      <div className="flex flex-col sm:flex-row items-center sm:items-stretch sm:justify-end justify-center gap-4 w-full">
        <div className="flex w-full sm:w-auto items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="relative flex-1 min-w-0 sm:flex-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 flex-shrink-0" style={{ color: colors.textTertiary }} />
            <input
              type="text"
              placeholder="Search room name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-lg border transition-all focus:outline-none focus:ring-2 text-sm"
              style={{ backgroundColor: colors.bgPrimary, borderColor: "#cbd5e1", color: colors.textPrimary }}
            />
          </div>

          <Button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 sm:px-4 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap text-sm"
            style={{
              backgroundColor: showFilters ? colors.info : colors.bgPrimary,
              color: showFilters ? "white" : colors.textSecondary,
              border: `1px solid ${showFilters ? colors.info : "#cbd5e1"}`,
              minHeight: "42px",
              padding: "10px 12px",
            }}
          >
            <Filter className="w-5 h-5 flex-shrink-0" />
            <span className="hidden sm:inline">Filters</span>
          </Button>

          {hasActiveFilters && (
            <Button
              onClick={handleClearFilters}
              className="px-3 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap transition-all text-sm"
              style={{
                backgroundColor: colors.bgPrimary,
                color: colors.danger,
                border: "1px solid #fecaca",
                minHeight: "42px",
                padding: "10px 12px",
              }}
            >
              <X className="w-5 h-5 flex-shrink-0" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="p-4 sm:p-6 rounded-lg border border-gray-200 bg-gray-50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Filter by Status</p>
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((option) => (
                  <Button
                    key={option.value}
                    onClick={() => setFilter(option.value as any)}
                    variant="outline"
                    className={`transition-colors text-sm font-medium ${
                      filter === option.value ? "bg-cyan-500 text-white border-cyan-500 hover:bg-cyan-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Sort By</p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full max-w-xs px-3 py-2 rounded-lg border border-gray-300 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
              >
                <option value="dateDesc">Booking Date (Newest)</option>
                <option value="dateAsc">Booking Date (Oldest)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          <p className="ml-3 text-gray-600 font-medium">Loading booking history...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center flex flex-col items-center">
          <AlertCircle className="w-8 h-8 text-red-600 mb-3" />
          <h3 className="font-semibold text-red-800 mb-1">Error Loading Data</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : sortedBookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedBookings.map((booking) => (
            <BookingCard key={(booking.id || (booking as any)._id) as string} booking={booking} />
          ))}
        </div>
      ) : (
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <Calendar className="w-8 h-8 text-gray-500 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800 mb-1">No Bookings Found</h3>
          <p className="text-sm text-gray-600">You currently have no room bookings matching the filter.</p>
        </div>
      )}
    </div>
  )
}
