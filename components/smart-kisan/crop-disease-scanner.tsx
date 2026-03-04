"use client"

import { useState, useCallback } from "react"
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
  ScanSearch,
  Upload,
  ImageIcon,
  Loader2,
  X,
  Wheat,
  Heart,
  Clock,
  Sprout,
  AlertTriangle,
  CheckCircle2,
  Scissors,
  Lightbulb,
} from "lucide-react"

/* ── Types from the Gemini analyze-crop response ── */
interface CropAnalysis {
  crop_name: string
  crop_name_hi?: string
  health: {
    percentage: number
    status: "Healthy" | "Moderate" | "Unhealthy" | "Critical"
    status_hi?: string
    summary: string
    summary_hi?: string
    issues: string[]
    issues_hi?: string[]
  }
  harvest: {
    estimated_time: string
    estimated_time_hi?: string
    growth_stage: string
    growth_stage_hi?: string
    recommendation: string
    recommendation_hi?: string
  }
  additional_tips?: string[]
  additional_tips_hi?: string[]
}

function healthColor(status: string) {
  switch (status) {
    case "Healthy": return "bg-green-100 text-green-700 border-green-300"
    case "Moderate": return "bg-yellow-100 text-yellow-700 border-yellow-300"
    case "Unhealthy": return "bg-orange-100 text-orange-700 border-orange-300"
    case "Critical": return "bg-red-100 text-red-700 border-red-300"
    default: return "bg-muted text-muted-foreground"
  }
}

function healthProgressColor(pct: number) {
  if (pct >= 75) return "bg-green-500"
  if (pct >= 50) return "bg-yellow-500"
  if (pct >= 25) return "bg-orange-500"
  return "bg-red-500"
}

