"use client";

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getAuthToken, removeAuthToken } from "@/lib/auth"
import { Loader2 } from "lucide-react"
import DashboardHeader from "@/components/common/dashboard-header"
import Footer from "@/components/common/Footer"

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const token = getAuthToken();

		if (!token) {
			console.log(
				"[DashboardLayout] No token found, redirecting to sign-in."
			);
			removeAuthToken(); // Pastiin bersih
			router.replace("/sign-in");
		} else {
			// Token ada, user boleh masuk
			setIsLoading(false);
		}
	}, [router]);

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center bg-gray-100">
				<Loader2 className="h-12 w-12 animate-spin text-blue-500" />
				<p className="ml-4 text-lg font-medium text-gray-700">
					Memverifikasi sesi...
				</p>
			</div>
		);
	}
    return (
      <div className="flex flex-col min-h-screen">
        <DashboardHeader />
        <main className="flex-grow pt-20">{children}</main>
        <Footer />
      </div>
    )
}