"use client"
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
    const { isAuthenticated, user, logout } = useAuth();

    return (
        <nav className="w-full py-5 flex items-center justify-between">
            <div className="flex items-center gap-8" >
                <Link href="/" className="flex items-center gap-2">
                <Image src="/logo.jpeg" alt="HanscoDev Logo" width={140} height={40} priority/>
</Link>
                <div className="flex items-center gap-2">
                    <Link  className={buttonVariants({variant:'ghost'})} href='/'>
                        Home</Link>
                    <Link className={buttonVariants({variant:'ghost'})} href='/about'>About</Link>
                    <Link className={buttonVariants({variant:'ghost'})} href='/contact'>Contact</Link>

                </div>
            </div>
            <div className="flex items-center gap-2">
                {isAuthenticated ? (
                    <>
                        <span className="text-sm font-medium">
                            {user?.name || user?.email?.split('@')[0]}
                        </span>
                        <button 
                            onClick={logout}
                            className={buttonVariants({ variant: 'outline' })}
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link className={buttonVariants({variant:'outline'})} href='/auth/signup'>Sign up</Link>
                        <Link className={buttonVariants()} href='/auth/login'>Login</Link>
                    </>
                )}
                <ThemeToggle />
            </div>

        </nav>
    );
}