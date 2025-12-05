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
  const t = useTranslations('maintenance');
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
      title: "Maintenance Préventive",
      description: "Programmes de maintenance planifiée pour éviter les pannes et prolonger la durée de vie",
      icon: Calendar,
      color: "green",
      features: [
        "Inspection régulière",
        "Calibration et tests",
        "Remplacement préventif",
        "Rapport détaillé"
      ],
      pricing: "À partir de 800 DH/visite"
    },
    {
      title: "Maintenance Corrective",
      description: "Intervention rapide pour la réparation et le dépannage d'urgence",
      icon: Wrench,
      color: "red",
      features: [
        "Intervention 24h/7j",
        "Diagnostic complet",
        "Réparation sur site",
        "Garantie pièces et main d'œuvre"
      ],
      pricing: "Devis sur mesure"
    },
    {
      title: "Contrats de Maintenance",
      description: "Contrats annuels pour une couverture complète et des coûts prévisibles",
      icon: Shield,
      color: "blue",
      features: [
        "Maintenance préventive incluse",
        "Priorité sur les interventions",
        "Pièces de rechange garanties",
        "Support technique illimité"
      ],
      pricing: "À partir de 12,000 DH/an"
    },
    {
      title: "Formation Technique",
      description: "Formation de vos équipes pour la maintenance de premier niveau",
      icon: Users,
      color: "purple",
      features: [
        "Formation certifiante",
        "Manuel technique inclus",
        "Support continu",
        "Mise à jour des procédures"
      ],
      pricing: "1,500 DH/jour de formation"
    }
  ];

  const equipmentCategories = [
    {
      name: "Imagerie Médicale",
      icon: Camera,
      items: ["Échographes", "Radiologie", "IRM", "Scanner"],
      maintenanceInterval: "Trimestrielle"
    },
    {
      name: "Équipements Cardio",
      icon: Heart,
      items: ["ECG", "Holter", "Défibrillateurs", "Monitoring"],
      maintenanceInterval: "Bimestrielle"
    },
    {
      name: "Systèmes de Monitoring",
      icon: Monitor,
      items: ["Multiparamètres", "Télémétrie", "Oxymétrie", "Capnographie"],
      maintenanceInterval: "Mensuelle"
    },
    {
      name: "Équipements de Laboratoire",
      icon: Activity,
      items: ["Analyseurs", "Centrifugeuses", "Microscopes", "Automates"],
      maintenanceInterval: "Mensuelle"
    }
  ];

  const maintenanceStats = [
    {
      number: "98%",
      label: "Temps de fonctionnement",
      icon: CheckCircle
    },
    {
      number: "2h",
      label: "Temps de réponse moyen",
      icon: Clock
    },
    {
      number: "500+",
      label: "Équipements sous contrat",
      icon: Settings
    },
    {
      number: "24/7",
      label: "Support disponible",
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
              Maintenance & Support Technique
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
              Services de maintenance professionnels pour assurer le bon fonctionnement
              et la longévité de vos équipements médicaux.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">
                <AlertCircle className="mr-2 h-5 w-5" />
                Demande d'Intervention Urgente
              </Button>
              <Button size="lg" variant="outline">
                <Calendar className="mr-2 h-5 w-5" />
                Planifier une Maintenance
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
                <div className="text-gray-600 text-sm">{stat.label}</div>
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
              Nos Services de Maintenance
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Solutions complètes adaptées à tous types d'équipements médicaux
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
                        {service.title}
                      </CardTitle>
                    </div>
                  </div>
                  <p className="text-gray-600">{service.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Services inclus :</h4>
                      <ul className="space-y-2">
                        {service.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{service.pricing}</div>
                      </div>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        Demander un Devis
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
              Équipements Pris en Charge
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Expertise technique sur toutes les catégories d'équipements médicaux
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {equipmentCategories.map((category, index) => (
              <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                    <category.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">{category.name}</h3>
                  <ul className="space-y-1 text-sm text-gray-600 mb-4">
                    {category.items.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                  <Badge variant="outline" className="text-xs">
                    Maintenance {category.maintenanceInterval}
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
                Demande de Maintenance
              </h2>
              <p className="text-gray-600">
                Remplissez le formulaire ci-dessous pour une demande d'intervention
              </p>
            </div>

            <Card className="border border-gray-200">
              <CardContent className="p-8">
                <form className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Type d'Équipement *
                      </label>
                      <select
                        name="equipmentType"
                        value={formData.equipmentType}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Sélectionner un type</option>
                        <option value="imagerie">Imagerie Médicale</option>
                        <option value="cardio">Équipements Cardio</option>
                        <option value="monitoring">Systèmes de Monitoring</option>
                        <option value="laboratoire">Équipements de Laboratoire</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Numéro de Série
                      </label>
                      <Input
                        name="serialNumber"
                        value={formData.serialNumber}
                        onChange={handleInputChange}
                        placeholder="Ex: KM2024-001"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Niveau d'Urgence *
                      </label>
                      <select
                        name="urgency"
                        value={formData.urgency}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="low">Faible - Maintenance préventive</option>
                        <option value="normal">Normal - Dans la semaine</option>
                        <option value="high">Élevé - Sous 24h</option>
                        <option value="urgent">Urgent - Intervention immédiate</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Localisation *
                      </label>
                      <Input
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="Adresse de l'équipement"
                        className="w-full"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Description du Problème *
                    </label>
                    <Textarea
                      name="issueDescription"
                      value={formData.issueDescription}
                      onChange={handleInputChange}
                      placeholder="Décrivez le problème en détail..."
                      rows={4}
                      className="w-full"
                      required
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Nom du Contact *
                      </label>
                      <Input
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleInputChange}
                        placeholder="Nom et prénom"
                        className="w-full"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Téléphone *
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
                        Email *
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
                      * Champs obligatoires
                    </p>
                    <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                      Envoyer la Demande
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
                Contact Maintenance d'Urgence
              </h2>
              <p className="text-gray-300">
                Pour les urgences, contactez notre équipe technique 24h/24, 7j/7
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center">
                  <Phone className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium mb-2">Urgences 24/7</h3>
                <p className="text-gray-300 mb-2">+212 522 86 03 66</p>
                <p className="text-gray-300 text-sm">Disponible en permanence</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium mb-2">Email Technique</h3>
                <p className="text-gray-300 mb-2">maintenance@kitmed.ma</p>
                <p className="text-gray-300 text-sm">Réponse sous 2h</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-600 rounded-full flex items-center justify-center">
                  <MapPin className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium mb-2">Intervention</h3>
                <p className="text-gray-300 mb-2">Maroc & Afrique</p>
                <p className="text-gray-300 text-sm">Service national</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}