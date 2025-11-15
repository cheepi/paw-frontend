"use client"

import Link from "next/link"
import { ChevronRight, BookOpen, Users, Bell, Loader2, AlertCircle, AlertTriangle } from "lucide-react"
import { useState, useEffect, Suspense } from "react" // <-- Tambah Suspense
import { useRouter, useSearchParams } from "next/navigation" // <-- Tambah useSearchParams
import BookCard from "@/components/books/book-card"
import { RoomCard } from "@/components/rooms/room-card"
import AnnouncementCard from "@/components/announcements/announcement-card"
import { typography } from "@/styles/typography"
import { colors } from "@/styles/colors"
import { spacing } from "@/styles/spacing"
import type { Book, Room, Announcement, Loan } from "@/types"
import { getAuthToken, setAuthToken, removeAuthToken } from "@/lib/auth" // <-- Tambah removeAuthToken

const API_URL = process.env.NEXT_PUBLIC_API_URL

const sampleBooks: Book[] = [
    { id: "1", title: "Mock Book", author: "Mock Author", stock: 5, status: "available", category: "Fiction", year: 2023 },
]
const sampleRooms: Room[] = [
    {
        id: "1",
        name: "Mock Room",
        description: "A quiet room",
        capacity: 6,
        photos: ["https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop"],
        facilities: ["Whiteboard"],
        status: "available" as const,
        price: 0,
    },
]
const sampleAnnouncements: Announcement[] = [
    { id: 1, title: "Mock Announcement", snippet: "Mock update.", bookTitle: "", message: "", createdAt: "" },
]

// --- WRAP KOMPONEN UTAMA BIAR BISA PAKE useSearchParams ---
export default function DashboardPageWrapper() {
    return (
        <Suspense fallback={<DashboardLoadingSkeleton />}>
            <Dashboard />
        </Suspense>
    )
}

function DashboardLoadingSkeleton() {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            <p className="ml-3 text-gray-600 font-medium">Loading Dashboard...</p>
        </div>
    )
}

