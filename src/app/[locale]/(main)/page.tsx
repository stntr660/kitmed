import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Heart, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');

  const features = [
    {
      icon: Shield,
      title: 'Medical Grade Quality',
      description: 'All equipment meets the highest medical standards and certifications',
      color: 'text-blue-600',
    },
    {
      icon: Zap,
      title: 'Fast Delivery',
      description: 'Quick processing and delivery to keep your operations running',
      color: 'text-yellow-600',
    },
    {
      icon: Heart,
      title: 'Expert Support',
      description: '24/7 technical support from medical equipment specialists',
      color: 'text-red-600',
    },
    {
      icon: CheckCircle,
      title: 'Comprehensive Solutions',
      description: 'Complete medical equipment solutions for all healthcare needs',
      color: 'text-green-600',
    },
  ];

  const disciplines = [
    { name: 'Cardiology', count: '150+ products', color: '#1C75BC' },
    { name: 'Radiology', count: '200+ products', color: '#ED1C24' },
    { name: 'Surgery', count: '300+ products', color: '#2563EB' },
    { name: 'Laboratory', count: '180+ products', color: '#059669' },
    { name: 'Emergency', count: '120+ products', color: '#DC2626' },
    { name: 'ICU', count: '90+ products', color: '#7C3AED' },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-white to-accent/5 py-20 lg:py-32">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="mb-4">
              🏥 Medical Equipment Platform
            </Badge>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-medical-heading lg:text-6xl">
              Professional Medical Equipment 
              <span className="text-primary"> Solutions</span>
            </h1>
            
            <p className="mb-8 text-xl text-medical-body lg:text-2xl">
              Discover cutting-edge medical equipment from trusted manufacturers. 
              Request proposals, compare solutions, and get expert support for your healthcare facility.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="min-w-[200px]" asChild>
                <Link href="/products" className="flex items-center">
                  Browse Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button variant="outline" size="lg" className="min-w-[200px]" asChild>
                <Link href="/contact">
                  Get Expert Consultation
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-medical-heading lg:text-4xl">
              Why Choose KITMED?
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-medical-body">
              We provide comprehensive medical equipment solutions with unmatched quality and support
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} variant="medical" className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50">
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Medical Disciplines */}
      <section className="bg-gray-50 py-16 lg:py-24">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-medical-heading lg:text-4xl">
              Medical Disciplines
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-medical-body">
              Specialized equipment for every medical specialty
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {disciplines.map((discipline, index) => (
              <Card key={index} variant="medical" className="transition-all hover:scale-105">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{discipline.name}</CardTitle>
                    <div 
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: discipline.color }}
                    />
                  </div>
                  <CardDescription>{discipline.count}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/products/disciplines" className="flex items-center">
                View All Disciplines
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 text-white lg:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
              Ready to Upgrade Your Medical Equipment?
            </h2>
            <p className="mb-8 text-xl opacity-90">
              Start building your request for proposal today and get personalized recommendations from our experts.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" variant="secondary" className="min-w-[200px]" asChild>
                <Link href="/rfp/new">
                  Start RFP Request
                </Link>
              </Button>
              
              <Button size="lg" variant="outline" className="min-w-[200px] border-white text-white hover:bg-white hover:text-primary" asChild>
                <Link href="/partners">
                  View Our Partners
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}