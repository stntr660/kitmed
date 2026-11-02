'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Award,
  FileCheck,
  Globe,
  Building2,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  AlertCircle,
  Users,
  BookOpen,
  Settings
} from 'lucide-react';

export default function CompliancePage() {
  const t = useTranslations('compliance');

  const certifications = [
    {
      title: "Autorisation Ministère de la Santé",
      authority: "Royaume du Maroc",
      description: "Autorisation officielle pour l'importation et la commercialisation d'équipements médicaux",
      status: "Active",
      validUntil: "2025-12-31",
      certificateNumber: "MS-2024-KITMED-001",
      icon: Building2,
      color: "green",
      documents: ["Autorisation officielle", "Licence d'importation", "Certificat de conformité"]
    },
    {
      title: "Certification CE (Conformité Européenne)",
      authority: "Union Européenne",
      description: "Marquage CE pour tous les équipements médicaux commercialisés",
      status: "Conforme",
      validUntil: "En continu",
      certificateNumber: "CE-KITMED-2024",
      icon: Award,
      color: "blue",
      documents: ["Déclaration CE", "Dossier technique", "Certificats produits"]
    },
    {
      title: "Licence Import/Export",
      authority: "Ministère du Commerce",
      description: "Licence pour l'importation d'équipements médicaux et l'exportation en Afrique",
      status: "Active",
      validUntil: "2025-06-30",
      certificateNumber: "IE-2024-KITMED",
      icon: Globe,
      color: "purple",
      documents: ["Licence d'importation", "Autorisation d'exportation", "Registre commercial"]
    },
    {
      title: "Système Qualité ISO",
      authority: "Bureau de normalisation",
      description: "Mise en conformité avec les standards internationaux de qualité",
      status: "En cours",
      validUntil: "2024-12-31",
      certificateNumber: "ISO-PREP-2024",
      icon: FileCheck,
      color: "orange",
      documents: ["Manuel qualité", "Procédures", "Plan d'amélioration"]
    }
  ];

  const regulations = [
    {
      category: "Réglementation Marocaine",
      items: [
        {
          name: "Loi 17-04 portant Code du Médicament et de la Pharmacie",
          description: "Cadre légal pour les dispositifs médicaux au Maroc",
          compliance: "Conforme"
        },
        {
          name: "Arrêté du Ministre de la Santé n° 1419-04",
          description: "Réglementation spécifique aux dispositifs médicaux",
          compliance: "Conforme"
        },
        {
          name: "Dahir n° 1-09-15 du Code de Commerce",
          description: "Obligations commerciales et import/export",
          compliance: "Conforme"
        }
      ]
    },
    {
      category: "Normes Internationales",
      items: [
        {
          name: "Directive 93/42/CEE (Dispositifs Médicaux)",
          description: "Directive européenne relative aux dispositifs médicaux",
          compliance: "Conforme"
        },
        {
          name: "FDA 21 CFR Part 820",
          description: "Réglementation américaine pour les dispositifs médicaux",
          compliance: "Applicable aux produits FDA"
        },
        {
          name: "ISO 13485:2016",
          description: "Système de management de la qualité pour dispositifs médicaux",
          compliance: "En cours de certification"
        }
      ]
    }
  ];

  const complianceProcesses = [
    {
      title: "Évaluation des Fournisseurs",
      description: "Audit et qualification de nos partenaires fabricants",
      icon: Users,
      steps: [
        "Vérification des certifications",
        "Audit qualité sur site",
        "Évaluation des processus",
        "Validation continue"
      ]
    },
    {
      title: "Contrôle Qualité",
      description: "Procédures de vérification avant commercialisation",
      icon: CheckCircle,
      steps: [
        "Inspection à la réception",
        "Tests de conformité",
        "Documentation technique",
        "Traçabilité complète"
      ]
    },
    {
      title: "Formation Continue",
      description: "Mise à jour des connaissances réglementaires",
      icon: BookOpen,
      steps: [
        "Veille réglementaire",
        "Formation du personnel",
        "Mise à jour des procédures",
        "Audits internes"
      ]
    },
    {
      title: "Amélioration Continue",
      description: "Système d'amélioration de la conformité",
      icon: Settings,
      steps: [
        "Analyse des non-conformités",
        "Actions correctives",
        "Prévention des risques",
        "Optimisation des processus"
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'conforme':
        return 'green';
      case 'en cours':
        return 'orange';
      default:
        return 'gray';
    }
  };

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
              Conformité & Certifications
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
              KITMED s'engage à respecter toutes les réglementations en vigueur et
              maintient les plus hauts standards de qualité et de conformité.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Dernière mise à jour : 15 novembre 2024</span>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              Nos Certifications et Autorisations
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Toutes nos activités sont encadrées par les autorités compétentes et
              respectent les normes internationales les plus strictes
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {certifications.map((cert, index) => (
              <Card key={index} className="border border-gray-200 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-${cert.color}-50 flex items-center justify-center`}>
                      <cert.icon className={`h-6 w-6 text-${cert.color}-600`} />
                    </div>
                    <Badge
                      variant={cert.status === 'Active' || cert.status === 'Conforme' ? 'default' : 'secondary'}
                      className={`${getStatusColor(cert.status) === 'green' ? 'bg-green-50 text-green-700' :
                                  getStatusColor(cert.status) === 'orange' ? 'bg-orange-50 text-orange-700' :
                                  'bg-gray-50 text-gray-700'}`}
                    >
                      {cert.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-medium text-gray-900 mb-2">
                    {cert.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mb-3">{cert.authority}</p>
                  <p className="text-gray-700">{cert.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-900">Numéro :</span>
                        <p className="text-gray-600 font-mono text-xs">{cert.certificateNumber}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Validité :</span>
                        <p className="text-gray-600">{cert.validUntil}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Documents associés :</h4>
                      <div className="space-y-1">
                        {cert.documents.map((doc, docIndex) => (
                          <div key={docIndex} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{doc}</span>
                            <Button size="sm" variant="outline" className="h-6 px-2">
                              <Download className="h-3 w-3 mr-1" />
                              PDF
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Regulatory Compliance */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-gray-900 mb-4">
                Conformité Réglementaire
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Respect scrupuleux des réglementations nationales et internationales
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {regulations.map((regulation, index) => (
                <Card key={index} className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-xl font-medium text-gray-900">
                      {regulation.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {regulation.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="border-l-4 border-blue-200 pl-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                              <p className="text-gray-600 text-xs mt-1">{item.description}</p>
                            </div>
                            <Badge
                              variant="secondary"
                              className={`ml-2 text-xs ${
                                item.compliance.includes('Conforme') ? 'bg-green-50 text-green-700' :
                                item.compliance.includes('En cours') ? 'bg-orange-50 text-orange-700' :
                                'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {item.compliance}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Processes */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-gray-900 mb-4">
                Processus de Conformité
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Méthodologie rigoureuse pour garantir la conformité à tous les niveaux
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {complianceProcesses.map((process, index) => (
                <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mr-4">
                        <process.icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-medium text-gray-900">
                          {process.title}
                        </CardTitle>
                        <p className="text-gray-600 text-sm">{process.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-medium text-gray-900 mb-3">Étapes clés :</h4>
                    <div className="space-y-3">
                      {process.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex items-start">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                            <span className="text-blue-600 text-xs font-medium">{stepIndex + 1}</span>
                          </div>
                          <span className="text-gray-700 text-sm">{step}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reporting and Transparency */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-gray-900 mb-4">
                Transparence et Reporting
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Nous publions régulièrement nos rapports de conformité et mettons
                nos certifications à disposition de nos clients
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <Card className="border border-gray-200 text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
                    <FileCheck className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Audit Annuel
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Audit complet de conformité réalisé par un organisme indépendant
                  </p>
                  <Button size="sm" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Rapport 2024
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                    <Award className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Certifications
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Accès à toutes nos certifications et autorisations officielles
                  </p>
                  <Button size="sm" variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Voir Tout
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-purple-50 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Alertes Conformité
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Système d'alerte en cas de mise à jour réglementaire importante
                  </p>
                  <Button size="sm" variant="outline">
                    S'Abonner
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Compliance */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-light mb-6">
              Questions de Conformité ?
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Notre équipe qualité est à votre disposition pour toute question
              concernant la conformité de nos produits et services.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button className="bg-white text-gray-900 hover:bg-gray-100">
                compliance@kitmed.ma
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                +212 522 86 03 66
              </Button>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3 text-center">
              <div>
                <h3 className="font-medium mb-2">Responsable Qualité</h3>
                <p className="text-gray-300 text-sm">Aicha Berrada</p>
                <p className="text-gray-300 text-sm">qualite@kitmed.ma</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Affaires Réglementaires</h3>
                <p className="text-gray-300 text-sm">Service dédié</p>
                <p className="text-gray-300 text-sm">reglementaire@kitmed.ma</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Direction</h3>
                <p className="text-gray-300 text-sm">Dr. Hassan Benali</p>
                <p className="text-gray-300 text-sm">direction@kitmed.ma</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-700">
              <p className="text-gray-400 text-sm">
                La conformité et la qualité sont au cœur de notre engagement envers nos clients
                et la sécurité des patients.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}