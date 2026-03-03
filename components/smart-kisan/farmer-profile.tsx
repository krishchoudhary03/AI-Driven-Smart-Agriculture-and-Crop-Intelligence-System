"use client"

import { useEffect, useState, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  UserCircle,
  MapPin,
  Wheat,
  FlaskConical,
  Droplets,
  Save,
  Plus,
  Trash2,
  Loader2,
  Leaf,
  Thermometer,
  Gauge,
  RotateCcw,
  ArrowDown,
  Activity,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Bar,
  BarChart,
} from "recharts"
import CropImageAnalyzer from "@/components/smart-kisan/crop-image-analyzer"
import { Camera } from "lucide-react"

interface FarmerProfileProps {
  user: any
}

/* ── farmers_profile: id, user_id, name, village, state, created_at ── */
/* ── crops: id, farmer_id, crop_name, crop_type, field_name, field_size, location, sowing_date, created_at ── */
/* ── sensor_data: id, farmer_id→farmers_profile.id, moisture, temperature, nitrogen, phosphorus, potassium, created_at ── */
/* ── yield prediction is done by ML model via /api/predict-yield ── */

interface CropRow {
  id: string
  farmer_id: string
  crop_name: string
  crop_type: string
  field_name: string
  field_size: string
  location: string
  sowing_date: string
  created_at: string
}

interface SensorRow {
  id: string
  farmer_id: string
  moisture: number
  temperature: number
  nitrogen: number
  phosphorus: number
  potassium: number
  created_at: string
}

interface YieldPrediction {
  predicted_yield: number
  yield_range: { min: number; max: number }
  confidence: number
  growth_stage: string
  factors: { factor: string; impact: string; detail: string }[]
  recommendation: string
  recommendation_hindi: string
}

/* ── health-badge helper (from soil-analytics) ── */
function getStatus(value: number, type: "moisture" | "temp" | "npk") {
  if (type === "moisture") {
    if (value >= 40 && value <= 70)
      return { text: "Optimal / सामान्य", color: "bg-primary/15 text-primary" }
    if (value < 40)
      return { text: "Low / कम", color: "bg-amber-100 text-amber-700" }
    return { text: "High / ज़्यादा", color: "bg-amber-100 text-amber-700" }
  }
  if (type === "temp") {
    if (value >= 18 && value <= 30)
      return { text: "Good / अच्छा", color: "bg-primary/15 text-primary" }
    if (value < 18)
      return { text: "Cold / ठंडा", color: "bg-blue-100 text-blue-700" }
    return { text: "Hot / गर्म", color: "bg-red-100 text-red-700" }
  }
  // npk
  if (value >= 60)
    return { text: "Good / अच्छा", color: "bg-primary/15 text-primary" }
  if (value >= 40)
    return { text: "Medium / मध्यम", color: "bg-amber-100 text-amber-700" }
  return { text: "Low / कम", color: "bg-red-100 text-red-700" }
}

