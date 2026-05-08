"use server"

import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";

export async function loginAction(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error("Invalid credentials");
    }

    const sessionData = { id: user.id, role: user.role, name: user.name };
    const sessionToken = await encrypt(sessionData);

    const cookieStore = await cookies();
    cookieStore.set("pos_auth_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 // 1 day
    });

    return { success: true, role: user.role };
}

export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete("pos_auth_session");
}
