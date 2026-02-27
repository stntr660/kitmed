'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  Eye,
  Lightbulb,
  Heart,
  Zap,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
import { CertificationSection } from '@/components/ui/compliance-badges';
import { CertificationsBanner } from '@/components/ui/certifications-banner';
import { GoogleMapEmbed } from '@/components/ui/google-map-embed';

export default function AboutPage() {
  const t = useTranslations('about');
  const tCommon = useTranslations('common');
  const locale = useHydrationSafeLocale('fr');

  // Calculate years of experience from founding year (1997)
  const foundingYear = 1997;
  const yearsOfExpertise = new Date().getFullYear() - foundingYear;

  return (
    <div className="flex flex-col">
      {/* Certifications Banner */}
      <CertificationsBanner variant="compact" />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-white py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6" variant="outline">
              {t('hero.badge')}
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-2xl lg:text-3xl font-semibold text-primary-600 mb-8">
              {t('hero.subtitle', { years: yearsOfExpertise })}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href={`/${locale}/contact`}>
                  {t('hero.cta.contact')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={`/${locale}/products`}>
                  {t('hero.cta.products')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none text-center">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {t('overview.description1')}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {t('overview.description2')}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                {t('overview.description3')}
              </p>
              <p className="text-xl font-semibold text-primary-600 italic">
                {t('overview.tagline')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision & Values */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Mission */}
              <Card className="border-0 shadow-lg h-full">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Target className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    {t('mission.title')}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {t('mission.description')}
                  </p>
                </CardContent>
              </Card>

              {/* Vision */}
              <Card className="border-0 shadow-lg h-full">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Eye className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    {t('vision.title')}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {t('vision.description')}
                  </p>
                </CardContent>
              </Card>

              {/* Values */}
              <Card className="border-0 shadow-lg h-full">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                    {t('values.title')}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-3">
                      <Lightbulb className="h-5 w-5 text-primary-500" />
                      <span className="text-gray-700 font-medium">
                        {t('values.items.innovation.title')}
                      </span>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                      <Heart className="h-5 w-5 text-primary-500" />
                      <span className="text-gray-700 font-medium">
                        {t('values.items.satisfaction.title')}
                      </span>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                      <Zap className="h-5 w-5 text-primary-500" />
                      <span className="text-gray-700 font-medium">
                        {t('values.items.responsiveness.title')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications & Compliance */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <CertificationSection />
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
                {t('contact.title')}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                {t('contact.description')}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Direction */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    {tCommon('direction')}
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                      <div>
                        <p className="text-gray-700">20, rue Lalande</p>
                        <p className="text-gray-700">Quartier des Hopitaux</p>
                        <p className="text-gray-700">Casablanca - Maroc</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-gray-700">+212 522 86 03 66</p>
                        <p className="text-gray-700">+212 522 86 04 31</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-gray-700">INFO@KITMED.MA</p>
                        <p className="text-gray-700">EXPORT@KITMED.MA</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ShowRoom */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {tCommon('showRoom')}
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                      <div>
                        <p className="text-gray-700">33, rue Lahcen El Aarjounen</p>
                        <p className="text-gray-700">Quartier des Hopitaux</p>
                        <p className="text-gray-700">Casablanca - Maroc</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-gray-700">+212 522 86 34 27</p>
                        <p className="text-gray-700">+212 522 86 08 56</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Map */}
            <div className="mt-8">
              <GoogleMapEmbed variant="medium" showDirectionsButton />
            </div>

            <div className="text-center mt-12">
              <Button size="lg" asChild>
                <Link href={`/${locale}/contact`}>
                  {t('contact.cta')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
