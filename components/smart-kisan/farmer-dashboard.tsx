"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LayoutDashboard,
  Wheat,
  CalendarDays,
  Droplets,
  Sun,
  CloudRain,
  TrendingUp,
  MapPin,
  Clock,
  Sprout,
  Bug,
  FlaskConical,
  Leaf,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

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

interface FarmerDashboardProps {
  user?: any
}

/* ── Calculate growth progress from sowing date ── */
function calcGrowth(sowingDate: string) {
  const sow = new Date(sowingDate)
  const now = new Date()
  const daysSinceSowing = Math.max(0, Math.floor((now.getTime() - sow.getTime()) / 86400000))

  // Estimate ~120 day crop cycle
  const totalDays = 120
  const daysToHarvest = Math.max(0, totalDays - daysSinceSowing)
  const progress = Math.min(100, Math.round((daysSinceSowing / totalDays) * 100))

  let stage = "Sowing / बुवाई"
  if (progress >= 85) stage = "Maturity / परिपक्वता"
  else if (progress >= 65) stage = "Grain Filling / दाना भरना"
  else if (progress >= 45) stage = "Flowering / फूल"
  else if (progress >= 20) stage = "Tillering / कल्ले"
  else stage = "Seedling / अंकुर"

  const harvestDate = new Date(sow.getTime() + totalDays * 86400000)
  const harvestStr = harvestDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

  return { daysSinceSowing, daysToHarvest, progress, stage, harvestStr }
}

const todayWeather = {
  temp: "28°C",
  humidity: "62%",
  rainfall: "0 mm",
  wind: "12 km/h",
  condition: "Sunny / धूप",
}

const activities = [
  {
    icon: Droplets,
    label: "Irrigation / सिंचाई",
    detail: "Next: Tomorrow 6 AM / कल सुबह 6 बजे",
    status: "Scheduled / निर्धारित",
    color: "text-blue-600",
  },
  {
    icon: FlaskConical,
    label: "Fertilizer / खाद",
    detail: "Urea top dressing due / यूरिया टॉप ड्रेसिंग",
    status: "Pending / बाकी",
    color: "text-amber-600",
  },
  {
    icon: Bug,
    label: "Pest Check / कीट जांच",
    detail: "Aphid monitoring / एफिड निगरानी",
    status: "Done / पूरा",
    color: "text-primary",
  },
  {
    icon: Sprout,
    label: "Growth Check / विकास जांच",
    detail: "Tiller count completed / टिलर गिनती पूरी",
    status: "Done / पूरा",
    color: "text-primary",
  },
]