export function FarmerProfile({ user }: FarmerProfileProps) {
  /* ── profile state (farmers_profile) ── */
  const [profileId, setProfileId] = useState<string | null>(null)
  const [farmerName, setFarmerName] = useState("")
  const [farmerVillage, setFarmerVillage] = useState("")
  const [farmerState, setFarmerState] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  /* ── crops ── */
  const [crops, setCrops] = useState<CropRow[]>([])

  /* ── sensor data rows ── */
  const [sensorRows, setSensorRows] = useState<SensorRow[]>([])
  const [loading, setLoading] = useState(true)

  /* ── ML yield prediction ── */
  const [yieldResult, setYieldResult] = useState<YieldPrediction | null>(null)
  const [predictingYield, setPredictingYield] = useState(false)
  const [yieldError, setYieldError] = useState("")

  /* ── sensor input form ── */
  const [sensorForm, setSensorForm] = useState({
    moisture: "",
    temperature: "",
  })
  const [npkForm, setNpkForm] = useState({
    nitrogen: "",
    phosphorus: "",
    potassium: "",
  })
  const [savingSensor, setSavingSensor] = useState(false)
  const [sensorSaved, setSensorSaved] = useState(false)

  /* ── add crop form ── */
  const [showCropForm, setShowCropForm] = useState(false)
  const [cropForm, setCropForm] = useState({
    crop_name: "",
    crop_type: "",
    field_name: "",
    field_size: "",
    location: "",
    sowing_date: "",
  })
  const emptyCropForm = { crop_name: "", crop_type: "", field_name: "", field_size: "", location: "", sowing_date: "" }
  const [savingCrop, setSavingCrop] = useState(false)
  const [editingCropId, setEditingCropId] = useState<string | null>(null)

  /* ── selected crop for prediction ── */
  const [selectedCropId, setSelectedCropId] = useState("")

  /* ────────────────────────────────────────── */
  /*  Fetch all data on mount                   */
  /* ────────────────────────────────────────── */
  useEffect(() => {
    if (user?.id) {
      fetchProfile()
    }
  }, [user])

  /* When profileId is known, fetch crops + sensor_data + predictions */
  useEffect(() => {
    if (profileId) {
      fetchCrops()
      fetchSensorData()
    }
  }, [profileId])

  /* ══════════ farmers_profile ══════════ */
  async function fetchProfile() {
    setLoading(true)
    const { data } = await supabase
      .from("farmers_profile")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (data) {
      setProfileId(data.id)
      setFarmerName(data.name || "")
      setFarmerVillage(data.village || "")
      setFarmerState(data.state || "")
      setProfileSaved(true)
    }
    setLoading(false)
  }

  async function saveProfile() {
    setSavingProfile(true)
    const payload: Record<string, any> = {
      user_id: user.id,
      name: farmerName,
      state: farmerState,
    }
    // Only include village if user entered a value (column may not exist yet)
    if (farmerVillage) payload.village = farmerVillage

    let result
    if (profileId) {
      result = await supabase
        .from("farmers_profile")
        .update(payload)
        .eq("id", profileId)
        .select()
    } else {
      result = await supabase
        .from("farmers_profile")
        .insert(payload)
        .select()
    }

    if (result.error) {
      // If village column is missing, retry without it
      if (result.error.message?.includes("village")) {
        delete payload.village
        const retry = profileId
          ? await supabase.from("farmers_profile").update(payload).eq("id", profileId).select()
          : await supabase.from("farmers_profile").insert(payload).select()

        if (retry.error) {
          console.error("Profile save error:", retry.error)
          alert("Error: " + retry.error.message)
        } else {
          if (retry.data?.[0]) setProfileId(retry.data[0].id)
          setProfileSaved(true)
          alert("Profile saved (run ALTER TABLE farmers_profile ADD COLUMN village text; in Supabase SQL Editor to enable village field)")
        }
      } else {
        console.error("Profile save error:", result.error)
        alert("Error: " + result.error.message)
      }
    } else {
      if (result.data?.[0]) setProfileId(result.data[0].id)
      setProfileSaved(true)
    }
    setSavingProfile(false)
  }

  /* ══════════ crops ══════════ */
  async function fetchCrops() {
    if (!profileId) return
    const { data } = await supabase
      .from("crops")
      .select("*")
      .eq("farmer_id", profileId)
      .order("created_at", { ascending: false })

    if (data) setCrops(data)
  }

  /* ══════════ Add / Update crop ══════════ */
  async function handleSaveCrop() {
    if (!cropForm.crop_name || !profileId) return
    setSavingCrop(true)

    const payload = {
      farmer_id: profileId,
      crop_name: cropForm.crop_name,
      crop_type: cropForm.crop_type,
      field_name: cropForm.field_name,
      field_size: cropForm.field_size,
      location: cropForm.location,
      sowing_date: cropForm.sowing_date || null,
    }

    let error
    if (editingCropId) {
      ;({ error } = await supabase.from("crops").update(payload).eq("id", editingCropId))
    } else {
      ;({ error } = await supabase.from("crops").insert(payload))
    }

    if (error) {
      console.error("Crop save error:", error)
      alert("Error: " + error.message)
    } else {
      setCropForm(emptyCropForm)
      setEditingCropId(null)
      setShowCropForm(false)
      fetchCrops()
    }
    setSavingCrop(false)
  }

  /* ══════════ Edit crop (populate form) ══════════ */
  function startEditCrop(crop: CropRow) {
    setCropForm({
      crop_name: crop.crop_name || "",
      crop_type: crop.crop_type || "",
      field_name: crop.field_name || "",
      field_size: crop.field_size || "",
      location: crop.location || "",
      sowing_date: crop.sowing_date || "",
    })
    setEditingCropId(crop.id)
    setShowCropForm(true)
  }

  /* ══════════ Delete crop ══════════ */
  async function handleDeleteCrop(id: string) {
    if (!confirm("Delete this crop/field? / यह फसल/खेत मिटाएं?")) return
    await supabase.from("crops").delete().eq("id", id)
    if (selectedCropId === id) setSelectedCropId("")
    fetchCrops()
  }

  /* ══════════ sensor_data ══════════ */
  async function fetchSensorData() {
    if (!profileId) return
    const { data } = await supabase
      .from("sensor_data")
      .select("*")
      .eq("farmer_id", profileId)
      .order("created_at", { ascending: true })

    if (data) setSensorRows(data)
  }



  /* ══════════ Save sensor reading ══════════ */
  async function handleSaveSensor() {
    if (!profileId) {
      alert("Please save your profile first / पहले प्रोफ़ाइल सहेजें")
      return
    }
    setSavingSensor(true)

    const m = parseFloat(sensorForm.moisture)
    const t = parseFloat(sensorForm.temperature)
    const n = parseFloat(npkForm.nitrogen)
    const p = parseFloat(npkForm.phosphorus)
    const k = parseFloat(npkForm.potassium)

    if (isNaN(m) || isNaN(t)) {
      alert("Moisture & Temperature are required / नमी और तापमान आवश्यक हैं")
      setSavingSensor(false)
      return
    }

    const payload = {
      farmer_id: profileId,
      moisture: m,
      temperature: t,
      nitrogen: isNaN(n) ? 0 : n,
      phosphorus: isNaN(p) ? 0 : p,
      potassium: isNaN(k) ? 0 : k,
    }

    const { error } = await supabase.from("sensor_data").insert(payload)

    if (error) {
      console.error("Sensor save error:", error)
      alert("Error: " + error.message)
    } else {
      setSensorForm({ moisture: "", temperature: "" })
      setNpkForm({ nitrogen: "", phosphorus: "", potassium: "" })
      setSensorSaved(true)
      setTimeout(() => setSensorSaved(false), 2000)
      fetchSensorData()
    }
    setSavingSensor(false)
  }

  /* ══════════ Delete sensor reading ══════════ */
  async function deleteSensorRow(id: string) {
    if (!confirm("Delete this reading? / यह रीडिंग मिटाएं?")) return
    await supabase.from("sensor_data").delete().eq("id", id)
    fetchSensorData()
  }

  /* ══════════ ML Yield Prediction ══════════ */
  async function handlePredictYield() {
    if (!selectedCropId) return
    const crop = crops.find((c) => c.id === selectedCropId)
    if (!crop) return

    setPredictingYield(true)
    setYieldError("")
    setYieldResult(null)

    try {
      const res = await fetch("/api/predict-yield", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop_name: crop.crop_name,
          crop_type: crop.crop_type,
          field_size: crop.field_size,
          location: crop.location,
          sowing_date: crop.sowing_date,
          sensor: latestSensor
            ? {
                moisture: latestSensor.moisture,
                temperature: latestSensor.temperature,
                nitrogen: latestSensor.nitrogen,
                phosphorus: latestSensor.phosphorus,
                potassium: latestSensor.potassium,
              }
            : null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setYieldError(data.error || "Prediction failed")
        return
      }
      setYieldResult(data.prediction)
    } catch (err: any) {
      setYieldError(err.message || "Network error — please try again")
    } finally {
      setPredictingYield(false)
    }
  }

  /* ═══════════════════════════════════════════ */
  /*  Derived data for charts                    */
  /* ═══════════════════════════════════════════ */
  const chartReadings = useMemo(() => {
    return sensorRows.map((r) => {
      const d = new Date(r.created_at)
      const h = d.getHours()
      const ampm = h >= 12 ? "PM" : "AM"
      const dh = h % 12 || 12
      return {
        time: `${dh} ${ampm}`,
        moisture: r.moisture,
        temperature: r.temperature,
      }
    })
  }, [sensorRows])

  const latestSensor = sensorRows.length > 0 ? sensorRows[sensorRows.length - 1] : null

  const soilMetrics = useMemo(() => {
    if (!latestSensor) return []
    return [
      {
        icon: Droplets,
        label: "Soil Moisture / मिट्टी की नमी",
        value: `${latestSensor.moisture}%`,
        ...getStatus(latestSensor.moisture, "moisture"),
      },
      {
        icon: Thermometer,
        label: "Soil Temperature / मिट्टी का तापमान",
        value: `${latestSensor.temperature}°C`,
        ...getStatus(latestSensor.temperature, "temp"),
      },
      {
        icon: Leaf,
        label: "Nitrogen (N) / नाइट्रोजन",
        value: `${latestSensor.nitrogen} kg/ha`,
        ...getStatus(latestSensor.nitrogen, "npk"),
      },
      {
        icon: FlaskConical,
        label: "Potassium (K) / पोटैशियम",
        value: `${latestSensor.potassium} kg/ha`,
        ...getStatus(latestSensor.potassium, "npk"),
      },
    ]
  }, [latestSensor])

  const nutrientChartData = useMemo(() => {
    if (!latestSensor) return []
    return [
      { nutrient: "N", value: latestSensor.nitrogen, label: "Nitrogen / नाइट्रोजन" },
      { nutrient: "P", value: latestSensor.phosphorus, label: "Phosphorus / फॉस्फोरस" },
      { nutrient: "K", value: latestSensor.potassium, label: "Potassium / पोटैशियम" },
    ]
  }, [latestSensor])

  function getCropName(cropId: string) {
    return crops.find((c) => c.id === cropId)?.crop_name || cropId
  }

  /* ═══════════════════════════════════════════ */
  /*  RENDER                                     */
  /* ═══════════════════════════════════════════ */
  if (loading) {
    return (
      <section className="mx-auto flex max-w-7xl items-center justify-center px-4 py-24">
        <Loader2 className="size-8 animate-spin text-primary" />
      </section>
    )
  }

  return (
    <section id="dashboard" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      {/* ── Header ── */}
      <div className="mb-10">
        <Badge
          variant="secondary"
          className="mb-3 border border-primary/20 bg-primary/10 text-primary"
        >
          <UserCircle className="size-3" />
          <span>{"Farmer Dashboard / किसान डैशबोर्ड"}</span>
        </Badge>
        <h2 className="text-3xl font-bold text-foreground md:text-4xl">
          {"Welcome, "}
          <span className="text-primary">{farmerName || user.email}</span>
        </h2>
        <p className="mt-1 text-lg text-muted-foreground">
          {"प्रोफ़ाइल भरें, सेंसर डेटा दर्ज करें, रियल-टाइम मॉनिटरिंग देखें"}
        </p>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/*  1.  PROFILE CARD  (farmers_profile)          */}
      {/* ══════════════════════════════════════════════ */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="size-5 text-primary" />
            {"Personal Details / व्यक्तिगत जानकारी"}
          </CardTitle>
          <CardDescription>
            {"farmers_profile — name, village, state"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pf-name" className="text-sm font-medium">
                {"Full Name / पूरा नाम"}
              </Label>
              <Input
                id="pf-name"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pf-village" className="text-sm font-medium">
                {"Village / गाँव"}
              </Label>
              <Input
                id="pf-village"
                value={farmerVillage}
                onChange={(e) => setFarmerVillage(e.target.value)}
                placeholder="e.g. Rampur"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pf-state" className="text-sm font-medium">
                {"State / राज्य"}
              </Label>
              <Input
                id="pf-state"
                value={farmerState}
                onChange={(e) => setFarmerState(e.target.value)}
                placeholder="e.g. Uttar Pradesh"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            {profileSaved && (
              <span className="text-sm text-green-600">{"✓ Saved"}</span>
            )}
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              <span>
                {savingProfile
                  ? "Saving..."
                  : "Save Profile / प्रोफ़ाइल सहेजें"}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════ */}
      {/*  2.  SENSOR DATA INPUT  (sensor_data)         */}
      {/* ══════════════════════════════════════════════ */}
      <div className="mb-10">
        <Badge
          variant="secondary"
          className="mb-3 border border-primary/20 bg-primary/10 text-primary"
        >
          <Droplets className="size-3" />
          <span>{"Soil Analytics / मिट्टी विश्लेषण"}</span>
        </Badge>
        <h3 className="text-2xl font-bold text-foreground">
          {"Real-Time Soil Monitoring"}
        </h3>
        <p className="mt-1 text-muted-foreground">
          {"सेंसर से प्राप्त डेटा भरें / Enter sensor data below"}
        </p>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Moisture & Temperature Input */}
        <Card className="border-dashed border-primary/30 bg-primary/[0.03]">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gauge className="size-5 text-primary" />
              {"Sensor Reading / सेंसर रीडिंग"}
            </CardTitle>
            <CardDescription>
              {"Add new moisture & temperature reading from your sensor"}
              <br />
              {"अपने सेंसर से नमी और तापमान रीडिंग जोड़ें"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="moisture-input" className="text-xs">
                    <Droplets className="size-3.5 text-primary" />
                    {"Moisture % / नमी %"}
                  </Label>
                  <Input
                    id="moisture-input"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="e.g. 52"
                    value={sensorForm.moisture}
                    onChange={(e) =>
                      setSensorForm({ ...sensorForm, moisture: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="temp-input" className="text-xs">
                    <Thermometer className="size-3.5 text-primary" />
                    {"Temperature °C / तापमान °C"}
                  </Label>
                  <Input
                    id="temp-input"
                    type="number"
                    min={-10}
                    max={60}
                    placeholder="e.g. 28"
                    value={sensorForm.temperature}
                    onChange={(e) =>
                      setSensorForm({
                        ...sensorForm,
                        temperature: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <ArrowDown className="size-3" />
                {"These values are saved to sensor_data table"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* NPK Input */}
        <Card className="border-dashed border-primary/30 bg-primary/[0.03]">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FlaskConical className="size-5 text-primary" />
              {"NPK Levels / एनपीके स्तर"}
            </CardTitle>
            <CardDescription>
              {"Update nutrient data from soil testing kit or sensor"}
              <br />
              {"मिट्टी परीक्षण किट या सेंसर से पोषक तत्व डेटा अपडेट करें"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="n-input" className="text-xs">
                    {"Nitrogen (N) kg/ha"}
                  </Label>
                  <Input
                    id="n-input"
                    type="number"
                    min={0}
                    max={200}
                    placeholder="e.g. 78"
                    value={npkForm.nitrogen}
                    onChange={(e) =>
                      setNpkForm({ ...npkForm, nitrogen: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="p-input" className="text-xs">
                    {"Phosphorus (P) kg/ha"}
                  </Label>
                  <Input
                    id="p-input"
                    type="number"
                    min={0}
                    max={200}
                    placeholder="e.g. 55"
                    value={npkForm.phosphorus}
                    onChange={(e) =>
                      setNpkForm({ ...npkForm, phosphorus: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="k-input" className="text-xs">
                    {"Potassium (K) kg/ha"}
                  </Label>
                  <Input
                    id="k-input"
                    type="number"
                    min={0}
                    max={200}
                    placeholder="e.g. 66"
                    value={npkForm.potassium}
                    onChange={(e) =>
                      setNpkForm({ ...npkForm, potassium: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Sensor Button */}
      <div className="mb-10 flex items-center gap-3">
        <Button
          onClick={handleSaveSensor}
          disabled={
            savingSensor ||
            !sensorForm.moisture ||
            !sensorForm.temperature ||
            !profileId
          }
          className="flex-1 sm:flex-none"
        >
          {savingSensor ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          <span>
            {sensorSaved
              ? "Saved! / सेव हो गया!"
              : "Save Reading / रीडिंग सहेजें"}
          </span>
        </Button>
        {!profileId && (
          <span className="text-sm text-amber-600">
            {"↑ Save your profile first to enable sensor data"}
          </span>
        )}
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/*  3.  METRIC CARDS  (latest sensor reading)    */}
      {/* ══════════════════════════════════════════════ */}
      {soilMetrics.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {soilMetrics.map((metric) => (
            <Card key={metric.label} className="gap-4 py-4">
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <metric.icon className="size-5 text-primary" />
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${metric.color}`}
                  >
                    {metric.text}
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metric.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/*  4.  CHARTS  (Moisture/Temp + NPK)            */}
      {/* ══════════════════════════════════════════════ */}
      {sensorRows.length > 0 && (
        <div className="mb-10 grid gap-6 lg:grid-cols-2">
          {/* Moisture & Temperature Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {"Moisture & Temperature / नمی और तापमान"}
                  </CardTitle>
                  <CardDescription>
                    {"Sensor readings timeline / सेंसर रीडिंग टाइमलाइन"}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {sensorRows.length} {"readings"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartReadings}>
                    <defs>
                      <linearGradient
                        id="moistureGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="oklch(0.52 0.17 145)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="oklch(0.52 0.17 145)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.90 0.03 145)"
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11 }}
                      stroke="oklch(0.45 0.04 145)"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="oklch(0.45 0.04 145)"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.995 0.001 140)",
                        border: "1px solid oklch(0.90 0.03 145)",
                        borderRadius: "0.5rem",
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="moisture"
                      stroke="oklch(0.52 0.17 145)"
                      strokeWidth={2}
                      fill="url(#moistureGrad)"
                      name="Moisture %"
                    />
                    <Area
                      type="monotone"
                      dataKey="temperature"
                      stroke="oklch(0.72 0.14 90)"
                      strokeWidth={2}
                      fill="none"
                      name="Temp °C"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Nutrient Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                {"Nutrient Analysis / पोषक तत्व विश्लेषण"}
              </CardTitle>
              <CardDescription>
                {"NPK levels from latest reading / नवीनतम रीडिंग से एनपीके"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={nutrientChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.90 0.03 145)"
                    />
                    <XAxis
                      dataKey="nutrient"
                      tick={{ fontSize: 12 }}
                      stroke="oklch(0.45 0.04 145)"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="oklch(0.45 0.04 145)"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.995 0.001 140)",
                        border: "1px solid oklch(0.90 0.03 145)",
                        borderRadius: "0.5rem",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="oklch(0.52 0.17 145)"
                      radius={[6, 6, 0, 0]}
                      name="Level"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-3">
                {nutrientChartData.map((item) => (
                  <div key={item.nutrient} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">
                        {item.label}
                      </span>
                      <span className="text-xs font-bold text-primary">
                        {item.value} kg/ha
                      </span>
                    </div>
                    <Progress
                      value={Math.min(item.value, 100)}
                      className="h-1.5"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/*  5.  SENSOR HISTORY TABLE                     */}
      {/* ══════════════════════════════════════════════ */}
      {sensorRows.length > 0 && (
        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              {"Sensor History / सेंसर इतिहास"}
            </CardTitle>
            <CardDescription>
              {"All sensor readings stored in sensor_data table"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4">{"Time"}</th>
                    <th className="pb-2 pr-4">{"Moisture %"}</th>
                    <th className="pb-2 pr-4">{"Temp °C"}</th>
                    <th className="pb-2 pr-4">{"N kg/ha"}</th>
                    <th className="pb-2 pr-4">{"P kg/ha"}</th>
                    <th className="pb-2 pr-4">{"K kg/ha"}</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {sensorRows
                    .slice()
                    .reverse()
                    .map((row) => {
                      const mStatus = getStatus(row.moisture, "moisture")
                      const tStatus = getStatus(row.temperature, "temp")
                      return (
                        <tr
                          key={row.id}
                          className="border-b border-border/50 last:border-0"
                        >
                          <td className="py-2 pr-4 text-xs text-muted-foreground">
                            {new Date(row.created_at).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-2 pr-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${mStatus.color}`}
                            >
                              {row.moisture}%
                            </span>
                          </td>
                          <td className="py-2 pr-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${tStatus.color}`}
                            >
                              {row.temperature}°C
                            </span>
                          </td>
                          <td className="py-2 pr-4 font-medium">
                            {row.nitrogen}
                          </td>
                          <td className="py-2 pr-4 font-medium">
                            {row.phosphorus}
                          </td>
                          <td className="py-2 pr-4 font-medium">
                            {row.potassium}
                          </td>
                          <td className="py-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-red-500 hover:text-red-600"
                              onClick={() => deleteSensorRow(row.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/*  6.  MY CROPS & FIELDS  (crops table)          */}
      {/* ══════════════════════════════════════════════ */}
      <div className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Badge
              variant="secondary"
              className="mb-3 border border-primary/20 bg-primary/10 text-primary"
            >
              <Wheat className="size-3" />
              <span>{"Crops & Fields / फसलें और खेत"}</span>
            </Badge>
            <h3 className="text-2xl font-bold text-foreground">
              {"My Crops & Fields / मेरी फसलें और खेत"}
            </h3>
            <p className="mt-1 text-muted-foreground">
              {"Add and manage your crops — saved in crops table"}
            </p>
          </div>
          <Button
            onClick={() => {
              if (showCropForm) {
                setShowCropForm(false)
                setEditingCropId(null)
                setCropForm(emptyCropForm)
              } else {
                setCropForm(emptyCropForm)
                setEditingCropId(null)
                setShowCropForm(true)
              }
            }}
            variant={showCropForm ? "outline" : "default"}
          >
            <Plus className="size-4" />
            <span>{showCropForm ? "Cancel" : "Add Crop / फसल जोड़ें"}</span>
          </Button>
        </div>

        {/* Add / Edit Crop Form */}
        {showCropForm && (
          <Card className="mb-6 border-dashed border-primary/30 bg-primary/[0.03]">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Leaf className="size-5 text-primary" />
                {editingCropId
                  ? "Edit Crop / फसल संपादित करें"
                  : "Add New Crop / नई फसल जोड़ें"}
              </CardTitle>
              <CardDescription>
                {"Saved to the crops table in Supabase"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">
                    {"Crop Name / फसल का नाम *"}
                  </Label>
                  <Input
                    placeholder="e.g. Wheat / गेहूं"
                    value={cropForm.crop_name}
                    onChange={(e) =>
                      setCropForm({ ...cropForm, crop_name: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">
                    {"Crop Type / फसल का प्रकार"}
                  </Label>
                  <select
                    value={cropForm.crop_type}
                    onChange={(e) =>
                      setCropForm({ ...cropForm, crop_type: e.target.value })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="">{"— Select type —"}</option>
                    <option value="Kharif">Kharif / खरीफ</option>
                    <option value="Rabi">Rabi / रबी</option>
                    <option value="Zaid">Zaid / जायद</option>
                    <option value="Annual">Annual / वार्षिक</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">
                    {"Field Name / खेत का नाम"}
                  </Label>
                  <Input
                    placeholder="e.g. Field A"
                    value={cropForm.field_name}
                    onChange={(e) =>
                      setCropForm({ ...cropForm, field_name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">
                    {"Field Size (Acres) / आकार (एकड़)"}
                  </Label>
                  <Input
                    placeholder="e.g. 2.5"
                    value={cropForm.field_size}
                    onChange={(e) =>
                      setCropForm({ ...cropForm, field_size: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">
                    {"Location / स्थान"}
                  </Label>
                  <Input
                    placeholder="e.g. Village name"
                    value={cropForm.location}
                    onChange={(e) =>
                      setCropForm({ ...cropForm, location: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">
                    {"Sowing Date / बुवाई तिथि"}
                  </Label>
                  <Input
                    type="date"
                    value={cropForm.sowing_date}
                    onChange={(e) =>
                      setCropForm({ ...cropForm, sowing_date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowCropForm(false)
                    setEditingCropId(null)
                    setCropForm(emptyCropForm)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCrop}
                  disabled={savingCrop || !cropForm.crop_name || !profileId}
                >
                  {savingCrop ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  <span>
                    {savingCrop
                      ? "Saving..."
                      : editingCropId
                        ? "Update / अपडेट करें"
                        : "Save Crop / फसल सहेजें"}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Crop Cards Grid */}
        {crops.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {crops.map((crop) => (
              <Card
                key={crop.id}
                className={`cursor-pointer transition-all ${
                  selectedCropId === crop.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "hover:border-primary/40"
                }`}
                onClick={() => setSelectedCropId(crop.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Leaf className="size-4 text-primary" />
                      {crop.crop_name}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditCrop(crop)
                        }}
                      >
                        <MapPin className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-red-500 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCrop(crop.id)
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {crop.crop_type && (
                      <Badge variant="secondary" className="text-xs">
                        {crop.crop_type}
                      </Badge>
                    )}
                    {crop.field_name && (
                      <Badge variant="outline" className="text-xs">
                        {crop.field_name}
                      </Badge>
                    )}
                    {crop.field_size && (
                      <Badge variant="outline" className="text-xs">
                        {crop.field_size} Acres
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    {crop.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {crop.location}
                      </div>
                    )}
                    {crop.sowing_date && (
                      <div className="flex items-center gap-1">
                        <Leaf className="size-3" />
                        {crop.sowing_date}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          !showCropForm && profileId && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Wheat className="mb-3 size-10 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold text-muted-foreground">
                  {"No crops added yet / अभी कोई फसल नहीं"}
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {"Click 'Add Crop' to get started / फसल जोड़ने के लिए ऊपर क्लिक करें"}
                </p>
                <Button onClick={() => setShowCropForm(true)}>
                  <Plus className="size-4" />
                  <span>{"Add Crop / फसल जोड़ें"}</span>
                </Button>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/*  6.5  AI CROP IMAGE SCANNER                   */}
      {/* ══════════════════════════════════════════════ */}
      <div className="mb-10">
        <div className="mb-4">
          <Badge
            variant="secondary"
            className="mb-3 border border-primary/20 bg-primary/10 text-primary"
          >
            <Camera className="size-3" />
            <span>{"AI Crop Scanner / AI फसल स्कैनर"}</span>
          </Badge>
          <h3 className="text-2xl font-bold text-foreground">
            {"Crop Disease & Health Scanner / फसल रोग एवं स्वास्थ्य स्कैनर"}
          </h3>
          <p className="mt-1 text-muted-foreground">
            {"Upload a crop photo — Gemini AI will analyze health, nutrition, irrigation & harvest time"}
          </p>
        </div>
        <CropImageAnalyzer />
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/*  7.  YIELD PREDICTION (ML Model)              */}
      {/* ══════════════════════════════════════════════ */}
      {crops.length > 0 && (
        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              {"Yield Prediction / उपज भविष्यवाणी"}
            </CardTitle>
            <CardDescription>
              {"Select your crop/field — our AI model will predict the expected yield / अपनी फसल चुनें — AI मॉडल उपज की भविष्यवाणी करेगा"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-2">
                <Label className="text-sm font-medium">
                  {"Select Field / खेत चुनें"}
                </Label>
                <select
                  value={selectedCropId}
                  onChange={(e) => {
                    setSelectedCropId(e.target.value)
                    setYieldResult(null)
                    setYieldError("")
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">{"— Choose crop / field —"}</option>
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.crop_name} {c.crop_type && `(${c.crop_type})`} {c.field_name && `- ${c.field_name}`}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handlePredictYield}
                disabled={predictingYield || !selectedCropId}
                className="sm:w-auto"
              >
                {predictingYield ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>{"Predicting... / भविष्यवाणी हो रही है..."}</span>
                  </>
                ) : (
                  <>
                    <Activity className="size-4" />
                    <span>{"Predict Yield / उपज भविष्यवाणी करें"}</span>
                  </>
                )}
              </Button>
            </div>

            {/* Error */}
            {yieldError && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <span>{yieldError}</span>
              </div>
            )}

            {/* Predicting animation */}
            {predictingYield && (
              <div className="mt-6 flex flex-col items-center justify-center py-8">
                <div className="relative mb-4">
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                  <div className="relative rounded-full bg-primary/10 p-4">
                    <Wheat className="size-8 animate-pulse text-primary" />
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {"AI model is predicting yield..."}
                </p>
                <p className="text-xs text-muted-foreground">
                  {"AI मॉडल उपज की भविष्यवाणी कर रहा है..."}
                </p>
              </div>
            )}

            {/* ML Prediction Result */}
            {yieldResult && !predictingYield && (
              <div className="mt-6 space-y-4">
                {/* Main yield number */}
                <div className="flex flex-col items-center rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
                  <p className="mb-1 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    {"Predicted Yield / अनुमानित उपज"}
                  </p>
                  <p className="text-4xl font-bold text-primary">
                    {yieldResult.predicted_yield} <span className="text-lg font-medium">q/ha</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Range: {yieldResult.yield_range.min} – {yieldResult.yield_range.max} q/ha
                  </p>
                  <div className="mt-2 flex gap-3">
                    <Badge variant="secondary" className="text-xs">
                      {"Confidence / विश्वास: "}{yieldResult.confidence}%
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {yieldResult.growth_stage}
                    </Badge>
                  </div>
                </div>

                {/* Factors */}
                {yieldResult.factors && yieldResult.factors.length > 0 && (
                  <div className="rounded-lg border border-border p-4">
                    <p className="mb-3 text-sm font-semibold text-foreground">
                      {"Key Factors / मुख्य कारक:"}
                    </p>
                    <div className="space-y-2">
                      {yieldResult.factors.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span
                            className={`mt-0.5 inline-block size-2 shrink-0 rounded-full ${
                              f.impact === "Positive"
                                ? "bg-green-500"
                                : f.impact === "Negative"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                            }`}
                          />
                          <div>
                            <span className="font-medium">{f.factor}:</span>{" "}
                            <span className="text-muted-foreground">{f.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendation */}
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    {"Recommendation / सुझाव"}
                  </p>
                  <p className="text-sm leading-relaxed text-foreground">
                    {yieldResult.recommendation}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {yieldResult.recommendation_hindi}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/*  Empty state when no sensor data              */}
      {/* ══════════════════════════════════════════════ */}
      {sensorRows.length === 0 && profileId && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Gauge className="mb-4 size-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              {"No sensor data yet / अभी कोई सेंसर डेटा नहीं"}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {"Add your first sensor reading above to see charts and analytics"}
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
