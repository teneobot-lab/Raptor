"use server"

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getProducts(search?: string) {
    let whereClause = {};
    if (search) {
        whereClause = {
            OR: [
                { name: { contains: search } },
                { barcode: { contains: search } }
            ]
        }
    }
    return prisma.product.findMany({
        where: whereClause,
        orderBy: { name: 'asc' }
    });
}

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

export async function createProduct(data: { name: string, price: number, stock: number, category: string, barcode: string }) {
    await verifyAdmin();
    const p = await prisma.product.create({
        data
    });
    revalidatePath("/products");
    revalidatePath("/checkout");
    return p;
}
