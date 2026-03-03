"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Camera,
  Upload,
  Loader2,
  Leaf,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Sprout,
  Scissors,
  ShieldCheck,
  Lightbulb,
  RefreshCw,
  Wheat,
  FlaskConical,
  Heart,
} from "lucide-react"

/* ─────────── Types ─────────── */
interface Deficiency {
  nutrient: string
  nutrient_hi?: string
  severity: "Low" | "Medium" | "High"
  recommendation: string
  recommendation_hi?: string
}

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
  nutrition: {
    summary: string
    summary_hi?: string
    deficiencies: Deficiency[]
    sufficient: string[]
    sufficient_hi?: string[]
  }
  irrigation: {
    status: string
    status_hi?: string
    percentage: number
    recommendation: string
    recommendation_hi?: string
  }
  harvest: {
    estimated_time: string
    estimated_time_hi?: string
    growth_stage: string
    growth_stage_hi?: string
    recommendation: string
    recommendation_hi?: string
  }
  additional_tips: string[]
  additional_tips_hi?: string[]
}

/* ─────────── Helpers ─────────── */
function healthColor(status: string) {
  switch (status) {
    case "Healthy":
      return "text-green-600 bg-green-100 border-green-300"
    case "Moderate":
      return "text-yellow-600 bg-yellow-100 border-yellow-300"
    case "Unhealthy":
      return "text-orange-600 bg-orange-100 border-orange-300"
    case "Critical":
      return "text-red-600 bg-red-100 border-red-300"
    default:
      return "text-muted-foreground bg-muted"
  }
}

function healthProgressColor(pct: number) {
  if (pct >= 75) return "bg-green-500"
  if (pct >= 50) return "bg-yellow-500"
  if (pct >= 25) return "bg-orange-500"
  return "bg-red-500"
}

function irrigationColor(status: string) {
  if (status.toLowerCase().includes("well")) return "text-green-600"
  if (status.toLowerCase().includes("over")) return "text-blue-600"
  if (status.toLowerCase().includes("under")) return "text-orange-600"
  return "text-red-600"
}

