'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  MessageSquare, 
  CheckCircle, 
  AlertCircle,
  Building2,
  Mail,
  Phone,
  User,
  Clock,
  Plus,
  X,
  Search
} from 'lucide-react';

interface Product {
  id: string;
  referenceFournisseur: string;
  constructeur: string;
  translations: Array<{
    languageCode: string;
    nom: string;
  }>;
}

interface QuoteRequestFormProps {
  product?: Product;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

interface QuoteFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  companyAddress: string;
  contactPerson: string;
  message: string;
  preferredContactMethod: 'email' | 'phone' | 'whatsapp';
  specialRequirements: string;
}

interface QuoteItem {
  productId: string;
  productName: string;
  productRef: string;
  quantity: number;
  specialRequirements?: string;
}

export function QuoteRequestForm({ product, trigger, onSuccess }: QuoteRequestFormProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<QuoteFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    companyName: '',
    companyAddress: '',
    contactPerson: '',
    message: '',
    preferredContactMethod: 'email',
    specialRequirements: '',
  });

  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Initialize with the provided product
  useEffect(() => {
    if (product && quoteItems.length === 0) {
      const initialItem: QuoteItem = {
        productId: product.id,
        productName: getProductName(product),
        productRef: product.referenceFournisseur,
        quantity: 1,
        specialRequirements: ''
      };
      setQuoteItems([initialItem]);
    }
  }, [product]);

  // Fetch available products for search
  const searchProducts = async (query: string) => {
    if (query.length < 2) {
      setAvailableProducts([]);
      return;
    }

    try {
      const response = await fetch(`/api/admin/products?query=${encodeURIComponent(query)}&pageSize=20`);
      if (response.ok) {
        const data = await response.json();
        setAvailableProducts(data.data.items || []);
      }
    } catch (error) {
      console.error('Failed to search products:', error);
    }
  };

  const addProductToQuote = (selectedProduct: Product) => {
    const existingItem = quoteItems.find(item => item.productId === selectedProduct.id);
    if (existingItem) {
      // Increase quantity if product already exists
      setQuoteItems(items => 
        items.map(item => 
          item.productId === selectedProduct.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      // Add new product
      const newItem: QuoteItem = {
        productId: selectedProduct.id,
        productName: getProductName(selectedProduct),
        productRef: selectedProduct.referenceFournisseur,
        quantity: 1,
        specialRequirements: ''
      };
      setQuoteItems(items => [...items, newItem]);
    }
    setProductSearchQuery('');
    setShowProductSearch(false);
    setAvailableProducts([]);
  };

  const removeProductFromQuote = (productId: string) => {
    setQuoteItems(items => items.filter(item => item.productId !== productId));
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setQuoteItems(items => 
      items.map(item => 
        item.productId === productId 
          ? { ...item, quantity }
          : item
      )
    );
  };

  const handleInputChange = (field: keyof QuoteFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getProductName = (product: Product, locale: string = 'fr') => {
    const translation = product.translations?.find(t => t.languageCode === locale);
    return translation?.nom || product.referenceFournisseur;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerEmail) {
      setError('Nom et email sont requis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const rfpData = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone || null,
        companyName: formData.companyName || null,
        companyAddress: formData.companyAddress || null,
        contactPerson: formData.contactPerson || null,
        message: formData.message || null,
        preferredContactMethod: formData.preferredContactMethod,
        items: quoteItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          specialRequirements: item.specialRequirements || null
        }))
      };

      const response = await fetch('/api/rfp-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rfpData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'envoi de la demande');
      }

      const result = await response.json();
      setSuccess(true);
      
      // Reset form after 2 seconds and close
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setFormData({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          companyName: '',
          companyAddress: '',
          contactPerson: '',
          message: '',
          preferredContactMethod: 'email',
          specialRequirements: '',
        });
        setQuoteItems(product ? [{
          productId: product.id,
          productName: getProductName(product),
          productRef: product.referenceFournisseur,
          quantity: 1,
          specialRequirements: ''
        }] : []);
        onSuccess?.();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };


  const contactOptions = [
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'phone', label: 'Téléphone', icon: Phone },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary text-white hover:bg-gray-600">
            <MessageSquare className="h-4 w-4 mr-2" />
            Demander un Devis
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-800 mb-2">
              Demande Envoyée !
            </h3>
            <p className="text-green-600 mb-4">
              Votre demande de devis a été transmise avec succès.
            </p>
            <p className="text-sm text-gray-600">
              Nous vous recontacterons dans les plus brefs délais.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Demande de Devis
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Remplissez les informations essentielles pour recevoir un devis personnalisé.
              </DialogDescription>
            </DialogHeader>

            {/* Products in Quote */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Produits ({quoteItems.length})</h4>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowProductSearch(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un produit
                </Button>
              </div>

              {/* Product Search */}
              {showProductSearch && (
                <div className="mb-4 p-3 bg-white rounded-lg border">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Rechercher un produit..."
                      value={productSearchQuery}
                      onChange={(e) => {
                        setProductSearchQuery(e.target.value);
                        searchProducts(e.target.value);
                      }}
                      className="pl-10"
                    />
                  </div>
                  
                  {availableProducts.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                      {availableProducts.map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => addProductToQuote(prod)}
                          className="w-full text-left p-2 hover:bg-gray-50 border-b last:border-b-0"
                        >
                          <div className="text-sm font-medium">{getProductName(prod)}</div>
                          <div className="text-xs text-gray-500">Réf: {prod.referenceFournisseur}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowProductSearch(false);
                        setProductSearchQuery('');
                        setAvailableProducts([]);
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}

              {/* Quote Items List */}
              <div className="space-y-3">
                {quoteItems.map((item) => (
                  <div key={item.productId} className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{item.productName}</h5>
                        <p className="text-xs text-gray-500">Réf: {item.productRef}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <label className="text-xs text-gray-600">Qté:</label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                            className="h-8 w-16 text-xs"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeProductFromQuote(item.productId)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {quoteItems.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Aucun produit sélectionné. Cliquez sur "Ajouter un produit" pour commencer.
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customerName" className="text-sm text-gray-700 mb-1 block">
                    Nom Complet *
                  </label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    placeholder="Votre nom et prénom"
                    required
                    className="h-10"
                  />
                </div>
                
                <div>
                  <label htmlFor="customerEmail" className="text-sm text-gray-700 mb-1 block">
                    Email *
                  </label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    placeholder="votre.email@exemple.com"
                    required
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customerPhone" className="text-sm text-gray-700 mb-1 block">
                    Téléphone
                  </label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    placeholder="+212 6XX XXX XXX"
                    className="h-10"
                  />
                </div>
                
                <div>
                  <label htmlFor="companyName" className="text-sm text-gray-700 mb-1 block">
                    Entreprise
                  </label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Nom de votre entreprise"
                    className="h-10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="text-sm text-gray-700 mb-1 block">
                  Message
                </label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Décrivez vos besoins spécifiques..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.customerName || !formData.customerEmail}
                  className="bg-primary text-white hover:bg-gray-600 min-w-[120px]"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Envoyer la Demande
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}