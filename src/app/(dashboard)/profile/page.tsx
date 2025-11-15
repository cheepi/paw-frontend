"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, Mail, Calendar, BookOpen, Users, Loader2, AlertCircle, Phone } from "lucide-react" // <-- Tambah ikon Phone
import { Button } from "@/components/ui/button"
import { typography } from "@/styles/typography"
import { colors } from "@/styles/colors"
import type { User as UserType, FrontendLoan, Booking } from "@/types"
import { getAuthToken } from "@/lib/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL

const STATUS_COLORS: Record<string, string> = {
    borrowed: "bg-cyan-50 text-cyan-700",
    upcoming: "bg-emerald-50 text-emerald-700",
    returned: "bg-slate-100 text-slate-600",
    completed: "bg-slate-100 text-slate-600",
    overdue: "bg-red-50 text-red-700",
    cancelled: "bg-red-50 text-red-700",
    pending_payment: "bg-amber-50 text-amber-700", 
}

const STATUS_LABELS: Record<string, string> = {
    borrowed: "Borrowed",
    returned: "Returned",
    overdue: "Overdue",
    upcoming: "Upcoming",
    completed: "Completed",
    cancelled: "Cancelled",
    pending_payment: "Pending Payment",
}

export default function ProfilePage() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [activeTab, setActiveTab] = useState<"overview" | "books" | "rooms">("overview")

    const [userData, setUserData] = useState<UserType | null>(null)
    const [userActivity, setUserActivity] = useState<{ loans: FrontendLoan[], bookings: Booking[] }>({ loans: [], bookings: [] })
    
    const [editedUsername, setEditedUsername] = useState("")
    const [editedEmail, setEditedEmail] = useState("") 
    const [editedBio, setEditedBio] = useState("")
    const [editedPhone, setEditedPhone] = useState("") // <-- State baru

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [formError, setFormError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const token = getAuthToken()
        if (!token) {
            setError("Authentication token not found.")
            setIsLoading(false)
            return
        }

        const fetchUserData = async () => {
             try {
                const userRes = await fetch(`${API_URL}/api/users/me`, {
                    headers: { "Authorization": `Bearer ${token}` }
                })
                 if (!userRes.ok) throw new Error("Failed to fetch user data.")
                
                 const userJson = await userRes.json() as UserType
                
                const userData = {
                    ...userJson,
                    username: userJson.name || userJson.username,
                    joinDate: userJson.createdAt || new Date().toISOString(),
                    profilePicture: userJson.profilePicture || "https://api.dicebear.com/7.x/avataaars/svg?seed=user_default"
                }

                setUserData(userData)

                setEditedUsername(userData.username)
                setEditedEmail(userData.email) 
                setEditedBio(userData.bio || "")
                setEditedPhone(userData.phone || "")

                localStorage.setItem('userProfilePicture', userData.profilePicture);

                const loansRes = await fetch(`${API_URL}/api/loans/my`, {
                     headers: { "Authorization": `Bearer ${token}` }
                })
                const loansData = await loansRes.json() || []

                const userIdToFilter = userJson._id || userJson.id;
                const bookingsRes = await fetch(`${API_URL}/api/rooms/bookings/list?userId=${userIdToFilter}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                })
                const bookingsData = await bookingsRes.json() || []

                const processedLoans = loansData.map((loan: any) => {
                    let status = loan.status as "borrowed" | "returned" | "overdue";
                    const isOverdue = status === "borrowed" && new Date(loan.dueDate) < new Date();
                    if (isOverdue) status = "overdue";
                    return { ...loan, status: status } as FrontendLoan;
                });

                const processedBookings = bookingsData
                    .filter((b: Booking) => b.status !== "cancelled")
                    .map((b: Booking) => ({
                        ...b,
                        displayStatus: b.status === "confirmed" ? "completed" : "pending_payment" 
                    }));

                setUserActivity({ loans: processedLoans, bookings: processedBookings })

            } catch (err: any) {
                console.error(err)
                setError(err.message || "Failed to load profile data.")
            } finally {
                setIsLoading(false)
            }
        }

        fetchUserData()
    }, [])

    const handleProfilePictureClick = () => {
        const choice = window.confirm("Pilih 'OK' untuk upload file (hanya sementara, tidak tersimpan di database), atau 'Cancel' untuk memasukkan URL gambar (permanen).");
        if (choice) {
            fileInputRef.current?.click();
        } else {
            const newImageUrl = window.prompt("Masukkan URL gambar online (e.g., https://i.imgur.com/...jpg):");
            if (newImageUrl && newImageUrl.startsWith("http")) {
                handleSaveProfilePictureUrl(newImageUrl);
            } else if (newImageUrl) {
                alert("URL tidak valid. Harus dimulai dengan 'http'.");
            }
        }
    }

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
           const file = e.target.files?.[0]
           if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const tempUrl = reader.result as string;
                setUserData({ ...userData!, profilePicture: tempUrl })
                localStorage.setItem('userProfilePicture', tempUrl);
                window.dispatchEvent(new Event('storage')); 
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSaveProfilePictureUrl = async (newUrl: string) => {
        setIsSaving(true);
        setFormError(null);
        const token = getAuthToken();

        try {
            const response = await fetch(`${API_URL}/api/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    profilePicture: newUrl 
                })
            });
            const updatedUser = await response.json();
            if (!response.ok) throw new Error(updatedUser.message);

            setUserData({ ...userData!, profilePicture: updatedUser.profilePicture });
            localStorage.setItem('userProfilePicture', updatedUser.profilePicture);
            window.dispatchEvent(new Event('storage'));
            alert("Foto profil berhasil diperbarui!");

        } catch (err: any) {
            alert(`Gagal update foto: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    }

    const handleSaveProfile = async () => {
        if (!window.confirm("Yakin mau simpan perubahan ini?")) {
            return;
        }

        setIsSaving(true);
        setFormError(null);
        const token = getAuthToken();
        const oldEmail = userData?.email;

        try {
            const response = await fetch(`${API_URL}/api/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: editedUsername, 
                    email: editedEmail, 
                    bio: editedBio,
                    phone: editedPhone, 
                    profilePicture: userData!.profilePicture 
                })
            });

            const updatedUser = await response.json();
            if (!response.ok) {
                throw new Error(updatedUser.message || "Failed to save profile.");
            }

            setUserData({ 
                ...userData!, 
                username: updatedUser.name, 
                bio: updatedUser.bio,
                email: updatedUser.email,
                phone: updatedUser.phone, 
                isVerified: updatedUser.isVerified,
                profilePicture: updatedUser.profilePicture
            });

            localStorage.setItem('userProfilePicture', updatedUser.profilePicture);
            window.dispatchEvent(new Event('storage'));
            
            if (oldEmail !== updatedUser.email && !updatedUser.isVerified) {
                alert("Profile updated! Email Anda telah diganti dan sekarang UNVERIFIED. Silakan verifikasi email baru Anda.");
            } else {
                alert("Profile updated successfully!");
            }
            
            setIsEditing(false);
        } catch (err: any) {
            setFormError(err.message || "An error occurred.");
            alert(err.message || "An error occurred.");
        } finally {
            setIsSaving(false);
        }
    }

    const handleCancel = () => {
        setIsEditing(false)
        setFormError(null);
        setEditedUsername(userData!.username)
        setEditedEmail(userData!.email) 
        setEditedBio(userData!.bio || "")
        setEditedPhone(userData!.phone || "") // < reset phone pas cancel
    }

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

    // Cek perubahan (termasuk phone)
    const isChanged = userData 
        ? userData.username !== editedUsername || 
          userData.email !== editedEmail || 
          (userData.bio || "") !== editedBio ||
          (userData.phone || "") !== editedPhone // cek phone
        : false;

    if (isLoading) return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            <p className="ml-3 text-gray-600 font-medium">Loading profile...</p>
        </div>
    )

    if (error || !userData) return (
         <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="font-semibold text-red-800 mb-1">Error</h3>
            <p className="text-sm text-red-700">{error || "User data not found."}</p>
        </div>
    )

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.bgPrimary }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     {/* Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6 shadow-sm">
                             {/* Profile Picture */}
                             <div className="text-center">
                                <div className="relative inline-block">
                                     <img
                                         src={userData.profilePicture}
                                         alt={userData.username}
                                         className="w-32 h-32 rounded-full border-4"
                                        style={{ borderColor: colors.primary }}
                                    />
                                     <button
                                         onClick={handleProfilePictureClick} 
                                         className="absolute bottom-0 right-0 p-2 rounded-full text-white hover:opacity-90 transition-opacity"
                                        style={{ backgroundColor: colors.primary }}
                                    >
                                         <Camera className="w-5 h-5" />
                                    </button>
                                 </div>
                                <input
                                     ref={fileInputRef}
                                     type="file"
                                    accept="image/*"
                                     onChange={handleProfilePictureChange}
                                     className="hidden"
                                />
                             </div>

                             {/* User Info */}
                            <div className="space-y-4">
                                 <div>
                                    <p className={`${typography.labelSmall} uppercase mb-2`} style={{ color: colors.textSecondary }}>
                                         Name
                                    </p>
                                     {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedUsername}
                                            onChange={(e) => setEditedUsername(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2"
                                            style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
                                        />
                                    ) : (
                                        <p className={typography.h4} style={{ color: colors.textPrimary }}>
                                             {userData.username}
                                        </p>
                                    )}
                                </div>

                                {/* Bagian Email */}
                                 <div>
                                     {isEditing ? (
                                        <>
                                            <p className={`${typography.labelSmall} uppercase mb-2`} style={{ color: colors.textSecondary }}>
                                                Email
                                            </p>
                                            <input
                                                type="email"
                                                value={editedEmail}
                                                onChange={(e) => setEditedEmail(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2"
                                                style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
                                            />
                                        </>
                                     ) : (
                                        <InfoField 
                                            icon={<Mail className="w-4 h-4" />} 
                                            label="Email" 
                                            value={
                                             <div className="flex items-center gap-2">
                                                    <span>{userData.email}</span>
                                                    {!userData.isVerified && (
                                                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-700">
                                                            Unverified
                                                        </span>
                                                    )}
                                                </div>
                                            } 
                                        />
                                     )}
                                </div>
                                
                                <div>
                                     {isEditing ? (
                                        <>
                                            <p className={`${typography.labelSmall} uppercase mb-2`} style={{ color: colors.textSecondary }}>
                                                Phone Number
                                            </p>
                                            <input
                                                type="tel"
                                                value={editedPhone}
                                                onChange={(e) => setEditedPhone(e.target.value)}
                                                placeholder="0812..."
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2"
                                                style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
                                            />
                                        </>
                                     ) : (
                                        <InfoField 
                                            icon={<Phone className="w-4 h-4" />} 
                                            label="Phone" 
                                            value={userData.phone || "No phone added yet"} 
                                        />
                                     )}
                                </div>

                                 <InfoField
                                    icon={<Calendar className="w-4 h-4" />}
                                    label="Member Since"
                                    value={formatDate(userData.joinDate)}
                                />

                                <div>
                                    <p className={`${typography.labelSmall} uppercase mb-2`} style={{ color: colors.textSecondary }}>
                                        Bio
                                    </p>
                                    {isEditing ? (
                                        <textarea
                                            value={editedBio}
                                            onChange={(e) => setEditedBio(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 resize-none"
                                            style={{ backgroundColor: colors.bgSecondary, color: colors.textPrimary }}
                                            rows={3}
                                            placeholder="Ceritakan sedikit tentang dirimu..." 
                                         />
                                    ) : (
                                        <p className={typography.bodySmall} style={{ color: colors.textSecondary }}>
                                              {userData.bio || "No bio added yet"}
                                        </p>
                                     )}
                                </div>
                                
                                {formError && (
                                    <p className="text-sm text-red-600">{formError}</p>
                                )}
                            </div>

                             {/* Tombol Aksi */}
                            <div className="space-y-2 pt-4 border-t border-slate-200">
                                {isEditing ? (
                                    <>
                                        <Button
                                            onClick={handleSaveProfile}
                                            variant="success" 
                                            className="w-full"
                                            disabled={isSaving || !isChanged} 
                                        >
                                           {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                                        </Button>
                                        <Button
                                             onClick={handleCancel}
                                             variant="secondary"
                                            className="w-full"
                                             disabled={isSaving}
                                         >
                                            Cancel
                                        </Button>
                                    </>
                                 ) : (
                                    <Button
                                         onClick={() => setIsEditing(true)}
                                        variant="primary"
                                         className="w-full"
                                     >
                                        Edit Profile
                                    </Button>
                                )}
                            </div>
                         </div>
                     </div>

                    {/* Bagian Aktivitas */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                             {/* Tabs */}
                            <div className="flex border-b border-slate-200">
                                {[
                                    { id: "overview", label: "Overview" },
                                    { id: "books", label: "Books", icon: BookOpen, count: userActivity.loans.length },
                                    { id: "rooms", label: "Rooms", icon: Users, count: userActivity.bookings.length },
                                ].map((tab) => (
                                    <TabButton
                                        key={tab.id}
                                        isActive={activeTab === tab.id}
                                        onClick={() => setActiveTab(tab.id as "overview" | "books" | "rooms")}
                                        icon={tab.icon}
                                        label={tab.label}
                                        count={tab.count}
                                    />
                                ))}
                             </div>
                            {/* Konten Tab */}
                            <div className="p-6">
                                {activeTab === "overview" && <OverviewTab activity={userActivity} />}
                                {activeTab === "books" && <BooksTab books={userActivity.loans} />}
                                {activeTab === "rooms" && <RoomsTab bookings={userActivity.bookings} />} 
                            </div>
                        </div>
                    </div>
                </div>
            </div>
         </div>
    )
}

function TabButton({
    isActive,
    onClick,
    icon: Icon,
    label,
    count,
}: {
    isActive: boolean
    onClick: () => void
    icon?: any
    label: string
    count?: number
}) {
    return (
        <button
            onClick={onClick}
            className="flex-1 px-4 py-3 font-semibold border-b-2 transition-colors flex items-center justify-center gap-2"
            style={{
                backgroundColor: isActive ? colors.info : "transparent",
                color: isActive ? "white" : colors.textSecondary,
                borderBottomColor: isActive ? colors.info : "transparent",
            }}
        >
            {Icon && <Icon className="w-4 h-4" />}
            {label}
            {count !== undefined && ` (${count})`}
        </button>
    )
}

function InfoField({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode
    label: string
    value: React.ReactNode 
}) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                <span style={{ color: colors.textSecondary }}>{icon}</span>
                <p className={`${typography.labelSmall} uppercase`} style={{ color: colors.textSecondary }}>
                     {label}
                </p>
            </div>
            <div className={typography.body} style={{ color: colors.textPrimary }}>
                {value}
            </div>
        </div>
    )
}

function OverviewTab({ activity }: { activity: { loans: FrontendLoan[], bookings: Booking[] } }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <StatBox label="Books Borrowed" value={activity.loans.length} />
                <StatBox label="Room Bookings" value={activity.bookings.length} />
            </div>
            <div>
                <h3 className={`${typography.h4} mb-3`} style={{ color: colors.textPrimary }}>
                    Recent Activity
                </h3>
                <div className="space-y-3">
                    {activity.loans.slice(0, 2).map((loan) => (
                         <ActivityCard
                            key={(loan.id || loan._id) as string}
                            title={loan.book.title}
                            subtitle={`By ${loan.book.author}`}
                            status={loan.status}
                        />
                    ))}
                    {activity.bookings.slice(0, 2).map((booking) => (
                        <ActivityCard
                            key={(booking.id || booking._id) as string}
                            title={booking.room.name}
                            subtitle={`Slot: ${booking.startTime} - ${booking.endTime}`}
                            status={booking.displayStatus || booking.status} 
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

function BooksTab({ books }: { books: FrontendLoan[] }) {
    return (
        <div className="space-y-3">
            {books.map((loan) => (
                <div
                    key={(loan.id || loan._id) as string}
                    className="rounded-lg border border-slate-200 p-4"
                    style={{ backgroundColor: colors.bgSecondary }}
                >
                     <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className={typography.h4} style={{ color: colors.textPrimary }}>
                                {loan.book.title}
                             </p>
                            <p className={`${typography.bodySmall} mt-1`} style={{ color: colors.textSecondary }}>
                               by {loan.book.author}
                             </p>
                        </div>
                        <StatusBadge status={loan.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className={typography.labelSmall} style={{ color: colors.textSecondary }}>
                                Borrow Date
                            </p>
                             <p className={typography.body} style={{ color: colors.textPrimary }}>
                                {new Date(loan.borrowDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className={typography.labelSmall} style={{ color: colors.textSecondary }}>
                                Due Date
                            </p>
                            <p style={{ color: (loan.status as string) === "overdue" ? colors.danger : colors.textPrimary }}>
                                {new Date(loan.dueDate).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

function RoomsTab({ bookings }: { bookings: Booking[] }) {
    return (
        <div className="space-y-3">
            {bookings.map((booking) => (
                 <div
                    key={(booking.id || booking._id) as string}
                    className="rounded-lg border border-slate-200 p-4"
                     style={{ backgroundColor: colors.bgSecondary }}
                >
                     <div className="flex items-start justify-between mb-3">
                        <div>
                             <p className={typography.h4} style={{ color: colors.textPrimary }}>
                                {booking.room.name}
                             </p>
                            <p className={`${typography.bodySmall} mt-1`} style={{ color: colors.textSecondary }}>
                                {booking.startTime} - {booking.endTime}
                             </p>
                        </div>
                         <StatusBadge status={booking.displayStatus || booking.status} /> 
                    </div>
                    <div>
                        <p className={typography.labelSmall} style={{ color: colors.textSecondary }}>
                             Booking Date
                        </p>
                        <p className={typography.body} style={{ color: colors.textPrimary }}>
                            {new Date(booking.date).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
}

function StatBox({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border border-slate-200 p-4" style={{ backgroundColor: colors.bgSecondary }}>
            <p className={typography.labelSmall} style={{ color: colors.textSecondary }}>
                {label}
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: colors.info }}>
                {value}
            </p>
        </div>
    )
}

function ActivityCard({ title, subtitle, status }: { title: string; subtitle: string; status: string }) {
    return (
        <div
            className="rounded-lg border border-slate-200 p-3 flex items-start justify-between"
            style={{ backgroundColor: colors.bgSecondary }}
        >
            <div>
                <p className={typography.body} style={{ color: colors.textPrimary }}>
                    {title}
                </p>
                <p className={`${typography.bodySmall} mt-1`} style={{ color: colors.textSecondary }}>
                    {subtitle}
                </p>
            </div>
            <StatusBadge status={status} />
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`text-xs font-semibold px-2 py-1 rounded ${STATUS_COLORS[status] || STATUS_COLORS.borrowed}`}>
            {STATUS_LABELS[status] || status}
        </span>
    )
}