function severityColor(sev: string) {
  switch (sev) {
    case "High":
      return "bg-red-100 text-red-700 border-red-300"
    case "Medium":
      return "bg-yellow-100 text-yellow-700 border-yellow-300"
    case "Low":
      return "bg-blue-100 text-blue-700 border-blue-300"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function healthIcon(status: string) {
  switch (status) {
    case "Healthy":
      return <CheckCircle2 className="size-5 text-green-600" />
    case "Moderate":
      return <AlertTriangle className="size-5 text-yellow-600" />
    case "Unhealthy":
      return <AlertTriangle className="size-5 text-orange-600" />
    case "Critical":
      return <XCircle className="size-5 text-red-600" />
    default:
      return <Leaf className="size-5" />
  }
}

/* ═══════════════════════════════════════════════════════ */
/*  COMPONENT                                             */
/* ═══════════════════════════════════════════════════════ */
export default function CropImageAnalyzer() {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [fileName, setFileName] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<CropAnalysis | null>(null)
  const [error, setError] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── Handle file select ── */
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
    setFileName(file.name)
    setAnalysis(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setImagePreview(dataUrl)
      setImageBase64(dataUrl)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  /* ── Drag & Drop ── */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      const file = e.dataTransfer.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  /* ── Analyze ── */
  const handleAnalyze = async () => {
    if (!imageBase64) return
    setAnalyzing(true)
    setError("")
    setAnalysis(null)

    try {
      const res = await fetch("/api/analyze-crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64 }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.not_crop) {
          setError(
            "❌ Wrong image! This is not a crop/plant photo. Please upload a clear photo of a crop, plant, or leaf. / यह फसल की तस्वीर नहीं है। कृपया फसल, पौधे या पत्ती की तस्वीर अपलोड करें।"
          )
        } else if (res.status === 429) {
          setError(
            "AI service is busy (rate limit). The server tried multiple models with retries. Please wait 1-2 minutes and try again."
          )
        } else {
          setError(data.error || "Analysis failed")
        }
        return
      }

      setAnalysis(data.analysis)
    } catch (err: any) {
      setError(err.message || "Network error — please try again")
    } finally {
      setAnalyzing(false)
    }
  }

  const reset = () => {
    setImagePreview(null)
    setImageBase64(null)
    setFileName("")
    setAnalysis(null)
    setError("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  /* ═══════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      {/* ── IMAGE UPLOAD ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="size-5 text-primary" />
            Upload Crop Image / फसल की फोटो अपलोड करें
          </CardTitle>
          <CardDescription>
            Take a clear photo of your crop and upload it for AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!imagePreview ? (
            <div
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all ${
                dragActive
                  ? "border-primary bg-primary/10 scale-[1.02]"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="mb-4 rounded-full bg-primary/10 p-4">
                <Upload className="size-8 text-primary" />
              </div>
              <p className="mb-1 text-lg font-semibold text-foreground">
                {dragActive
                  ? "Drop image here / यहाँ छोड़ें"
                  : "Click or drag image here"}
              </p>
              <p className="text-sm text-muted-foreground">
                JPG, PNG, WEBP — up to 20 MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative overflow-hidden rounded-xl border">
                <img
                  src={imagePreview}
                  alt="Crop preview"
                  className="mx-auto max-h-[400px] w-full object-contain bg-muted/30"
                />
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent p-4">
                  <span className="text-sm font-medium text-white">
                    {fileName}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={reset}
                      className="bg-white/20 text-white hover:bg-white/30 backdrop-blur"
                    >
                      <RefreshCw className="size-3.5" />
                      <span>Change</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Analyze Button */}
              <div className="flex items-center gap-3">
                <Button
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="flex-1 text-base"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      <span>Analyzing with Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <Sprout className="size-5" />
                      <span>Analyze Crop / फसल का विश्लेषण करें</span>
                    </>
                  )}
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

      {/* ── ANALYZING ANIMATION ── */}
      {analyzing && (
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <div className="relative rounded-full bg-primary/10 p-6">
                <Sprout className="size-10 animate-pulse text-primary" />
              </div>
            </div>
            <h3 className="mb-1 text-xl font-bold text-foreground">
              AI is analyzing your crop...
            </h3>
            <p className="text-muted-foreground">
              Gemini Vision is inspecting health, nutrition, irrigation &
              harvest timing
            </p>
            <div className="mt-6 flex gap-4">
              {["Health", "Nutrition", "Irrigation", "Harvest"].map(
                (step, i) => (
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
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── RESULTS ──                                   */}
      {/* ═══════════════════════════════════════════════ */}
      {analysis && (
        <div className="space-y-6">
          {/* ── Crop Identified ── */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/[0.06] via-transparent to-primary/[0.03]">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-primary/10 p-3">
                <Wheat className="size-7 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Crop Identified / फसल पहचानी गई
                </p>
                <h2 className="text-2xl font-bold text-foreground">
                  {analysis.crop_name}
                </h2>
                {analysis.crop_name_hi && (
                  <p className="text-sm text-muted-foreground">{analysis.crop_name_hi}</p>
                )}
              </div>
              <div className="ml-auto">
                <Badge
                  className={`border px-3 py-1 text-sm font-semibold ${healthColor(
                    analysis.health.status
                  )}`}
                >
                  {healthIcon(analysis.health.status)}
                  <span className="ml-1">{analysis.health.status}</span>
                  {analysis.health.status_hi && (
                    <span className="ml-1 text-xs">/ {analysis.health.status_hi}</span>
                  )}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* ── 1. HEALTH ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="size-5 text-red-500" />
                Crop Health / फसल स्वास्थ्य
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex size-24 items-center justify-center">
                  <svg className="size-24 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted/50"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${
                        (analysis.health.percentage / 100) * 264
                      } 264`}
                      className={
                        analysis.health.percentage >= 75
                          ? "stroke-green-500"
                          : analysis.health.percentage >= 50
                            ? "stroke-yellow-500"
                            : analysis.health.percentage >= 25
                              ? "stroke-orange-500"
                              : "stroke-red-500"
                      }
                    />
                  </svg>
                  <span className="absolute text-xl font-bold">
                    {analysis.health.percentage}%
                  </span>
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-base text-foreground">
                    {analysis.health.summary}
                  </p>
                  {analysis.health.summary_hi && (
                    <p className="mb-2 text-sm text-muted-foreground">
                      {analysis.health.summary_hi}
                    </p>
                  )}
                  <div className="w-full">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Health Score</span>
                      <span>{analysis.health.percentage}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${healthProgressColor(
                          analysis.health.percentage
                        )}`}
                        style={{
                          width: `${analysis.health.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {analysis.health.issues.length > 0 && (
                <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/30">
                  <p className="mb-2 text-sm font-semibold text-orange-700 dark:text-orange-400">
                    Issues Detected / समस्याएँ:
                  </p>
                  <ul className="space-y-1">
                    {analysis.health.issues.map((issue, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-orange-600 dark:text-orange-300"
                      >
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                        <div>
                          <span>{issue}</span>
                          {analysis.health.issues_hi?.[i] && (
                            <span className="ml-1 text-orange-500 dark:text-orange-400">/ {analysis.health.issues_hi[i]}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── 2. NUTRITION ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="size-5 text-purple-500" />
                Nutrition Analysis / पोषण विश्लेषण
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {analysis.nutrition.summary}
              </p>
              {analysis.nutrition.summary_hi && (
                <p className="text-sm text-muted-foreground/80">
                  {analysis.nutrition.summary_hi}
                </p>
              )}

              {/* Deficiencies */}
              {analysis.nutrition.deficiencies.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-semibold text-foreground">
                    Nutrient Deficiencies / पोषक तत्वों की कमी:
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {analysis.nutrition.deficiencies.map((def, i) => (
                      <div
                        key={i}
                        className="rounded-lg border p-3 transition-shadow hover:shadow"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-foreground">
                              {def.nutrient}
                            </span>
                            {def.nutrient_hi && (
                              <span className="ml-1 text-sm text-muted-foreground">/ {def.nutrient_hi}</span>
                            )}
                          </div>
                          <Badge
                            className={`text-xs ${severityColor(
                              def.severity
                            )}`}
                          >
                            {def.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {def.recommendation}
                        </p>
                        {def.recommendation_hi && (
                          <p className="mt-1 text-xs text-muted-foreground/80">
                            {def.recommendation_hi}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sufficient */}
              {analysis.nutrition.sufficient.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-foreground">
                    Adequate Nutrients / पर्याप्त पोषक तत्व:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.nutrition.sufficient.map((n, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400"
                      >
                        <CheckCircle2 className="mr-1 size-3" />
                        {n}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── 3. IRRIGATION ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="size-5 text-blue-500" />
                Irrigation Status / सिंचाई स्थिति
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className={`rounded-full border-2 px-4 py-2 text-center text-sm font-bold ${
                    analysis.irrigation.status
                      .toLowerCase()
                      .includes("well")
                      ? "border-green-300 bg-green-50 text-green-700"
                      : analysis.irrigation.status
                            .toLowerCase()
                            .includes("over")
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-orange-300 bg-orange-50 text-orange-700"
                  }`}
                >
                  <span>{analysis.irrigation.status}</span>
                  {analysis.irrigation.status_hi && (
                    <span className="block text-xs font-medium opacity-80">{analysis.irrigation.status_hi}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Irrigation Adequacy</span>
                    <span>{analysis.irrigation.percentage}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-700"
                      style={{
                        width: `${analysis.irrigation.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3">
                <Droplets className="mt-0.5 size-4 shrink-0 text-blue-500" />
                <div>
                  <p className="text-sm text-foreground">
                    {analysis.irrigation.recommendation}
                  </p>
                  {analysis.irrigation.recommendation_hi && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {analysis.irrigation.recommendation_hi}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── 4. HARVEST ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="size-5 text-amber-600" />
                Harvest Estimate / कटाई का अनुमान
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col items-center rounded-lg border bg-amber-50/50 p-4 text-center dark:bg-amber-950/20">
                  <Clock className="mb-2 size-6 text-amber-600" />
                  <p className="text-xs text-muted-foreground">
                    Estimated Time / अनुमानित समय
                  </p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {analysis.harvest.estimated_time}
                  </p>
                  {analysis.harvest.estimated_time_hi && (
                    <p className="text-xs text-muted-foreground">{analysis.harvest.estimated_time_hi}</p>
                  )}
                </div>
                <div className="flex flex-col items-center rounded-lg border bg-green-50/50 p-4 text-center dark:bg-green-950/20">
                  <Sprout className="mb-2 size-6 text-green-600" />
                  <p className="text-xs text-muted-foreground">Growth Stage / विकास चरण</p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {analysis.harvest.growth_stage}
                  </p>
                  {analysis.harvest.growth_stage_hi && (
                    <p className="text-xs text-muted-foreground">{analysis.harvest.growth_stage_hi}</p>
                  )}
                </div>
                <div className="flex flex-col items-center rounded-lg border bg-primary/5 p-4 text-center">
                  <ShieldCheck className="mb-2 size-6 text-primary" />
                  <p className="text-xs text-muted-foreground">Advice / सलाह</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {analysis.harvest.recommendation}
                  </p>
                  {analysis.harvest.recommendation_hi && (
                    <p className="mt-1 text-xs text-muted-foreground">{analysis.harvest.recommendation_hi}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── 5. ADDITIONAL TIPS ── */}
          {analysis.additional_tips && analysis.additional_tips.length > 0 && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="size-5 text-yellow-500" />
                  Additional Tips / अतिरिक्त सुझाव
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.additional_tips.map((tip, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <Lightbulb className="mt-0.5 size-4 shrink-0 text-yellow-500" />
                      <div>
                        <p>{tip}</p>
                        {analysis.additional_tips_hi?.[i] && (
                          <p className="text-xs text-muted-foreground">{analysis.additional_tips_hi[i]}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* ── Analyze another ── */}
          <div className="flex justify-center">
            <Button variant="outline" size="lg" onClick={reset}>
              <RefreshCw className="size-4" />
              <span>Analyze Another Crop / दूसरी फसल का विश्लेषण करें</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
