'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowRight, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Manufacturer {
  name: string;
  productCount: number;
  slug: string;
}

export default function ProductsByManufacturerPage() {
  const t = useTranslations('common');
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';

  useEffect(() => {
    loadManufacturers();
  }, []);

  const loadManufacturers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products?status=active&pageSize=1000&locale=fr');
      if (response.ok) {
        const data = await response.json();
        
        // Group products by manufacturer
        const manufacturerMap = new Map();
        data.data.items.forEach((product: any) => {
          const manufacturer = product.manufacturer.name;
          if (manufacturerMap.has(manufacturer)) {
            manufacturerMap.set(manufacturer, manufacturerMap.get(manufacturer) + 1);
          } else {
            manufacturerMap.set(manufacturer, 1);
          }
        });
        
        // Convert to array and sort by product count
        const manufacturerList = Array.from(manufacturerMap.entries())
          .map(([name, count]) => ({
            name,
            productCount: count as number,
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
          }))
          .sort((a, b) => b.productCount - a.productCount);
        
        setManufacturers(manufacturerList);
      }
    } catch (error) {
      console.error('Failed to load manufacturers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative bg-slate-900 py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-accent-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-6 py-3 bg-primary-500 text-white border-0 shadow-xl">
              🏭 Fabricants Partenaires KITMED
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Produits par
              <span className="text-primary-300 block mt-2">Fabricant</span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-12 leading-relaxed max-w-3xl mx-auto">
              Explorez notre catalogue organisé par fabricant pour découvrir les innovations 
              de chaque marque partenaire reconnue dans le domaine médical.
            </p>
          </div>
        </div>
      </section>

      {/* Manufacturers Grid */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner size="lg" text="Chargement des fabricants..." />
            </div>
          ) : manufacturers.length > 0 ? (
            <>
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                  Nos Fabricants Partenaires
                </h2>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                  {manufacturers.length} fabricant{manufacturers.length > 1 ? 's' : ''} partenaire{manufacturers.length > 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {manufacturers.map((manufacturer) => (
                  <Card key={manufacturer.slug} className="group h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white overflow-hidden">
                    <div className="relative h-32 bg-gradient-to-br from-slate-50 to-white overflow-hidden">
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <Building2 className="h-12 w-12 text-slate-400 group-hover:text-primary transition-colors duration-300" />
                      </div>
                      
                      {/* Product Count Badge */}
                      <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {manufacturer.productCount} produit{manufacturer.productCount > 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                        {manufacturer.name}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="p-4 pt-0">
                      <div className="mb-4">
                        <p className="text-sm text-slate-600">
                          {manufacturer.productCount} produit{manufacturer.productCount > 1 ? 's' : ''} disponible{manufacturer.productCount > 1 ? 's' : ''}
                        </p>
                      </div>
                      
                      <Button 
                        size="sm"
                        className="w-full bg-primary text-white hover:bg-blue-700"
                        asChild
                      >
                        <Link href={`/${locale}/products?manufacturer=${encodeURIComponent(manufacturer.name)}`} className="flex items-center justify-center">
                          Voir Produits
                          <ArrowRight className="ml-2 h-3 w-3" />
                        </Link>
                      </Button>
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
                Aucun Fabricant Trouvé
              </h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Aucun fabricant n'est actuellement disponible.
              </p>
              <Button asChild>
                <Link href={`/${locale}/products`}>
                  Retour aux Produits
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}