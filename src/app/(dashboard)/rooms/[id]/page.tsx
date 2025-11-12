"use client"
import React from "react"
import { Button } from "@/components/ui/button"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Users, Calendar, Check, AlertCircle, ChevronLeft, ChevronRight, Phone, User } from "lucide-react"
import { useState, useMemo } from "react"
import { typography } from "@/styles/typography"
import { console } from "inspector"

interface RoomDetail {
    id: string
    name: string
    description: string
    capacity: number
    image: string
    features: string[]
    status: "available" | "unavailable"
    longDescription: string
    pricePerHour: number
    availableSlots: string[]
}

const MOCK_ROOM: RoomDetail = {
    id: "",
    name: "Discussion Room A",
    description: "A quiet room perfect for group study",
    capacity: 6,
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
    features: ["Whiteboard", "Projector", "WiFi", "Sound System"],
    status: "available",
    longDescription: "Our Discussion Room A is specifically designed for group study sessions and collaborative work. It features a large whiteboard, projector, and high-speed WiFi to support your team's productivity.",
    pricePerHour: 50000,
    availableSlots: ["09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00"],
}

const ROOM_INFO_FIELDS = [
    { label: "Capacity", value: (room: RoomDetail) => `${room.capacity} people`, icon: Users },
    { label: "Price Per Hour", value: (room: RoomDetail) => `Rp ${room.pricePerHour.toLocaleString()}`, icon: undefined },
] as const

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const WEEKDAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const WORKING_DAYS = [1, 2, 3, 4, 5]

const isWorkingDay = (date: Date): boolean => WORKING_DAYS.includes(date.getDay())
const formatDate = (date: Date): string => {
    const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}
const getDaysInMonth = (date: Date): number => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
const getFirstDayOfMonth = (date: Date): number => new Date(date.getFullYear(), date.getMonth(), 1).getDay()
const getMinDate = (): string => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (isWorkingDay(today)) return formatDate(today)
    const next = new Date(today)
    while (!isWorkingDay(next)) next.setDate(next.getDate() + 1)
    return formatDate(next)
}

interface CalendarGridProps {
    currentMonth: Date
    selectedDate: string
    onDateClick: (day: number) => void
    onPrevMonth: () => void
    onNextMonth: () => void
}

