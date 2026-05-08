import { cookies } from 'next/headers';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { decrypt } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionStr = cookieStore.get('pos_auth_session')?.value;
  let role = 'CASHIER';
  if (sessionStr) {
      try {
          const session = await decrypt(sessionStr);
          if (session) {
              role = session.role;
          }
      } catch (e) {}
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar role={role} />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
