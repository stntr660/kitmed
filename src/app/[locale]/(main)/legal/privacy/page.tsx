'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Lock,
  Eye,
  UserCheck,
  FileText,
  Clock,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function PrivacyPage() {
  const t = useTranslations('privacy');

  const privacyPrinciples = [
    {
      title: "Transparence",
      description: "Nous vous informons clairement sur la collecte et l'utilisation de vos données",
      icon: Eye,
      color: "blue"
    },
    {
      title: "Contrôle",
      description: "Vous avez le contrôle sur vos données personnelles et leurs utilisations",
      icon: UserCheck,
      color: "green"
    },
    {
      title: "Sécurité",
      description: "Vos données sont protégées par des mesures de sécurité avancées",
      icon: Lock,
      color: "red"
    },
    {
      title: "Minimisation",
      description: "Nous collectons uniquement les données nécessaires à nos services",
      icon: Shield,
      color: "purple"
    }
  ];

  const dataCategories = [
    {
      category: "Informations d'identification",
      purpose: "Gestion des comptes et communications",
      retention: "Durée de la relation commerciale + 3 ans",
      examples: ["Nom et prénom", "Email", "Téléphone", "Adresse"]
    },
    {
      category: "Informations professionnelles",
      purpose: "Personnalisation des services et support technique",
      retention: "Durée de la relation commerciale + 5 ans",
      examples: ["Établissement", "Fonction", "Spécialité médicale", "Besoins équipement"]
    },
    {
      category: "Données de navigation",
      purpose: "Amélioration de l'expérience utilisateur",
      retention: "13 mois maximum",
      examples: ["Pages visitées", "Durée de session", "Préférences", "Historique de recherche"]
    },
    {
      category: "Informations commerciales",
      purpose: "Gestion des commandes et facturation",
      retention: "10 ans (obligations légales)",
      examples: ["Commandes", "Devis", "Factures", "Paiements"]
    }
  ];

  const userRights = [
    {
      right: "Droit d'accès",
      description: "Obtenir une copie des données personnelles que nous détenons sur vous"
    },
    {
      right: "Droit de rectification",
      description: "Corriger ou mettre à jour vos informations personnelles"
    },
    {
      right: "Droit à l'effacement",
      description: "Demander la suppression de vos données personnelles"
    },
    {
      right: "Droit à la portabilité",
      description: "Récupérer vos données dans un format structuré et lisible"
    },
    {
      right: "Droit d'opposition",
      description: "Vous opposer au traitement de vos données pour motif légitime"
    },
    {
      right: "Droit de limitation",
      description: "Limiter le traitement de vos données dans certaines circonstances"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-16 lg:py-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="h-10 w-10 text-blue-600" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6 leading-tight">
              Politique de Confidentialité
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
              KITMED s'engage à protéger vos données personnelles et respecter votre vie privée.
              Cette politique explique comment nous collectons, utilisons et protégeons vos informations.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Dernière mise à jour : 15 novembre 2024</span>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Principles */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              Nos Principes de Confidentialité
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              La protection de vos données personnelles repose sur quatre piliers fondamentaux
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {privacyPrinciples.map((principle, index) => (
              <Card key={index} className="border border-gray-200 text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className={`w-16 h-16 mx-auto mb-4 bg-${principle.color}-50 rounded-full flex items-center justify-center`}>
                    <principle.icon className={`h-8 w-8 text-${principle.color}-600`} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {principle.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {principle.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Data Collection */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-gray-900 mb-4">
                Quelles Données Collectons-nous ?
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Nous collectons uniquement les données nécessaires pour fournir nos services et améliorer votre expérience
              </p>
            </div>

            <div className="space-y-6">
              {dataCategories.map((category, index) => (
                <Card key={index} className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-xl font-medium text-gray-900 flex items-center">
                      <FileText className="h-5 w-5 mr-3 text-blue-600" />
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Finalité</h4>
                        <p className="text-gray-600 text-sm">{category.purpose}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Durée de conservation</h4>
                        <p className="text-gray-600 text-sm">{category.retention}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Exemples de données</h4>
                        <ul className="text-gray-600 text-sm space-y-1">
                          {category.examples.map((example, exampleIndex) => (
                            <li key={exampleIndex} className="flex items-center">
                              <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                              {example}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* User Rights */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-gray-900 mb-4">
                Vos Droits
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Conformément au RGPD et à la loi marocaine, vous disposez de plusieurs droits concernant vos données personnelles
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {userRights.map((right, index) => (
                <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">
                          {right.right}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {right.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Card className="border border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <AlertCircle className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Comment exercer vos droits ?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Pour exercer l'un de ces droits, contactez notre Délégué à la Protection des Données (DPD)
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Mail className="mr-2 h-4 w-4" />
                      dpo@kitmed.ma
                    </Button>
                    <Button variant="outline">
                      <Phone className="mr-2 h-4 w-4" />
                      +212 522 86 03 66
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Security Measures */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-gray-900 mb-4">
                Mesures de Sécurité
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Nous mettons en place des mesures techniques et organisationnelles appropriées pour protéger vos données
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl font-medium text-gray-900 flex items-center">
                    <Lock className="h-5 w-5 mr-3 text-green-600" />
                    Mesures Techniques
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Chiffrement des données sensibles
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Protocoles HTTPS/SSL pour toutes les transmissions
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Sauvegardes régulières et sécurisées
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Surveillance continue des accès
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Pare-feu et systèmes de détection d'intrusion
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl font-medium text-gray-900 flex items-center">
                    <UserCheck className="h-5 w-5 mr-3 text-blue-600" />
                    Mesures Organisationnelles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Formation régulière du personnel
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Contrôles d'accès strictes
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Procédures de réponse aux incidents
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Audits de sécurité réguliers
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      Clauses de confidentialité pour tous les employés
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact and Updates */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-light mb-6">
              Contact et Mises à Jour
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Cette politique de confidentialité peut être mise à jour. Nous vous informerons
              de tout changement important par email ou via notre site web.
            </p>

            <div className="grid gap-8 md:grid-cols-3 mb-12">
              <div>
                <h3 className="font-medium mb-3">Délégué à la Protection des Données</h3>
                <div className="text-gray-300 space-y-2">
                  <div className="flex items-center justify-center">
                    <Mail className="h-4 w-4 mr-2" />
                    dpo@kitmed.ma
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Service Clientèle</h3>
                <div className="text-gray-300 space-y-2">
                  <div className="flex items-center justify-center">
                    <Phone className="h-4 w-4 mr-2" />
                    +212 522 86 03 66
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Adresse</h3>
                <div className="text-gray-300 space-y-2">
                  <div className="text-sm">
                    20, rue Lalande<br />
                    Quartier des Hôpitaux<br />
                    Casablanca - Maroc
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-8">
              <p className="text-gray-400 text-sm">
                En continuant à utiliser nos services, vous acceptez cette politique de confidentialité.
                Pour toute question, n'hésitez pas à nous contacter.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}