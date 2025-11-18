'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Linkedin, Phone } from 'lucide-react';

export default function TeamPage() {
  const t = useTranslations('team');

  const teamMembers = [
    {
      name: "Dr. Hassan Benali",
      position: "Directeur Général",
      department: "Direction",
      experience: "25 ans d'expérience",
      email: "h.benali@kitmed.ma",
      phone: "+212 522 86 03 66",
      image: "/api/placeholder/300/300",
      specialization: "Gestion d'équipements médicaux"
    },
    {
      name: "Fatima Zohra Alami",
      position: "Directrice Commerciale",
      department: "Commercial",
      experience: "15 ans d'expérience",
      email: "f.alami@kitmed.ma",
      phone: "+212 522 86 03 67",
      image: "/api/placeholder/300/300",
      specialization: "Développement commercial"
    },
    {
      name: "Mohamed Tazi",
      position: "Responsable Technique",
      department: "Technique",
      experience: "20 ans d'expérience",
      email: "m.tazi@kitmed.ma",
      phone: "+212 522 86 03 68",
      image: "/api/placeholder/300/300",
      specialization: "Maintenance & SAV"
    },
    {
      name: "Aicha Berrada",
      position: "Responsable Qualité",
      department: "Qualité",
      experience: "12 ans d'expérience",
      email: "a.berrada@kitmed.ma",
      phone: "+212 522 86 03 69",
      image: "/api/placeholder/300/300",
      specialization: "Assurance qualité"
    },
    {
      name: "Youssef Kettani",
      position: "Ingénieur Biomédical",
      department: "Technique",
      experience: "10 ans d'expérience",
      email: "y.kettani@kitmed.ma",
      phone: "+212 522 86 03 70",
      image: "/api/placeholder/300/300",
      specialization: "Ingénierie biomédicale"
    },
    {
      name: "Khadija El Mansouri",
      position: "Responsable Export",
      department: "International",
      experience: "8 ans d'expérience",
      email: "export@kitmed.ma",
      phone: "+212 522 86 03 71",
      image: "/api/placeholder/300/300",
      specialization: "Commerce international"
    }
  ];

  const departments = [
    {
      name: "Direction",
      description: "Leadership stratégique et vision d'entreprise",
      count: 1
    },
    {
      name: "Commercial",
      description: "Développement des ventes et relations clients",
      count: 1
    },
    {
      name: "Technique",
      description: "Expertise technique et maintenance",
      count: 2
    },
    {
      name: "Qualité",
      description: "Assurance qualité et conformité",
      count: 1
    },
    {
      name: "International",
      description: "Développement export et partenariats",
      count: 1
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6 leading-tight">
              Notre Équipe
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Une équipe d'experts passionnés dédiée à fournir les meilleures solutions d'équipement médical au Maroc et en Afrique.
            </p>
          </div>
        </div>
      </section>

      {/* Department Overview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-light text-gray-900 mb-12 text-center">
              Nos Départements
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {departments.map((dept, index) => (
                <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {dept.name}
                      </h3>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                        {dept.count} {dept.count === 1 ? 'membre' : 'membres'}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {dept.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-light text-gray-900 mb-12 text-center">
              Rencontrez Notre Équipe
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((member, index) => (
                <Card key={index} className="border border-gray-200 hover:shadow-xl transition-shadow overflow-hidden">
                  <div className="aspect-square bg-gray-100">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-medium text-gray-900 mb-1">
                        {member.name}
                      </h3>
                      <p className="text-blue-600 font-medium text-sm mb-2">
                        {member.position}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {member.department}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {member.experience}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        {member.specialization}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        <a href={`mailto:${member.email}`} className="hover:text-blue-600 transition-colors">
                          {member.email}
                        </a>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        <a href={`tel:${member.phone}`} className="hover:text-blue-600 transition-colors">
                          {member.phone}
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-light text-gray-900 mb-12">
              Nos Valeurs
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Excellence</h3>
                <p className="text-gray-600 text-sm">
                  Nous visons l'excellence dans tout ce que nous faisons
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🤝</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Intégrité</h3>
                <p className="text-gray-600 text-sm">
                  L'honnêteté et la transparence guident nos actions
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💡</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Innovation</h3>
                <p className="text-gray-600 text-sm">
                  Nous innovons constamment pour mieux servir nos clients
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}