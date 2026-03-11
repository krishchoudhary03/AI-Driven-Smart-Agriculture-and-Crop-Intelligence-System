"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Landmark,
  ArrowRight,
  IndianRupee,
  Shield,
  Tractor,
  Droplets,
  Wheat,
  GraduationCap,
  ExternalLink,
  Loader2,
  RefreshCw,
  CreditCard,
  Sprout,
  Sun,
} from "lucide-react"

/* ── Types ── */
interface Scheme {
  name: string
  name_hi: string
  description: string
  description_hi: string
  benefit: string
  category: string
  category_hi: string
  status: "Active" | "Enrolling" | "Apply Now"
  website: string
  apply_url: string
}

/* ── Icon picker based on category ── */
function getCategoryIcon(category: string) {
  const c = category.toLowerCase()
  if (c.includes("income") || c.includes("financial")) return IndianRupee
  if (c.includes("insurance")) return Shield
  if (c.includes("equipment") || c.includes("mechani")) return Tractor
  if (c.includes("irrigation") || c.includes("water")) return Droplets
  if (c.includes("soil")) return Wheat
  if (c.includes("credit") || c.includes("loan")) return CreditCard
  if (c.includes("education") || c.includes("training")) return GraduationCap
  if (c.includes("market")) return Sun
  if (c.includes("seed") || c.includes("organic")) return Sprout
  return Landmark
}

function statusStyle(status: string) {
  switch (status) {
    case "Active":
      return "bg-primary/15 text-primary border-primary/20"
    case "Enrolling":
      return "bg-amber-100 text-amber-700 border-amber-200"
    case "Apply Now":
      return "bg-blue-100 text-blue-700 border-blue-200"
    default:
      return "bg-primary/15 text-primary border-primary/20"
  }
}

const statusHindi: Record<string, string> = {
  Active: "सक्रिय",
  Enrolling: "नामांकन",
  "Apply Now": "आवेदन करें",
}

export function GovSchemes() {
  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchSchemes = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/gov-schemes")
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to load schemes")
        return
      }
      setSchemes(data.schemes || [])
    } catch (err: any) {
      setError(err.message || "Network error — please try again")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSchemes()
  }, [fetchSchemes])

  return (
    <section id="schemes" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge
            variant="secondary"
            className="mb-3 border border-primary/20 bg-primary/10 text-primary"
          >
            <Landmark className="size-3" />
            <span>{"Government Schemes / सरकारी योजनाएं"}</span>
          </Badge>
          <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
            {"Schemes for Farmers"}
          </h2>
          <p className="mt-1 text-lg text-muted-foreground">
            {"किसानों के लिए सरकारी योजनाएं और सब्सिडी — powered by Gemini AI"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSchemes}
          disabled={loading}
          className="shrink-0"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Loading..." : "Refresh / ताज़ा करें"}</span>
        </Button>
      </div>

      {/* Loading state */}
      {loading && schemes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="mb-4 size-10 animate-spin text-primary" />
          <p className="text-lg font-semibold text-foreground">
            Fetching latest government schemes...
          </p>
          <p className="text-sm text-muted-foreground">
            Gemini AI से नवीनतम सरकारी योजनाएं प्राप्त कर रहे हैं...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchSchemes}>
              <RefreshCw className="size-4" />
              <span>Try Again / पुनः प्रयास करें</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Schemes grid */}
      {schemes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schemes.map((scheme, idx) => {
            const Icon = getCategoryIcon(scheme.category)
            return (
              <Card
                key={`${scheme.name}-${idx}`}
                className="group flex flex-col transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${statusStyle(scheme.status)}`}
                    >
                      {scheme.status} / {statusHindi[scheme.status] || scheme.status}
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 text-base">{scheme.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {scheme.name_hi}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed text-foreground">
                      {scheme.description}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {scheme.description_hi}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground">
                        {"Benefit / लाभ"}
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {scheme.benefit}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {scheme.category} / {scheme.category_hi}
                    </Badge>
                  </div>

                  {/* Live website links */}
                  <div className="flex flex-wrap gap-2 border-t pt-3">
                    {scheme.website && (
                      <a
                        href={scheme.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                      >
                        <ExternalLink className="size-3" />
                        Official Website
                      </a>
                    )}
                    {scheme.apply_url && scheme.apply_url !== scheme.website && (
                      <a
                        href={scheme.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                      >
                        <ArrowRight className="size-3" />
                        Apply Online / ऑनलाइन आवेदन
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* CTA Banner */}
      <Card className="mt-10 border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h3 className="text-xl font-bold text-foreground">
              {"Need help applying? / आवेदन में मदद चाहिए?"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {
                "Visit the official portal links above to apply directly on government websites. / ऊपर दिए गए आधिकारिक पोर्टल लिंक पर जाकर सीधे सरकारी वेबसाइट पर आवेदन करें।"
              }
            </p>
          </div>
          <Button
            size="lg"
            className="shrink-0 font-semibold"
            onClick={() => {
              if (schemes.length > 0 && schemes[0].apply_url) {
                window.open(schemes[0].apply_url, "_blank", "noopener,noreferrer")
              }
            }}
          >
            <Landmark className="size-4" />
            <span>{"Apply Now / अभी आवेदन करें"}</span>
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}
