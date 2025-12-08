
'use client';

import { Droplet, User, Wrench, BarChart, Home, Book, Phone, Globe } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/use-translation';

const roles = [
  {
    icon: <User className="h-8 w-8 text-primary" />,
    titleKey: 'gp_members_title',
    descriptionKey: 'gp_members_desc',
    href: '/login?redirectTo=/gram-panchayat',
  },
  {
    icon: <Wrench className="h-8 w-8 text-primary" />,
    titleKey: 'pump_operators_title',
    descriptionKey: 'pump_operators_desc',
    href: '/login?redirectTo=/pump-operator',
  },
  {
    icon: <Home className="h-8 w-8 text-primary" />,
    titleKey: 'village_residents_title',
    descriptionKey: 'village_residents_desc',
    href: '/login?redirectTo=/village-resident',
  },
  {
    icon: <BarChart className="h-8 w-8 text-primary" />,
    titleKey: 'block_officials_title',
    descriptionKey: 'block_officials_desc',
    href: '/login?redirectTo=/block-official',
  },
];

export default function HomePage() {
  const { t, setLanguage, language } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Droplet className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground font-headline">JalShakthi</h1>
        </div>
        <div className="flex items-center gap-4">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-auto md:w-[150px] text-sm">
                  <Globe className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline"><SelectValue /></span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <p className="text-muted-foreground mt-2 text-lg">{t('homepage_subtitle')}</p>
          <h2 className="text-4xl font-bold tracking-tight font-headline mt-8">{t('who_are_you')}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t('select_your_role')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {roles.map((role) => (
            <Card key={role.titleKey} className="flex flex-col hover:shadow-xl transition-shadow duration-300 bg-card rounded-lg">
              <CardHeader className="items-center text-center">
                {role.icon}
                <CardTitle className="mt-4 font-headline">{t(role.titleKey)}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col text-center">
                <CardDescription className="flex-grow">{t(role.descriptionKey)}</CardDescription>
                <Button asChild className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href={role.href}>{t('proceed_to_dashboard')}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="mt-20 text-center">
          <h3 className="text-2xl font-bold font-headline">{t('jjm_support_title')}</h3>
          <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
            {t('jjm_support_desc')}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button asChild variant="outline">
              <Link href="https://jaljeevanmission.gov.in" target="_blank" rel="noopener noreferrer">
                <Book className="mr-2 h-4 w-4" />
                {t('read_guidelines')}
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <div className="text-left">
                <span className="text-sm text-muted-foreground">{t('national_helpline')}</span>
                <a href="tel:1800-121-1243" className="block font-bold text-lg text-primary hover:underline">
                  1800-121-1243
                </a>
              </div>
            </div>
          </div>
        </section>
        
      </main>
      <footer className="container mx-auto px-4 py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} JalShakthi. All rights reserved.</p>
      </footer>
    </div>
  );
}
