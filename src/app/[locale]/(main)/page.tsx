'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Award, Users, Globe, Star } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');

  return (
    <div className="flex flex-col">
      {/* Luxury Hero Section */}
      <section className="relative min-h-[90vh] bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative container mx-auto px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-center mb-8">
              <Badge className="px-6 py-3 text-sm font-semibold bg-primary-500 text-white border-0 shadow-xl">
                🏥 Plateforme Médicale Premium KITMED
              </Badge>
            </div>
            
            <h1 className="text-center mb-8">
              <span className="block text-5xl lg:text-7xl font-extrabold text-white leading-tight">
                Équipements Médicaux
              </span>
              <span className="block text-4xl lg:text-6xl font-bold text-primary-300 mt-2">
                d&apos;Exception
              </span>
            </h1>
            
            <p className="text-center text-xl lg:text-2xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Découvrez une sélection exclusive d&apos;équipements médicaux de pointe. 
              Technologies avancées, qualité premium et support expert pour transformer votre pratique médicale.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
              <Button size="lg" className="min-w-[240px] h-14 text-lg font-semibold bg-primary-600 hover:bg-primary-700 shadow-2xl transition-all duration-300" asChild>
                <Link href="/products" className="flex items-center">
                  Explorer le Catalogue
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              {[
                { number: '500+', label: 'Établissements Équipés' },
                { number: '2000+', label: 'Produits Premium' },
                { number: '50+', label: 'Marques Partenaires' },
                { number: '24/7', label: 'Support Technique' }
              ].map((stat, index) => (
                <div key={index} className="group">
                  <div className="text-3xl lg:text-4xl font-bold text-white mb-2 group-hover:text-primary-300 transition-colors">
                    {stat.number}
                  </div>
                  <div className="text-slate-400 font-medium text-sm lg:text-base">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-slate-50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <Badge className="mb-6 px-4 py-2 bg-primary-100 text-primary-800 border-primary-200">
              Excellence & Innovation
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Pourquoi Choisir
              <span className="text-primary-600"> KITMED</span>?
            </h2>
            <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
              Nous redéfinissons l&apos;excellence en équipements médicaux avec des solutions innovantes, 
              une qualité incomparable et un support technique de classe mondiale.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Shield,
                title: 'Qualité Médicale Premium',
                description: 'Équipements certifiés aux plus hauts standards médicaux internationaux',
                color: 'text-primary-600',
                bgColor: 'bg-primary-50'
              },
              {
                icon: Award,
                title: 'Excellence Reconnue',
                description: 'Partenaires certifiés et équipements primés par les professionnels',
                color: 'text-amber-600',
                bgColor: 'bg-amber-50'
              },
              {
                icon: Users,
                title: 'Support Expert 24/7',
                description: 'Assistance technique spécialisée par des experts médicaux',
                color: 'text-emerald-600',
                bgColor: 'bg-emerald-50'
              },
              {
                icon: Globe,
                title: 'Réseau Mondial',
                description: 'Accès aux meilleures technologies médicales du monde entier',
                color: 'text-violet-600',
                bgColor: 'bg-violet-50'
              }
            ].map((feature, index) => (
              <div key={index} className="group relative">
                <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="text-center pb-4">
                    <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${feature.bgColor} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900 mb-3">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-slate-600 leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 lg:py-32 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-800/20"></div>
        
        <div className="relative container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <Badge className="mb-6 px-4 py-2 bg-white/10 text-white border-white/20 backdrop-blur-sm">
              Spécialités Médicales
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Catégories
              <span className="text-primary-300"> Premium</span>
            </h2>
            <p className="text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
              Équipements spécialisés pour chaque domaine médical, sélectionnés pour leur innovation et leur fiabilité exceptionnelles.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: 'Cardiologie',
                count: '150+ produits',
                color: '#1C75BC',
                description: 'Équipements cardiovasculaires de pointe',
                featured: true
              },
              {
                name: 'Radiologie',
                count: '200+ produits',
                color: '#ED1C24',
                description: 'Imagerie médicale haute définition'
              },
              {
                name: 'Chirurgie',
                count: '300+ produits',
                color: '#2563EB',
                description: 'Instruments chirurgicaux précis',
                featured: true
              },
              {
                name: 'Laboratoire',
                count: '180+ produits',
                color: '#059669',
                description: 'Analyses et diagnostics avancés'
              },
              {
                name: 'Urgences',
                count: '120+ produits',
                color: '#DC2626',
                description: 'Solutions d\'urgence et réanimation'
              },
              {
                name: 'Soins Intensifs',
                count: '90+ produits',
                color: '#7C3AED',
                description: 'Technologies de soins critiques'
              }
            ].map((category, index) => (
              <div key={index} className="group relative">
                <Card className="h-full border-0 bg-white/5 backdrop-blur-lg hover:bg-white/10 transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 shadow-2xl overflow-hidden">
                  <div className="relative h-48 bg-slate-700 overflow-hidden">
                    <div className="absolute inset-0 bg-black/30"></div>
                    <div 
                      className="absolute top-4 right-4 w-3 h-3 rounded-full shadow-lg"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    {category.featured && (
                      <Badge className="absolute top-4 left-4 px-3 py-1 bg-accent-500 text-white border-0 text-xs font-semibold">
                        Vedette
                      </Badge>
                    )}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="text-xs text-slate-300 mb-1">{category.count}</div>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-white group-hover:text-primary-300 transition-colors">
                      {category.name}
                    </CardTitle>
                    <CardDescription className="text-slate-300 leading-relaxed">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-primary-300 hover:text-white hover:bg-primary-600/20 border border-primary-400/30 hover:border-primary-400 transition-all"
                      asChild
                    >
                      <Link href={`/products/category/${category.name.toLowerCase()}`} className="flex items-center justify-center">
                        Explorer
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Button size="lg" variant="outline" className="min-w-[200px] h-12 border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300" asChild>
              <Link href="/products/categories" className="flex items-center">
                Voir Toutes les Catégories
                <ArrowRight className="ml-3 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <Badge className="mb-6 px-4 py-2 bg-primary-100 text-primary-800 border-primary-200">
              Confiance & Excellence
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              La Confiance des
              <span className="text-primary-600"> Professionnels</span>
            </h2>
            <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
              Des milliers de professionnels de santé nous font confiance pour équiper leurs établissements avec les meilleures technologies médicales.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
            {[
              {
                quote: "KITMED nous a fourni des équipements exceptionnels qui ont transformé notre service de cardiologie. La qualité et le support sont incomparables.",
                author: "Dr. Amina Benali",
                title: "Chef du Service Cardiologie",
                hospital: "Hôpital Universitaire Mohammed VI"
              },
              {
                quote: "L’expertise technique et l’accompagnement personnalisé de KITMED font la différence. Nos patients bénéficient directement de ces technologies avancées.",
                author: "Prof. Hassan El Malki",
                title: "Directeur Médical",
                hospital: "Clinique Atlas Médical"
              },
              {
                quote: "Une collaboration exceptionnelle depuis 5 ans. KITMED comprend parfaitement les besoins spécifiques de notre laboratoire d’analyses.",
                author: "Dr. Fatima Zahra",
                title: "Responsable Laboratoire",
                hospital: "Centre de Diagnostic Avancé"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <CardContent className="p-8">
                  <div className="mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400 inline mr-1" />
                    ))}
                  </div>
                  <blockquote className="text-slate-700 mb-6 leading-relaxed text-lg italic">
                    “{testimonial.quote}”
                  </blockquote>
                  <div className="border-t border-slate-100 pt-6">
                    <div className="font-bold text-slate-900 text-lg">{testimonial.author}</div>
                    <div className="text-sm text-slate-600 font-medium">{testimonial.title}</div>
                    <div className="text-sm text-primary-600 font-semibold">{testimonial.hospital}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center border-t border-slate-200 pt-16">
            {[
              { number: "500+", label: "Installations Réussies" },
              { number: "98%", label: "Satisfaction Client" },
              { number: "50+", label: "Partenaires Certifiés" },
              { number: "24/7", label: "Support Technique" }
            ].map((stat, index) => (
              <div key={index} className="group">
                <div className="text-4xl lg:text-5xl font-bold text-slate-900 mb-3 group-hover:text-primary-600 transition-colors">{stat.number}</div>
                <div className="text-slate-600 font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-primary-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-48 -translate-y-48"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-48 translate-y-48"></div>
        </div>
        
        <div className="relative container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Prêt à Transformer Votre
              <span className="text-primary-200"> Pratique Médicale</span>?
            </h2>
            <p className="text-xl text-primary-100 mb-12 leading-relaxed max-w-3xl mx-auto">
              Démarrez votre demande de proposition personnalisée dès aujourd&apos;hui et recevez 
              des recommandations expertes adaptées à vos besoins spécifiques.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button size="lg" variant="secondary" className="min-w-[240px] h-14 text-lg font-semibold bg-white text-primary-600 hover:bg-primary-50 shadow-2xl transition-all duration-300 transform hover:scale-105" asChild>
                <Link href="/rfp/new" className="flex items-center">
                  Démarrer une Demande RFP
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
              
              <Button size="lg" variant="outline" className="min-w-[240px] h-14 text-lg font-semibold border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300" asChild>
                <Link href="/partners" className="flex items-center">
                  Nos Partenaires Premium
                  <Users className="ml-3 h-6 w-6" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}