const CalendarGrid = ({ currentMonth, selectedDate, onDateClick, onPrevMonth, onNextMonth }: CalendarGridProps) => {
    const calendarDays = useMemo(() => {
        const days: (number | null)[] = []
        for (let i = 0; i < getFirstDayOfMonth(currentMonth); i++) days.push(null)
        for (let i = 1; i <= getDaysInMonth(currentMonth); i++) days.push(i)
        return days
    }, [currentMonth])

    const minDateString = getMinDate()
    const [minYear, minMonth, minDay] = minDateString.split("-").map(Number)
    const minDate = new Date(minYear, minMonth - 1, minDay)
    minDate.setHours(0, 0, 0, 0)

    return (
        <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Select Date
            </h3>

            <div className="flex items-center justify-between mb-4">
                <button onClick={onPrevMonth} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h4 className="font-semibold text-gray-900 text-sm">
                    {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                </h4>
                <button onClick={onNextMonth} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map((day) => (
                    <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">{day}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                    if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />
                    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                    dateObj.setHours(0, 0, 0, 0)
                    const dateString = formatDate(dateObj)
                    const isSelected = dateString === selectedDate
                    const isWorking = isWorkingDay(dateObj)
                    const isDisabled = dateObj < new Date(getMinDate())

                    return (
                        <button
                            key={day}
                            onClick={() => onDateClick(day)}
                            disabled={!isWorking || isDisabled}
                            className={`aspect-square rounded-lg font-medium text-sm transition-all flex items-center justify-center ${
                                isSelected ? "bg-blue-500 text-white" : isWorking && !isDisabled ? "bg-white text-gray-900 border border-gray-300 hover:bg-blue-50 cursor-pointer" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            {day}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

interface TimeSlotSelectorProps {
    room: RoomDetail
    selectedSlots: string[]
    onSlotToggle: (slot: string) => void
    isWorkingDay: boolean
}

const TimeSlotSelector = ({ room, selectedSlots, onSlotToggle, isWorkingDay }: TimeSlotSelectorProps) => {
    const slotsAvailable = isWorkingDay && room.availableSlots.length > 0
    return (
        <div>
            <h3 className="font-semibold text-gray-900 mb-3">Available Time Slots</h3>
            {slotsAvailable ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {room.availableSlots.map((slot) => (
                        <button
                            key={slot}
                            onClick={() => onSlotToggle(slot)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                                selectedSlots.includes(slot) ? "bg-cyan-500 text-white border border-cyan-600" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                            {slot}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="p-3 bg-white border border-gray-200 rounded-lg text-center text-sm text-gray-500">
                    {isWorkingDay ? "No available slots for this date." : "Please select a working day to see time slots."}
                </div>
            )}
        </div>
    )
}

interface RoomHeaderProps {
    room: RoomDetail
}

const RoomHeader = ({ room }: RoomHeaderProps) => (
    <>
        <div>
            <h1 className={typography.h1}>{room.name}</h1>
            <p className={`${typography.body} text-gray-600 mt-2`}>{room.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 py-6 border-y border-gray-100">
            {ROOM_INFO_FIELDS.map(({ label, value, icon: Icon }) => (
                <div key={label}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
                    <div className="flex items-center gap-2">
                        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
                        <p className="text-gray-900 font-medium">{value(room)}</p>
                    </div>
                </div>
            ))}
        </div>

        <div>
            <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
            <div className="flex flex-wrap gap-2">
                {room.features.map((feature) => (
                    <span key={feature} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {feature}
                    </span>
                ))}
            </div>
        </div>

        <div>
            <h3 className="font-semibold text-gray-900 mb-3">About This Room</h3>
            <p className="text-gray-700 leading-relaxed">{room.longDescription}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
                <p className="font-semibold text-amber-900 text-sm">Working Days Only</p>
                <p className="text-amber-800 text-sm mt-1">This room can only be booked on working days: Monday through Friday</p>
            </div>
        </div>
    </>
)

export default function RoomDetailPage() {
    const router = useRouter()
    const params = useParams()
    const roomId = params.id as string
    const [isBooking, setIsBooking] = useState(false)
    const [selectedDate, setSelectedDate] = useState(getMinDate())
    const [selectedSlot, setSelectedSlot] = useState("")
    const [currentMonth, setCurrentMonth] = useState(new Date(getMinDate()))
    
    // Form fields
    const [borrowerName, setBorrowerName] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [selectedSlots, setSelectedSlots] = useState<string[]>([])

    const room: RoomDetail = { ...MOCK_ROOM, id: roomId }
    const { dayName, isSelectedDateWorkingDay } = useMemo(() => {
        if (!selectedDate) return { dayName: "", isSelectedDateWorkingDay: false }
        const [year, month, day] = selectedDate.split("-").map(Number)
        const dateObj = new Date(year, month - 1, day)
        return { dayName: WEEKDAYS_FULL[dateObj.getDay()], isSelectedDateWorkingDay: isWorkingDay(dateObj) }
    }, [selectedDate])

    const handleDateClick = (day: number): void => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        newDate.setHours(0, 0, 0, 0)
        if (isWorkingDay(newDate)) {
            setSelectedDate(formatDate(newDate))
            setSelectedSlot("")
        }
    }

    const handleSlotToggle = (slot: string): void => {
        setSelectedSlots(prev => 
            prev.includes(slot) 
                ? prev.filter(s => s !== slot)
                : [...prev, slot]
        )
    }

    const handleBook = async (): Promise<void> => {
        if (selectedSlots.length === 0 || !isSelectedDateWorkingDay || !borrowerName.trim() || !phoneNumber.trim()) {
            alert("Please fill in all required fields")
            return
        }
        
        if (phoneNumber.length < 10) {
            alert("Please enter a valid phone number")
            return
        }

        setIsBooking(true)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        
        const totalPrice = room.pricePerHour * selectedSlots.length
        const bookingDetails = `
Room Booking Confirmation:
- Room: ${room.name}
- Date: ${selectedDate}
- Time Slots: ${selectedSlots.join(", ")}
- Duration: ${selectedSlots.length} hour(s)
- Borrower Name: ${borrowerName}
- Phone Number: ${phoneNumber}
- Total Price: Rp ${room.pricePerHour.toLocaleString()}
        `
        alert(bookingDetails)
        
        setIsBooking(false)
        setSelectedSlots([])
        setBorrowerName("")
        setPhoneNumber("")
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="sticky top-16 z-40 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Rooms
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="md:col-span-1">
                        <div className="sticky top-32 space-y-4">
                            <img src={room.image} alt={room.name} className="w-full rounded-lg shadow-lg object-cover aspect-[4/3]" />
                            {room.status === "available" && (
                                <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-600" />
                                    <span className="font-semibold text-sm text-green-700">Available to Book</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-8">
                        <RoomHeader room={room} />

                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                                <CalendarGrid
                                    currentMonth={currentMonth}
                                    selectedDate={selectedDate}
                                    onDateClick={handleDateClick}
                                    onPrevMonth={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                    onNextMonth={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                />

                                <div className="space-y-6">
                                    {selectedDate && (
                                        <div className="p-3 bg-white border border-blue-200 rounded-lg">
                                            <p className="text-xs text-gray-500 font-semibold uppercase">Selected Date</p>
                                            <p className="text-gray-900 font-semibold mt-1">{dayName}, {selectedDate}</p>
                                        </div>
                                    )}

                                    <TimeSlotSelector
                                        room={room}
                                        selectedSlots={selectedSlots}
                                        onSlotToggle={handleSlotToggle}
                                        isWorkingDay={isSelectedDateWorkingDay}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Borrower Information Form */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
                            <h3 className="font-semibold text-gray-900 text-lg">Borrower Information</h3>

                            {/* Borrower Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Borrower Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={borrowerName}
                                    onChange={(e) => setBorrowerName(e.target.value)}
                                    placeholder="Enter your full name"
                                    className="w-full px-4 py-2.5 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
                                />
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="Enter your phone number (e.g., 08123456789)"
                                    className="w-full px-4 py-2.5 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
                                />
                            </div>

                            {/* Total Price */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <p className="text-sm text-gray-600 mb-1">Total Price</p>
                                <p className="text-2xl font-bold text-blue-600">Rp {room.pricePerHour.toLocaleString()}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Fixed price per room booking
                                </p>
                            </div>

                            <Button
                                onClick={handleBook}
                                disabled={isBooking || selectedSlots.length === 0 || !isSelectedDateWorkingDay}
                                className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg disabled:cursor-not-allowed transition-all"
                            >
                                {isBooking ? "Processing..." : selectedSlots.length > 0 ? "Complete Booking" : "Select Time Slots to Book"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}