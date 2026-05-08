import { getUsers } from "@/actions/user.actions";
import { Card } from "@/components/ui/card";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { format } from "date-fns";

export default async function UsersPage() {
    const users = await getUsers();

    return (
        <div className="flex-1 flex flex-col pt-8">
            <div className="px-8 pb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Users</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage system access and roles.</p>
                </div>
                <UserFormDialog />
            </div>

            <div className="px-8 flex-1 overflow-hidden">
                <Card className="h-full flex flex-col">
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Name</th>
                                    <th className="px-6 py-3 font-medium">Email</th>
                                    <th className="px-6 py-3 font-medium">Role</th>
                                    <th className="px-6 py-3 font-medium">Created At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="px-6 py-3 font-medium text-slate-900">{user.name}</td>
                                        <td className="px-6 py-3">{user.email}</td>
                                        <td className="px-6 py-3">
                                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">{format(new Date(user.createdAt), 'PP')}</td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="h-24 text-center text-slate-500">No users found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
