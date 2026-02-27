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
  const t = useTranslations('support.training');

  const trainingPrograms = [
    {
      titleKey: "programs.ultrasound.title",
      descriptionKey: "programs.ultrasound.description",
      durationKey: "programs.ultrasound.duration",
      levelKey: "programs.ultrasound.level",
      participantsKey: "programs.ultrasound.participants",
      locationKey: "programs.ultrasound.location",
      price: "2,500 DH",
      categoryKey: "programs.ultrasound.category",
      icon: Camera,
      color: "blue",
      featureKeys: [
        "programs.ultrasound.features.0",
        "programs.ultrasound.features.1",
        "programs.ultrasound.features.2",
        "programs.ultrasound.features.3"
      ],
      nextSessions: ["15 Décembre 2024", "20 Janvier 2025", "25 Février 2025"]
    },
    {
      titleKey: "programs.cardio.title",
      descriptionKey: "programs.cardio.description",
      durationKey: "programs.cardio.duration",
      levelKey: "programs.cardio.level",
      participantsKey: "programs.cardio.participants",
      locationKey: "programs.cardio.location",
      price: "1,800 DH",
      categoryKey: "programs.cardio.category",
      icon: Heart,
      color: "red",
      featureKeys: [
        "programs.cardio.features.0",
        "programs.cardio.features.1",
        "programs.cardio.features.2",
        "programs.cardio.features.3"
      ],
      nextSessions: ["10 Décembre 2024", "15 Janvier 2025", "10 Mars 2025"]
    },
    {
      titleKey: "programs.monitoring.title",
      descriptionKey: "programs.monitoring.description",
      durationKey: "programs.monitoring.duration",
      levelKey: "programs.monitoring.level",
      participantsKey: "programs.monitoring.participants",
      locationKey: "programs.monitoring.location",
      price: "2,200 DH",
      categoryKey: "programs.monitoring.category",
      icon: Activity,
      color: "green",
      featureKeys: [
        "programs.monitoring.features.0",
        "programs.monitoring.features.1",
        "programs.monitoring.features.2",
        "programs.monitoring.features.3"
      ],
      nextSessions: ["5 Décembre 2024", "12 Janvier 2025", "18 Février 2025"]
    },
    {
      titleKey: "programs.laboratory.title",
      descriptionKey: "programs.laboratory.description",
      durationKey: "programs.laboratory.duration",
      levelKey: "programs.laboratory.level",
      participantsKey: "programs.laboratory.participants",
      locationKey: "programs.laboratory.location",
      price: "1,200 DH",
      categoryKey: "programs.laboratory.category",
      icon: Monitor,
      color: "purple",
      featureKeys: [
        "programs.laboratory.features.0",
        "programs.laboratory.features.1",
        "programs.laboratory.features.2",
        "programs.laboratory.features.3"
      ],
      nextSessions: ["8 Décembre 2024", "22 Janvier 2025", "5 Mars 2025"]
    }
  ];

  const trainingStats = [
    {
      number: "500+",
      labelKey: "stats.professionalsTrainedLabel",
      icon: Users
    },
    {
      number: "98%",
      labelKey: "stats.satisfactionRateLabel",
      icon: Star
    },
    {
      number: "24h",
      labelKey: "stats.postTrainingSupportLabel",
      icon: Clock
    },
    {
      number: "15+",
      labelKey: "stats.availableProgramsLabel",
      icon: GraduationCap
    }
  ];

  const testimonials = [
    {
      quoteKey: "testimonials.0.quote",
      author: "Dr. Amina Benali",
      positionKey: "testimonials.0.position",
      organization: "CHU Ibn Rochd"
    },
    {
      quoteKey: "testimonials.1.quote",
      author: "Hassan Tazi",
      positionKey: "testimonials.1.position",
      organization: "Clinique Al Madina"
    }
  ];

  const benefits = [
    {
      titleKey: "benefits.certified.title",
      descriptionKey: "benefits.certified.description",
      icon: CheckCircle
    },
    {
      titleKey: "benefits.experts.title",
      descriptionKey: "benefits.experts.description",
      icon: Users
    },
    {
      titleKey: "benefits.continuousSupport.title",
      descriptionKey: "benefits.continuousSupport.description",
      icon: Phone
    },
    {
      titleKey: "benefits.documentation.title",
      descriptionKey: "benefits.documentation.description",
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
              {t('hero.title')}
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
              {t('hero.description')}
            </p>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Calendar className="mr-2 h-5 w-5" />
              {t('hero.bookButton')}
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
                <div className="text-gray-600 text-sm">{t(stat.labelKey)}</div>
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
              {t('programsSection.title')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('programsSection.description')}
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
                      {t(program.categoryKey)}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-medium text-gray-900 mb-2">
                    {t(program.titleKey)}
                  </CardTitle>
                  <p className="text-gray-600 text-sm">{t(program.descriptionKey)}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Program Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {t(program.durationKey)}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        {t(program.participantsKey)}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="truncate">{t(program.locationKey)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Star className="h-4 w-4 mr-2" />
                        {t(program.levelKey)}
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">{t('programsSection.includedLabel')}</h4>
                      <ul className="space-y-1">
                        {program.featureKeys.map((featureKey, featureIndex) => (
                          <li key={featureIndex} className="flex items-start text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {t(featureKey)}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Next Sessions */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">{t('programsSection.nextSessionsLabel')}</h4>
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
                        <span className="text-gray-600 text-sm">{t('programsSection.perPerson')}</span>
                      </div>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        {t('programsSection.bookButton')}
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
              {t('benefitsSection.title')}
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                  <benefit.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t(benefit.titleKey)}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t(benefit.descriptionKey)}
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
              {t('testimonialsSection.title')}
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
                      "{t(testimonial.quoteKey)}"
                    </blockquote>
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{t(testimonial.positionKey)}</div>
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
              {t('cta.title')}
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              {t('cta.description')}
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
