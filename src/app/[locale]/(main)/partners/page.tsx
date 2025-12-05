'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Star,
  ExternalLink,
  Building2,
  Users,
  Award,
  Target,
  ArrowRight,
  Mail,
  Phone
} from 'lucide-react';
import Link from 'next/link';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
// import Image from 'next/image';

interface Partner {
  id: string;
  slug: string;
  websiteUrl?: string;
  logoUrl?: string;
  isFeatured: boolean;
  name: {
    fr: string;
    en: string;
  };
  description: {
    fr: string;
    en: string;
  };
}

export default function PartnersPage() {
  const t = useTranslations('partners');
  const tCommon = useTranslations('common');
  const tPartner = useTranslations('partnerDetail');
  const locale = useHydrationSafeLocale('fr');

  const [partners, setPartners] = useState<Partner[]>([]);
  const [featuredPartners, setFeaturedPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        const [allResponse, featuredResponse] = await Promise.all([
          fetch('/api/partners'),
          fetch('/api/partners?featured=true'),
        ]);

        if (!allResponse.ok || !featuredResponse.ok) {
          throw new Error('Failed to fetch partners');
        }

        const [allData, featuredData] = await Promise.all([
          allResponse.json(),
          featuredResponse.json(),
        ]);

        if (allData.success && featuredData.success) {
          setPartners(allData.data);
          setFeaturedPartners(featuredData.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load partners');
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  const getPartnerName = (partner: Partner) => {
    return partner.name[locale as keyof typeof partner.name] || partner.name.fr || partner.name.en;
  };

  const getPartnerDescription = (partner: Partner) => {
    return partner.description[locale as keyof typeof partner.description] || partner.description.fr || partner.description.en;
  };

  if (loading) {
    return (
      <div className="flex flex-col">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">{tCommon('error')}</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Featured Partners Section */}
      {featuredPartners.length > 0 && (
        <section className="py-16 lg:py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
                  {t('featured.title')}
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
                  {t('featured.description')}
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {featuredPartners.map((partner) => (
                  <Card key={partner.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col">
                    <CardContent className="p-6 flex-1 flex flex-col text-center">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-primary-500 mr-2" />
                          <Badge variant="secondary" className="text-xs">
                            {t('featured.badge')}
                          </Badge>
                        </div>
                        {partner.websiteUrl && (
                          <a
                            href={partner.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>

                      {partner.logoUrl && (
                        <div className="w-full h-20 mb-4 flex items-center justify-center">
                          <img
                            src={partner.logoUrl}
                            alt={getPartnerName(partner)}
                            className="max-h-16 w-auto object-contain"
                          />
                        </div>
                      )}

                      <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                        {getPartnerName(partner)}
                      </h3>

                      {getPartnerDescription(partner) && (
                        <p className="text-gray-600 text-sm leading-relaxed mb-4 text-center">
                          {getPartnerDescription(partner)}
                        </p>
                      )}

                      {/* Spacer to push button to bottom */}
                      <div className="flex-1"></div>

                      <div className="space-y-2">
                        <Button size="sm" className="w-full" asChild>
                          <Link href={`/${locale}/partners/${partner.slug}`}>
                            {tPartner('viewProducts')}
                            <ArrowRight className="ml-2 h-3 w-3" />
                          </Link>
                        </Button>

                        {partner.websiteUrl && (
                          <Button variant="outline" size="sm" className="w-full" asChild>
                            <a
                              href={partner.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {t('visitWebsite')}
                              <ExternalLink className="ml-2 h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* All Partners Section */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
                {t('all.title')}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
                {t('all.description')}
              </p>
            </div>

            {partners.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {partners.map((partner) => (
                  <Card key={partner.id} className="border-0 shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
                    <CardContent className="p-4 flex-1 flex flex-col text-center">
                      <div className="flex items-center justify-between mb-3">
                        {partner.isFeatured && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1 text-primary-500" />
                            {t('featured.badge')}
                          </Badge>
                        )}
                        {partner.websiteUrl && (
                          <a
                            href={partner.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>

                      {partner.logoUrl && (
                        <div className="w-full h-16 mb-3 flex items-center justify-center">
                          <img
                            src={partner.logoUrl}
                            alt={getPartnerName(partner)}
                            className="max-h-12 w-auto object-contain"
                          />
                        </div>
                      )}

                      <h3 className="text-sm font-semibold text-gray-900 mb-2 text-center">
                        {getPartnerName(partner)}
                      </h3>

                      {getPartnerDescription(partner) && (
                        <p className="text-gray-600 text-xs leading-relaxed text-center mb-3">
                          {getPartnerDescription(partner)}
                        </p>
                      )}

                      {/* Spacer for consistent height */}
                      <div className="flex-1"></div>

                      <Button size="sm" variant="outline" className="w-full mt-3" asChild>
                        <Link href={`/${locale}/partners/${partner.slug}`}>
                          {tPartner('viewProductsShort')}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('noPartners.title')}
                </h3>
                <p className="text-gray-600">
                  {t('noPartners.description')}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Partnership Benefits Section */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
                {t('benefits.title')}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
                {t('benefits.description')}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('benefits.quality.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('benefits.quality.description')}
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('benefits.trust.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('benefits.trust.description')}
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t('benefits.innovation.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('benefits.innovation.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-16 lg:py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-light mb-6 leading-tight">
              {t('cta.title')}
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto mb-12">
              {t('cta.description')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button
                size="lg"
                className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg font-medium transition-all duration-300"
                asChild
              >
                <Link href={`/${locale}/contact`} className="flex items-center">
                  <Mail className="mr-2 h-5 w-5" />
                  {t('cta.contact')}
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-gray-900 px-8 py-4 text-lg font-medium transition-all duration-300"
                asChild
              >
                <Link href="tel:+212522860366" className="flex items-center">
                  <Phone className="mr-2 h-5 w-5" />
                  {t('cta.call')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}