"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Users, Book, DoorOpen, Box, Hourglass,
    Menu, 
    // X, 
    LayoutDashboard, LucideIcon,
    LogOutIcon
} from "lucide-react";
import { colors } from "@/styles/colors";

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

// interface NavItemProps {
//     link: LinkType;
//     isActive: (href: string) => boolean;
// }

// function NavItem({ link, isActive }: NavItemProps) {
//     const [isOverlayOpen, setIsOverlayOpen] = useState(false);
//     const Icon = link.icon;
//     return (
//         <Link
//             href={link.href}
//             onClick={() => setIsOverlayOpen(false)}
//             style={{
//                 backgroundColor: isActive(link.href) ? colors.primary : "transparent",
//                 color: isActive(link.href) ? "white" : colors.textSecondary,
//             }}
//             className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
//                 !isActive(link.href) ? "hover:bg-white/10" : ""
//             }`}
//         >
//             <Icon className="w-5 h-5 flex-shrink-0" />
//             <span className="text-sm">{link.label}</span>
//         </Link>
//     );
// }

export default function AdminSidebar() {
    const pathname = usePathname();
    const isActive = useCallback((href: string) => pathname.startsWith(href), [pathname]);
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);

    const handleNavClick = () => {
        setIsOverlayOpen(false);
    };

    return (
        <>
            {/* Fixed Top Header - Glass Effect */}
            <div 
                className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b shadow-lg"
                style={{
                    backgroundColor: `${colors.primary}15`,
                    borderColor: `${colors.primary}40`,
                }}
            >
                <div className="flex items-center gap-4 px-4 sm:px-6 lg:px-10 py-4">
                    {/* Menu Button */}
                    <button
                        onClick={() => setIsOverlayOpen(!isOverlayOpen)}
                        className="p-2 rounded-lg transition-colors"
                        style={{
                            color: colors.primary,
                        }}
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Title */}
                    <img src="/logo(min).png" alt="Logo" className="w-8 h-8 object-contain" />
                    <span 
                        className="text-xl font-bold"
                        style={{ color: colors.primaryDark }}
                    >
                        Admin Dashboard
                    </span>
                </div>
            </div>

            {/* Sidebar Overlay Backdrop */}
            <AnimatePresence>
                {isOverlayOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOverlayOpen(false)}
                        className="fixed inset-0 bg-black/50 z-40 top-16"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Overlay - Half Screen */}
            <AnimatePresence>
                {isOverlayOpen && (
                    <motion.div
                        initial={{ x: -400 }}
                        animate={{ x: 0 }}
                        exit={{ x: -400 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed left-0 top-16 w-1/2 sm:w-80 h-[calc(100vh-64px)] backdrop-blur-md z-40 flex flex-col shadow-2xl"
                        style={{
                            backgroundColor: `${colors.bgTertiary}D0`,
                            borderColor: `${colors.primary}40`,
                            borderRight: `1px solid ${colors.primary}40`,
                        }}
                    >
                        {/* Navigation */}
                        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                            {adminNavs.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={handleNavClick}
                                    style={{
                                        backgroundColor: isActive(link.href) ? colors.primary : "transparent",
                                        color: isActive(link.href) ? "white" : colors.textSecondary,
                                    }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                                        !isActive(link.href) ? "hover:bg-white/10" : ""
                                    }`}
                                >
                                    <link.icon className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm">{link.label}</span>
                                </Link>
                            ))}
                        </nav>

                        {/* Logout Button */}
                        <div 
                            className="px-4 py-4 border-t"
                            style={{
                                borderColor: `${colors.primary}40`,
                            }}
                        >
                            <Link
                                href="/dashboard"
                                onClick={handleNavClick}
                                className="flex items-center justify-center gap-3 px-4 py-3 text-white rounded-lg transition-colors font-medium text-sm w-full hover:opacity-80"
                                style={{
                                    backgroundColor: colors.danger,
                                }}
                            >
                                <LogOutIcon className="w-5 h-5" />
                                <span>Logout</span>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Spacer untuk fixed header */}
            <div className="h-16" />
        </>
    );
}