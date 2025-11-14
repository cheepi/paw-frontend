"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, Calendar, Clock } from 'lucide-react'

interface BookingFormProps {
  roomId: string // leave it like this
  onSubmit: (startDate: string, endDate: string) => Promise<void> 
}

export const BookingForm: React.FC<BookingFormProps> = ({ onSubmit, roomId: _roomId }) => { 
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    const startDateTime = `${date}T${startTime}:00`
    const endDateTime = `${date}T${endTime}:00`

    if (!date || !startTime || !endTime) {
        setError("Please select date and time slots.");
        setIsLoading(false);
        return;
    }

    try {
      await onSubmit(startDateTime, endDateTime)
      
      setDate('')
      setStartTime('')
      setEndTime('')

    } catch (err: any) {
      setError(err.message || 'Booking failed') 
    } finally {
      setIsLoading(false)
    }
  }
  
  const formatDate = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }
  const getMinDate = () => {
    const today = new Date()
    return formatDate(today)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Book This Room</h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Input Date */}
      <div>
        <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Date <span className="text-red-500">*</span>
        </label>
        <Input
          type="date"
          value={date}
          min={getMinDate()}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      {/* Input Time Slots */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Start Time <span className="text-red-500">*</span>
          </label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            step="1800" // 30 minutes
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" /> End Time <span className="text-red-500">*</span>
          </label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            step="1800" // 30 minutes
          />
        </div>
      </div>

      <Button type="submit" variant="primary" size="lg" loading={isLoading}> 
        Book Room
      </Button>
    </form>
  )
}
