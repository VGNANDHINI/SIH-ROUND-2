import { Droplet, User, Wrench, BarChart, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const roles = [
  {
    icon: <User className="h-8 w-8 text-primary" />,
    title: 'Gram Panchayat Members',
    description: 'Access administrative tools, manage water supply schemes, and monitor village-level data.',
    href: '/login?redirectTo=/gram-panchayat',
  },
  {
    icon: <Wrench className="h-8 w-8 text-primary" />,
    title: 'Pump Operators / Technicians',
    description: 'View operational data, report issues, and manage maintenance schedules for water pumps.',
    href: '/login?redirectTo=/pump-operator',
  },
  {
    icon: <Home className="h-8 w-8 text-primary" />,
    title: 'Village Residents',
    description: 'Check water availability, pay bills, and get updates on water supply in your area.',
    href: '/login?redirectTo=/village-resident',
  },
  {
    icon: <BarChart className="h-8 w-8 text-primary" />,
    title: 'Block / District Officials',
    description: 'Oversee regional water management, analyze data dashboards, and coordinate across panchayats.',
    href: '/login?redirectTo=/block-official',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2">
          <Droplet className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground font-headline">JalShakthi</h1>
        </div>
        <p className="text-muted-foreground mt-2">Your companion for community water management.</p>
      </header>
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight font-headline">Who are you?</h2>
          <p className="mt-4 text-lg text-muted-foreground">Select your role to proceed to your personalized dashboard.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {roles.map((role) => (
            <Card key={role.title} className="flex flex-col hover:shadow-xl transition-shadow duration-300 bg-card rounded-lg">
              <CardHeader className="items-center text-center">
                {role.icon}
                <CardTitle className="mt-4 font-headline">{role.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col text-center">
                <CardDescription className="flex-grow">{role.description}</CardDescription>
                <Button asChild className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href={role.href}>Proceed to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <footer className="container mx-auto px-4 py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} JalShakthi. All rights reserved.</p>
      </footer>
    </div>
  );
}
