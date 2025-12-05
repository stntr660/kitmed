'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ShoppingCart, Eye, Heart, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRFPStore } from '@/store/rfp-store';
import { cn, formatCurrency } from '@/lib/utils';
import type { Product, Locale } from '@/types';

interface ProductCardProps {
  product: Product;
  locale: Locale;
  className?: string;
  variant?: 'default' | 'compact' | 'featured';
  onQuickView?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
}

export function ProductCard({
  product,
  locale,
  className,
  variant = 'default',
  onQuickView,
  onAddToWishlist,
}: ProductCardProps) {
  const t = useTranslations('product');
  const { addItem, getItem } = useRFPStore();

  const [isHovered, setIsHovered] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const inCart = getItem(product.id);
  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];

  const handleAddToRFP = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToWishlist?.(product);
  };

  const cardVariants = {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.02, y: -4 },
  };

  const imageVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      animate="rest"
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        className={cn(
          'group relative overflow-hidden transition-shadow duration-200 h-full flex flex-col',
          'hover:shadow-medical-lg',
          {
            'max-w-sm': variant === 'compact',
            'border-2 border-accent/20': variant === 'featured',
          },
          className
        )}
        variant="medical"
      >
        <Link
          href={`/${locale}/products/${product.slug}`}
          className="flex-1 flex flex-col"
          aria-label={`${t('viewProduct')} ${product.nom ? product.nom[locale] : 'Product'}`}
        >
          {/* Image Section */}
          <div className="relative aspect-square overflow-hidden bg-gray-50">
            {product.featured && (
              <Badge
                variant="accent"
                className="absolute left-2 top-2 z-10"
              >
                {t('featured')}
              </Badge>
            )}

            {product.status === 'discontinued' && (
              <Badge
                variant="discontinued"
                className="absolute right-2 top-2 z-10"
              >
                {t('discontinued')}
              </Badge>
            )}

            {primaryImage && !imageError ? (
              <motion.div
                variants={imageVariants}
                className="h-full w-full"
              >
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.alt ? primaryImage.alt[locale] : (product.nom ? product.nom[locale] : 'Product image')}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              </motion.div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>
            )}

            {/* Overlay actions */}
            <div className={cn(
              'absolute inset-0 bg-black/40 transition-opacity duration-200',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}>
              <div className="flex h-full items-center justify-center space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleQuickView}
                  aria-label={t('quickView')}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {onAddToWishlist && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleAddToWishlist}
                    aria-label={t('addToWishlist')}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <CardContent className="p-4 flex-1 flex flex-col">
            {/* Category & Manufacturer */}
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-medical-text-muted">
              <span>{product.category?.name ? product.category.name[locale] : 'Category'}</span>
              <span>•</span>
              <span>{product.manufacturer?.name || product.constructeur || 'Manufacturer'}</span>
            </div>

            {/* Product Name */}
            <h3 className="mb-2 line-clamp-2 text-base font-semibold text-medical-heading">
              {product.nom ? product.nom[locale] : 'Product name'}
            </h3>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="mb-3 line-clamp-2 text-sm text-medical-body">
                {product.shortDescription ? product.shortDescription[locale] : ''}
              </p>
            )}

            {/* Discipline */}
            <Badge
              variant="medical"
              size="sm"
              className="mb-3 flex items-center gap-2"
              style={{
                backgroundColor: `${product.discipline.color}20`,
                color: product.discipline.color,
                borderColor: `${product.discipline.color}40`
              }}
            >
              {product.discipline?.imageUrl && (
                <Image
                  src={product.discipline.imageUrl}
                  alt={product.discipline?.name ? product.discipline.name[locale] : 'Discipline'}
                  width={16}
                  height={16}
                  className="rounded-full object-cover"
                />
              )}
              {product.discipline?.name ? product.discipline.name[locale] : 'Discipline'}
            </Badge>

            {/* Spacer to push price to bottom */}
            <div className="flex-1"></div>

            {/* Price */}
            {product.price && (
              <div className="text-sm">
                {product.price.type === 'fixed' ? (
                  <span className="font-semibold text-primary">
                    {formatCurrency(product.price.amount, product.price.currency, locale)}
                  </span>
                ) : (
                  <span className="text-medical-text-secondary">
                    {t(`price.${product.price.type}`)}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Link>

        <CardFooter className="p-4 pt-0">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center space-x-2">
              {product.documents.length > 0 && (
                <Badge variant="outline" size="sm">
                  {product.documents.length} {t('documents')}
                </Badge>
              )}
            </div>

            <Button
              size="sm"
              variant={inCart ? "outline" : "medical"}
              onClick={handleAddToRFP}
              className="min-w-[100px]"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {inCart ? (
                `${t('inRFP')} (${inCart.quantity})`
              ) : (
                t('addToRFP')
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}