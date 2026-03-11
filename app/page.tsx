"use client"

import dynamic from "next/dynamic"
import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"

import { Navbar } from "@/components/smart-kisan/navbar"
import { HeroSection } from "@/components/smart-kisan/hero-section"
import { FarmerDashboard } from "@/components/smart-kisan/farmer-dashboard"
import { GovSchemes } from "@/components/smart-kisan/gov-schemes"
import { Footer } from "@/components/smart-kisan/footer"

/* FarmerProfile now includes soil analytics — loaded without SSR for recharts */
const FarmerProfile = dynamic(
  () =>
    import("@/components/smart-kisan/farmer-profile").then(
      (mod) => mod.FarmerProfile
    ),
  { ssr: false }
)

export default function SmartKisanPage() {
  const [user, setUser] = useState<any>(null)
  const [showProfile, setShowProfile] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const newUser = session?.user ?? null
        setUser(newUser)
        // Auto-show profile when user logs in
        if (newUser) {
          setShowProfile(true)
          // Scroll to profile after a small delay
          setTimeout(() => {
            profileRef.current?.scrollIntoView({ behavior: "smooth" })
          }, 100)
        } else {
          setShowProfile(false)
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const handleOpenProfile = () => {
    setShowProfile(true)
    setTimeout(() => {
      profileRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar user={user} onOpenProfile={handleOpenProfile} />

      <main className="flex-1">
        <HeroSection />

        {/* Show Farmer Profile when logged in */}
        {user && showProfile && (
          <div ref={profileRef}>
            <FarmerProfile user={user} />
          </div>
        )}

        <FarmerDashboard user={user} />
        <GovSchemes />
      </main>

      <Footer />
    </div>
  )
}