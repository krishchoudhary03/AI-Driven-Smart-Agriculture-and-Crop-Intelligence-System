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
} from "lucide-react"

const schemes = [
  {
    icon: IndianRupee,
    name: "PM-KISAN",
    nameHindi: "पीएम-किसान सम्मान निधि",
    description:
      "Direct income support of Rs 6,000/year in 3 installments to farmer families.",
    descriptionHindi:
      "किसान परिवारों को 3 किस्तों में Rs 6,000/वर्ष की सीधी आय सहायता।",
    amount: "Rs 6,000/year",
    status: "Active / सक्रिय",
    statusColor: "bg-primary/15 text-primary border-primary/20",
    category: "Income Support / आय सहायता",
  },
  {
    icon: Shield,
    name: "PM Fasal Bima Yojana",
    nameHindi: "पीएम फसल बीमा योजना",
    description:
      "Crop insurance at low premium rates. Kharif: 2%, Rabi: 1.5%, Commercial: 5%.",
    descriptionHindi:
      "कम प्रीमियम दरों पर फसल बीमा। खरीफ: 2%, रबी: 1.5%, वाणिज्यिक: 5%।",
    amount: "Low Premium",
    status: "Enrolling / नामांकन",
    statusColor: "bg-amber-100 text-amber-700 border-amber-200",
    category: "Insurance / बीमा",
  },
  {
    icon: Tractor,
    name: "Sub-Mission on Agri Mechanization",
    nameHindi: "कृषि यंत्रीकरण उप-मिशन (SMAM)",
    description:
      "50-80% subsidy on farm equipment like tractors, harvesters, and irrigation tools.",
    descriptionHindi:
      "ट्रैक्टर, हार्वेस्टर और सिंचाई उपकरणों पर 50-80% सब्सिडी।",
    amount: "Up to 80% Subsidy",
    status: "Active / सक्रिय",
    statusColor: "bg-primary/15 text-primary border-primary/20",
    category: "Equipment / उपकरण",
  },
  {
    icon: Droplets,
    name: "PM Krishi Sinchai Yojana",
    nameHindi: "पीएम कृषि सिंचाई योजना",
    description:
      "Micro irrigation support - drip and sprinkler systems with 55-70% subsidy.",
    descriptionHindi:
      "सूक्ष्म सिंचाई सहायता - ड्रिप और स्प्रिंकलर सिस्टम पर 55-70% सब्सिडी।",
    amount: "55-70% Subsidy",
    status: "Active / सक्रिय",
    statusColor: "bg-primary/15 text-primary border-primary/20",
    category: "Irrigation / सिंचाई",
  },
  {
    icon: Wheat,
    name: "Soil Health Card Scheme",
    nameHindi: "मृदा स्वास्थ्य कार्ड योजना",
    description:
      "Free soil testing and health card with nutrient recommendations for your soil.",
    descriptionHindi:
      "मुफ्त मिट्टी परीक्षण और आपकी मिट्टी के लिए पोषक तत्व सिफारिश कार्ड।",
    amount: "Free",
    status: "Active / सक्रिय",
    statusColor: "bg-primary/15 text-primary border-primary/20",
    category: "Soil / मिट्टी",
  },
  {
    icon: GraduationCap,
    name: "Kisan Credit Card (KCC)",
    nameHindi: "किसान क्रेडिट कार्ड (केसीसी)",
    description:
      "Short-term credit for crop production at subsidized interest rate of 4% per annum.",
    descriptionHindi:
      "फसल उत्पादन के लिए 4% प्रति वर्ष की रियायती ब्याज दर पर अल्पकालिक ऋण।",
    amount: "4% Interest",
    status: "Apply Now / आवेदन करें",
    statusColor: "bg-blue-100 text-blue-700 border-blue-200",
    category: "Credit / ऋण",
  },
]

export function GovSchemes() {
  return (
    <section id="schemes" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mb-10">
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
          {"किसानों के लिए सरकारी योजनाएं और सब्सिडी"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schemes.map((scheme) => (
          <Card
            key={scheme.name}
            className="group transition-shadow hover:shadow-md"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <scheme.icon className="size-5 text-primary" />
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${scheme.statusColor}`}
                >
                  {scheme.status}
                </Badge>
              </div>
              <CardTitle className="mt-2 text-base">{scheme.name}</CardTitle>
              <CardDescription className="text-xs">
                {scheme.nameHindi}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary"
                >
                  <span className="text-xs">{"Details / विवरण"}</span>
                  <ArrowRight className="size-3" />
                </Button>
              </div>
              <div>
                <Badge variant="secondary" className="text-[10px]">
                  {scheme.category}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA Banner */}
      <Card className="mt-10 border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h3 className="text-xl font-bold text-foreground">
              {"Need help applying? / आवेदन में मदद चाहिए?"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {
                "Our AI assistant can guide you through the application process for any government scheme. / हमारा AI सहायक किसी भी सरकारी योजना के आवेदन में आपकी मदद कर सकता है।"
              }
            </p>
          </div>
          <Button size="lg" className="shrink-0 font-semibold">
            <Landmark className="size-4" />
            <span>{"Apply Now / अभी आवेदन करें"}</span>
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}