export function CropDiseaseScanner() {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<CropAnalysis | null>(null)
  const [error, setError] = useState("")

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WEBP)")
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Image must be under 20 MB")
      return
    }
    setError("")
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string)
      setResult(null)
      setError("")
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      if (e.dataTransfer.files?.[0]) {
        processFile(e.dataTransfer.files[0])
      }
    },
    [processFile]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
        processFile(e.target.files[0])
      }
    },
    [processFile]
  )

  const handleScan = useCallback(async () => {
    if (!uploadedImage) return
    setScanning(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/analyze-crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: uploadedImage }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.not_crop) {
          setError(
            "❌ This is not a crop/plant photo. Please upload a clear photo of a crop, plant, or leaf. / यह फसल की तस्वीर नहीं है। कृपया फसल, पौधे या पत्ती की तस्वीर अपलोड करें।"
          )
        } else if (res.status === 429) {
          setError(
            "AI service is busy. Please wait 1-2 minutes and try again. / AI सेवा व्यस्त है, कृपया 1-2 मिनट बाद पुनः प्रयास करें।"
          )
        } else {
          setError(data.error || "Analysis failed")
        }
        return
      }

      setResult(data.analysis)
    } catch (err: any) {
      setError(err.message || "Network error — please try again")
    } finally {
      setScanning(false)
    }
  }, [uploadedImage])

  const handleReset = useCallback(() => {
    setUploadedImage(null)
    setResult(null)
    setScanning(false)
    setError("")
  }, [])

  return (
    <section id="disease" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mb-10">
        <Badge
          variant="secondary"
          className="mb-3 border border-primary/20 bg-primary/10 text-primary"
        >
          <ScanSearch className="size-3" />
          <span>{"Crop Scanner AI / फसल स्कैनर AI"}</span>
        </Badge>
        <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
          {"AI Crop Scanner & Disease Detection"}
        </h2>
        <p className="mt-1 text-lg text-muted-foreground">
          {"फसल की पहचान, स्वास्थ्य जांच और कटाई का अनुमान — Gemini AI द्वारा संचालित"}
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>
              {"Scan Your Crop / अपनी फसल स्कैन करें"}
            </CardTitle>
            <CardDescription>
              {
                "Upload a crop photo to identify the crop, check health condition, and estimate harvesting time / फसल की तस्वीर अपलोड करें - फसल पहचान, स्वास्थ्य जांच और कटाई का समय"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!uploadedImage ? (
              <div
                className={`relative flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
                  dragActive
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-border bg-muted/30 hover:border-primary/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() =>
                  document.getElementById("crop-scan-upload")?.click()
                }
                role="button"
                tabIndex={0}
                aria-label="Upload crop image"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    document.getElementById("crop-scan-upload")?.click()
                  }
                }}
              >
                <input
                  id="crop-scan-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
                    <Upload className="size-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {"Drag & drop or click to upload"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {"खींचें और छोड़ें या क्लिक करें"}
                    </p>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      {"JPG, PNG, WEBP up to 20MB"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="relative overflow-hidden rounded-xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedImage}
                    alt="Uploaded crop"
                    className="h-60 w-full object-cover"
                  />
                  <button
                    onClick={handleReset}
                    className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-foreground/70 text-background transition-colors hover:bg-foreground"
                    aria-label="Remove image"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleScan}
                    disabled={scanning}
                    className="flex-1 font-semibold"
                  >
                    {scanning ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>{"Scanning with Gemini AI..."}</span>
                      </>
                    ) : (
                      <>
                        <ScanSearch className="size-4" />
                        <span>{"Scan Crop / फसल स्कैन करें"}</span>
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    <ImageIcon className="size-4" />
                    <span>{"New / नया"}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scanning animation */}
        {scanning && (
          <Card className="mt-6 overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-4">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                <div className="relative rounded-full bg-primary/10 p-5">
                  <Sprout className="size-8 animate-pulse text-primary" />
                </div>
              </div>
              <h3 className="mb-1 text-lg font-bold text-foreground">
                AI is scanning your crop...
              </h3>
              <p className="text-sm text-muted-foreground">
                Identifying crop, checking health & estimating harvest
              </p>
              <div className="mt-4 flex gap-3">
                {["Crop ID", "Health", "Harvest"].map((step, i) => (
                  <div
                    key={step}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground"
                    style={{
                      animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite`,
                    }}
                  >
                    <div className="size-2 rounded-full bg-primary animate-pulse" />
                    {step}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ══ RESULTS ══ */}
        {result && (
          <div className="mt-6 space-y-4">
            {/* Crop Identified */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/[0.06] via-transparent to-primary/[0.03]">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-full bg-primary/10 p-3">
                  <Wheat className="size-7 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Crop Identified / फसल पहचानी गई
                  </p>
                  <h3 className="text-xl font-bold text-foreground">
                    {result.crop_name}
                  </h3>
                  {result.crop_name_hi && (
                    <p className="text-sm text-muted-foreground">{result.crop_name_hi}</p>
                  )}
                </div>
                <Badge className={`border px-3 py-1 text-sm font-semibold ${healthColor(result.health.status)}`}>
                  {result.health.status === "Healthy" && <CheckCircle2 className="mr-1 size-4" />}
                  {(result.health.status === "Moderate" || result.health.status === "Unhealthy") && <AlertTriangle className="mr-1 size-4" />}
                  {result.health.status === "Critical" && <X className="mr-1 size-4" />}
                  {result.health.status}
                  {result.health.status_hi && <span className="ml-1 text-xs">/ {result.health.status_hi}</span>}
                </Badge>
              </CardContent>
            </Card>

            {/* Health Score */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Heart className="size-4 text-red-500" />
                  Health Condition / स्वास्थ्य स्थिति
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="relative flex size-16 items-center justify-center">
                    <svg className="size-16 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/50" />
                      <circle
                        cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(result.health.percentage / 100) * 264} 264`}
                        className={
                          result.health.percentage >= 75 ? "stroke-green-500" :
                          result.health.percentage >= 50 ? "stroke-yellow-500" :
                          result.health.percentage >= 25 ? "stroke-orange-500" : "stroke-red-500"
                        }
                      />
                    </svg>
                    <span className="absolute text-sm font-bold">{result.health.percentage}%</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{result.health.summary}</p>
                    {result.health.summary_hi && (
                      <p className="text-xs text-muted-foreground">{result.health.summary_hi}</p>
                    )}
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${healthProgressColor(result.health.percentage)}`}
                        style={{ width: `${result.health.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {result.health.issues.length > 0 && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/30">
                    <p className="mb-2 text-xs font-semibold text-orange-700 dark:text-orange-400">
                      Issues Detected / समस्याएँ:
                    </p>
                    <ul className="space-y-1">
                      {result.health.issues.map((issue, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-orange-600 dark:text-orange-300">
                          <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                          <span>{issue}{result.health.issues_hi?.[i] && ` / ${result.health.issues_hi[i]}`}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Harvest Estimate */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Scissors className="size-4 text-amber-600" />
                  Harvest Estimate / कटाई का अनुमान
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="flex flex-col items-center rounded-lg border bg-amber-50/50 p-4 text-center dark:bg-amber-950/20">
                    <Clock className="mb-2 size-5 text-amber-600" />
                    <p className="text-[10px] text-muted-foreground">Time Left / शेष समय</p>
                    <p className="mt-1 text-base font-bold text-foreground">{result.harvest.estimated_time}</p>
                    {result.harvest.estimated_time_hi && (
                      <p className="text-[10px] text-muted-foreground">{result.harvest.estimated_time_hi}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-center rounded-lg border bg-green-50/50 p-4 text-center dark:bg-green-950/20">
                    <Sprout className="mb-2 size-5 text-green-600" />
                    <p className="text-[10px] text-muted-foreground">Growth Stage / विकास चरण</p>
                    <p className="mt-1 text-base font-bold text-foreground">{result.harvest.growth_stage}</p>
                    {result.harvest.growth_stage_hi && (
                      <p className="text-[10px] text-muted-foreground">{result.harvest.growth_stage_hi}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-center rounded-lg border bg-primary/5 p-4 text-center">
                    <Scissors className="mb-2 size-5 text-primary" />
                    <p className="text-[10px] text-muted-foreground">Advice / सलाह</p>
                    <p className="mt-1 text-xs font-medium text-foreground">{result.harvest.recommendation}</p>
                    {result.harvest.recommendation_hi && (
                      <p className="mt-1 text-[10px] text-muted-foreground">{result.harvest.recommendation_hi}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Tips */}
            {result.additional_tips && result.additional_tips.length > 0 && (
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Lightbulb className="size-4 text-yellow-500" />
                    Tips / सुझाव
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {result.additional_tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-yellow-500" />
                        <span>{tip}{result.additional_tips_hi?.[i] && ` / ${result.additional_tips_hi[i]}`}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Scan another */}
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleReset}>
                <ScanSearch className="size-4" />
                <span>Scan Another Crop / दूसरी फसल स्कैन करें</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
