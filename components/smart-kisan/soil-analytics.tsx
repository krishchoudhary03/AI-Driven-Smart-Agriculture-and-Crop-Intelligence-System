"use client"

import { useState, useMemo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Droplets,
  Thermometer,
  Leaf,
  FlaskConical,
  Plus,
  Save,
  RotateCcw,
  ArrowDown,
  Gauge,
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

interface SensorReading {
  time: string
  moisture: number
  temperature: number
}

interface NutrientInput {
  nitrogen: number
  phosphorus: number
  potassium: number
  ph: number
}

const defaultReadings: SensorReading[] = [
  { time: "6 AM", moisture: 62, temperature: 22 },
  { time: "8 AM", moisture: 58, temperature: 25 },
  { time: "10 AM", moisture: 51, temperature: 29 },
  { time: "12 PM", moisture: 44, temperature: 33 },
  { time: "2 PM", moisture: 38, temperature: 35 },
  { time: "4 PM", moisture: 42, temperature: 32 },
]

function getStatus(value: number, type: "moisture" | "temp" | "npk" | "ph") {
  if (type === "moisture") {
    if (value >= 40 && value <= 70) return { text: "Optimal / सामान्य", color: "bg-primary/15 text-primary" }
    if (value < 40) return { text: "Low / कम", color: "bg-amber-100 text-amber-700" }
    return { text: "High / ज़्यादा", color: "bg-amber-100 text-amber-700" }
  }
  if (type === "temp") {
    if (value >= 18 && value <= 30) return { text: "Good / अच्छा", color: "bg-primary/15 text-primary" }
    if (value < 18) return { text: "Cold / ठंडा", color: "bg-blue-100 text-blue-700" }
    return { text: "Hot / गर्म", color: "bg-red-100 text-red-700" }
  }
  if (type === "ph") {
    if (value >= 6 && value <= 7.5) return { text: "Optimal / सामान्य", color: "bg-primary/15 text-primary" }
    return { text: "Needs Attention / ध्यान दें", color: "bg-amber-100 text-amber-700" }
  }
  if (value >= 60) return { text: "Good / अच्छा", color: "bg-primary/15 text-primary" }
  if (value >= 40) return { text: "Medium / मध्यम", color: "bg-amber-100 text-amber-700" }
  return { text: "Low / कम", color: "bg-red-100 text-red-700" }
}

export function SoilAnalytics() {
  const [readings, setReadings] = useState<SensorReading[]>(defaultReadings)
  const [nutrients, setNutrients] = useState<NutrientInput>({
    nitrogen: 78,
    phosphorus: 55,
    potassium: 66,
    ph: 6.8,
  })
  const [sensorForm, setSensorForm] = useState({
    moisture: "",
    temperature: "",
  })
  const [npkForm, setNpkForm] = useState({
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    ph: "",
  })
  const [saved, setSaved] = useState(false)

  const latestReading = readings[readings.length - 1]

  const soilMetrics = useMemo(() => [
    {
      icon: Droplets,
      label: "Soil Moisture / मिट्टी की नमी",
      value: `${latestReading.moisture}%`,
      ...getStatus(latestReading.moisture, "moisture"),
    },
    {
      icon: Thermometer,
      label: "Soil Temperature / मिट्टी का तापमान",
      value: `${latestReading.temperature}\u00B0C`,
      ...getStatus(latestReading.temperature, "temp"),
    },
    {
      icon: Leaf,
      label: "Nitrogen (N) / नाइट्रोजन",
      value: `${nutrients.nitrogen} kg/ha`,
      ...getStatus(nutrients.nitrogen, "npk"),
    },
    {
      icon: FlaskConical,
      label: "pH Level / पीएच स्तर",
      value: `${nutrients.ph}`,
      ...getStatus(nutrients.ph, "ph"),
    },
  ], [latestReading, nutrients])

  const nutrientChartData = useMemo(
    () => [
      { nutrient: "N", value: nutrients.nitrogen, label: "Nitrogen / नाइट्रोजन" },
      { nutrient: "P", value: nutrients.phosphorus, label: "Phosphorus / फॉस्फोरस" },
      { nutrient: "K", value: nutrients.potassium, label: "Potassium / पोटैशियम" },
      { nutrient: "pH", value: Math.round(nutrients.ph * 10), label: "pH Level / पीएच स्तर" },
    ],
    [nutrients]
  )

  function handleAddReading() {
    const m = parseFloat(sensorForm.moisture)
    const t = parseFloat(sensorForm.temperature)
    if (isNaN(m) || isNaN(t)) return

    const hours = new Date().getHours()
    const ampm = hours >= 12 ? "PM" : "AM"
    const displayHour = hours % 12 || 12
    const time = `${displayHour} ${ampm}`

    setReadings((prev) => [...prev, { time, moisture: m, temperature: t }])
    setSensorForm({ moisture: "", temperature: "" })
  }

  function handleSaveNutrients() {
    const n = parseFloat(npkForm.nitrogen)
    const p = parseFloat(npkForm.phosphorus)
    const k = parseFloat(npkForm.potassium)
    const ph = parseFloat(npkForm.ph)

    setNutrients({
      nitrogen: isNaN(n) ? nutrients.nitrogen : n,
      phosphorus: isNaN(p) ? nutrients.phosphorus : p,
      potassium: isNaN(k) ? nutrients.potassium : k,
      ph: isNaN(ph) ? nutrients.ph : ph,
    })
    setNpkForm({ nitrogen: "", phosphorus: "", potassium: "", ph: "" })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    setReadings(defaultReadings)
    setNutrients({ nitrogen: 78, phosphorus: 55, potassium: 66, ph: 6.8 })
  }

  return (
    <section id="analytics" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mb-10">
        <Badge
          variant="secondary"
          className="mb-3 border border-primary/20 bg-primary/10 text-primary"
        >
          <Droplets className="size-3" />
          <span>{"Soil Analytics / मिट्टी विश्लेषण"}</span>
        </Badge>
        <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
          {"Real-Time Soil Monitoring"}
        </h2>
        <p className="mt-1 text-lg text-muted-foreground">
          {"सेंसर से प्राप्त डेटा भरें / Enter sensor data below"}
        </p>
      </div>

      {/* Sensor Data Input Forms */}
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
                  <Label
                    htmlFor="moisture-input"
                    className="text-xs text-foreground"
                  >
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
                  <Label
                    htmlFor="temp-input"
                    className="text-xs text-foreground"
                  >
                    <Thermometer className="size-3.5 text-primary" />
                    {"Temperature \u00B0C / तापमान \u00B0C"}
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
              <div className="flex gap-3">
                <Button
                  onClick={handleAddReading}
                  disabled={!sensorForm.moisture || !sensorForm.temperature}
                  className="flex-1"
                >
                  <Plus className="size-4" />
                  {"Add Reading / रीडिंग जोड़ें"}
                </Button>
                <Button variant="outline" size="icon" onClick={handleReset} title="Reset / रीसेट">
                  <RotateCcw className="size-4" />
                </Button>
              </div>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <ArrowDown className="size-3" />
                {"New readings appear in the chart below / नई रीडिंग नीचे चार्ट में दिखेगी"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* NPK & pH Input */}
        <Card className="border-dashed border-primary/30 bg-primary/[0.03]">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FlaskConical className="size-5 text-primary" />
              {"NPK & pH Levels / एनपीके और पीएच स्तर"}
            </CardTitle>
            <CardDescription>
              {"Update nutrient data from soil testing kit or sensor"}
              <br />
              {"मिट्टी परीक्षण किट या सेंसर से पोषक तत्व डेटा अपडेट करें"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="nitrogen-input"
                    className="text-xs text-foreground"
                  >
                    {"Nitrogen (N) kg/ha / नाइट्रोजन"}
                  </Label>
                  <Input
                    id="nitrogen-input"
                    type="number"
                    min={0}
                    max={200}
                    placeholder={`Current: ${nutrients.nitrogen}`}
                    value={npkForm.nitrogen}
                    onChange={(e) =>
                      setNpkForm({ ...npkForm, nitrogen: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="phosphorus-input"
                    className="text-xs text-foreground"
                  >
                    {"Phosphorus (P) kg/ha / फॉस्फोरस"}
                  </Label>
                  <Input
                    id="phosphorus-input"
                    type="number"
                    min={0}
                    max={200}
                    placeholder={`Current: ${nutrients.phosphorus}`}
                    value={npkForm.phosphorus}
                    onChange={(e) =>
                      setNpkForm({ ...npkForm, phosphorus: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="potassium-input"
                    className="text-xs text-foreground"
                  >
                    {"Potassium (K) kg/ha / पोटैशियम"}
                  </Label>
                  <Input
                    id="potassium-input"
                    type="number"
                    min={0}
                    max={200}
                    placeholder={`Current: ${nutrients.potassium}`}
                    value={npkForm.potassium}
                    onChange={(e) =>
                      setNpkForm({ ...npkForm, potassium: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="ph-input"
                    className="text-xs text-foreground"
                  >
                    {"pH Level / पीएच स्तर"}
                  </Label>
                  <Input
                    id="ph-input"
                    type="number"
                    min={0}
                    max={14}
                    step={0.1}
                    placeholder={`Current: ${nutrients.ph}`}
                    value={npkForm.ph}
                    onChange={(e) =>
                      setNpkForm({ ...npkForm, ph: e.target.value })
                    }
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveNutrients}
                disabled={
                  !npkForm.nitrogen &&
                  !npkForm.phosphorus &&
                  !npkForm.potassium &&
                  !npkForm.ph
                }
              >
                <Save className="size-4" />
                {saved
                  ? "Saved! / सेव हो गया!"
                  : "Update Nutrients / पोषक तत्व अपडेट करें"}
              </Button>
              <p className="text-[11px] text-muted-foreground">
                {"Leave empty to keep current value / मौजूदा मान रखने के लिए खाली छोड़ें"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metric Cards */}
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
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Moisture Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {"Moisture & Temperature / नमी और तापमान"}
                </CardTitle>
                <CardDescription>
                  {"Sensor readings timeline / सेंसर रीडिंग टाइमलाइन"}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                {readings.length} {"readings / रीडिंग"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={readings}>
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
                    name="Temp \u00B0C"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Nutrient Levels */}
        <Card>
          <CardHeader>
            <CardTitle>{"Nutrient Analysis / पोषक तत्व विश्लेषण"}</CardTitle>
            <CardDescription>
              {"NPK & pH levels / एनपीके और पीएच स्तर"}
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
              {nutrientChartData.map((item) => {
                const displayVal =
                  item.nutrient === "pH"
                    ? nutrients.ph
                    : item.value
                return (
                  <div key={item.nutrient} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">
                        {item.label}
                      </span>
                      <span className="text-xs font-bold text-primary">
                        {item.nutrient === "pH"
                          ? displayVal
                          : `${displayVal} kg/ha`}
                      </span>
                    </div>
                    <Progress
                      value={
                        item.nutrient === "pH"
                          ? (nutrients.ph / 14) * 100
                          : Math.min(item.value, 100)
                      }
                      className="h-1.5"
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
