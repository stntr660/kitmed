'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
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
  FileText
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  referenceFournisseur: string;
  constructeur: string;
  slug: string;
  pdfBrochureUrl: string | null;
  pdfSource?: 'product' | 'manufacturer' | null;
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
  const tProducts = useTranslations('products');
  const locale = useHydrationSafeLocale('fr');
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductsResponse | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Read URL params on initial load
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const queryParam = searchParams.get('q');
    const manufacturerParam = searchParams.get('manufacturer');

    if (categoryParam) {
      setSelectedCategory(categoryParam);
      setSelectedDiscipline(categoryParam);
    }
    if (queryParam) setSearchQuery(queryParam);
    if (manufacturerParam) setSelectedManufacturer(manufacturerParam);

    setInitialLoadDone(true);
  }, [searchParams]);

  useEffect(() => {
    if (!initialLoadDone) return;
    loadProducts();
    loadCategories();
    loadManufacturers();
  }, [searchQuery, selectedCategory, selectedManufacturer, onlyFeatured, locale, initialLoadDone]);

  const loadCategories = async () => {
    try {
      const response = await fetch(`/api/categories?includeProductCount=true&hierarchy=true&locale=${locale}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadManufacturers = async () => {
    try {
      const response = await fetch('/api/partners?status=active');
      if (response.ok) {
        const data = await response.json();
        const OPHTHALMOLOGY_PRIORITY_SLUGS = [
          'nidek', 'haag-streit', 'moria', 'fci', 'keeler',
          'medicontur', 'medicontour', 'ophtec', 'rheon',
          'mediworks', 'espansione', 'espansionne', 'omni', 'omnilens'
        ];
        const sorted = (data.data || []).sort((a: any, b: any) => {
          const aName = (typeof a.name === 'string' ? a.name : a.name?.fr || a.name?.en || '').toLowerCase();
          const bName = (typeof b.name === 'string' ? b.name : b.name?.fr || b.name?.en || '').toLowerCase();
          const aSlug = (a.slug || '').toLowerCase();
          const bSlug = (b.slug || '').toLowerCase();
          const aPriority = OPHTHALMOLOGY_PRIORITY_SLUGS.findIndex(s => aSlug.includes(s) || aName.includes(s));
          const bPriority = OPHTHALMOLOGY_PRIORITY_SLUGS.findIndex(s => bSlug.includes(s) || bName.includes(s));
          const aIsPriority = aPriority !== -1;
          const bIsPriority = bPriority !== -1;
          if (aIsPriority && !bIsPriority) return -1;
          if (!aIsPriority && bIsPriority) return 1;
          if (aIsPriority && bIsPriority) return aPriority - bPriority;
          return aName.localeCompare(bName);
        });
        setManufacturers(sorted);
      }
    } catch (error) {
      console.error('Failed to load manufacturers:', error);
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
      if (selectedManufacturer) params.append('manufacturer', selectedManufacturer);
      if (onlyFeatured) params.append('featured', 'true');

      const response = await fetch(`/api/products?${params}&locale=${locale}`);
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
      {/* Search and Filters */}
      <section className="py-3 sm:py-4 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-4">

            {/* Row 1: Search bar + Filter button */}
            <div className="flex gap-3 items-center">
              {/* Search input - full width */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 pointer-events-none" />
                <Input
                  placeholder={tProducts('search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-11 h-11 sm:h-12 text-sm sm:text-base border-2 border-slate-200 focus:border-primary-500 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl shadow-sm w-full transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-7 w-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Advanced filter button with active dot */}
              <div className="relative flex-shrink-0">
                <Button
                  type="button"
                  variant={showFilters ? 'default' : 'outline'}
                  className="h-11 sm:h-12 px-3 sm:px-4 rounded-xl gap-1.5 border-2 border-slate-200 text-slate-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                  onClick={() => setShowFilters(!showFilters)}
                  aria-expanded={showFilters}
                  aria-label="Toggle advanced filters"
                >
                  <Filter className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline text-sm font-medium">{t('filter')}</span>
                </Button>
                {(selectedManufacturer || onlyFeatured) && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary-500 border-2 border-white" aria-hidden="true" />
                )}

                {/* Dropdown panel */}
                {showFilters && (
                  <div className="absolute right-0 top-[calc(100%+8px)] bg-white border border-slate-200 rounded-xl shadow-2xl p-5 w-72 sm:w-80 z-50">
                    <h3 className="font-semibold text-slate-900 mb-4 text-sm">{t('filter')}</h3>
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                        {t('manufacturer')}
                      </label>
                      <select
                        value={selectedManufacturer}
                        onChange={(e) => setSelectedManufacturer(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none bg-white"
                      >
                        <option value="">{tProducts('search.allManufacturers')}</option>
                        {manufacturers.map((manufacturer) => (
                          <option key={manufacturer.id} value={manufacturer.slug || manufacturer.id}>
                            {typeof manufacturer.name === 'string'
                              ? manufacturer.name
                              : manufacturer.name?.[locale] || manufacturer.name?.fr || manufacturer.name?.en || 'Unknown'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-5">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={onlyFeatured}
                          onChange={(e) => setOnlyFeatured(e.target.checked)}
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-slate-700">{tProducts('search.onlyFeatured')}</span>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => { setSelectedManufacturer(''); setOnlyFeatured(false); }}
                        className="flex-1 rounded-lg text-xs"
                      >
                        {t('clear')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setShowFilters(false)}
                        className="flex-1 rounded-lg text-xs"
                      >
                        {t('close')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Discipline pills - horizontally scrollable */}
            <div
              className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="group"
              aria-label="Filter by discipline"
            >
              <button
                type="button"
                onClick={() => { setSelectedDiscipline(''); setSelectedCategory(''); }}
                className={[
                  'flex-shrink-0 h-9 px-4 rounded-full text-xs sm:text-sm font-medium border-2 transition-colors whitespace-nowrap',
                  selectedDiscipline === ''
                    ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600'
                ].join(' ')}
                aria-pressed={selectedDiscipline === ''}
              >
                {tProducts('search.allCategories')}
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => { setSelectedDiscipline(category.id); setSelectedCategory(category.id); }}
                  className={[
                    'flex-shrink-0 h-9 px-4 rounded-full text-xs sm:text-sm font-medium border-2 transition-colors whitespace-nowrap',
                    selectedDiscipline === category.id
                      ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600'
                  ].join(' ')}
                  aria-pressed={selectedDiscipline === category.id}
                >
                  {category.name}
                  {category.productCount != null && (
                    <span className={[
                      'ml-1.5 text-[10px] font-normal',
                      selectedDiscipline === category.id ? 'text-white/70' : 'text-slate-400'
                    ].join(' ')}>
                      ({category.productCount})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Row 3: Subcategory chips - shown when discipline selected and has subcategories */}
            {(() => {
              const selectedParent = categories.find((c: any) => c.id === selectedDiscipline);
              const subs = selectedParent?.subcategories;
              if (!subs || subs.length === 0) return null;
              return (
                <div
                  className="flex gap-1.5 overflow-x-auto pb-0.5 pl-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  role="group"
                  aria-label="Filter by subcategory"
                >
                  {/* "All {discipline}" chip */}
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(selectedParent.id)}
                    className={[
                      'flex-shrink-0 h-7 px-3 rounded-full text-xs font-medium border transition-colors whitespace-nowrap',
                      selectedCategory === selectedParent.id
                        ? 'bg-primary-100 border-primary-300 text-primary-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-primary-200 hover:text-primary-600 hover:bg-primary-50'
                    ].join(' ')}
                    aria-pressed={selectedCategory === selectedParent.id}
                  >
                    {tProducts('search.allCategories')}
                    {selectedParent.productCount != null && (
                      <span className="ml-1 opacity-60">({selectedParent.productCount})</span>
                    )}
                  </button>
                  {subs.map((sub: any) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedCategory(sub.id)}
                      className={[
                        'flex-shrink-0 h-7 px-3 rounded-full text-xs font-medium border transition-colors whitespace-nowrap',
                        selectedCategory === sub.id
                          ? 'bg-primary-100 border-primary-300 text-primary-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-primary-200 hover:text-primary-600 hover:bg-primary-50'
                      ].join(' ')}
                      aria-pressed={selectedCategory === sub.id}
                    >
                      {sub.name}
                      {sub.productCount != null && (
                        <span className="ml-1 opacity-60">({sub.productCount})</span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* Row 4: Active filter badges - only when filters are set */}
            {(searchQuery || selectedManufacturer || onlyFeatured) && (
              <div className="flex items-center gap-2 flex-wrap" role="status" aria-label="Active filters">
                <span className="text-xs font-medium text-slate-500 flex-shrink-0">{t('filter')}:</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                    &ldquo;{searchQuery}&rdquo;
                    <button
                      type="button"
                      aria-label={`Remove search filter: ${searchQuery}`}
                      onClick={() => setSearchQuery('')}
                      className="flex items-center justify-center h-4 w-4 rounded-full hover:bg-slate-300 text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {selectedManufacturer && (
                  <span className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                    {typeof manufacturers.find((m: any) => (m.slug || m.id) === selectedManufacturer)?.name === 'string'
                      ? manufacturers.find((m: any) => (m.slug || m.id) === selectedManufacturer)?.name
                      : selectedManufacturer}
                    <button
                      type="button"
                      aria-label="Remove manufacturer filter"
                      onClick={() => setSelectedManufacturer('')}
                      className="flex items-center justify-center h-4 w-4 rounded-full hover:bg-slate-300 text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {onlyFeatured && (
                  <span className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                    {tProducts('search.onlyFeatured')}
                    <button
                      type="button"
                      aria-label="Remove featured filter"
                      onClick={() => setOnlyFeatured(false)}
                      className="flex items-center justify-center h-4 w-4 rounded-full hover:bg-slate-300 text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
              </div>
            )}

          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-6 lg:py-8">
        <div className="container mx-auto px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner size="lg" text={tProducts('search.loading')} />
            </div>
          ) : products && products.items.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">
                    {selectedDiscipline
                      ? categories.find((c: any) => c.id === selectedDiscipline)?.name || tProducts('listing.title')
                      : tProducts('listing.title')}
                  </h2>
                  <p className="text-slate-600">
                    {tProducts('listing.count', { total: products.total, plural: products.total > 1 ? 's' : '' })}
                  </p>
                </div>

              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.items.map((product) => {
                  const primaryImage = getPrimaryImage(product);
                  const categoryInfo = product.category;

                  return (
                    <Card key={product.id} className="group h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white overflow-hidden">
                      {/* Product Image */}
                      <div className="relative h-64 bg-white overflow-hidden p-4">
                        {primaryImage ? (
                          <Image
                            src={primaryImage.url}
                            alt={primaryImage.altText || getProductName(product)}
                            fill
                            className="object-contain group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-white flex items-center justify-center">
                            <Building2 className="h-16 w-16 text-gray-400" />
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
                              {tProducts('listing.featured')}
                            </Badge>
                          )}
                          {categoryInfo && (
                            <Badge
                              variant="secondary"
                              className="text-xs border-0 bg-primary-100 text-primary-600"
                            >
                              {categoryInfo.name || 'Category'}
                            </Badge>
                          )}
                          {product.pdfBrochureUrl && (
                            <Badge
                              variant="secondary"
                              className="text-xs border-0 bg-blue-100 text-blue-600"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              PDF
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
                          {getProductDescription(product) || tProducts('listing.descriptionFallback')}
                        </div>
                      </CardHeader>

                      <CardContent className="p-6 pt-0 mt-auto">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-xs text-slate-500 font-mono truncate max-w-full" title={product.referenceFournisseur}>
                            {tProducts('listing.reference', { ref: product.referenceFournisseur })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Button
                            size="sm"
                            className="w-full bg-primary text-white hover:bg-primary-600"
                            asChild
                          >
                            <Link href={`/${locale}/products/${product.slug || product.id}`}>
                              {tProducts('listing.viewDetails')}
                            </Link>
                          </Button>

                          {product.pdfBrochureUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-2"
                              asChild
                            >
                              <a href={product.pdfBrochureUrl} target="_blank" rel="noopener noreferrer" title={
                                product.pdfSource === 'manufacturer'
                                  ? tProducts('listing.manufacturerBrochure')
                                  : tProducts('listing.productBrochure')
                              }>
                                <Download className="h-4 w-4 mr-2" />
                                PDF
                              </a>
                            </Button>
                          )}
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
                    onClick={() => {
                      if (products.page < products.totalPages) {
                        const params = new URLSearchParams();
                        params.append('status', 'active');
                        params.append('pageSize', '12');
                        params.append('page', String(products.page + 1));

                        if (searchQuery) params.append('query', searchQuery);
                        if (selectedCategory) params.append('category', selectedCategory);

                        fetch(`/api/products?${params}&locale=${locale}`)
                          .then(res => res.json())
                          .then(data => {
                            if (data.success) {
                              setProducts(prev => prev ? {
                                ...data.data,
                                items: [...prev.items, ...data.data.items]
                              } : data.data);
                            }
                          })
                          .catch(err => console.error('Failed to load more products:', err));
                      }
                    }}
                  >
                    {tProducts('listing.loadMore')}
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
                {tProducts('noResults.title')}
              </h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                {tProducts('noResults.description')}
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                }}
                className="bg-primary text-white hover:bg-primary-600"
              >
                {tProducts('noResults.resetFilters')}
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
              {tProducts('categories.title')}
              <span className="text-primary-300"> {tProducts('categories.subtitle')}</span>
            </h2>
            <p className="text-xl text-slate-300 leading-relaxed">
              {tProducts('categories.description')}
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
                      className="w-10 h-10 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg border border-white/20 flex items-center justify-center bg-primary-500"
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