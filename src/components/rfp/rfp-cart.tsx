'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';
import { X, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRFPStore } from '@/store/rfp-store';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

export function RFPCart() {
  const t = useTranslations('rfp');
  const tCommon = useTranslations('common');
  const locale = useHydrationSafeLocale('fr');

  const {
    cart,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    updateNotes,
    itemCount,
    hasItems,
  } = useRFPStore();

  const totalItems = itemCount();

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleNotesChange = (productId: string, notes: string) => {
    updateNotes(productId, notes);
  };

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent side="right" className="w-full max-w-md p-0">
        <div className="flex h-full flex-col">
          {/* Header */}
          <SheetHeader className="border-b p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <SheetTitle>{t('cart')}</SheetTitle>
              </div>
              {totalItems > 0 && (
                <Badge variant="accent" className="h-6 w-6 p-0 text-xs">
                  {totalItems}
                </Badge>
              )}
            </div>
            <SheetDescription>
              {hasItems()
                ? `${totalItems} ${totalItems === 1 ? t('item') : t('items')}`
                : t('emptyCart')
              }
            </SheetDescription>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {!hasItems() ? (
              /* Empty State */
              <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-medical-heading mb-2">
                  {t('emptyCart')}
                </h3>
                <p className="text-sm text-medical-body mb-6">
                  {t('addProducts')}
                </p>
                <Button asChild onClick={closeCart}>
                  <Link href={`/${locale}/products`}>
                    {t('browseProducts')}
                  </Link>
                </Button>
              </div>
            ) : (
              /* Cart Items */
              <div className="p-6 space-y-6">
                <AnimatePresence>
                  {cart.items.map((item) => {
                    const primaryImage = item.product.images.find(img => img.isPrimary) || item.product.images[0];

                    return (
                      <motion.div
                        key={item.productId}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-b pb-6 last:border-b-0"
                      >
                        <div className="flex space-x-4">
                          {/* Product Image */}
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white p-2">
                            {primaryImage ? (
                              <Image
                                src={primaryImage.url}
                                alt={primaryImage.alt.en || item.product.name.en}
                                fill
                                className="object-contain"
                                sizes="64px"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-white">
                                <ShoppingCart className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-medical-heading line-clamp-2">
                              {item.product.name.en}
                            </h4>

                            <p className="text-xs text-medical-text-muted mt-1">
                              {item.product.manufacturer.name}
                            </p>

                            <Badge
                              variant="medical"
                              size="sm"
                              className="mt-2"
                              style={{
                                backgroundColor: `${item.product.discipline.color}20`,
                                color: item.product.discipline.color,
                                borderColor: `${item.product.discipline.color}40`
                              }}
                            >
                              {item.product.discipline.name.en}
                            </Badge>

                            {/* Quantity Controls */}
                            <div className="flex items-center space-x-2 mt-3">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>

                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 1)}
                                className="h-8 w-16 text-center text-sm"
                              />

                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => removeItem(item.productId)}
                                aria-label={t('removeItem')}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Notes */}
                            <div className="mt-3">
                              <Textarea
                                placeholder={t('notes')}
                                value={item.notes || ''}
                                onChange={(e) => handleNotesChange(item.productId, e.target.value)}
                                className="min-h-[60px] text-xs"
                                rows={2}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Footer */}
          {hasItems() && (
            <div className="border-t p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{tCommon('total')}:</span>
                  <span className="font-semibold">
                    {totalItems} {totalItems === 1 ? t('item') : t('items')}
                  </span>
                </div>

                <Separator />

                <Button
                  className="w-full"
                  size="lg"
                  asChild
                  onClick={closeCart}
                >
                  <Link href="/rfp/new">
                    {t('continueRequest')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                  onClick={closeCart}
                >
                  <Link href={`/${locale}/products`}>
                    {t('browseProducts')}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}