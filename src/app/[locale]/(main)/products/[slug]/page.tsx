'use client';

import { useEffect, useState } from 'react';
import { useHydrationSafeParams } from '@/hooks/useHydrationSafeParams';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  ArrowLeft,
  Download, 
  Heart,
  Share2,
  Star,
  Building2,
  Award,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  Phone,
  Mail,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { QuoteRequestForm } from '@/components/forms/QuoteRequestForm';

interface Product {
  id: string;
  referenceFournisseur: string;
  constructeur: string;
  slug: string;
  pdfBrochureUrl: string | null;
  status: string;
  isFeatured: boolean;
  createdAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  translations: Array<{
    languageCode: string;
    nom: string;
    description: string | null;
    ficheTechnique: string | null;
  }>;
  media: Array<{
    id: string;
    type: string;
    url: string;
    isPrimary: boolean;
    altText: string | null;
    title: string | null;
    sortOrder: number;
  }>;
}

export default function ProductDetailPage() {
  const params = useHydrationSafeParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (slug) {
      loadProduct();
    }
  }, [slug]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      
      // Try to fetch real product data by slug
      const response = await fetch(`/api/admin/products?slug=${slug}&pageSize=1`);
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.items && data.data.items.length > 0) {
          // Find the product with matching slug
          const productData = data.data.items.find(p => p.slug === slug) || data.data.items[0];
          
          // Transform the API data to match our interface
          const transformedProduct: Product = {
            id: productData.id,
            referenceFournisseur: productData.referenceFournisseur,
            constructeur: productData.constructeur,
            slug: productData.slug,
            pdfBrochureUrl: productData.pdfBrochureUrl,
            status: productData.status,
            isFeatured: productData.isFeatured || false,
            createdAt: productData.createdAt,
            category: productData.category,
            translations: productData.translations || [],
            media: productData.media || []
          };
          
          setProduct(transformedProduct);
          return;
        }
      }
      
      // Fallback to mock data if no real product found
      const mockProduct: Product = {
        id: '1',
        referenceFournisseur: 'REF001',
        constructeur: 'Medtronic',
        slug: slug,
        pdfBrochureUrl: '/uploads/brochures/sample-brochure.pdf',
        status: 'active',
        isFeatured: true,
        createdAt: '2024-01-01',
        category: {
          id: 'cardiology',
          name: 'Cardiologie',
          slug: 'cardiology'
        },
        translations: [
          {
            languageCode: 'fr',
            nom: 'Moniteur Cardiaque Pro X1',
            description: 'Moniteur cardiaque avancé avec écran haute résolution, surveillance continue et alertes intelligentes pour un diagnostic précis.',
            ficheTechnique: 'Écran 15 pouces • Résolution 1920x1080 • Connectivité Wi-Fi • Batterie 12h • Certification CE/FDA'
          }
        ],
        media: [
          {
            id: '1',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop',
            isPrimary: true,
            altText: 'Moniteur Cardiaque Vue Principale',
            title: 'Vue Principale',
            sortOrder: 0
          },
          {
            id: '2',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop',
            isPrimary: false,
            altText: 'Moniteur Cardiaque Vue Latérale',
            title: 'Vue Latérale',
            sortOrder: 1
          }
        ]
      };
      
      setProduct(mockProduct);
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (product: Product, locale: string = 'fr') => {
    const translation = product.translations?.find(t => t.languageCode === locale);
    return translation?.nom || product.referenceFournisseur;
  };

  const getProductDescription = (product: Product, locale: string = 'fr') => {
    const translation = product.translations?.find(t => t.languageCode === locale);
    return translation?.description;
  };

  const getProductSpecs = (product: Product, locale: string = 'fr') => {
    const translation = product.translations?.find(t => t.languageCode === locale);
    return translation?.ficheTechnique;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Chargement du produit..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Produit non trouvé</h1>
          <Button asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au catalogue
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const images = product.media?.filter(m => m.type === 'image').sort((a, b) => a.sortOrder - b.sortOrder) || [];
  const currentImage = images[selectedImageIndex];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <nav className="bg-white border-b border-slate-200 py-4">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center text-sm text-slate-600">
            <Link href="/products" className="hover:text-gray-600 transition-colors">
              Produits
            </Link>
            <span className="mx-2">/</span>
            {product.category && (
              <>
                <Link href={`/products?category=${product.category.slug}`} className="hover:text-gray-600 transition-colors">
                  {product.category.name?.fr || product.category.name?.en || 'Category'}
                </Link>
                <span className="mx-2">/</span>
              </>
            )}
            <span className="text-slate-900 font-medium">{getProductName(product)}</span>
          </div>
        </div>
      </nav>

      {/* Product Detail */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Product Images */}
            <div className="space-y-6">
              {/* Main Image */}
              <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                <div className="aspect-square relative">
                  {currentImage ? (
                    <Image
                      src={currentImage.url}
                      alt={currentImage.altText || getProductName(product)}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                      <ImageIcon className="h-24 w-24 text-slate-400" />
                    </div>
                  )}
                  
                  {/* Status Badges */}
                  <div className="absolute top-6 left-6 space-y-2">
                    {product.isFeatured && (
                      <Badge className="bg-accent-500 text-white border-0">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Produit Vedette
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Disponible
                    </Badge>
                  </div>
                  
                  {/* Actions */}
                  <div className="absolute top-6 right-6 space-y-2">
                    <Button size="sm" variant="secondary" className="h-10 w-10 p-0 shadow-lg">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary" className="h-10 w-10 p-0 shadow-lg">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Thumbnail Grid */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square bg-white rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        selectedImageIndex === index 
                          ? 'border-primary-500 ring-2 ring-primary-200' 
                          : 'border-slate-200 hover:border-primary-300'
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={image.altText || `Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="space-y-8">
              {/* Header */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" className="text-slate-600">
                    {product.constructeur}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-300 text-amber-300" />
                    ))}
                    <span className="text-sm text-slate-600 ml-1">(4.8)</span>
                  </div>
                </div>
                
                <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                  {getProductName(product)}
                </h1>
                
                <div className="text-sm text-slate-500 font-mono mb-6">
                  Référence: {product.referenceFournisseur}
                </div>
                
                <p className="text-lg text-slate-700 leading-relaxed">
                  {getProductDescription(product)}
                </p>
              </div>

              {/* Specifications */}
              {getProductSpecs(product) && (
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-900 flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Caractéristiques Techniques
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-slate-700 leading-relaxed">
                      {getProductSpecs(product)?.split(' • ').map((spec, index) => (
                        <div key={index} className="flex items-center mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                          <span>{spec}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <QuoteRequestForm 
                    product={{
                      id: product.id,
                      referenceFournisseur: product.referenceFournisseur,
                      constructeur: product.constructeur,
                      translations: product.translations
                    }}
                    trigger={
                      <Button size="lg" className="bg-primary text-white hover:bg-gray-600 h-14">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Demander un Devis
                      </Button>
                    }
                  />
                  
                  {product.pdfBrochureUrl && (
                    <Button size="lg" variant="outline" className="h-14" asChild>
                      <a href={product.pdfBrochureUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-5 w-5 mr-2" />
                        Télécharger Brochure
                      </a>
                    </Button>
                  )}
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-center space-x-8 text-center">
                  <div className="flex flex-col items-center">
                    <Phone className="h-6 w-6 text-primary-600 mb-2" />
                    <span className="text-sm text-slate-600">Support Téléphone</span>
                    <div className="space-y-1">
                      <a href="tel:+212522860366" className="block text-sm font-semibold text-slate-900 hover:text-gray-600 transition-colors">
                        +212 522 86 03 66
                      </a>
                      <a href="tel:+212522860431" className="block text-sm font-semibold text-slate-900 hover:text-gray-600 transition-colors">
                        +212 522 86 04 31
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <Mail className="h-6 w-6 text-primary-600 mb-2" />
                    <span className="text-sm text-slate-600">Contact Email</span>
                    <div className="space-y-1">
                      <a href="mailto:INFO@KITMED.MA" className="block text-sm font-semibold text-slate-900 hover:text-gray-600 transition-colors">
                        INFO@KITMED.MA
                      </a>
                      <a href="mailto:EXPORT@KITMED.MA" className="block text-sm font-semibold text-slate-900 hover:text-gray-600 transition-colors">
                        EXPORT@KITMED.MA
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Produits Similaires
            </h2>
            <p className="text-slate-600">
              Découvrez d'autres équipements de la même catégorie
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* This would be populated with related products */}
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <div className="relative h-48 bg-slate-100">
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                    <Building2 className="h-12 w-12 text-slate-400" />
                  </div>
                </div>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg font-bold text-slate-900">
                    Produit Similaire {i}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Button size="sm" variant="outline" className="w-full">
                    Voir Détails
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}