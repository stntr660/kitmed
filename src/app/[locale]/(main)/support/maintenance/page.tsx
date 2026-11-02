'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Wrench,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Monitor,
  Heart,
  Camera,
  Activity,
  Shield,
  Settings,
  FileText,
  ArrowRight,
  Users,
  Star
} from 'lucide-react';
import { useState } from 'react';

export default function MaintenancePage() {
  const t = useTranslations('support.maintenance');
  const [formData, setFormData] = useState({
    equipmentType: '',
    serialNumber: '',
    issueDescription: '',
    urgency: 'normal',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    location: ''
  });

  const maintenanceServices = [
    {
      titleKey: "services.preventive.title" as const,
      descriptionKey: "services.preventive.description" as const,
      icon: Calendar,
      color: "green",
      featureKeys: [
        "services.preventive.features.inspection",
        "services.preventive.features.calibration",
        "services.preventive.features.replacement",
        "services.preventive.features.report"
      ] as const,
      pricingKey: "services.preventive.pricing" as const
    },
    {
      titleKey: "services.corrective.title" as const,
      descriptionKey: "services.corrective.description" as const,
      icon: Wrench,
      color: "red",
      featureKeys: [
        "services.corrective.features.intervention",
        "services.corrective.features.diagnostic",
        "services.corrective.features.onSiteRepair",
        "services.corrective.features.warranty"
      ] as const,
      pricingKey: "services.corrective.pricing" as const
    },
    {
      titleKey: "services.contracts.title" as const,
      descriptionKey: "services.contracts.description" as const,
      icon: Shield,
      color: "blue",
      featureKeys: [
        "services.contracts.features.preventiveIncluded",
        "services.contracts.features.priority",
        "services.contracts.features.spareParts",
        "services.contracts.features.unlimitedSupport"
      ] as const,
      pricingKey: "services.contracts.pricing" as const
    },
    {
      titleKey: "services.training.title" as const,
      descriptionKey: "services.training.description" as const,
      icon: Users,
      color: "purple",
      featureKeys: [
        "services.training.features.certified",
        "services.training.features.manual",
        "services.training.features.continuousSupport",
        "services.training.features.procedureUpdates"
      ] as const,
      pricingKey: "services.training.pricing" as const
    }
  ];

  const equipmentCategories = [
    {
      nameKey: "equipment.imaging.name" as const,
      icon: Camera,
      itemKeys: [
        "equipment.imaging.items.ultrasound",
        "equipment.imaging.items.radiology",
        "equipment.imaging.items.mri",
        "equipment.imaging.items.ctScan"
      ] as const,
      intervalKey: "equipment.imaging.interval" as const
    },
    {
      nameKey: "equipment.cardio.name" as const,
      icon: Heart,
      itemKeys: [
        "equipment.cardio.items.ecg",
        "equipment.cardio.items.holter",
        "equipment.cardio.items.defibrillators",
        "equipment.cardio.items.monitoring"
      ] as const,
      intervalKey: "equipment.cardio.interval" as const
    },
    {
      nameKey: "equipment.monitoring.name" as const,
      icon: Monitor,
      itemKeys: [
        "equipment.monitoring.items.multiparameter",
        "equipment.monitoring.items.telemetry",
        "equipment.monitoring.items.oximetry",
        "equipment.monitoring.items.capnography"
      ] as const,
      intervalKey: "equipment.monitoring.interval" as const
    },
    {
      nameKey: "equipment.laboratory.name" as const,
      icon: Activity,
      itemKeys: [
        "equipment.laboratory.items.analyzers",
        "equipment.laboratory.items.centrifuges",
        "equipment.laboratory.items.microscopes",
        "equipment.laboratory.items.automatedSystems"
      ] as const,
      intervalKey: "equipment.laboratory.interval" as const
    }
  ];

  const maintenanceStats = [
    {
      number: "98%",
      labelKey: "stats.uptime" as const,
      icon: CheckCircle
    },
    {
      number: "2h",
      labelKey: "stats.responseTime" as const,
      icon: Clock
    },
    {
      number: "500+",
      labelKey: "stats.equipmentUnderContract" as const,
      icon: Settings
    },
    {
      number: "24/7",
      labelKey: "stats.supportAvailable" as const,
      icon: Phone
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-16 lg:py-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
              {t('hero.description')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">
                <AlertCircle className="mr-2 h-5 w-5" />
                {t('hero.urgentRequest')}
              </Button>
              <Button size="lg" variant="outline">
                <Calendar className="mr-2 h-5 w-5" />
                {t('hero.scheduleMaintenance')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {maintenanceStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                  <stat.icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-3xl font-light text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 text-sm">{t(stat.labelKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              {t('servicesSection.title')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('servicesSection.description')}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {maintenanceServices.map((service, index) => (
              <Card key={index} className="border border-gray-200 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-${service.color}-50 flex items-center justify-center mr-4`}>
                      <service.icon className={`h-6 w-6 text-${service.color}-600`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-medium text-gray-900">
                        {t(service.titleKey)}
                      </CardTitle>
                    </div>
                  </div>
                  <p className="text-gray-600">{t(service.descriptionKey)}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">{t('servicesSection.includedServices')}</h4>
                      <ul className="space-y-2">
                        {service.featureKeys.map((featureKey, featureIndex) => (
                          <li key={featureIndex} className="flex items-start text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {t(featureKey)}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{t(service.pricingKey)}</div>
                      </div>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        {t('servicesSection.requestQuote')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment Categories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              {t('equipmentSection.title')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('equipmentSection.description')}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {equipmentCategories.map((category, index) => (
              <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                    <category.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">{t(category.nameKey)}</h3>
                  <ul className="space-y-1 text-sm text-gray-600 mb-4">
                    {category.itemKeys.map((itemKey, itemIndex) => (
                      <li key={itemIndex}>{t(itemKey)}</li>
                    ))}
                  </ul>
                  <Badge variant="outline" className="text-xs">
                    {t('equipmentSection.maintenanceLabel')} {t(category.intervalKey)}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Request Form */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-gray-900 mb-4">
                {t('form.title')}
              </h2>
              <p className="text-gray-600">
                {t('form.description')}
              </p>
            </div>

            <Card className="border border-gray-200">
              <CardContent className="p-8">
                <form className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {t('form.equipmentType.label')}
                      </label>
                      <select
                        name="equipmentType"
                        value={formData.equipmentType}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">{t('form.equipmentType.placeholder')}</option>
                        <option value="imagerie">{t('form.equipmentType.options.imaging')}</option>
                        <option value="cardio">{t('form.equipmentType.options.cardio')}</option>
                        <option value="monitoring">{t('form.equipmentType.options.monitoring')}</option>
                        <option value="laboratoire">{t('form.equipmentType.options.laboratory')}</option>
                        <option value="autre">{t('form.equipmentType.options.other')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {t('form.serialNumber.label')}
                      </label>
                      <Input
                        name="serialNumber"
                        value={formData.serialNumber}
                        onChange={handleInputChange}
                        placeholder={t('form.serialNumber.placeholder')}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {t('form.urgency.label')}
                      </label>
                      <select
                        name="urgency"
                        value={formData.urgency}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="low">{t('form.urgency.options.low')}</option>
                        <option value="normal">{t('form.urgency.options.normal')}</option>
                        <option value="high">{t('form.urgency.options.high')}</option>
                        <option value="urgent">{t('form.urgency.options.urgent')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {t('form.location.label')}
                      </label>
                      <Input
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder={t('form.location.placeholder')}
                        className="w-full"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      {t('form.issueDescription.label')}
                    </label>
                    <Textarea
                      name="issueDescription"
                      value={formData.issueDescription}
                      onChange={handleInputChange}
                      placeholder={t('form.issueDescription.placeholder')}
                      rows={4}
                      className="w-full"
                      required
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {t('form.contactName.label')}
                      </label>
                      <Input
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleInputChange}
                        placeholder={t('form.contactName.placeholder')}
                        className="w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {t('form.contactPhone.label')}
                      </label>
                      <Input
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleInputChange}
                        placeholder="+212 6XX XXX XXX"
                        className="w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {t('form.contactEmail.label')}
                      </label>
                      <Input
                        name="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={handleInputChange}
                        placeholder="contact@example.com"
                        className="w-full"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t">
                    <p className="text-sm text-gray-600">
                      {t('form.requiredFields')}
                    </p>
                    <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                      {t('form.submit')}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light mb-4">
                {t('contact.title')}
              </h2>
              <p className="text-gray-300">
                {t('contact.description')}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center">
                  <Phone className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium mb-2">{t('contact.emergency.title')}</h3>
                <p className="text-gray-300 mb-2">+212 522 86 03 66</p>
                <p className="text-gray-300 text-sm">{t('contact.emergency.availability')}</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium mb-2">{t('contact.email.title')}</h3>
                <p className="text-gray-300 mb-2">maintenance@kitmed.ma</p>
                <p className="text-gray-300 text-sm">{t('contact.email.responseTime')}</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-600 rounded-full flex items-center justify-center">
                  <MapPin className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium mb-2">{t('contact.intervention.title')}</h3>
                <p className="text-gray-300 mb-2">{t('contact.intervention.coverage')}</p>
                <p className="text-gray-300 text-sm">{t('contact.intervention.serviceType')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
