"use server"
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
export async function loginAction(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    console.log("[login] attempt:", email);
    if (!email || !password) {
        throw new Error("Email and password are required");
    }
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });
        console.log("[login] user found:", !!user);
        if (!user) throw new Error("Invalid credentials");
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("[login] password match:", isMatch);
        if (!isMatch) throw new Error("Invalid credentials");
        const sessionData = { id: user.id, role: user.role, name: user.name };
        const sessionToken = await encrypt(sessionData);
        const cookieStore = await cookies();
        cookieStore.set("pos_auth_session", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24
        });
        return { success: true, role: user.role };
    } catch (error) {
        console.error("[login] error:", error);
        throw error;
    }
}
export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete("pos_auth_session");
}
