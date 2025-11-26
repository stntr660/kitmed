'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  Heart,
  Download,
  Eye,
  Building2,
  Award,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { QuoteRequestForm } from '@/components/forms/QuoteRequestForm';
import { CertificationsBanner } from '@/components/ui/certifications-banner';

interface Product {
  id: string;
  referenceFournisseur: string;
  constructeur: string;
  slug: string;
  pdfBrochureUrl: string | null;
  status: string;
  isFeatured: boolean;
  createdAt: string;
  name: string;
  description: string;
  shortDescription: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
  };
  manufacturer: {
    name: string;
  };
  discipline: {
    name: string;
    color: string;
    imageUrl: string | null;
  };
  media: Array<{
    id: string;
    type: string;
    url: string;
    isPrimary: boolean;
    altText: string | null;
  }>;
}

interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function ProductsPage() {
  const t = useTranslations('common');
  const [products, setProducts] = useState<ProductsResponse | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [searchQuery, selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories?includeProductCount=true&locale=fr');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('status', 'active');
      params.append('pageSize', '12');
      
      if (searchQuery) params.append('query', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await fetch(`/api/products?${params}&locale=fr`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (product: Product) => {
    return product.name || product.referenceFournisseur;
  };

  const getProductDescription = (product: Product) => {
    return product.description || product.shortDescription;
  };

  const getPrimaryImage = (product: Product) => {
    return product.media?.find(m => m.isPrimary && m.type === 'image');
  };


  return (
    <div className="min-h-screen bg-slate-50">
      {/* Certifications Banner */}
      <CertificationsBanner variant="compact" />
      
      {/* Hero Section */}
      <section className="relative bg-slate-900 py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-accent-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 px-6 py-3 bg-primary-500 text-white border-0 shadow-xl">
              🏥 Catalogue Premium KITMED
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Équipements Médicaux
              <span className="text-primary-300 block mt-2">d'Excellence</span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-12 leading-relaxed max-w-3xl mx-auto">
              Découvrez notre collection exclusive d'équipements médicaux de pointe, 
              sélectionnés pour leur innovation et leur fiabilité exceptionnelles.
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  placeholder="Rechercher par nom, référence ou marque..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg border-2 border-slate-200 focus:border-primary-500 shadow-sm"
                />
              </div>
              
              {/* Category Filter */}
              <div className="flex gap-3 flex-wrap">
                <Button
                  variant={selectedCategory === '' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('')}
                  className="h-14 px-6"
                >
                  Toutes
                </Button>
                {categories.slice(0, 3).map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(category.id)}
                    className="h-14 px-6"
                  >
                    {category.name}
                  </Button>
                ))}
                <Button variant="outline" className="h-14 px-4">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner size="lg" text="Chargement des produits..." />
            </div>
          ) : products && products.items.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    Produits Premium
                  </h2>
                  <p className="text-slate-600">
                    {products.total} équipement{products.total > 1 ? 's' : ''} disponible{products.total > 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <Button variant="outline" size="sm">
                    Prix
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    Popularité
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.items.map((product) => {
                  const primaryImage = getPrimaryImage(product);
                  const categoryInfo = product.category;
                  
                  return (
                    <Card key={product.id} className="group h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white overflow-hidden">
                      {/* Product Image */}
                      <div className="relative h-64 bg-slate-100 overflow-hidden">
                        {primaryImage ? (
                          <Image
                            src={primaryImage.url}
                            alt={primaryImage.altText || getProductName(product)}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                            <Building2 className="h-16 w-16 text-slate-400" />
                          </div>
                        )}
                        
                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
                          <Button size="sm" variant="secondary" className="h-8 w-8 p-0 shadow-lg">
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="secondary" className="h-8 w-8 p-0 shadow-lg">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Status Badges */}
                        <div className="absolute top-4 left-4 space-y-2">
                          {product.isFeatured && (
                            <Badge className="bg-accent-500 text-white border-0 text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Vedette
                            </Badge>
                          )}
                          {categoryInfo && (
                            <Badge 
                              variant="secondary" 
                              className="text-xs border-0"
                              className="bg-primary-100 text-primary-600"
                            >
                              {categoryInfo.name || 'Category'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <CardHeader className="p-6 pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="text-sm text-slate-500 font-medium mb-1">
                              {product.manufacturer.name}
                            </div>
                            <CardTitle className="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-gray-600 transition-colors">
                              {getProductName(product)}
                            </CardTitle>
                          </div>
                          {product.isFeatured && (
                            <Award className="h-5 w-5 text-primary-500 flex-shrink-0 ml-2" />
                          )}
                        </div>
                        
                        <div className="text-sm text-slate-600 line-clamp-2">
                          {getProductDescription(product) || 'Description disponible sur demande'}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-6 pt-0 mt-auto">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-xs text-slate-500 font-mono">
                            Réf: {product.referenceFournisseur}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Button 
                            size="sm" 
                            className="w-full bg-primary text-white hover:bg-primary-600"
                            asChild
                          >
                            <Link href={`/fr/products/${product.slug || product.id}`}>
                              Voir Détails
                            </Link>
                          </Button>
                          
                          <div className="flex gap-2">
                            <QuoteRequestForm 
                              product={{
                                id: product.id,
                                referenceFournisseur: product.referenceFournisseur,
                                constructeur: product.manufacturer.name,
                                translations: [{
                                  languageCode: 'fr',
                                  nom: product.name,
                                  description: product.description,
                                  ficheTechnique: null
                                }]
                              }}
                              trigger={
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="flex-1"
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Devis
                                </Button>
                              }
                            />
                            
                            {product.pdfBrochureUrl && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="px-3"
                                asChild
                              >
                                <a href={product.pdfBrochureUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {/* Load More Button */}
              {products.totalPages > 1 && (
                <div className="mt-16 text-center">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="min-w-[200px] h-12 border-2 border-primary-300 text-primary-700 hover:bg-primary-50"
                  >
                    Voir Plus de Produits
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="h-24 w-24 bg-slate-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Search className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Aucun Produit Trouvé
              </h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Aucun équipement ne correspond à vos critères de recherche. 
                Essayez de modifier vos filtres ou votre recherche.
              </p>
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                }}
                className="bg-primary text-white hover:bg-primary-600"
              >
                Réinitialiser les Filtres
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 lg:py-24 bg-slate-900">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Explorer par
              <span className="text-primary-300"> Spécialité</span>
            </h2>
            <p className="text-xl text-slate-300 leading-relaxed">
              Équipements spécialisés pour chaque domaine médical
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant="ghost"
                size="lg"
                onClick={() => setSelectedCategory(category.id)}
                className="h-48 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white hover:text-white transition-all duration-300 group"
              >
                <div className="flex items-center space-x-4 w-full">
                  {category.imageUrl ? (
                    <div className="w-40 h-40 rounded-xl overflow-hidden group-hover:scale-110 transition-transform duration-300 shadow-lg border border-white/20">
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        width={160}
                        height={160}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div 
                      className="w-10 h-10 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg border border-white/20 flex items-center justify-center"
                      className="bg-primary-500"
                    >
                      <div className="w-5 h-5 bg-white/50 rounded-full"></div>
                    </div>
                  )}
                  <span className="text-lg font-semibold">{category.name}</span>
                  <ArrowRight className="h-5 w-5 ml-auto group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </Button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}