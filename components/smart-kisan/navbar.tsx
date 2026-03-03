"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Leaf,
  Menu,
  X,
  User,
  LogOut,
  UserCircle,
} from "lucide-react"

interface NavbarProps {
  user?: any
  onOpenProfile?: () => void
}

export function Navbar({ user, onOpenProfile }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loadingAuth, setLoadingAuth] = useState(false)
  const [authMessage, setAuthMessage] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <a href="#" className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
            <Leaf className="size-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight text-foreground">
              SmartKisan AI
            </span>
            <span className="text-[10px] leading-tight text-muted-foreground">
              {"स्मार्ट किसान एआई"}
            </span>
          </div>
        </a>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-6 md:flex">
          <a
            href="#dashboard"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {"Dashboard / डैशबोर्ड"}
          </a>
          <a
            href="#analytics"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {"Analytics / विश्लेषण"}
          </a>
          <a
            href="#disease"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {"Disease AI / रोग पहचान"}
          </a>
          <a
            href="#schemes"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {"Gov Schemes / सरकारी योजनाएं"}
          </a>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Button variant="outline" size="sm" onClick={onOpenProfile}>
                <UserCircle className="size-4" />
                <span>{"My Profile / मेरी प्रोफ़ाइल"}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut()
                }}
              >
                <LogOut className="size-4" />
                <span>{"Logout / लॉगआउट"}</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setLoginOpen(true)}>
                <User className="size-4" />
                <span>{"Farmer Login / किसान लॉगिन"}</span>
              </Button>
              <Button size="sm" onClick={() => setRegisterOpen(true)}>
                <Leaf className="size-4" />
                <span>{"Sign Up / साइन अप"}</span>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </nav>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="border-t border-border bg-card px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <a
              href="#dashboard"
              className="text-sm font-medium text-muted-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {"Dashboard / डैशबोर्ड"}
            </a>
            <a
              href="#analytics"
              className="text-sm font-medium text-muted-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {"Analytics / विश्लेषण"}
            </a>
            <a
              href="#disease"
              className="text-sm font-medium text-muted-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {"Disease AI / रोग पहचान"}
            </a>
            <a
              href="#schemes"
              className="text-sm font-medium text-muted-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {"Gov Schemes / सरकारी योजनाएं"}
            </a>
            {user ? (
              <>
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => { setMobileOpen(false); onOpenProfile?.(); }}>
                  <UserCircle className="size-4" />
                  <span>{"My Profile / मेरी प्रोफ़ाइल"}</span>
                </Button>
                <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={async () => { setMobileOpen(false); await supabase.auth.signOut(); }}>
                  <LogOut className="size-4" />
                  <span>{"Logout / लॉगआउट"}</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => { setMobileOpen(false); setLoginOpen(true); }}>
                  <User className="size-4" />
                  <span>{"Farmer Login / किसान लॉगिन"}</span>
                </Button>
                <Button size="sm" className="mt-2 w-full" onClick={() => { setMobileOpen(false); setRegisterOpen(true); }}>
                  <Leaf className="size-4" />
                  <span>{"Sign Up / साइन अप"}</span>
                </Button>
              </>
            )}
          </div>
        </div>
      )}

    </header>

      {mounted && loginOpen && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Farmer Login</h3>
                <button
                  onClick={() => setLoginOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  setLoadingAuth(true)
                  setAuthMessage("")
                  try {
                    const { data, error } = await supabase.auth.signInWithPassword({
                      email,
                      password,
                    })
                    if (error) {
                      setAuthMessage("Invalid email or password. Please try again.")
                    } else {
                      setLoginOpen(false)
                      setEmail("")
                      setPassword("")
                      setAuthMessage("")
                    }
                  } catch (err) {
                    console.error(err)
                    setAuthMessage("Login failed. Please try again.")
                  } finally {
                    setLoadingAuth(false)
                  }
                }}
              >
                {authMessage && (
                  <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                    {authMessage}
                  </div>
                )}
                <div className="mb-3">
                  <label className="mb-1 block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none"
                    required
                    disabled={loadingAuth}
                  />
                </div>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none"
                    required
                    disabled={loadingAuth}
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" onClick={() => setLoginOpen(false)} type="button">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loadingAuth}>
                    {loadingAuth ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setLoginOpen(false)
                      setRegisterOpen(true)
                      setEmail("")
                      setPassword("")
                    }}
                    className="text-primary hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            </div>
          </div>,
        document.body)}

      {mounted && registerOpen && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Create Farmer Account</h3>
                <button
                  onClick={() => setRegisterOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (password !== confirmPassword) {
                    alert("Passwords do not match")
                    return
                  }
                  setLoadingAuth(true)
                  setAuthMessage("")
                  try {
                    const { data, error } = await supabase.auth.signUp({
                      email,
                      password,
                    })
                    if (error) {
                      alert(error.message)
                      return
                    }

                    // Auto sign-in after successful registration
                    const { error: signInError } =
                      await supabase.auth.signInWithPassword({ email, password })

                    if (signInError) {
                      alert("Account created but auto-login failed: " + signInError.message)
                    }

                    setRegisterOpen(false)
                    setEmail("")
                    setPassword("")
                    setConfirmPassword("")
                  } catch (err) {
                    console.error(err)
                    alert("Sign up failed")
                  } finally {
                    setLoadingAuth(false)
                  }
                }}
              >
                <div className="mb-3">
                  <label className="mb-1 block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none"
                    required
                    disabled={loadingAuth}
                  />
                </div>
                <div className="mb-3">
                  <label className="mb-1 block text-sm font-medium">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none"
                    required
                    disabled={loadingAuth}
                  />
                </div>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none"
                    required
                    disabled={loadingAuth}
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" onClick={() => setRegisterOpen(false)} type="button">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loadingAuth}>
                    {loadingAuth ? "Signing up..." : "Sign up"}
                  </Button>
                </div>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterOpen(false)
                      setLoginOpen(true)
                      setEmail("")
                      setPassword("")
                      setConfirmPassword("")
                    }}
                    className="text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            </div>
          </div>,
        document.body)}
    </>
  )
}
