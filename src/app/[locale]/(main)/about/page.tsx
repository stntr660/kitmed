'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart,
  Shield, 
  Award, 
  Users, 
  Globe, 
  Star,
  CheckCircle,
  Building2,
  Stethoscope,
  Target,
  Eye,
  ArrowRight,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
import { CertificationSection } from '@/components/ui/compliance-badges';

export default function AboutPage() {
  const t = useTranslations('about');
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

      {/* Company Overview */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
                  {t('overview.title')}
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  {t('overview.description1')}
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {t('overview.description2')}
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t('overview.established.title')}
                    </h3>
                    <p className="text-gray-600">
                      {t('overview.established.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Stethoscope className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t('overview.expertise.title')}
                    </h3>
                    <p className="text-gray-600">
                      {t('overview.expertise.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Globe className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t('overview.reach.title')}
                    </h3>
                    <p className="text-gray-600">
                      {t('overview.reach.description')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
                {t('mission.sectionTitle')}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
                {t('mission.sectionDescription')}
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* Mission */}
              <Card className="border-0 shadow-lg h-full flex flex-col">
                <CardContent className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900">
                      {t('mission.title')}
                    </h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {t('mission.description')}
                  </p>
                  <ul className="space-y-3">
                    {[
                      t('mission.points.0'),
                      t('mission.points.1'),
                      t('mission.points.2'),
                      t('mission.points.3')
                    ].map((point, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Vision */}
              <Card className="border-0 shadow-lg h-full flex flex-col">
                <CardContent className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                      <Eye className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900">
                      {t('vision.title')}
                    </h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {t('vision.description')}
                  </p>
                  <ul className="space-y-3">
                    {[
                      t('vision.points.0'),
                      t('vision.points.1'),
                      t('vision.points.2'),
                      t('vision.points.3')
                    ].map((point, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
                {t('values.title')}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
                {t('values.description')}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Heart, color: 'red', key: 'excellence' },
                { icon: Shield, color: 'blue', key: 'integrity' },
                { icon: Users, color: 'green', key: 'partnership' },
                { icon: Award, color: 'yellow', key: 'quality' },
                { icon: Globe, color: 'purple', key: 'innovation' },
                { icon: CheckCircle, color: 'indigo', key: 'commitment' }
              ].map((value, index) => (
                <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
                  <CardContent className="p-6 text-center flex-1 flex flex-col">
                    <div className={`w-16 h-16 bg-${value.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <value.icon className={`h-8 w-8 text-${value.color}-600`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {t(`values.items.${value.key}.title`)}
                    </h3>
                    <div className="flex-1 flex items-center">
                      <p className="text-gray-600 leading-relaxed">
                        {t(`values.items.${value.key}.description`)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Certifications & Compliance */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <CertificationSection />
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 lg:py-20 bg-white">
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
                    Direction
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                      <div>
                        <p className="text-gray-700">20, rue Lalande</p>
                        <p className="text-gray-700">Quartier des Hôpitaux</p>
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
                    ShowRoom
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                      <div>
                        <p className="text-gray-700">33, rue Lahcen El Aarjounen</p>
                        <p className="text-gray-700">Quartier des Hôpitaux</p>
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