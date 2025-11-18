'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap,
  Users,
  Clock,
  MapPin,
  Calendar,
  Play,
  CheckCircle,
  Star,
  ArrowRight,
  Monitor,
  Heart,
  Camera,
  Activity,
  Phone,
  Mail
} from 'lucide-react';

export default function TrainingPage() {
  const t = useTranslations('training');

  const trainingPrograms = [
    {
      title: "Formation Échographie Avancée",
      description: "Formation complète sur l'utilisation des équipements d'échographie haute résolution",
      duration: "3 jours",
      level: "Avancé",
      participants: "6-12 personnes",
      location: "Centre de formation KITMED",
      price: "2,500 DH",
      category: "Imagerie",
      icon: Camera,
      color: "blue",
      features: [
        "Théorie et pratique",
        "Certification incluse",
        "Support technique 6 mois",
        "Documentation complète"
      ],
      nextSessions: ["15 Décembre 2024", "20 Janvier 2025", "25 Février 2025"]
    },
    {
      title: "Maintenance Préventive - Équipements Cardio",
      description: "Protocoles de maintenance et dépannage pour équipements cardiovasculaires",
      duration: "2 jours",
      level: "Intermédiaire",
      participants: "4-8 personnes",
      location: "Site client ou centre KITMED",
      price: "1,800 DH",
      category: "Maintenance",
      icon: Heart,
      color: "red",
      features: [
        "Maintenance préventive",
        "Diagnostic de pannes",
        "Pièces de rechange",
        "Manuel technique"
      ],
      nextSessions: ["10 Décembre 2024", "15 Janvier 2025", "10 Mars 2025"]
    },
    {
      title: "Formation Monitoring Avancé",
      description: "Utilisation optimale des systèmes de monitoring multiparamètres",
      duration: "2 jours",
      level: "Intermédiaire",
      participants: "8-15 personnes",
      location: "Centre de formation ou site client",
      price: "2,200 DH",
      category: "Monitoring",
      icon: Activity,
      color: "green",
      features: [
        "Configuration systèmes",
        "Alarmes et alertes",
        "Analyse des données",
        "Certification utilisateur"
      ],
      nextSessions: ["5 Décembre 2024", "12 Janvier 2025", "18 Février 2025"]
    },
    {
      title: "Utilisation Équipements de Laboratoire",
      description: "Formation pratique sur les analyseurs et équipements de laboratoire",
      duration: "1 jour",
      level: "Débutant",
      participants: "6-10 personnes",
      location: "Laboratoire partenaire",
      price: "1,200 DH",
      category: "Laboratoire",
      icon: Monitor,
      color: "purple",
      features: [
        "Utilisation de base",
        "Calibration",
        "Maintenance quotidienne",
        "Guide utilisateur"
      ],
      nextSessions: ["8 Décembre 2024", "22 Janvier 2025", "5 Mars 2025"]
    }
  ];

  const trainingStats = [
    {
      number: "500+",
      label: "Professionnels formés",
      icon: Users
    },
    {
      number: "98%",
      label: "Taux de satisfaction",
      icon: Star
    },
    {
      number: "24h",
      label: "Support post-formation",
      icon: Clock
    },
    {
      number: "15+",
      label: "Programmes disponibles",
      icon: GraduationCap
    }
  ];

  const testimonials = [
    {
      quote: "Formation excellente avec une approche très pratique. Les formateurs sont des experts dans leur domaine.",
      author: "Dr. Amina Benali",
      position: "Chef du service cardiologie",
      organization: "CHU Ibn Rochd"
    },
    {
      quote: "Grâce à cette formation, notre équipe maîtrise parfaitement les nouveaux équipements. Service après-vente exceptionnel.",
      author: "Hassan Tazi",
      position: "Responsable technique",
      organization: "Clinique Al Madina"
    }
  ];

  const benefits = [
    {
      title: "Formation Certifiante",
      description: "Certificats reconnus par les autorités de santé",
      icon: CheckCircle
    },
    {
      title: "Formateurs Experts",
      description: "Ingénieurs biomédicaux certifiés et expérimentés",
      icon: Users
    },
    {
      title: "Support Continu",
      description: "Assistance technique 6 mois après formation",
      icon: Phone
    },
    {
      title: "Documentation Complète",
      description: "Manuels et guides techniques inclus",
      icon: Monitor
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-16 lg:py-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6 leading-tight">
              Formations Professionnelles
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
              Développez l'expertise de vos équipes avec nos formations certifiantes 
              sur l'utilisation et la maintenance des équipements médicaux.
            </p>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Calendar className="mr-2 h-5 w-5" />
              Réserver une Formation
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {trainingStats.map((stat, index) => (
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

      {/* Training Programs */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              Programmes de Formation
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Formations adaptées à tous les niveaux, de l'initiation à la spécialisation avancée
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {trainingPrograms.map((program, index) => (
              <Card key={index} className="border border-gray-200 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-${program.color}-50 flex items-center justify-center`}>
                      <program.icon className={`h-6 w-6 text-${program.color}-600`} />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {program.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-medium text-gray-900 mb-2">
                    {program.title}
                  </CardTitle>
                  <p className="text-gray-600 text-sm">{program.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Program Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {program.duration}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        {program.participants}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="truncate">{program.location}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Star className="h-4 w-4 mr-2" />
                        {program.level}
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Inclus dans la formation :</h4>
                      <ul className="space-y-1">
                        {program.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Next Sessions */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Prochaines sessions :</h4>
                      <div className="flex flex-wrap gap-2">
                        {program.nextSessions.slice(0, 2).map((session, sessionIndex) => (
                          <Badge key={sessionIndex} variant="secondary" className="text-xs">
                            {session}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Price and Action */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <span className="text-2xl font-bold text-gray-900">{program.price}</span>
                        <span className="text-gray-600 text-sm">/personne</span>
                      </div>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        Réserver
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

      {/* Benefits */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              Pourquoi Choisir Nos Formations ?
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                  <benefit.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              Témoignages
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border border-gray-200">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <blockquote className="text-gray-700 leading-relaxed italic">
                      "{testimonial.quote}"
                    </blockquote>
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.position}</div>
                    <div className="text-sm text-blue-600 font-medium">{testimonial.organization}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-light mb-4">
              Besoin d'une Formation Personnalisée ?
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Nous créons des programmes de formation sur mesure adaptés aux besoins 
              spécifiques de votre établissement.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button className="bg-white text-gray-900 hover:bg-gray-100">
                <Phone className="mr-2 h-5 w-5" />
                +212 522 86 03 66
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                <Mail className="mr-2 h-5 w-5" />
                formation@kitmed.ma
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}