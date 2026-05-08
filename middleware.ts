import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/auth';

export async function middleware(request: NextRequest) {
    const isLoginPage = request.nextUrl.pathname.startsWith('/login');
    const authCookie = request.cookies.get('pos_auth_session');

    let role = 'CASHIER';
    let isValidSession = false;

    if (authCookie?.value) {
        try {
            const session = await decrypt(authCookie.value);
            if (session) {
                isValidSession = true;
                role = session.role || 'CASHIER';
            }
        } catch (e) {}
    }

    if (!isLoginPage && !isValidSession) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isLoginPage && isValidSession) {
        return NextResponse.redirect(new URL(role === 'ADMIN' ? '/dashboard' : '/checkout', request.url));
    }

    if (request.nextUrl.pathname === '/') {
        if (isValidSession) {
            return NextResponse.redirect(new URL(role === 'ADMIN' ? '/dashboard' : '/checkout', request.url));
        } else {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Role-based protection
    if (isValidSession && role === 'CASHIER') {
        const path = request.nextUrl.pathname;
        if (path.startsWith('/dashboard') || path.startsWith('/products') || path.startsWith('/transactions') || path.startsWith('/users')) {
            return NextResponse.redirect(new URL('/checkout', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

