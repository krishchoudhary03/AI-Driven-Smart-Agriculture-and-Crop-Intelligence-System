"use client"

<<<<<<< HEAD
import { useState, useEffect, useCallback } from "react"
=======
import { useEffect, useState } from "react"
>>>>>>> b58f3ec (feat: add Gemini-powered gov schemes with real .gov.in portal links)
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
<<<<<<< HEAD
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
=======
  Store,
  CreditCard,
  Building2,
  Leaf,
} from "lucide-react"

/* ── Icon mapping based on scheme name keywords ── */
function getSchemeIcon(name: string) {
  const n = name.toLowerCase()
  if (n.includes("kisan") && !n.includes("credit")) return IndianRupee
  if (n.includes("bima") || n.includes("insurance") || n.includes("fasal")) return Shield
  if (n.includes("mechaniz") || n.includes("smam") || n.includes("tractor")) return Tractor
  if (n.includes("sinch") || n.includes("irrigat") || n.includes("pmksy")) return Droplets
  if (n.includes("soil") || n.includes("mrid")) return Wheat
  if (n.includes("credit") || n.includes("kcc")) return CreditCard
  if (n.includes("enam") || n.includes("market")) return Store
  if (n.includes("infra") || n.includes("fund")) return Building2
  if (n.includes("organic") || n.includes("paramparagat")) return Leaf
  return GraduationCap
}

function getStatusColor(status: string) {
  const s = status.toLowerCase()
  if (s.includes("enroll") || s.includes("नामांकन")) return "bg-amber-100 text-amber-700 border-amber-200"
  if (s.includes("apply") || s.includes("आवेदन")) return "bg-blue-100 text-blue-700 border-blue-200"
  return "bg-primary/15 text-primary border-primary/20"
}

/* ── Fallback: real schemes with real .gov.in portals ── */
const FALLBACK_SCHEMES = [
  {
    name: "PM-KISAN Samman Nidhi",
    nameHindi: "पीएम-किसान सम्मान निधि",
    description: "Direct income support of ₹6,000/year in 3 equal installments to all land-holding farmer families across India.",
    descriptionHindi: "भारत भर के सभी भूमिधारक किसान परिवारों को 3 समान किस्तों में ₹6,000/वर्ष की सीधी आय सहायता।",
    amount: "₹6,000/year",
    status: "Active / सक्रिय",
    category: "Income Support / आय सहायता",
    portalUrl: "https://pmkisan.gov.in/",
    portalName: "PM-KISAN Portal",
  },
  {
    name: "PM Fasal Bima Yojana",
    nameHindi: "प्रधानमंत्री फसल बीमा योजना",
    description: "Comprehensive crop insurance at very low premium rates. Kharif: 2%, Rabi: 1.5%, Commercial/Horticultural: 5%.",
    descriptionHindi: "बहुत कम प्रीमियम दरों पर व्यापक फसल बीमा। खरीफ: 2%, रबी: 1.5%, वाणिज्यिक: 5%।",
    amount: "Low Premium",
    status: "Enrolling / नामांकन",
    category: "Insurance / बीमा",
    portalUrl: "https://pmfby.gov.in/",
    portalName: "PMFBY Portal",
  },
  {
    name: "Kisan Credit Card (KCC)",
    nameHindi: "किसान क्रेडिट कार्ड (केसीसी)",
    description: "Short-term credit for crop production at subsidized interest rate of 4% per annum for loans up to ₹3 lakh.",
    descriptionHindi: "₹3 लाख तक के ऋण पर 4% प्रति वर्ष की रियायती ब्याज दर पर फसल उत्पादन के लिए अल्पकालिक ऋण।",
    amount: "4% Interest",
    status: "Apply Now / आवेदन करें",
    category: "Credit / ऋण",
    portalUrl: "https://pmkisan.gov.in/",
    portalName: "KCC via PM-KISAN Portal",
  },
  {
    name: "PM Krishi Sinchai Yojana",
    nameHindi: "प्रधानमंत्री कृषि सिंचाई योजना",
    description: "Micro irrigation support including drip and sprinkler systems with 55-70% subsidy under 'Per Drop More Crop'.",
    descriptionHindi: "'हर बूंद अधिक फसल' के तहत ड्रिप और स्प्रिंकलर सिस्टम सहित सूक्ष्म सिंचाई पर 55-70% सब्सिडी।",
    amount: "55-70% Subsidy",
    status: "Active / सक्रिय",
    category: "Irrigation / सिंचाई",
    portalUrl: "https://pmksy.gov.in/",
    portalName: "PMKSY Portal",
  },
  {
    name: "Soil Health Card Scheme",
    nameHindi: "मृदा स्वास्थ्य कार्ड योजना",
    description: "Free soil testing and health card with crop-wise nutrient recommendations to improve productivity.",
    descriptionHindi: "उत्पादकता सुधार के लिए मुफ्त मिट्टी परीक्षण और फसल-वार पोषक तत्व सिफारिश कार्ड।",
    amount: "Free",
    status: "Active / सक्रिय",
    category: "Soil / मिट्टी",
    portalUrl: "https://soilhealth.dac.gov.in/",
    portalName: "Soil Health Portal",
  },
  {
    name: "eNAM - National Agriculture Market",
    nameHindi: "ई-नाम - राष्ट्रीय कृषि बाजार",
    description: "Online trading platform for agricultural commodities. Connects farmers to buyers across India for better prices.",
    descriptionHindi: "कृषि उत्पादों के लिए ऑनलाइन व्यापार मंच। बेहतर कीमतों के लिए किसानों को पूरे भारत के खरीदारों से जोड़ता है।",
    amount: "Better Prices",
    status: "Active / सक्रिय",
    category: "Market / बाजार",
    portalUrl: "https://enam.gov.in/",
    portalName: "eNAM Portal",
  },
]
>>>>>>> b58f3ec (feat: add Gemini-powered gov schemes with real .gov.in portal links)

