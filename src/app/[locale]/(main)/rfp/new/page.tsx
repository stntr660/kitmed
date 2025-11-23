'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText,
  ArrowRight,
  CheckCircle,
  Clock,
  Building2,
  Users,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
import { QuoteRequestForm } from '@/components/forms/QuoteRequestForm';

export default function NewRFPPage() {
  const t = useTranslations('rfp');
  const tCommon = useTranslations('common');
  const locale = useHydrationSafeLocale('fr');

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-16 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6" variant="outline">
              {t('hero.badge')}
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
              {t('hero.description')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href={`/${locale}/products`}>
                  {t('hero.cta.browseProducts')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={`/${locale}/contact`}>
                  {t('hero.cta.getHelp')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
                {t('howItWorks.title')}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
                {t('howItWorks.description')}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('howItWorks.step1.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('howItWorks.step1.description')}
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('howItWorks.step2.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('howItWorks.step2.description')}
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('howItWorks.step3.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('howItWorks.step3.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RFP Form Section */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
                {t('form.title')}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                {t('form.description')}
              </p>
            </div>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <QuoteRequestForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose KITMED Section */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
                {t('whyKitmed.title')}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
                {t('whyKitmed.description')}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('whyKitmed.expertise.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('whyKitmed.expertise.description')}
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('whyKitmed.support.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('whyKitmed.support.description')}
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('whyKitmed.experience.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('whyKitmed.experience.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}