"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sprout,
  ArrowRight,
  Cpu,
  CloudRain,
  ScanSearch,
} from "lucide-react"
import Image from "next/image"

export function HeroSection() {
  const handleGetStarted = () => {
    // Scroll to dashboard section
    const dashboardSection = document.getElementById("dashboard")
    if (dashboardSection) {
      dashboardSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleScanCrop = () => {
    const diseaseSection = document.getElementById("disease")
    if (diseaseSection) {
      diseaseSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section className="relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-farm.jpg"
          alt="Smart agriculture field"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 lg:px-8 lg:py-32">
        <div className="max-w-3xl">
          <Badge
            variant="secondary"
            className="mb-6 border border-primary/20 bg-primary/10 text-primary"
          >
            <Cpu className="size-3" />
            <span>{"AI-Powered Agriculture / एआई-संचालित कृषि"}</span>
          </Badge>

          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            {"Smart Farming, "}
            <span className="text-primary">{"Smarter Future"}</span>
          </h1>

          <p className="mt-3 text-xl font-medium text-foreground/70 md:text-2xl">
            {"स्मार्ट खेती, बेहतर भविष्य"}
          </p>

          <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            {
              "Empowering Indian farmers with AI-driven soil analytics, crop disease detection, weather insights, and real-time government scheme updates. / भारतीय किसानों को एआई-संचालित मिट्टी विश्लेषण, फसल रोग पहचान, मौसम अपडेट और सरकारी योजना की जानकारी से सशक्त बनाना।"
            }
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button size="lg" className="font-semibold" onClick={handleGetStarted}>
              <Sprout className="size-5" />
              <span>{"Get Started / शुरू करें"}</span>
              <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={handleScanCrop}>
              <ScanSearch className="size-5" />
              <span>{"Scan Crop / फसल स्कैन करें"}</span>
            </Button>
          </div>

          {/* Stats Row */}
          <div className="mt-14 grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              {
                value: "50K+",
                label: "Farmers / किसान",
                icon: Sprout,
              },
              {
                value: "98%",
                label: "Accuracy / सटीकता",
                icon: Cpu,
              },
              {
                value: "12+",
                label: "States / राज्य",
                icon: CloudRain,
              },
              {
                value: "24/7",
                label: "Support / सहायता",
                icon: ScanSearch,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border/60 bg-card/80 px-4 py-4 backdrop-blur-sm"
              >
                <stat.icon className="mb-2 size-5 text-primary" />
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
