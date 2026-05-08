"use server"
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

async function verifyAdmin() {
    const cookieStore = await cookies();
    const sessionStr = cookieStore.get('pos_auth_session')?.value;
    if (!sessionStr) throw new Error("Unauthorized");
    const session = await decrypt(sessionStr);
    if (!session || session.role !== 'ADMIN') throw new Error("Unauthorized");
}

async function getSession() {
    const cookieStore = await cookies();
    const sessionStr = cookieStore.get('pos_auth_session')?.value;
    if (!sessionStr) throw new Error("Unauthorized");
    const session = await decrypt(sessionStr);
    if (!session) throw new Error("Unauthorized");
    return session;
}

export async function getProducts(search?: string) {
    const where: any = { isActive: true };
    if (search) {
        where.OR = [
            { name: { contains: search } },
            { barcode: { contains: search } }
        ];
    }
    return prisma.product.findMany({ where, orderBy: { name: 'asc' } });
}

export async function getAllProducts(search?: string) {
    const where: any = {};
    if (search) {
        where.OR = [
            { name: { contains: search } },
            { barcode: { contains: search } },
            { category: { contains: search } }
        ];
    }
    return prisma.product.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function createProduct(data: {
    name: string; price: number; cost: number;
    stock: number; minStock: number; category: string; barcode: string;
}) {
    await verifyAdmin();
    const session = await getSession();
    const p = await prisma.product.create({ data });
    await prisma.stockMovement.create({
        data: {
            productId: p.id,
            type: 'IN',
            quantity: data.stock,
            notes: 'Initial stock',
            createdBy: session.id
        }
    });
    revalidatePath("/products");
    revalidatePath("/checkout");
    return p;
}

export async function updateProduct(id: string, data: {
    name?: string; price?: number; cost?: number;
    stock?: number; minStock?: number; category?: string;
    barcode?: string; isActive?: boolean;
}) {
    await verifyAdmin();
    const p = await prisma.product.update({ where: { id }, data });
    revalidatePath("/products");
    revalidatePath("/checkout");
    return p;
}

export async function deleteProduct(id: string) {
    await verifyAdmin();
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/products");
}

export async function adjustStock(productId: string, quantity: number, type: 'IN' | 'OUT' | 'ADJUSTMENT', notes?: string) {
    await verifyAdmin();
    const session = await getSession();
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found");
    const newStock = type === 'IN'
        ? product.stock + quantity
        : type === 'OUT'
        ? product.stock - quantity
        : quantity;
    if (newStock < 0) throw new Error("Stock cannot be negative");
    await prisma.$transaction([
        prisma.product.update({ where: { id: productId }, data: { stock: newStock } }),
        prisma.stockMovement.create({
            data: { productId, type, quantity, notes, createdBy: session.id }
        })
    ]);
    revalidatePath("/products");
    revalidatePath("/checkout");
}

export async function getStockMovements(productId?: string) {
    return prisma.stockMovement.findMany({
        where: productId ? { productId } : {},
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { product: { select: { name: true } } }
    });
}

export async function getLowStockProducts() {
    return prisma.product.findMany({
        where: { isActive: true, stock: { lte: prisma.product.fields.minStock } }
    });
}