interface Scheme {
  name: string
  nameHindi: string
  description: string
  descriptionHindi: string
  amount: string
  status: string
  category: string
  portalUrl: string
  portalName: string
}

export function GovSchemes() {
<<<<<<< HEAD
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
=======
  const [schemes, setSchemes] = useState<Scheme[]>(FALLBACK_SCHEMES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchSchemes() {
      try {
        const res = await fetch("/api/gov-schemes")
        if (!res.ok) throw new Error("API error")
        const data = await res.json()
        if (!cancelled && Array.isArray(data.schemes) && data.schemes.length > 0) {
          setSchemes(data.schemes)
        }
      } catch {
        // fallback schemes already set
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchSchemes()
    return () => { cancelled = true }
  }, [])
>>>>>>> b58f3ec (feat: add Gemini-powered gov schemes with real .gov.in portal links)

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
<<<<<<< HEAD
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
=======
          <Landmark className="size-3" />
          <span>{"Government Schemes / सरकारी योजनाएं"}</span>
        </Badge>
        <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
          {"Schemes for Farmers"}
        </h2>
        <p className="mt-1 text-lg text-muted-foreground">
          {"किसानों के लिए सरकारी योजनाएं और सब्सिडी"}
        </p>
        {loading && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span>Fetching latest schemes from AI... / AI से नवीनतम योजनाएं प्राप्त हो रही हैं...</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schemes.map((scheme) => {
          const Icon = getSchemeIcon(scheme.name)
          const statusColor = getStatusColor(scheme.status)
          return (
            <Card
              key={scheme.name}
              className="group flex flex-col transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${statusColor}`}
                  >
                    {scheme.status}
                  </Badge>
                </div>
                <CardTitle className="mt-2 text-base">{scheme.name}</CardTitle>
                <CardDescription className="text-xs">
                  {scheme.nameHindi}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div>
                  <p className="text-sm leading-relaxed text-foreground">
                    {scheme.description}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {scheme.descriptionHindi}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground">
                      {"Benefit / लाभ"}
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {scheme.amount}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {scheme.category}
                  </Badge>
                </div>

                {/* ── Portal Link ── */}
                <div className="mt-auto">
                  <a
                    href={scheme.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    <ExternalLink className="size-4" />
                    <span>
                      Click here to visit {scheme.portalName ?? "Portal"} / पोर्टल पर जाएं
                    </span>
                    <ArrowRight className="size-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
>>>>>>> b58f3ec (feat: add Gemini-powered gov schemes with real .gov.in portal links)

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
<<<<<<< HEAD
            onClick={() => {
              if (schemes.length > 0 && schemes[0].apply_url) {
                window.open(schemes[0].apply_url, "_blank", "noopener,noreferrer")
              }
            }}
          >
            <Landmark className="size-4" />
            <span>{"Apply Now / अभी आवेदन करें"}</span>
=======
            asChild
          >
            <a href="https://pmkisan.gov.in/" target="_blank" rel="noopener noreferrer">
              <Landmark className="size-4" />
              <span>{"PM-KISAN Portal / पीएम-किसान पोर्टल"}</span>
            </a>
>>>>>>> b58f3ec (feat: add Gemini-powered gov schemes with real .gov.in portal links)
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}
