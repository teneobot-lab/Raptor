import { getDashboardStats } from "@/actions/dashboard.actions";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
    const stats = await getDashboardStats();
    return <DashboardClient stats={stats as any} />;
}
