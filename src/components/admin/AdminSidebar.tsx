"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Users, Book, DoorOpen, Box, Hourglass,
    Menu, X, UserCog, LayoutDashboard, LucideIcon,
    LogOutIcon, ChevronRight, ChevronLeft
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
    isCollapsed: boolean;
}

function NavItem({ link, isActive, isCollapsed }: NavItemProps) {
    const Icon = link.icon;
    return (
        <Link
            href={link.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                isActive(link.href) 
                    ? "bg-[#1a7b93] text-white shadow-lg" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title={isCollapsed ? link.label : ""}
        >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm whitespace-nowrap">{link.label}</span>}
        </Link>
    );
}

export default function AdminSidebar() {
    const pathname = usePathname();
    const isActive = useCallback((href: string) => pathname.startsWith(href), [pathname]);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <>
            {/* Desktop Sidebar - Collapsible */}
            <div className={`hidden lg:flex fixed left-0 top-0 h-screen bg-white border-r border-slate-200 z-40 flex-col transition-all duration-300 ${
                isCollapsed ? "w-20" : "w-64"
            }`}>
                {/* Header dengan Toggle Button */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
                    {!isCollapsed && (
                        <div className="flex items-center gap-2">
                            <UserCog className="w-6 h-6 text-[#1a7b93]" />
                            <span className="text-lg font-bold text-[#1a7b93]">Admin</span>
                        </div>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                        title={isCollapsed ? "Expand" : "Collapse"}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="w-5 h-5 text-slate-600" />
                        ) : (
                            <ChevronLeft className="w-5 h-5 text-slate-600" />
                        )}
                    </button>
                </div>

                {/* Navigation */}
                <nav className={`flex-1 px-3 py-6 space-y-2 overflow-y-auto ${
                    isCollapsed ? "px-2" : ""
                }`}>
                    {adminNavs.map((link) => (
                        <NavItem key={link.href} link={link} isActive={isActive} isCollapsed={isCollapsed} />
                    ))}
                </nav>

                {/* Logout Button */}
                <div className="px-3 py-4 border-t border-slate-200 bg-white">
                    <Link
                        href="/dashboard"
                        className={`flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm w-full ${
                            isCollapsed ? "justify-center" : ""
                        }`}
                        title={isCollapsed ? "Logout" : ""}
                    >
                        <LogOutIcon className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && <span>Logout</span>}
                    </Link>
                </div>
            </div>

            {/* Mobile Sidebar Toggle */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
                {isMobileOpen ? (
                    <X className="w-6 h-6 text-slate-600" />
                ) : (
                    <Menu className="w-6 h-6 text-slate-600" />
                )}
            </button>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileOpen(false)}
                        className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    />
                )}
            </AnimatePresence>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="lg:hidden fixed left-0 top-0 w-64 h-screen bg-white z-40 flex flex-col shadow-xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <UserCog className="w-6 h-6 text-[#1a7b93]" />
                                <span className="text-lg font-bold text-[#1a7b93]">Admin</span>
                            </div>
                            <button
                                onClick={() => setIsMobileOpen(false)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg"
                            >
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                            {adminNavs.map((link) => (
                                <NavItem key={link.href} link={link} isActive={isActive} isCollapsed={false} />
                            ))}
                        </nav>

                        {/* Logout Button */}
                        <div className="px-4 py-4 border-t border-slate-200">
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm"
                            >
                                <LogOutIcon className="w-5 h-5" />
                                <span>Logout</span>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}