'use client'

import { Loan } from '@/types' 
import { Card } from '@/components/ui/card' 
import Link from 'next/link'
import { 
    Clock, BookOpen, DollarSign, ArrowRight, 
    AlertCircle, CheckCircle 
} from 'lucide-react' 

const formatDate = (dateString: string | Date | null | undefined) => {
  if (!dateString) return "N/A"; 
  try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString('id-ID', {
          day: 'numeric', month: 'short', year: 'numeric'
      });
  } catch {
      return "N/A";
  }
};

const calculateBorrowedAt = (dueDateString: string): Date | null => {
    try {
        const dueDate = new Date(dueDateString);
        if (isNaN(dueDate.getTime())) return null;
        const borrowedDate = new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        return borrowedDate;
    } catch {
        return null;
    }
};

interface LoanCardProps {
  loan: Loan
}

export const LoanCard: React.FC<LoanCardProps> = ({ loan }) => {
  const loanStatusString = loan.status as string;
  
  const statusConfig = {
    borrowed: { color: 'bg-cyan-100 text-cyan-800', icon: Clock, label: 'BORROWED' },
    returned: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'RETURNED' },
    late: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'LATE' }, 
  }

  const definitiveId = (loan.id || loan._id) as string;
  if (!definitiveId) {
    console.error("Loan object is missing both id and _id:", loan);
    return null;
  }

  const config = statusConfig[loanStatusString as keyof typeof statusConfig] || statusConfig.borrowed; 
  
  const isLate = loanStatusString === 'late';
  const isReturned = loanStatusString === 'returned';
  const hasFine = (loan.fineAmount || 0) > 0;
  
  const daysLeft = Math.ceil(
    (new Date(loan.dueDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  )

  const daysOverdue = Math.abs(daysLeft)

  const borrowedDate = loan.borrowDate ? loan.borrowDate : calculateBorrowedAt(loan.dueDate);
  
  let linkText = "View Details & Return";
  let linkColor = "text-cyan-600 hover:text-cyan-700";
  
  if (isLate && !isReturned) {
    linkColor = "text-red-600 hover:text-red-700";
    if (hasFine && loan.fineAmount! >= loan.depositAmount) {
      linkText = "Return (Deposit Hangus)";
    } else if (hasFine) {
      linkText = "Return (Denda dipotong)";
    }
  }

  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
        isLate ? 'border-l-4 border-red-500 hover:shadow-red-300/30' : 'hover:border-cyan-400'
    } h-full flex flex-col`}>
        
      <div className="space-y-4 p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start border-b pb-3 border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{loan.book.title}</h3>
          
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${config.color} flex-shrink-0`}
          >
            <config.icon className='w-3 h-3' />
            {config.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-y-3 text-sm">
          
          <InfoItem icon={BookOpen} label="Author" value={loan.book.author} />
          
          <InfoItem icon={DollarSign} label="Deposit" value={`Rp ${loan.depositAmount.toLocaleString('id-ID')}`} />
          
          <InfoItem icon={Clock} label="Borrowed" value={formatDate(borrowedDate)} />

          <InfoItem 
            icon={Clock} 
            label={isLate ? "LATE DATE" : "Due Date"} 
            value={formatDate(loan.dueDate)} 
            valueClass={isLate ? 'text-red-600 font-bold' : 'text-gray-900'}
          />
        </div>

        {hasFine && !isReturned && (
          <InfoItem 
            icon={AlertCircle} 
            label="Current Fine" 
            value={`Rp ${loan.fineAmount!.toLocaleString('id-ID')}`} 
            valueClass="text-red-600 font-bold"
          />
        )}

        {!isReturned && (
          <div className={`mt-2 p-3 rounded-lg text-sm font-semibold ${isLate ? 'bg-red-50 text-red-800' : 'bg-cyan-50 text-cyan-800'}`}>
            {isLate 
              ? `LATE by ${daysOverdue} days!`
              : `${daysLeft} days left to return.`
            }
          </div>
        )}

        <div className='mt-auto pt-4 border-t border-gray-100'>
            <Link
                href={`/loans/${definitiveId}`}
                className={`transition-colors text-sm font-semibold flex items-center gap-1 ${linkColor}`}
            >
                {linkText} <ArrowRight className='w-4 h-4' />
            </Link>
        </div>
      </div>
    </Card>
  )
}

const InfoItem = ({ icon: Icon, label, value, valueClass = 'text-gray-900' }: { icon: any, label: string, value: string, valueClass?: string }) => (
    <div>
        <p className='text-xs text-gray-500 flex items-center gap-1.5 font-semibold uppercase'>
            <Icon className='w-3 h-3 text-gray-400' /> {label}
        </p>
        <p className={`font-medium mt-1 ${valueClass}`}>{value}</p>
    </div>
)