"use client"
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, Users, Receipt, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/actions/auth.actions';

export function DashboardSidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    ...(role === 'ADMIN' ? [{ icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' }] : []),
    { icon: ShoppingCart, label: 'POS Checkout', path: '/checkout' },
    ...(role === 'ADMIN' ? [
        { icon: Package, label: 'Products', path: '/products' },
        { icon: Receipt, label: 'Transactions', path: '/transactions' },
        { icon: Users, label: 'Users', path: '/users' }
    ] : []),
  ];

  return (
      <aside className="w-64 bg-white border-r flex flex-col h-full">
        <div className="h-16 flex items-center px-6 border-b">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <ShoppingCart size={18} />
            </div>
            NodePOS Pro
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <a
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <item.icon size={18} className={isActive ? "text-blue-600" : "text-slate-400"} />
                {item.label}
              </a>
            );
          })}
        </div>
        <div className="p-4 border-t">
            <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
                <LogOut size={18} className="mr-2" /> Logout
            </Button>
        </div>
      </aside>
  );
}
