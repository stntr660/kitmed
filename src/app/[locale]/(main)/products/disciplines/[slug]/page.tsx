'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowRight, ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
import { CertificationsBanner } from '@/components/ui/certifications-banner';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  productCount: number;
  type: string;
}

interface Discipline {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  children: Category[];
}

interface PageProps {
  params: {
    slug: string;
    locale: string;
  };
}

export default function DisciplineCategoriesPage({ params }: PageProps) {
  const t = useTranslations('common');
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locale = useHydrationSafeLocale('fr');

  useEffect(() => {
    loadDiscipline();
  }, [params.slug, locale]);

  const loadDiscipline = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load discipline with its categories
      const response = await fetch(`/api/disciplines/${params.slug}?locale=${locale}`);
      if (response.ok) {
        const data = await response.json();
        setDiscipline(data.data);
      } else {
        setError('Discipline non trouvée');
      }
    } catch (error) {
      console.error('Failed to load discipline:', error);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Chargement de la discipline..." />
      </div>
    );
  }

  if (error || !discipline) {
    return (
      <div className="min-h-screen bg-slate-50">
        <CertificationsBanner variant="compact" />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="h-24 w-24 bg-slate-200 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Building2 className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              {error || 'Discipline non trouvée'}
            </h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Cette discipline médicale n'existe pas ou n'est pas disponible.
            </p>
            <Button asChild>
              <Link href={`/${locale}/products/disciplines`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux Disciplines
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Certifications Banner */}
      <CertificationsBanner variant="compact" />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Breadcrumb */}
            <div className="mb-6">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10" asChild>
                <Link href={`/${locale}/products/disciplines`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Disciplines Médicales
                </Link>
              </Button>
            </div>

            <Badge className="mb-6 px-6 py-3 bg-white/20 text-white border-0 shadow-xl">
              🏥 {discipline.name}
            </Badge>

            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Équipements
              <span className="text-primary-100 block mt-2">{discipline.name}</span>
            </h1>

            <p className="text-xl text-primary-100 mb-8 leading-relaxed max-w-3xl mx-auto">
              {discipline.description ||
               `Découvrez notre gamme complète d'équipements pour ${discipline.name.toLowerCase()},
                sélectionnés pour leur qualité et leur performance exceptionnelles.`}
            </p>

            {discipline.children && discipline.children.length > 0 && (
              <div className="text-primary-100">
                {discipline.children.length} catégorie{discipline.children.length > 1 ? 's' : ''} disponible{discipline.children.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6 lg:px-8">
          {discipline.children && discipline.children.length > 0 ? (
            <>
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                  Catégories d'Équipements
                </h2>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                  Choisissez la catégorie qui correspond à vos besoins spécifiques en {discipline.name.toLowerCase()}
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {discipline.children.map((category) => (
                  <Card key={category.id} className="group h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white overflow-hidden">
                    <div className="relative h-56 bg-gradient-to-br from-primary-50 to-white overflow-hidden">
                      {category.imageUrl ? (
                        <Image
                          src={category.imageUrl}
                          alt={category.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-bold text-xl">{category.name.charAt(0)}</span>
                          </div>
                        </div>
                      )}

                      {/* Product Count Badge */}
                      <div className="absolute top-4 right-4 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                        {category.productCount || 0} produits
                      </div>

                      {/* Category Type Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge variant="secondary" className="bg-white/90 text-primary-700 border-0 text-xs">
                          Équipement
                        </Badge>
                      </div>
                    </div>

                    <CardHeader className="p-6 pb-4">
                      <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                        {category.name}
                      </CardTitle>
                      <p className="text-slate-600 leading-relaxed line-clamp-3">
                        {category.description ||
                         `Solutions professionnelles spécialisées pour ${category.name.toLowerCase()} en ${discipline.name.toLowerCase()}.`}
                      </p>
                    </CardHeader>

                    <CardContent className="p-6 pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <span>Produits disponibles</span>
                          <span className="font-semibold">{category.productCount || 0}</span>
                        </div>

                        <Button
                          className="w-full bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                          asChild
                        >
                          <Link href={`/${locale}/products?category=${category.id}`} className="flex items-center justify-center">
                            Voir les Produits
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="h-24 w-24 bg-slate-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Building2 className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Aucune Catégorie Disponible
              </h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Cette discipline ne contient pas encore de catégories d'équipements.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" asChild>
                  <Link href={`/${locale}/products/disciplines`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour aux Disciplines
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/${locale}/products`}>
                    Voir Tous les Produits
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}