"use client"

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
} from "lucide-react"

const cropData = {
  name: "Wheat (Gehun / गेहूं)",
  variety: "HD-3226",
  field: "Field A - 2.5 Acres / खेत A - 2.5 एकड़",
  sowingDate: "15 Nov 2025 / 15 नवम्बर 2025",
  expectedHarvest: "20 Mar 2026 / 20 मार्च 2026",
  stage: "Grain Filling / दाना भरना",
  stageProgress: 78,
  daysToHarvest: 18,
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

export function FarmerDashboard() {
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
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Crop Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Wheat className="size-5 text-primary" />
                      {cropData.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {"Variety / किस्म: "}
                      {cropData.variety}
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
                    <p className="text-[10px] text-muted-foreground">
                      {"Field / खेत"}
                    </p>
                    <p className="text-xs font-semibold text-foreground">
                      {cropData.field}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/40 px-3 py-3">
                    <CalendarDays className="size-4 text-primary" />
                    <p className="text-[10px] text-muted-foreground">
                      {"Sowing / बुवाई"}
                    </p>
                    <p className="text-xs font-semibold text-foreground">
                      {cropData.sowingDate}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/40 px-3 py-3">
                    <TrendingUp className="size-4 text-primary" />
                    <p className="text-[10px] text-muted-foreground">
                      {"Harvest / कटाई"}
                    </p>
                    <p className="text-xs font-semibold text-foreground">
                      {cropData.expectedHarvest}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/40 px-3 py-3">
                    <Clock className="size-4 text-primary" />
                    <p className="text-[10px] text-muted-foreground">
                      {"Days Left / बाकी दिन"}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {cropData.daysToHarvest}
                    </p>
                  </div>
                </div>

                {/* Growth Progress */}
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {"Growth Stage / विकास चरण: "}
                      <span className="text-primary">{cropData.stage}</span>
                    </p>
                    <span className="text-sm font-bold text-primary">
                      {cropData.stageProgress}%
                    </span>
                  </div>
                  <Progress value={cropData.stageProgress} className="h-3" />
                  <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
                    <span>{"Sowing / बुवाई"}</span>
                    <span>{"Tillering / कल्ले"}</span>
                    <span>{"Flowering / फूल"}</span>
                    <span>{"Grain Fill / दाना"}</span>
                    <span>{"Harvest / कटाई"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="flex flex-col gap-4">
              <Card className="flex-1">
                <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                  <Wheat className="mb-2 size-8 text-primary" />
                  <p className="text-3xl font-bold text-foreground">{"2.5"}</p>
                  <p className="text-xs text-muted-foreground">
                    {"Total Acres / कुल एकड़"}
                  </p>
                </CardContent>
              </Card>
              <Card className="flex-1">
                <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                  <TrendingUp className="mb-2 size-8 text-primary" />
                  <p className="text-3xl font-bold text-foreground">
                    {"4.2 t"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {"Expected Yield / अपेक्षित उपज"}
                  </p>
                </CardContent>
              </Card>
              <Card className="flex-1">
                <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                  <Droplets className="mb-2 size-8 text-primary" />
                  <p className="text-3xl font-bold text-foreground">{"56%"}</p>
                  <p className="text-xs text-muted-foreground">
                    {"Soil Moisture / मिट्टी नमी"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
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
