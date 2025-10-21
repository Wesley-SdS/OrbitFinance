import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"
import ClientProvider from "./client-provider"
import { HeroSection } from "@/components/sections/hero-section"
import { HeroContent } from "@/components/hero/hero-content"
import { HeroActions } from "@/components/hero/hero-actions"
import { FeatureGrid } from "@/components/features/feature-grid"
import { FeatureCard } from "@/components/features/feature-card"
import { StatsSection, StatItem } from "@/components/sections/stats-section"
import { TestimonialSection, TestimonialCard } from "@/components/sections/testimonial-section"
import { CTASection, CTAContent } from "@/components/sections/cta-section"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"

export default async function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = params
  
  // Enable static rendering
  setRequestLocale(locale)

  const t = await getTranslations({ locale })

  const features = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          />
        </svg>
      ),
      title: t("home.features.analytics.title"),
      description: t("home.features.analytics.description")
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
          />
        </svg>
      ),
      title: t("home.features.aiInsights.title"),
      description: t("home.features.aiInsights.description")
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
      ),
      title: t("home.features.multiAccount.title"),
      description: t("home.features.multiAccount.description")
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
          />
        </svg>
      ),
      title: t("home.features.goalTracking.title"),
      description: t("home.features.goalTracking.description")
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.25 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
          />
        </svg>
      ),
      title: t("home.features.detailedReports.title"),
      description: t("home.features.detailedReports.description")
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"
          />
        </svg>
      ),
      title: t("home.features.multiLanguage.title"),
      description: t("home.features.multiLanguage.description")
    }
  ]

  const testimonials = [
    {
      quote: "O OrbiFinance transformou completamente como gerencio minhas finanças. Os insights com IA me ajudaram a economizar 30% mais este ano!",
      author: "Ana Silva",
      role: "Empresária"
    },
    {
      quote: "Finalmente uma ferramenta que integra todas as minhas contas e me dá uma visão clara do meu futuro financeiro.",
      author: "Carlos Mendes",
      role: "Investidor"
    },
    {
      quote: "A facilidade de uso e os relatórios detalhados fizeram do OrbiFinance essencial para meu planejamento financeiro.",
      author: "Maria Santos",
      role: "Consultora Financeira"
    }
  ]

  return (
    <ClientProvider locale={locale}>
      <main className="flex-1">
        <HeroSection>
          <HeroContent 
            title={t("home.title")}
            description={t("home.description")}
          />
          <HeroActions locale={locale} />
          
          <FeatureGrid>
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </FeatureGrid>
        </HeroSection>

        <StatsSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 sm:px-6">
            <StatItem 
              value="50K+" 
              label={t("home.stats.activeUsers")} 
              description={t("home.stats.activeUsersDesc")}
            />
            <StatItem 
              value="R$ 10M+" 
              label={t("home.stats.managed")} 
              description={t("home.stats.managedDesc")}
            />
            <StatItem 
              value="4.9★" 
              label={t("home.stats.rating")} 
              description={t("home.stats.ratingDesc")}
            />
          </div>
        </StatsSection>

        <TestimonialSection>
          <div className="text-center mb-12 px-4 sm:px-6">
            <h2 className="text-3xl font-bold text-gradient mb-4">{t("home.testimonials.title")}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("home.testimonials.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 sm:px-6">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                quote={testimonial.quote}
                author={testimonial.author}
                role={testimonial.role}
              />
            ))}
          </div>
        </TestimonialSection>

        <CTASection>
          <CTAContent 
            title={t("home.cta.title")}
            description={t("home.cta.description")}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                className="px-8 py-3 shadow-lg hover-glow bg-gradient-to-r from-primary to-primary/80"
              >
                <a href={`/${locale}/auth/sign-up`}>{t("home.cta.getStarted")}</a>
              </Button>
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="px-8 py-3 border-primary/30 bg-transparent hover:bg-primary/10"
              >
                <a href={`/${locale}/auth/login`}>{t("home.cta.seeDemo")}</a>
              </Button>
            </div>
          </CTAContent>
        </CTASection>
      </main>

      <Footer>
        <div className="container mx-auto px-6 flex flex-col items-center justify-between gap-6 md:flex-row">
          <p className="text-muted-foreground text-sm">© 2024 OrbiFinance. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              Privacidade
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              Termos
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              Contato
            </a>
          </div>
        </div>
      </Footer>
    </ClientProvider>
  )
}
