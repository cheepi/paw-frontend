"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Users, Book, ArrowLeft, DoorOpen, Box, Hourglass,
    Menu, X, UserCog, LayoutDashboard, LucideIcon
} from "lucide-react";

interface LinkType {
    href: string;
    label: string;
    icon: LucideIcon;
}

const adminNavs: LinkType[] = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Manage Users", icon: Users },
    { href: "/admin/books", label: "Manage Books", icon: Book },
    { href: "/admin/rooms", label: "Manage Rooms", icon: DoorOpen },
    { href: "/admin/bookings", label: "Manage Bookings", icon: Hourglass },
    { href: "/admin/loans", label: "Manage Loans", icon: Box },
];

interface NavItemProps {
    link: LinkType;
    isActive: (href: string) => boolean;
}

function NavItem({ link, isActive }: NavItemProps) {
    const Icon = link.icon;
    return (
        <Link
            href={link.href}
            title={link.label}
            className={`flex items-center gap-3 p-3 rounded-xl font-medium transition-colors hover:shadow-md ${
                isActive(link.href) ? "bg-black/40 text-white shadow-lg" : "text-black/60 hover:bg-black/10 hover:text-black"
            }`}
        >
            <Icon className="w-6 h-6 flex-shrink-0" />
            <span className="whitespace-nowrap">{link.label}</span>
        </Link>
    );
}

export default function AdminSidebar() {
    const pathname = usePathname();
    const isActive = useCallback((href: string) => pathname.startsWith(href), [pathname]);
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [isDragging, setIsDragging] = useState(false);

    return (
        <AnimatePresence>
            <motion.div
                drag
                dragMomentum={false}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => setTimeout(() => setIsDragging(false), 50)}
                onDrag={(_, info) => setPosition({ x: info.point.x, y: info.point.y })}
                style={{ x: position.x, y: position.y }}
                className="fixed z-50"
            >
                {!isOpen && (
                    <div className="relative group">
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            onClick={() => { if (!isDragging) setIsOpen(true) }}
                            className="w-14 h-14 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white shadow-lg cursor-grab active:cursor-grabbing"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Menu className="w-6 h-6 text-black/70" />
                        </motion.button>
                        
                        {/* Tooltip "Drag me!" */}
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            Drag me!
                            {/* Arrow indicator */}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900"></div>
                        </div>
                    </div>
                )}

                {isOpen && (
                    <motion.div
                        initial={{ x: -200, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -200, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="w-64 h-[65vh] flex flex-col p-4 bg-white/20 backdrop-blur border border-white/30 rounded-2xl shadow-2xl overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-black/10 p-1 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 text-black/70" />
                            </button>
                            <div className="flex items-center gap-2">
                                <UserCog className="w-8 h-8 text-black" />
                                <span className="text-xl font-bold text-black/70">Admin</span>
                            </div>
                        </div>

                        <nav className="flex flex-col gap-2">
                            {adminNavs.map((link) => (
                                <NavItem key={link.href} link={link} isActive={isActive} />
                            ))}
                        </nav>

                        <div className="mt-auto">
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-3 p-3 bg-white shadow-lg rounded-xl text-black hover:bg-red-500/90 hover:text-white transition-colors font-medium"
                            >
                                <ArrowLeft className="w-6 h-6" />
                                <span>Keluar Admin</span>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}