function Dashboard() {
    const [stats, setStats] = useState({
        totalBooks: 0,
        availableRooms: 0,
        announcementCount: 0,
        featuredBooks: sampleBooks,
        featuredRooms: sampleRooms,
        featuredAnnouncements: sampleAnnouncements,
    })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [username, setUsername] = useState("")
    const [greeting, setGreeting] = useState("")
    const [lateLoans, setLateLoans] = useState<Loan[]>([])
    const [upcomingLoans, setUpcomingLoans] = useState<Loan[]>([])
    
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Tangkap token dari query saat redirect OAuth (?token=...)
        try {
            const token = searchParams.get("token");
            if (token && typeof token === "string" && token !== "undefined") {
                setAuthToken(token)
                
                const url = new URL(window.location.href)
                url.searchParams.delete("token")
                window.history.replaceState({}, document.title, url.pathname + url.search)
            }
        } catch {}

        const hour = new Date().getHours()
        if (hour < 11) setGreeting("Selamat Pagi")
        else if (hour < 15) setGreeting("Selamat Siang")
        else if (hour < 18) setGreeting("Selamat Sore")
        else setGreeting("Selamat Malam")
    }, [searchParams])

    useEffect(() => {
        const token = getAuthToken()
        const stored = localStorage.getItem("username")
        if (stored) setUsername(stored)

        let cancelled = false

        ;(async () => {
            try {
                if (!API_URL || !token) {
                    if(!token) setIsLoading(false); // Hindarin loading muter terus
                    return;
                }
                const headers: HeadersInit = {}
                headers["Authorization"] = `Bearer ${token}`
                
                const res = await fetch(`${API_URL}/api/users/me`, {
                    headers,
                    credentials: "include",
                })
                
                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) {
                         removeAuthToken(); // Token invalid
                         router.replace("/sign-in");
                    }
                    return;
                }
                const data = await res.json()
                if (cancelled) return
                const name = data?.username || data?.name || data?.email
                if (name) {
                    setUsername(name)
                    try {
                        localStorage.setItem("username", name)
                    } catch {}
                }
            } catch {}
        })()

        return () => {
            cancelled = true
        }
    }, [router])

    useEffect(() => {
        const token = getAuthToken()
        if (!token) {
             setError("Authentication required.");
             setIsLoading(false);
             router.replace("/sign-in");
             return;
        }

        const fetchDashboardData = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const common: RequestInit = {
                    credentials: "include",
                }
                const headers: HeadersInit = {}
                if (token) headers["Authorization"] = `Bearer ${token}`

                const [featuredBooksRes, totalBooksRes, roomsRes, announcementsRes, loansRes] = await Promise.all([
                    fetch(`${API_URL}/api/books?limit=4&sortBy=createdAt&order=desc`, { ...common, headers }), // Ambil 4 buku
                    fetch(`${API_URL}/api/books?limit=1`, { ...common, headers }), 
                    fetch(`${API_URL}/api/rooms`, { ...common, headers }),
                    fetch(`${API_URL}/api/announcements`, { ...common, headers }),
                    fetch(`${API_URL}/api/loans/my`, { ...common, headers })
                ])
                
                if ([featuredBooksRes, totalBooksRes, roomsRes, announcementsRes, loansRes].some(res => res.status === 401)) {
                    throw new Error("Invalid token. Please log in again.");
                }

                const featuredBooksData = await featuredBooksRes.json()
                const featuredBooks = featuredBooksData.data || []
                
                const totalBooksData = await totalBooksRes.json()
                const totalBooks = totalBooksData.total || 0 

                const roomsData: Room[] = await roomsRes.json();
                
                const featuredRooms = (roomsData || [])
                    .sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime()) // Urutin dari yg terbaru
                    .slice(0, 3); // Ambil 3 teratas
                
                const availableRooms = (roomsData || []).filter((r: any) => r.status === "available").length

                const announcementsData = await announcementsRes.json()
                const featuredAnnouncements = (announcementsData || []).slice(0, 3)
                const announcementCount = (announcementsData || []).length

                const loansData: Loan[] = await loansRes.json();
                
                const now = new Date();
                const sevenDaysFromNow = new Date();
                sevenDaysFromNow.setDate(now.getDate() + 7);
                now.setHours(0, 0, 0, 0); 

                const late = loansData.filter(loan => loan.status === 'late');
                
                const upcoming = loansData.filter(loan => {
                    if (!loan.dueDate || isNaN(new Date(loan.dueDate).getTime())) return false; 
                    const dueDate = new Date(loan.dueDate);
                    return loan.status === 'borrowed' && 
                           dueDate >= now && 
                           dueDate <= sevenDaysFromNow;
                });
                
                setLateLoans(late);
                setUpcomingLoans(upcoming); 

                setStats({
                    totalBooks,
                    availableRooms,
                    announcementCount,
                    featuredBooks,
                    featuredRooms,
                    featuredAnnouncements,
                })
            } catch (err: any) {
                if (err.message.includes("Invalid token")) {
                    removeAuthToken();
                    router.replace("/sign-in");
                }
                setError("Failed to load dashboard data. Check backend.")
                setStats({
                    totalBooks: 0,
                    availableRooms: 0,
                    announcementCount: 0,
                    featuredBooks: sampleBooks,
                    featuredRooms: sampleRooms,
                    featuredAnnouncements: sampleAnnouncements,
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchDashboardData()
    }, [router])

    if (isLoading) return <DashboardLoadingSkeleton />; // Pake skeleton

    if (error)
        return (
            <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="font-semibold text-red-800 mb-1">Error Loading Dashboard</h3>
                <p className="text-sm text-red-700">{error}</p>
            </div>
        )

    return (
        <div style={{ backgroundColor: colors.bgPrimary }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
                <div className={`space-y-${spacing.sm}`}>
                    <h1 className={typography.h1}>{greeting}, {username || "Guest"}!</h1>
                    <p className={typography.body}>Explore books, reserve rooms, and stay updated</p>
                </div>
            </div>

            {lateLoans.length > 0 && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 mb-10">
                <div className="p-4 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-800">Peringatan Keterlambatan!</h3>
                    <p className="text-sm text-red-700">
                      Lu punya {lateLoans.length} buku yang telat dibalikin. 
                      Cek <Link href="/loans" className="font-bold underline">Halaman Pinjaman</Link> buat liat denda.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {upcomingLoans.length > 0 && lateLoans.length === 0 && ( 
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 mb-10">
                <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">Peringatan Jatuh Tempo</h3>
                    <p className="text-sm text-yellow-700">
                      Lu punya {upcomingLoans.length} buku yang akan jatuh tempo dalam 7 hari ke depan.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        href="/books"
                        label="Total Books"
                        value={stats.totalBooks.toLocaleString()}
                        icon={<BookOpen className="w-12 h-12" style={{ color: colors.info }} />}
                    />
                    <StatCard
                        href="/rooms"
                        label="Available Rooms"
                        value={stats.availableRooms.toLocaleString()}
                        icon={<Users className="w-12 h-12" style={{ color: colors.success }} />}
                    />
                    <StatCard
                        href="/announcements"
                        label="Announcements"
                        value={stats.announcementCount.toLocaleString()}
                        icon={<Bell className="w-12 h-12" style={{ color: colors.warning }} />}
                    />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 pb-16">
                <Section title="Featured Books" description="Latest additions to our collection" viewAllHref="/books">
                    {/* --- FIX DI SINI: grid-cols-2 --- */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {stats.featuredBooks.map((book: any) => (
                            <BookCard key={book.id || book._id} id={book.id || book._id} title={book.title} author={book.author} cover={book.cover} stock={book.stock} />
                        ))}
                    </div>
                </Section>

                <Section title="Available Rooms" description="Book a space for your group" viewAllHref="/rooms">
                    {/* --- FIX DI SINI: grid-cols-2 --- */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                        {stats.featuredRooms.map((room: any) => (
                            <RoomCard key={room.id || room._id} {...room} />
                        ))}
                    </div>
                </Section>

                <Section title="Latest Announcements" description="Stay updated with library news" viewAllHref="/announcements">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stats.featuredAnnouncements.map((announcement: any) => (
                            <AnnouncementCard
                                key={announcement.id || announcement._id}
                                id={announcement.id || announcement._id}
                                title={announcement.bookTitle || announcement.title}
                                snippet={announcement.message || announcement.snippet}
                                date={announcement.createdAt || announcement.date}
                            />
                        ))}
                    </div>
                </Section>
            </div>
        </div>
    )
}

function Section({ title, description, viewAllHref, children }: { title: string; description: string; viewAllHref: string; children: React.ReactNode }) {
    return (
        <section>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className={typography.h2}>{title}</h2>
                    <p className={`${typography.bodySmall} mt-1`} style={{ color: colors.textSecondary }}>
                        {description}
                    </p>
                </div>
                <Link href={viewAllHref}>
                    <button className="font-semibold flex items-center gap-2 text-sm transition-colors" style={{ color: colors.info }}>
                        View All
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </Link>
            </div>
            {children}
        </section>
    )
}

function StatCard({ href, label, value, icon }: { href: string; label: string; value: string; icon: React.ReactNode }) {
    return (
        <Link href={href}>
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-md hover:shadow-lg transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`${typography.label} text-slate-600`}>{label}</p>
                        <p className={`${typography.h2} mt-1`}>{value}</p>
                    </div>
                    <div className="opacity-80">{icon}</div>
                </div>
            </div>
        </Link>
    )
}