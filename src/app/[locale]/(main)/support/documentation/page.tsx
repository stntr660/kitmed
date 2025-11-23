'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Download, 
  FileText, 
  Video, 
  Image, 
  Wrench,
  Book,
  Monitor,
  Heart,
  Camera,
  ArrowRight,
  ExternalLink,
  Filter
} from 'lucide-react';
import { useState } from 'react';

export default function DocumentationPage() {
  const t = useTranslations('documentation');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const documentCategories = [
    { id: 'all', name: 'Tous les documents', count: 45, icon: FileText },
    { id: 'user-manuals', name: 'Manuels d\'utilisation', count: 18, icon: Book },
    { id: 'technical', name: 'Documentation technique', count: 12, icon: Wrench },
    { id: 'installation', name: 'Guides d\'installation', count: 8, icon: Monitor },
    { id: 'maintenance', name: 'Maintenance', count: 7, icon: Heart }
  ];

  const featuredDocuments = [
    {
      title: "Manuel d'Utilisation - Échographe Portable",
      description: "Guide complet d'utilisation pour échographe portable haute résolution",
      type: "Manuel utilisateur",
      category: "user-manuals",
      format: "PDF",
      size: "15.2 MB",
      language: "Français",
      version: "v2.3",
      downloadUrl: "#",
      icon: FileText,
      color: "blue"
    },
    {
      title: "Installation - Système de Monitoring",
      description: "Procédure d'installation et configuration du système de monitoring",
      type: "Guide d'installation",
      category: "installation",
      format: "PDF",
      size: "8.7 MB",
      language: "Français/Anglais",
      version: "v1.8",
      downloadUrl: "#",
      icon: Monitor,
      color: "green"
    },
    {
      title: "Maintenance Préventive - Équipement Cardio",
      description: "Protocoles de maintenance pour équipements cardiovasculaires",
      type: "Manuel maintenance",
      category: "maintenance",
      format: "PDF",
      size: "12.4 MB",
      language: "Français",
      version: "v3.1",
      downloadUrl: "#",
      icon: Heart,
      color: "red"
    },
    {
      title: "Spécifications Techniques - Imagerie Médicale",
      description: "Spécifications complètes pour équipements d'imagerie médicale",
      type: "Documentation technique",
      category: "technical",
      format: "PDF",
      size: "22.1 MB",
      language: "Français/Anglais",
      version: "v4.0",
      downloadUrl: "#",
      icon: Camera,
      color: "purple"
    }
  ];

  const quickLinks = [
    {
      title: "Certificats CE",
      description: "Tous les certificats de conformité européenne",
      icon: FileText,
      link: "#"
    },
    {
      title: "Fiches de Sécurité",
      description: "Fiches de données de sécurité pour tous les produits",
      icon: FileText,
      link: "#"
    },
    {
      title: "Formations Vidéo",
      description: "Bibliothèque de vidéos de formation",
      icon: Video,
      link: "#"
    },
    {
      title: "Support Technique",
      description: "Accès direct au support technique",
      icon: Wrench,
      link: "#"
    }
  ];

  const filteredDocuments = featuredDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-16 lg:py-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6 leading-tight">
              Documentation Technique
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
              Accédez à toute la documentation technique de nos équipements médicaux : 
              manuels d'utilisation, guides d'installation, protocoles de maintenance et plus encore.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Rechercher dans la documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <Card className="border border-gray-200 sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Catégories
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {documentCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                        selectedCategory === category.id ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <category.icon className="h-4 w-4 mr-3" />
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {category.productCount || 0}
                      </Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="border border-gray-200 mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Accès Rapide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.link}
                    className="block p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-start space-x-3">
                      <link.icon className="h-5 w-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900 group-hover:text-blue-600 text-sm">
                          {link.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {link.description}
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-light text-gray-900">
                  {selectedCategory === 'all' ? 'Tous les documents' : 
                   documentCategories.find(c => c.id === selectedCategory)?.name}
                </h2>
                <p className="text-gray-600 mt-1">
                  {filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''} trouvé{filteredDocuments.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Documents Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {filteredDocuments.map((doc, index) => (
                <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${doc.color}-50`}>
                        <doc.icon className={`h-6 w-6 text-${doc.color}-600`} />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {doc.format}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">{doc.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{doc.description}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Type</span>
                          <span>{doc.type}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Taille</span>
                          <span>{doc.size}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Langue</span>
                          <span>{doc.language}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Version</span>
                          <span>{doc.version}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 pt-2">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </Button>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredDocuments.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun document trouvé</h3>
                <p className="text-gray-600 mb-4">
                  Essayez de modifier vos critères de recherche ou contactez notre support.
                </p>
                <Button variant="outline">
                  Contacter le Support
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Support Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              Besoin d'Aide Supplémentaire ?
            </h2>
            <p className="text-gray-600 mb-8">
              Notre équipe technique est disponible pour vous accompagner dans l'utilisation de nos équipements.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                Contacter le Support
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline">
                Demander une Formation
                <Video className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}