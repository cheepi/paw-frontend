"use client"

import { Button } from "@/components/ui/button"
import { Plus, Search, Loader2, Calendar, AlertCircle, Filter, X } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { typography } from "@/styles/typography"
import { BookingCard } from "@/components/bookings/BookingCard"
import type { Booking, User } from "@/types"
import { getAuthToken } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { colors } from "@/styles/colors"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "cancelled">("all")
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<"dateDesc" | "dateAsc">("dateDesc")

  useEffect(() => {
    let cancelled = false

    const fetchUserAndBookings = async () => {
      setIsLoading(true)
      setError(null)

      const token = getAuthToken()
      if (!token) {
        setError("authentication required. please login.")
        setIsLoading(false)
        return
      }

      try {
        // fetch current user first
        const userRes = await fetch(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!userRes.ok) {
          const err = await userRes.json().catch(() => ({}))
          throw new Error(err?.message || "failed to fetch user")
        }
        const userData: User = await userRes.json()
        if (cancelled) return
        setCurrentUser(userData)

        // helper: try endpoints in order (to avoid fetching all)
        const tryEndpoints = async (endpoints: string[]) => {
          for (const ep of endpoints) {
            try {
              const res = await fetch(ep, { headers: { Authorization: `Bearer ${token}` } })
              if (!res.ok) continue
              const data = await res.json()
              // basic validation: expect array
              if (Array.isArray(data)) return data as Booking[]
              // some apis wrap in { data: [] }
              if (data && Array.isArray((data as any).data)) return (data as any).data as Booking[]
            } catch {
              // ignore and try next
            }
          }
          return null
        }

        // if admin -> fetch all bookings (admin intent)
        if ((userData as any).role === "admin" || (userData as any).isAdmin) {
          const allRes = await fetch(`${API_URL}/api/rooms/bookings/list`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!allRes.ok) {
            const e = await allRes.json().catch(() => ({}))
            throw new Error(e?.message || "failed to fetch bookings")
          }
          const allData = await allRes.json()
          const bookingsArr: Booking[] = Array.isArray(allData) ? allData : allData?.data ?? []
          if (cancelled) return
          setBookings(bookingsArr)
          setIsLoading(false)
          return
        }

        // non-admin: try dedicated endpoints to avoid fetching everything
        const endpointsToTry = [
          `${API_URL}/api/rooms/bookings/my`,
          `${API_URL}/api/rooms/bookings/list?mine=true`,
          `${API_URL}/api/users/${(userData as any).id || (userData as any)._id}/bookings`,
        ].filter(Boolean) as string[]

        const result = await tryEndpoints(endpointsToTry)

        if (result) {
          if (cancelled) return
          setBookings(result)
          setIsLoading(false)
          return
        }

        // last-resort: server doesn't expose per-user endpoints -> fetch all then filter
        // note: this is not ideal but safe fallback
        const fallbackRes = await fetch(`${API_URL}/api/rooms/bookings/list`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!fallbackRes.ok) {
          const err = await fallbackRes.json().catch(() => ({}))
          throw new Error(err?.message || "failed to fetch bookings")
        }
        const fallbackData = await fallbackRes.json()
        const all = Array.isArray(fallbackData) ? fallbackData : fallbackData?.data ?? []
        // filter client-side to show only user's bookings
        const filtered = all.filter((b: Booking) => {
          const userId = (currentUser as any)?.id || (currentUser as any)?._id
          return (b.user && ((b.user as any).id === userId || (b.user as any)._id === userId))
        })
        if (cancelled) return
        setBookings(filtered)
      } catch (err: any) {
        console.error("fetchBookingsAndUser error:", err)
        if (!cancelled) setError(err?.message || "failed to load bookings")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchUserAndBookings()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <h1 className={`${typography.h1} text-gray-900`}>my bookings</h1>
        <Button
          onClick={() => router.push("/rooms")}
          className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          book room
        </Button>
      </header>

      {/* search & filter bar */}
      <div className="flex flex-col sm:flex-row items-center sm:items-stretch sm:justify-end justify-center gap-4 w-full">
        <div className="flex w-full sm:w-auto items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="relative flex-1 min-w-0 sm:flex-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 flex-shrink-0" style={{ color: colors.textTertiary }} />
            <input
              type="text"
              placeholder="search room name..."
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
            <span className="hidden sm:inline">filters</span>
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
              <span className="hidden sm:inline">clear</span>
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="p-4 sm:p-6 rounded-lg border border-gray-200 bg-gray-50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">filter by status</p>
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
              <p className="text-sm font-semibold text-gray-700 mb-3">sort by</p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full max-w-xs px-3 py-2 rounded-lg border border-gray-300 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
              >
                <option value="dateDesc">booking date (newest)</option>
                <option value="dateAsc">booking date (oldest)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* main content */}
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          <p className="ml-3 text-gray-600 font-medium">loading booking history...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center flex flex-col items-center">
          <AlertCircle className="w-8 h-8 text-red-600 mb-3" />
          <h3 className="font-semibold text-red-800 mb-1">error loading data</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : sortedBookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedBookings.map((booking) => (
            <BookingCard key={(booking.id || booking._id) as string} booking={booking} />
          ))}
        </div>
      ) : (
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <Calendar className="w-8 h-8 text-gray-500 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800 mb-1">no bookings found</h3>
          <p className="text-sm text-gray-600">you currently have no room bookings matching the filter.</p>
        </div>
      )}
    </div>
  )
}
