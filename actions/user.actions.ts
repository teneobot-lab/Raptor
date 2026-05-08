"use server"
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import bcrypt from "bcryptjs";

async function verifyAdmin() {
    const cookieStore = await cookies();
    const sessionStr = cookieStore.get('pos_auth_session')?.value;
    if (!sessionStr) throw new Error("Unauthorized");
    const session = await decrypt(sessionStr);
    if (!session || session.role !== 'ADMIN') throw new Error("Unauthorized");
}

export async function getUsers() {
    return prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true, name: true, email: true, role: true,
            isActive: true, createdAt: true,
            _count: { select: { transactions: true } }
        }
    });
}

export async function createUser(data: { name: string; email: string; password: string; role: string }) {
    await verifyAdmin();
    const hashed = await bcrypt.hash(data.password, 10);
    const u = await prisma.user.create({ data: { ...data, password: hashed } });
    revalidatePath("/users");
    return u;
}

export async function updateUser(id: string, data: { name?: string; email?: string; role?: string; isActive?: boolean; password?: string }) {
    await verifyAdmin();
    const updateData: any = { ...data };
    if (updateData.password && updateData.password.length > 0) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
        delete updateData.password;
    }
    const u = await prisma.user.update({ where: { id }, data: updateData });
    revalidatePath("/users");
    return u;
}

export async function deleteUser(id: string) {
    await verifyAdmin();
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/users");
}
