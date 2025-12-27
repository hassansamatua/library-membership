"use client"
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
    const { isAuthenticated, user, logout } = useAuth();

    return (
        <nav className="w-full py-5 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2">
                        <Image 
                            src="/logo.jpeg" 
                            alt="HanscoDev Logo" 
                            width={140} 
                            height={40} 
                            priority
                            className="dark:invert dark:brightness-90"
                        />
                    </Link>
                    <div className="hidden md:flex items-center gap-1">
                        <Link className={buttonVariants({variant:'ghost'})} href='/'>
                            Home
                        </Link>
                        <Link className={buttonVariants({variant:'ghost'})} href='/about'>
                            About
                        </Link>
                        <Link className={buttonVariants({variant:'ghost'})} href='/contact'>
                            Contact
                        </Link>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {isAuthenticated ? (
                        <>
                            <span className="hidden sm:inline text-sm font-medium text-foreground">
                                {user?.name || user?.email?.split('@')[0]}
                            </span>
                            <Link 
                                href={user?.isAdmin ? '/admin' : '/dashboard'}
                                className={buttonVariants({ variant: 'ghost' })}
                            >
                                <span className="hidden sm:inline">
                                    {user?.isAdmin ? 'Admin Dashboard' : 'Dashboard'}
                                </span>
                                <span className="sm:hidden">
                                    {user?.isAdmin ? 'Admin' : 'Dash'}
                                </span>
                            </Link>
                            <button 
                                onClick={logout}
                                className={buttonVariants({ variant: 'outline' })}
                            >
                                <span className="hidden sm:inline">Logout</span>
                                <span className="sm:hidden">Out</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link 
                                className={`${buttonVariants({variant:'outline'})} hidden sm:inline-flex`} 
                                href='/auth/signup'
                            >
                                Sign up
                            </Link>
                            <Link 
                                className={`${buttonVariants()} hidden sm:inline-flex`} 
                                href='/auth/login'
                            >
                                Login
                            </Link>
                            <Link 
                                className={`${buttonVariants({variant:'outline'})} sm:hidden`} 
                                href='/auth/login'
                            >
                                Login
                            </Link>
                        </>
                    )}
                    <ThemeToggle />
                </div>
            </div>
        </nav>
    );
}