export function FarmerDashboard({ user }: FarmerDashboardProps) {
  const [crops, setCrops] = useState<CropRow[]>([])
  const [selectedCrop, setSelectedCrop] = useState<CropRow | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchCrops = useCallback(async () => {
    if (!user) {
      setCrops([])
      setSelectedCrop(null)
      return
    }
    setLoading(true)
    try {
      // First get the farmer profile id
      const { data: profile } = await supabase
        .from("farmers_profile")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (!profile) {
        setCrops([])
        setSelectedCrop(null)
        return
      }

      const { data } = await supabase
        .from("crops")
        .select("*")
        .eq("farmer_id", profile.id)
        .order("created_at", { ascending: false })

      setCrops(data || [])
      setSelectedCrop(null) // Don't auto-select, let user choose
    } catch {
      setCrops([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchCrops()
  }, [fetchCrops])

  const growth = selectedCrop ? calcGrowth(selectedCrop.sowing_date) : null

  return (
    <section id="dashboard" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mb-10">
        <Badge
          variant="secondary"
          className="mb-3 border border-primary/20 bg-primary/10 text-primary"
        >
          <LayoutDashboard className="size-3" />
          <span>{"Farmer Dashboard / किसान डैशबोर्ड"}</span>
        </Badge>
        <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
          {"My Farm Overview"}
        </h2>
        <p className="mt-1 text-lg text-muted-foreground">
          {"मेरे खेत का विवरण"}
        </p>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList>
          <TabsTrigger value="current">
            <Wheat className="size-4" />
            <span className="hidden sm:inline">
              {"Current Crop / वर्तमान फसल"}
            </span>
            <span className="sm:hidden">{"Crop"}</span>
          </TabsTrigger>
          <TabsTrigger value="weather">
            <Sun className="size-4" />
            <span className="hidden sm:inline">
              {"Weather / मौसम"}
            </span>
            <span className="sm:hidden">{"Weather"}</span>
          </TabsTrigger>
          <TabsTrigger value="activities">
            <CalendarDays className="size-4" />
            <span className="hidden sm:inline">
              {"Activities / गतिविधियां"}
            </span>
            <span className="sm:hidden">{"Tasks"}</span>
          </TabsTrigger>
        </TabsList>

        {/* Current Crop Tab */}
        <TabsContent value="current" className="mt-6">
          {/* ── No user logged in or no crops ── */}
          {!user ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Leaf className="mb-4 size-12 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold text-foreground">
                  {"Login to see your farm data / अपने खेत का डेटा देखने के लिए लॉगिन करें"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {"Sign in and add your crops in My Profile section / लॉगिन करें और मेरी प्रोफाइल में अपनी फसलें जोड़ें"}
                </p>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <Sprout className="mr-2 size-5 animate-pulse text-primary" />
                <span className="text-muted-foreground">Loading your crops...</span>
              </CardContent>
            </Card>
          ) : crops.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Wheat className="mb-4 size-12 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold text-foreground">
                  {"No crops added yet / अभी तक कोई फसल नहीं जोड़ी गई"}
                </h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  {"Go to My Profile and add your field details to see your farm overview here. / मेरी प्रोफाइल में जाकर अपने खेत का विवरण जोड़ें।"}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    document.getElementById("farmer-profile")?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  <ArrowRight className="size-4" />
                  <span>Go to My Profile / प्रोफाइल पर जाएं</span>
                </Button>
              </CardContent>
            </Card>
          ) : !selectedCrop ? (
            /* ── Crop Selector ── */
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                {"Select a crop to view details / विवरण देखने के लिए फसल चुनें"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {crops.map((crop) => (
                  <Card
                    key={crop.id}
                    className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
                    onClick={() => setSelectedCrop(crop)}
                  >
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                        <Wheat className="size-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {crop.crop_name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {crop.field_name} — {crop.field_size}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Sown: {new Date(crop.sowing_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            /* ── Selected Crop Details ── */
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCrop(null)}
                className="text-muted-foreground"
              >
                ← Back to crop list / फसल सूची पर वापस
              </Button>
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Crop Card */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Wheat className="size-5 text-primary" />
                          {selectedCrop.crop_name}
                          {selectedCrop.crop_type && (
                            <span className="text-sm font-normal text-muted-foreground">
                              ({selectedCrop.crop_type})
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {selectedCrop.field_name}
                        </CardDescription>
                      </div>
                      <Badge className="bg-primary text-primary-foreground">
                        {"Active / सक्रिय"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/40 px-3 py-3">
                        <MapPin className="size-4 text-primary" />
                        <p className="text-[10px] text-muted-foreground">{"Field / खेत"}</p>
                        <p className="text-xs font-semibold text-foreground">
                          {selectedCrop.field_name} — {selectedCrop.field_size}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/40 px-3 py-3">
                        <CalendarDays className="size-4 text-primary" />
                        <p className="text-[10px] text-muted-foreground">{"Sowing / बुवाई"}</p>
                        <p className="text-xs font-semibold text-foreground">
                          {new Date(selectedCrop.sowing_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/40 px-3 py-3">
                        <TrendingUp className="size-4 text-primary" />
                        <p className="text-[10px] text-muted-foreground">{"Expected Harvest / कटाई"}</p>
                        <p className="text-xs font-semibold text-foreground">
                          {growth?.harvestStr}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/40 px-3 py-3">
                        <Clock className="size-4 text-primary" />
                        <p className="text-[10px] text-muted-foreground">{"Days Left / बाकी दिन"}</p>
                        <p className="text-lg font-bold text-primary">
                          {growth?.daysToHarvest}
                        </p>
                      </div>
                    </div>

                    {/* Growth Progress */}
                    {growth && (
                      <div className="mt-6">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">
                            {"Growth Stage / विकास चरण: "}
                            <span className="text-primary">{growth.stage}</span>
                          </p>
                          <span className="text-sm font-bold text-primary">
                            {growth.progress}%
                          </span>
                        </div>
                        <Progress value={growth.progress} className="h-3" />
                        <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
                          <span>{"Sowing / बुवाई"}</span>
                          <span>{"Tillering / कल्ले"}</span>
                          <span>{"Flowering / फूल"}</span>
                          <span>{"Grain Fill / दाना"}</span>
                          <span>{"Harvest / कटाई"}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="flex flex-col gap-4">
                  <Card className="flex-1">
                    <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                      <Wheat className="mb-2 size-8 text-primary" />
                      <p className="text-3xl font-bold text-foreground">{selectedCrop.field_size || "—"}</p>
                      <p className="text-xs text-muted-foreground">{"Field Size / खेत का आकार"}</p>
                    </CardContent>
                  </Card>
                  <Card className="flex-1">
                    <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                      <MapPin className="mb-2 size-8 text-primary" />
                      <p className="text-lg font-bold text-foreground">{selectedCrop.location || "—"}</p>
                      <p className="text-xs text-muted-foreground">{"Location / स्थान"}</p>
                    </CardContent>
                  </Card>
                  <Card className="flex-1">
                    <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                      <Clock className="mb-2 size-8 text-primary" />
                      <p className="text-3xl font-bold text-foreground">{growth?.daysToHarvest ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{"Days to Harvest / कटाई तक दिन"}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Weather Tab */}
        <TabsContent value="weather" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="size-5 text-primary" />
                {"Today's Weather / आज का मौसम"}
              </CardTitle>
              <CardDescription>
                {"Local weather forecast for your farm / आपके खेत का मौसम पूर्वानुमान"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                {[
                  {
                    icon: Sun,
                    label: "Temperature / तापमान",
                    value: todayWeather.temp,
                  },
                  {
                    icon: Droplets,
                    label: "Humidity / नमी",
                    value: todayWeather.humidity,
                  },
                  {
                    icon: CloudRain,
                    label: "Rainfall / बारिश",
                    value: todayWeather.rainfall,
                  },
                  {
                    icon: TrendingUp,
                    label: "Wind / हवा",
                    value: todayWeather.wind,
                  },
                  {
                    icon: Sun,
                    label: "Condition / स्थिति",
                    value: todayWeather.condition,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-5 text-center"
                  >
                    <item.icon className="size-6 text-primary" />
                    <p className="text-lg font-bold text-foreground">
                      {item.value}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-5 text-primary" />
                {"Farm Activities / खेत की गतिविधियां"}
              </CardTitle>
              <CardDescription>
                {"Upcoming and recent farm tasks / आगामी और हालिया कार्य"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {activities.map((activity) => (
                  <div
                    key={activity.label}
                    className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3"
                  >
                    <activity.icon className={`size-5 ${activity.color}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {activity.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.detail}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  )
}
