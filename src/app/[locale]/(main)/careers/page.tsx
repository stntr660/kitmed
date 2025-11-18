'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  Users, 
  GraduationCap, 
  Heart, 
  Target,
  ArrowRight,
  Mail,
  Briefcase
} from 'lucide-react';

export default function CareersPage() {
  const t = useTranslations('careers');

  const openPositions = [
    {
      title: "Ingénieur Biomédical Senior",
      department: "Technique",
      location: "Casablanca",
      type: "CDI",
      experience: "5+ ans",
      description: "Responsable de la maintenance et du support technique des équipements médicaux",
      requirements: [
        "Diplôme en génie biomédical ou équivalent",
        "5 ans d'expérience minimum",
        "Maîtrise des normes CE et FDA",
        "Excellent relationnel client"
      ]
    },
    {
      title: "Commercial Export",
      department: "Commercial",
      location: "Casablanca",
      type: "CDI",
      experience: "3+ ans",
      description: "Développement des ventes à l'international pour les équipements médicaux",
      requirements: [
        "Formation commerciale ou technique",
        "Expérience en commerce international",
        "Maîtrise de l'anglais et du français",
        "Esprit d'initiative et autonomie"
      ]
    },
    {
      title: "Technicien de Maintenance",
      department: "Technique",
      location: "Rabat",
      type: "CDI",
      experience: "2+ ans",
      description: "Maintenance préventive et corrective des équipements médicaux",
      requirements: [
        "Formation technique spécialisée",
        "Expérience en maintenance d'équipements",
        "Disponibilité pour déplacements",
        "Sens du service client"
      ]
    }
  ];

  const benefits = [
    {
      icon: <Heart className="h-8 w-8 text-red-500" />,
      title: "Assurance Santé",
      description: "Couverture médicale complète pour vous et votre famille"
    },
    {
      icon: <GraduationCap className="h-8 w-8 text-blue-500" />,
      title: "Formation Continue",
      description: "Programmes de formation et développement professionnel"
    },
    {
      icon: <Target className="h-8 w-8 text-green-500" />,
      title: "Évolution de Carrière",
      description: "Opportunités d'avancement et de promotion interne"
    },
    {
      icon: <Users className="h-8 w-8 text-purple-500" />,
      title: "Équipe Dynamique",
      description: "Environnement de travail collaboratif et stimulant"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6 leading-tight">
              Rejoignez Notre Équipe
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
              Construisez votre carrière avec KITMED et participez à l'amélioration 
              des soins de santé au Maroc et en Afrique.
            </p>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Mail className="mr-2 h-5 w-5" />
              Candidature Spontanée
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-gray-900 mb-4">
                Pourquoi Travailler Chez KITMED ?
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Nous offrons un environnement de travail stimulant où vous pouvez développer 
                vos compétences et faire une différence dans le secteur médical.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit, index) => (
                <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow text-center">
                  <CardContent className="p-6">
                    <div className="flex justify-center mb-4">
                      {benefit.icon}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-gray-900 mb-4">
                Postes Ouverts
              </h2>
              <p className="text-gray-600">
                Découvrez nos opportunités d'emploi actuelles
              </p>
            </div>
            <div className="space-y-6">
              {openPositions.map((position, index) => (
                <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-8">
                    <div className="grid lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-medium text-gray-900 mb-2">
                              {position.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center">
                                <Briefcase className="h-4 w-4 mr-1" />
                                {position.department}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {position.location}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {position.type}
                              </div>
                            </div>
                            <p className="text-gray-600 mb-4">
                              {position.description}
                            </p>
                          </div>
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                            {position.experience}
                          </Badge>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Exigences :</h4>
                          <ul className="space-y-1 text-sm text-gray-600">
                            {position.requirements.map((req, reqIndex) => (
                              <li key={reqIndex} className="flex items-start">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center lg:justify-end">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                          Postuler
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-light text-gray-900 mb-12">
              Processus de Candidature
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-semibold text-blue-600">1</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Candidature</h3>
                <p className="text-gray-600 text-sm">
                  Envoyez votre CV et lettre de motivation
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-semibold text-blue-600">2</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Entretien</h3>
                <p className="text-gray-600 text-sm">
                  Entretien avec notre équipe RH et le manager
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-semibold text-blue-600">3</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Intégration</h3>
                <p className="text-gray-600 text-sm">
                  Formation et intégration dans l'équipe
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-light mb-4">
              Vous Ne Trouvez Pas Le Poste Idéal ?
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Nous sommes toujours à la recherche de talents exceptionnels. 
              Envoyez-nous votre candidature spontanée !
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button className="bg-white text-gray-900 hover:bg-gray-100">
                <Mail className="mr-2 h-5 w-5" />
                rh@kitmed.ma
              </Button>
              <div className="text-gray-300">
                ou appelez-nous au +212 522 86 03 66
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}