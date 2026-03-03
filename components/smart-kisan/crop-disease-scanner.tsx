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
} from "lucide-react"

interface PredictionResult {
  disease: string
  diseaseHindi: string
  confidence: number
  severity: "low" | "medium" | "high"
  recommendation: string
  recommendationHindi: string
}

const mockResults: PredictionResult[] = [
  {
    disease: "Leaf Blight",
    diseaseHindi: "पत्ती झुलसा",
    confidence: 94,
    severity: "high",
    recommendation:
      "Apply Mancozeb 75% WP at 2g/L water. Spray in early morning or evening. Remove affected leaves.",
    recommendationHindi:
      "मैंकोज़ेब 75% WP 2 ग्राम/लीटर पानी में मिलाकर छिड़काव करें। सुबह या शाम को छिड़काव करें। प्रभावित पत्तियों को हटा दें।",
  },
  {
    disease: "Healthy Crop",
    diseaseHindi: "स्वस्थ फसल",
    confidence: 97,
    severity: "low",
    recommendation:
      "Your crop looks healthy! Maintain regular watering schedule and monitor for pests.",
    recommendationHindi:
      "आपकी फसल स्वस्थ दिखती है! नियमित सिंचाई बनाए रखें और कीटों पर नज़र रखें।",
  },
]

export function CropDiseaseScanner() {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)

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
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string)
      setResult(null)
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

  const handleScan = useCallback(() => {
    setScanning(true)
    setTimeout(() => {
      setResult(mockResults[Math.random() > 0.5 ? 0 : 1])
      setScanning(false)
    }, 2500)
  }, [])

  const handleReset = useCallback(() => {
    setUploadedImage(null)
    setResult(null)
    setScanning(false)
  }, [])

  const severityColor = {
    low: "bg-primary/15 text-primary",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-red-100 text-red-700",
  }

  const severityLabel = {
    low: "Low / कम",
    medium: "Medium / मध्यम",
    high: "High / गंभीर",
  }

  return (
    <section id="disease" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mb-10">
        <Badge
          variant="secondary"
          className="mb-3 border border-primary/20 bg-primary/10 text-primary"
        >
          <ScanSearch className="size-3" />
          <span>{"Crop Disease AI / फसल रोग AI"}</span>
        </Badge>
        <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
          {"AI Crop Disease Detection"}
        </h2>
        <p className="mt-1 text-lg text-muted-foreground">
          {"एआई फसल रोग पहचान - अपनी फसल की तस्वीर अपलोड करें"}
        </p>
      </div>

      <div className="mx-auto max-w-xl">
        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>
              {"Upload Crop Image / फसल की तस्वीर अपलोड करें"}
            </CardTitle>
            <CardDescription>
              {
                "Take a photo of affected crop leaf and upload / प्रभावित फसल की पत्ती की तस्वीर लें और अपलोड करें"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!uploadedImage ? (
              <div
                className={`relative flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/30 hover:border-primary/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() =>
                  document.getElementById("crop-upload")?.click()
                }
                role="button"
                tabIndex={0}
                aria-label="Upload crop image"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    document.getElementById("crop-upload")?.click()
                  }
                }}
              >
                <input
                  id="crop-upload"
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
                      {"JPG, PNG up to 10MB"}
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
                        <span>{"Analyzing / विश्लेषण..."}</span>
                      </>
                    ) : (
                      <>
                        <ScanSearch className="size-4" />
                        <span>{"Scan Now / अभी स्कैन करें"}</span>
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
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
