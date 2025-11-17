'use client';

import { useState } from 'react';
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
  Clock
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
  urgencyLevel: 'low' | 'normal' | 'high' | 'urgent';
  preferredContactMethod: 'email' | 'phone' | 'whatsapp';
  quantity: number;
  specialRequirements: string;
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
    urgencyLevel: 'normal',
    preferredContactMethod: 'email',
    quantity: 1,
    specialRequirements: '',
  });

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
        urgencyLevel: formData.urgencyLevel,
        preferredContactMethod: formData.preferredContactMethod,
        items: product ? [{
          productId: product.id,
          quantity: formData.quantity,
          specialRequirements: formData.specialRequirements || null
        }] : []
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
          urgencyLevel: 'normal',
          preferredContactMethod: 'email',
          quantity: 1,
          specialRequirements: '',
        });
        onSuccess?.();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  const urgencyOptions = [
    { value: 'low', label: 'Faible', color: 'bg-gray-100 text-gray-800' },
    { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'Élevé', color: 'bg-amber-100 text-amber-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  ];

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

            {/* Product Summary */}
            {product && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-900 mb-1">{getProductName(product)}</h4>
                <p className="text-sm text-gray-600 mb-3">{product.constructeur} - Réf: {product.referenceFournisseur}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-700 mb-1 block">Quantité</label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700 mb-1 block">Urgence</label>
                    <select
                      value={formData.urgencyLevel}
                      onChange={(e) => handleInputChange('urgencyLevel', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {urgencyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

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