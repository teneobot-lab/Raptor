"use server"

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

import { cookies } from "next/headers";

async function verifyAdmin() {
    const cookieStore = await cookies();
    const sessionStr = cookieStore.get('pos_auth_session')?.value;
    if (!sessionStr) throw new Error("Unauthorized");
    try {
        if (JSON.parse(sessionStr).role !== 'ADMIN') throw new Error("Unauthorized");
    } catch (e) {
        throw new Error("Unauthorized");
    }
}

export async function getUsers() {
    await verifyAdmin();
    return prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
    });
}

export async function createUser(data: any) {
    await verifyAdmin();
    const result = await prisma.user.create({
        data
    });
    revalidatePath("/users");
    return result;
}
