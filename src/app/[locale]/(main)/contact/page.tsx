'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MapPin,
  Phone,
  Mail,
  Clock,
  Building2,
  Send,
  ArrowRight,
  CheckCircle,
  Printer
} from 'lucide-react';
import { useHydrationSafeLocale } from '@/hooks/useHydrationSafeParams';

export default function ContactPage() {
  const t = useTranslations('contact');
  const tCommon = useTranslations('common');
  const locale = useHydrationSafeLocale('fr');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col">
        <section className="py-20 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6">
                {t('success.title')}
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                {t('success.message')}
              </p>
              <Button size="lg" onClick={() => setIsSubmitted(false)}>
                {t('success.sendAnother')}
              </Button>
            </div>
          </div>
        </section>
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
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              {t('hero.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information and Form */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-12 lg:grid-cols-2">
              
              {/* Contact Information */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-light text-gray-900 mb-6">
                    {t('info.title')}
                  </h2>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {t('info.description')}
                  </p>
                </div>

                {/* Direction */}
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                      Direction
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-gray-500 mt-1" />
                        <div>
                          <p className="text-gray-900 font-medium">20, rue Lalande</p>
                          <p className="text-gray-600">Quartier des Hôpitaux</p>
                          <p className="text-gray-600">Casablanca - Maroc</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-500" />
                        <div className="space-y-1">
                          <a href="tel:+212522860366" className="block text-gray-900 hover:text-blue-600 transition-colors">
                            +212 522 86 03 66
                          </a>
                          <a href="tel:+212522860431" className="block text-gray-900 hover:text-blue-600 transition-colors">
                            +212 522 86 04 31
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Printer className="h-5 w-5 text-gray-500" />
                        <span className="text-gray-900">+212 522 86 04 16</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-500" />
                        <div className="space-y-1">
                          <a href="mailto:INFO@KITMED.MA" className="block text-gray-900 hover:text-blue-600 transition-colors">
                            INFO@KITMED.MA
                          </a>
                          <a href="mailto:EXPORT@KITMED.MA" className="block text-gray-900 hover:text-blue-600 transition-colors">
                            EXPORT@KITMED.MA
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ShowRoom */}
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      ShowRoom
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-gray-500 mt-1" />
                        <div>
                          <p className="text-gray-900 font-medium">33, rue Lahcen El Aarjounen</p>
                          <p className="text-gray-600">Quartier des Hôpitaux</p>
                          <p className="text-gray-600">Casablanca - Maroc</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-500" />
                        <div className="space-y-1">
                          <a href="tel:+212522863427" className="block text-gray-900 hover:text-blue-600 transition-colors">
                            +212 522 86 34 27
                          </a>
                          <a href="tel:+212522860856" className="block text-gray-900 hover:text-blue-600 transition-colors">
                            +212 522 86 08 56
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Printer className="h-5 w-5 text-gray-500" />
                        <span className="text-gray-900">+212 522 86 04 16</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Hours */}
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-green-600" />
                      {t('hours.title')}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('hours.weekdays')}</span>
                        <span className="text-gray-900 font-medium">08:00 - 18:00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('hours.saturday')}</span>
                        <span className="text-gray-900 font-medium">08:00 - 13:00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('hours.sunday')}</span>
                        <span className="text-red-600">{t('hours.closed')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Form */}
              <div>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                      {t('form.title')}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('form.firstName')}
                          </label>
                          <Input
                            id="firstName"
                            name="firstName"
                            type="text"
                            required
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full"
                            placeholder={t('form.placeholders.firstName')}
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('form.lastName')}
                          </label>
                          <Input
                            id="lastName"
                            name="lastName"
                            type="text"
                            required
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="w-full"
                            placeholder={t('form.placeholders.lastName')}
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('form.email')}
                          </label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full"
                            placeholder={t('form.placeholders.email')}
                          />
                        </div>
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('form.phone')}
                          </label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full"
                            placeholder={t('form.placeholders.phone')}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                          {t('form.company')}
                        </label>
                        <Input
                          id="company"
                          name="company"
                          type="text"
                          value={formData.company}
                          onChange={handleInputChange}
                          className="w-full"
                          placeholder={t('form.placeholders.company')}
                        />
                      </div>

                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                          {t('form.subject')}
                        </label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          required
                          value={formData.subject}
                          onChange={handleInputChange}
                          className="w-full"
                          placeholder={t('form.placeholders.subject')}
                        />
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                          {t('form.message')}
                        </label>
                        <Textarea
                          id="message"
                          name="message"
                          rows={6}
                          required
                          value={formData.message}
                          onChange={handleInputChange}
                          className="w-full resize-none"
                          placeholder={t('form.placeholders.message')}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          tCommon('loading')
                        ) : (
                          <>
                            <Send className="mr-2 h-5 w-5" />
                            {t('form.submit')}
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}