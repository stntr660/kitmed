'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Scale,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  ShoppingCart,
  Truck,
  CreditCard,
  Shield,
  Phone,
  Mail
} from 'lucide-react';

export default function TermsPage() {
  const t = useTranslations('terms');

  const sections = [
    {
      id: "definitions",
      title: "1. Définitions et Champ d'Application",
      icon: FileText,
      color: "blue"
    },
    {
      id: "services",
      title: "2. Description des Services",
      icon: ShoppingCart,
      color: "green"
    },
    {
      id: "accounts",
      title: "3. Comptes Utilisateurs",
      icon: User,
      color: "purple"
    },
    {
      id: "orders",
      title: "4. Commandes et Devis",
      icon: CreditCard,
      color: "orange"
    },
    {
      id: "delivery",
      title: "5. Livraison et Installation",
      icon: Truck,
      color: "red"
    },
    {
      id: "warranties",
      title: "6. Garanties et Responsabilités",
      icon: Shield,
      color: "teal"
    },
    {
      id: "liability",
      title: "7. Limitation de Responsabilité",
      icon: AlertTriangle,
      color: "yellow"
    },
    {
      id: "termination",
      title: "8. Résiliation et Suspension",
      icon: Clock,
      color: "gray"
    }
  ];

  const keyPoints = [
    {
      title: "Acceptation des Conditions",
      description: "L'utilisation de notre plateforme implique l'acceptation pleine et entière de ces conditions générales.",
      icon: CheckCircle,
      highlight: true
    },
    {
      title: "Services B2B Uniquement",
      description: "Nos services s'adressent exclusivement aux professionnels de santé et établissements médicaux.",
      icon: User,
      highlight: false
    },
    {
      title: "Devis Personnalisés",
      description: "Tous nos équipements font l'objet de devis personnalisés adaptés à vos besoins spécifiques.",
      icon: CreditCard,
      highlight: false
    },
    {
      title: "Support Technique Inclus",
      description: "Installation, formation et maintenance préventive incluses dans nos offres.",
      icon: Shield,
      highlight: true
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-16 lg:py-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <Scale className="h-10 w-10 text-blue-600" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6 leading-tight">
              Conditions Générales d'Utilisation
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
              Ces conditions générales régissent l'utilisation de la plateforme KITMED et
              l'acquisition d'équipements médicaux professionnels.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Dernière mise à jour : 15 novembre 2024</span>
            </div>
          </div>
        </div>
      </section>

      {/* Key Points */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-gray-900 mb-4">
                Points Essentiels
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Les éléments clés à retenir concernant l'utilisation de nos services
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {keyPoints.map((point, index) => (
                <Card key={index} className={`border ${point.highlight ? 'border-blue-200 bg-blue-50' : 'border-gray-200'} hover:shadow-lg transition-shadow`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${point.highlight ? 'bg-blue-100' : 'bg-gray-100'} flex-shrink-0`}>
                        <point.icon className={`h-6 w-6 ${point.highlight ? 'text-blue-600' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">
                          {point.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {point.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Terms */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-12">

              {/* Section 1: Definitions */}
              <div id="definitions" className="scroll-mt-24">
                <Card className="border border-gray-200">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-2xl font-light text-gray-900 flex items-center">
                      <FileText className="h-6 w-6 mr-3 text-blue-600" />
                      1. Définitions et Champ d'Application
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-6 text-gray-700 leading-relaxed">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">1.1 Définitions</h4>
                        <ul className="space-y-2 ml-4">
                          <li><strong>« KITMED » ou « Nous »</strong> : La société KITMED, spécialiste en équipements médicaux, située 20 rue Lalande, Quartier des Hôpitaux, Casablanca.</li>
                          <li><strong>« Client » ou « Vous »</strong> : Toute personne physique ou morale, professionnelle de santé, utilisant nos services.</li>
                          <li><strong>« Plateforme »</strong> : Le site web, l'application mobile et tous les services numériques de KITMED.</li>
                          <li><strong>« Équipements »</strong> : Tous les dispositifs médicaux, instruments et matériels proposés par KITMED.</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">1.2 Champ d'Application</h4>
                        <p>Ces conditions générales s'appliquent à toute utilisation de la plateforme KITMED et à tout achat d'équipements médicaux, sans exception ni restriction.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Section 2: Services */}
              <div id="services" className="scroll-mt-24">
                <Card className="border border-gray-200">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-2xl font-light text-gray-900 flex items-center">
                      <ShoppingCart className="h-6 w-6 mr-3 text-green-600" />
                      2. Description des Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-6 text-gray-700 leading-relaxed">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">2.1 Services Proposés</h4>
                        <ul className="space-y-2 ml-4 list-disc">
                          <li>Vente d'équipements médicaux certifiés CE et FDA</li>
                          <li>Installation et mise en service des équipements</li>
                          <li>Formation du personnel utilisateur</li>
                          <li>Maintenance préventive et corrective</li>
                          <li>Support technique et assistance</li>
                          <li>Conseil et accompagnement technique</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">2.2 Clientèle Cible</h4>
                        <p>Nos services s'adressent exclusivement aux professionnels de santé : hôpitaux, cliniques, cabinets médicaux, laboratoires d'analyses médicales et centres de soins.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Section 3: User Accounts */}
              <div id="accounts" className="scroll-mt-24">
                <Card className="border border-gray-200">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-2xl font-light text-gray-900 flex items-center">
                      <User className="h-6 w-6 mr-3 text-purple-600" />
                      3. Comptes Utilisateurs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-6 text-gray-700 leading-relaxed">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">3.1 Création de Compte</h4>
                        <p>L'accès à certains services nécessite la création d'un compte professionnel. Vous vous engagez à fournir des informations exactes, complètes et à jour.</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">3.2 Responsabilité du Compte</h4>
                        <p>Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités effectuées sous votre compte.</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">3.3 Vérification Professionnelle</h4>
                        <p>KITMED se réserve le droit de vérifier le statut professionnel des utilisateurs et de suspendre les comptes non conformes.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Section 4: Orders */}
              <div id="orders" className="scroll-mt-24">
                <Card className="border border-gray-200">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-2xl font-light text-gray-900 flex items-center">
                      <CreditCard className="h-6 w-6 mr-3 text-orange-600" />
                      4. Commandes et Devis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-6 text-gray-700 leading-relaxed">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">4.1 Processus de Commande</h4>
                        <ul className="space-y-2 ml-4 list-disc">
                          <li>Demande de devis via la plateforme ou par contact direct</li>
                          <li>Étude personnalisée de vos besoins</li>
                          <li>Proposition commerciale détaillée</li>
                          <li>Validation et signature du devis</li>
                          <li>Commande ferme avec acompte</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">4.2 Prix et Paiement</h4>
                        <p>Les prix sont exprimés en dirhams marocains, hors taxes. Les modalités de paiement sont définies dans chaque devis. Un acompte de 30% est généralement demandé à la commande.</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">4.3 Validité des Devis</h4>
                        <p>Sauf mention contraire, nos devis sont valables 30 jours à compter de leur émission.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Section 5: Delivery */}
              <div id="delivery" className="scroll-mt-24">
                <Card className="border border-gray-200">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-2xl font-light text-gray-900 flex items-center">
                      <Truck className="h-6 w-6 mr-3 text-red-600" />
                      5. Livraison et Installation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-6 text-gray-700 leading-relaxed">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">5.1 Délais de Livraison</h4>
                        <p>Les délais de livraison sont indicatifs et dépendent de la disponibilité des équipements. Nous nous engageons à vous tenir informé en cas de retard.</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">5.2 Installation</h4>
                        <p>L'installation est réalisée par nos techniciens qualifiés. Le client doit s'assurer que les prérequis techniques (alimentation, espace, etc.) sont respectés.</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">5.3 Réception</h4>
                        <p>La réception s'effectue lors de la mise en service de l'équipement. Tout défaut apparent doit être signalé immédiatement.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Section 6: Warranties */}
              <div id="warranties" className="scroll-mt-24">
                <Card className="border border-gray-200">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-2xl font-light text-gray-900 flex items-center">
                      <Shield className="h-6 w-6 mr-3 text-teal-600" />
                      6. Garanties et Responsabilités
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-6 text-gray-700 leading-relaxed">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">6.1 Garantie Constructeur</h4>
                        <p>Tous nos équipements bénéficient de la garantie constructeur, généralement de 1 à 3 ans selon les produits.</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">6.2 Garantie KITMED</h4>
                        <p>En complément, nous offrons notre propre garantie sur l'installation et la mise en service pendant 12 mois.</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">6.3 Exclusions de Garantie</h4>
                        <ul className="space-y-2 ml-4 list-disc">
                          <li>Mauvaise utilisation ou négligence</li>
                          <li>Modification non autorisée</li>
                          <li>Usure normale</li>
                          <li>Dommages accidentels</li>
                          <li>Force majeure</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Section 7: Liability */}
              <div id="liability" className="scroll-mt-24">
                <Card className="border border-gray-200">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-2xl font-light text-gray-900 flex items-center">
                      <AlertTriangle className="h-6 w-6 mr-3 text-yellow-600" />
                      7. Limitation de Responsabilité
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-6 text-gray-700 leading-relaxed">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">7.1 Responsabilité de KITMED</h4>
                        <p>Notre responsabilité est limitée au remplacement ou à la réparation de l'équipement défectueux, dans les limites de la garantie.</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">7.2 Exclusions</h4>
                        <p>KITMED ne peut être tenu responsable des dommages indirects, pertes d'exploitation, ou dommages aux patients résultant d'un dysfonctionnement.</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">7.3 Assurance</h4>
                        <p>Il appartient au client de vérifier que son assurance couvre l'utilisation des équipements fournis.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Section 8: Termination */}
              <div id="termination" className="scroll-mt-24">
                <Card className="border border-gray-200">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-2xl font-light text-gray-900 flex items-center">
                      <Clock className="h-6 w-6 mr-3 text-gray-600" />
                      8. Résiliation et Modifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-6 text-gray-700 leading-relaxed">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">8.1 Modification des Conditions</h4>
                        <p>KITMED se réserve le droit de modifier ces conditions à tout moment. Les nouvelles conditions seront applicables dès leur publication sur la plateforme.</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">8.2 Suspension de Compte</h4>
                        <p>Nous pouvons suspendre ou fermer un compte en cas de non-respect de ces conditions ou d'utilisation frauduleuse.</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">8.3 Droit Applicable</h4>
                        <p>Ces conditions sont régies par le droit marocain. Tout litige relève de la compétence des tribunaux de Casablanca.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-light mb-6">
              Questions sur nos Conditions ?
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Notre équipe juridique et commerciale est à votre disposition pour
              répondre à toutes vos questions concernant ces conditions générales.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button className="bg-white text-gray-900 hover:bg-gray-100">
                <Mail className="mr-2 h-5 w-5" />
                legal@kitmed.ma
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                <Phone className="mr-2 h-5 w-5" />
                +212 522 86 03 66
              </Button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-700">
              <p className="text-gray-400 text-sm">
                En utilisant nos services, vous acceptez ces conditions générales d'utilisation.
                Nous vous recommandons de les consulter régulièrement.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}