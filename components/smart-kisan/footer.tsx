import { Leaf, Globe } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                <Leaf className="size-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  SmartKisan AI
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {"स्मार्ट किसान एआई"}
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {
                "Empowering Indian farmers with AI technology for smarter, sustainable agriculture. / एआई तकनीक से भारतीय किसानों को स्मार्ट और टिकाऊ कृषि के लिए सशक्त बनाना।"
              }
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <p className="mb-3 text-sm font-semibold text-foreground">
              {"Quick Links / त्वरित लिंक"}
            </p>
            <ul className="flex flex-col gap-2">
              {[
                { href: "#dashboard", label: "Dashboard / डैशबोर्ड" },
                { href: "#analytics", label: "Soil Analytics / मिट्टी विश्लेषण" },
                { href: "#disease", label: "Disease AI / रोग पहचान" },
                { href: "#schemes", label: "Gov Schemes / सरकारी योजनाएं" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="mb-3 text-sm font-semibold text-foreground">
              {"Resources / संसाधन"}
            </p>
            <ul className="flex flex-col gap-2">
              {[
                "Farming Guide / खेती गाइड",
                "Weather Alerts / मौसम अलर्ट",
                "Market Prices / मंडी भाव",
                "Expert Helpline / विशेषज्ञ हेल्पलाइन",
              ].map((item) => (
                <li key={item}>
                  <span className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-3 text-sm font-semibold text-foreground">
              {"Contact / संपर्क"}
            </p>
            <ul className="flex flex-col gap-2">
              <li className="text-xs text-muted-foreground">
                {"Helpline: 1800-XXX-XXXX"}
              </li>
              <li className="text-xs text-muted-foreground">
                {"Email: help@smartkisan.ai"}
              </li>
              <li className="text-xs text-muted-foreground">
                {"WhatsApp: +91 XXXXX XXXXX"}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p className="text-[11px] text-muted-foreground">
              {"© 2026 SmartKisan AI. All rights reserved. / सर्वाधिकार सुरक्षित।"}
            </p>
            <div className="flex items-center gap-4">
              <span className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
                {"Privacy / गोपनीयता"}
              </span>
              <span className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
                {"Terms / शर्तें"}
              </span>
              <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40">
                <Globe className="size-3.5" />
                <select
                  className="cursor-pointer appearance-none border-none bg-transparent pr-1 text-[11px] text-muted-foreground outline-none focus:text-foreground"
                  defaultValue="bilingual"
                  onChange={(e) => {
                    // Store preference — can be wired to a context/provider later
                    document.documentElement.setAttribute("data-lang", e.target.value)
                  }}
                >
                  <option value="bilingual">EN / हिंदी</option>
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
