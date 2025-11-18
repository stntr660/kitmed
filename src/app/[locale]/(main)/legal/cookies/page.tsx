'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Cookie,
  Settings,
  BarChart3,
  Shield,
  Eye,
  Clock,
  CheckCircle,
  X,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { useState } from 'react';

export default function CookiesPage() {
  const t = useTranslations('cookies');
  
  const [cookieSettings, setCookieSettings] = useState({
    necessary: true, // Always enabled
    analytics: true,
    marketing: false,
    preferences: true
  });

  const cookieCategories = [
    {
      id: 'necessary',
      title: 'Cookies Nécessaires',
      description: 'Ces cookies sont essentiels au fonctionnement du site et ne peuvent pas être désactivés.',
      icon: Shield,
      color: 'green',
      required: true,
      examples: [
        'Session utilisateur',
        'Préférences de langue',
        'Panier d\'achat',
        'Authentification'
      ],
      duration: 'Session ou 1 an',
      cookies: [
        { name: 'session_id', purpose: 'Maintient votre session active', duration: 'Session' },
        { name: 'csrf_token', purpose: 'Protection contre les attaques CSRF', duration: '2 heures' },
        { name: 'locale', purpose: 'Mémorisation de votre langue', duration: '1 an' }
      ]
    },
    {
      id: 'analytics',
      title: 'Cookies Analytiques',
      description: 'Ces cookies nous aident à comprendre comment les visiteurs interagissent avec notre site.',
      icon: BarChart3,
      color: 'blue',
      required: false,
      examples: [
        'Pages visitées',
        'Temps passé sur le site',
        'Source du trafic',
        'Erreurs rencontrées'
      ],
      duration: '2 ans maximum',
      cookies: [
        { name: '_ga', purpose: 'Google Analytics - Identificateur unique', duration: '2 ans' },
        { name: '_gid', purpose: 'Google Analytics - Identificateur de session', duration: '24 heures' },
        { name: '_gat', purpose: 'Google Analytics - Limitation du taux de requête', duration: '1 minute' }
      ]
    },
    {
      id: 'marketing',
      title: 'Cookies Marketing',
      description: 'Ces cookies permettent de personnaliser la publicité en fonction de vos intérêts.',
      icon: Eye,
      color: 'purple',
      required: false,
      examples: [
        'Publicités ciblées',
        'Retargeting',
        'Mesure de conversion',
        'Réseaux sociaux'
      ],
      duration: '1 an maximum',
      cookies: [
        { name: '_fbp', purpose: 'Facebook Pixel - Suivi des conversions', duration: '90 jours' },
        { name: 'linkedin_analytics', purpose: 'LinkedIn - Analyse audience', duration: '1 an' }
      ]
    },
    {
      id: 'preferences',
      title: 'Cookies de Préférences',
      description: 'Ces cookies mémorisent vos choix et préférences pour personnaliser votre expérience.',
      icon: Settings,
      color: 'orange',
      required: false,
      examples: [
        'Préférences d\'affichage',
        'Filtres de recherche',
        'Produits favoris',
        'Paramètres de notification'
      ],
      duration: '1 an',
      cookies: [
        { name: 'display_preferences', purpose: 'Mémorisation des préférences d\'affichage', duration: '1 an' },
        { name: 'search_filters', purpose: 'Sauvegarde des filtres de recherche', duration: '6 mois' }
      ]
    }
  ];

  const handleToggle = (category: string) => {
    if (category === 'necessary') return; // Cannot disable necessary cookies
    
    setCookieSettings(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const acceptAll = () => {
    setCookieSettings({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    });
  };

  const rejectAll = () => {
    setCookieSettings({
      necessary: true, // Always required
      analytics: false,
      marketing: false,
      preferences: false
    });
  };

  const saveSettings = () => {
    // Here you would save the settings to localStorage and update actual cookies
    console.log('Cookie settings saved:', cookieSettings);
    alert('Vos préférences de cookies ont été enregistrées.');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-16 lg:py-20 bg-gradient-to-br from-orange-50 to-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
              <Cookie className="h-10 w-10 text-orange-600" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6 leading-tight">
              Politique des Cookies
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
              Cette page explique comment KITMED utilise les cookies et technologies similaires 
              pour améliorer votre expérience sur notre plateforme.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Dernière mise à jour : 15 novembre 2024</span>
            </div>
          </div>
        </div>
      </section>

      {/* What are Cookies */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-gray-900 mb-4">
                Qu'est-ce qu'un Cookie ?
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border border-gray-200">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
                      <Cookie className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-4 text-center">
                    Définition
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Un cookie est un petit fichier texte stocké sur votre ordinateur ou 
                    appareil mobile lorsque vous visitez un site web. Il permet au site 
                    de mémoriser vos actions et préférences pendant un certain temps.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto bg-green-50 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-4 text-center">
                    Utilité
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Les cookies améliorent votre expérience en mémorisant vos préférences, 
                    en sécurisant votre session, et en nous aidant à analyser l'utilisation 
                    du site pour l'améliorer continuellement.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Cookie Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-gray-900 mb-4">
                Types de Cookies Utilisés
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Nous utilisons différents types de cookies selon leur fonction et leur finalité
              </p>
            </div>

            <div className="space-y-8">
              {cookieCategories.map((category) => (
                <Card key={category.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-12 h-12 rounded-lg bg-${category.color}-50 flex items-center justify-center mr-4`}>
                          <category.icon className={`h-6 w-6 text-${category.color}-600`} />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-medium text-gray-900 flex items-center">
                            {category.title}
                            {category.required && (
                              <Badge variant="secondary" className="ml-2 bg-red-50 text-red-700">
                                Obligatoire
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-gray-600 text-sm mt-1">{category.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {cookieSettings[category.id as keyof typeof cookieSettings] ? 'Activé' : 'Désactivé'}
                        </span>
                        <button
                          onClick={() => handleToggle(category.id)}
                          disabled={category.required}
                          className={`${category.required ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                          {cookieSettings[category.id as keyof typeof cookieSettings] ? (
                            <ToggleRight className="h-8 w-8 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-8 w-8 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Utilisés pour :</h4>
                        <ul className="space-y-2">
                          {category.examples.map((example, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-600">
                              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                              {example}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 text-sm">
                          <span className="font-medium text-gray-900">Durée : </span>
                          <span className="text-gray-600">{category.duration}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Cookies spécifiques :</h4>
                        <div className="space-y-3">
                          {category.cookies.map((cookie, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <code className="text-sm font-mono text-gray-900">{cookie.name}</code>
                                <span className="text-xs text-gray-500">{cookie.duration}</span>
                              </div>
                              <p className="text-xs text-gray-600">{cookie.purpose}</p>
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
        </div>
      </section>

      {/* Cookie Settings */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-2xl font-light text-gray-900 flex items-center">
                  <Settings className="h-6 w-6 mr-3 text-blue-600" />
                  Gérer vos Préférences de Cookies
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Vous pouvez à tout moment modifier vos préférences concernant l'utilisation des cookies. 
                  Notez que la désactivation de certains cookies peut affecter le fonctionnement du site.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={acceptAll} className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accepter Tous les Cookies
                  </Button>
                  
                  <Button onClick={rejectAll} variant="outline" className="border-gray-300">
                    <X className="mr-2 h-4 w-4" />
                    Refuser les Cookies Optionnels
                  </Button>
                  
                  <Button onClick={saveSettings} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Settings className="mr-2 h-4 w-4" />
                    Sauvegarder mes Préférences
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Browser Settings */}
            <Card className="border border-gray-200 mt-8">
              <CardHeader>
                <CardTitle className="text-xl font-medium text-gray-900 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-3 text-orange-600" />
                  Paramètres du Navigateur
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">
                  Vous pouvez également gérer les cookies directement depuis les paramètres de votre navigateur :
                </p>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Blocage des cookies</h4>
                    <p className="text-sm text-gray-600">
                      Configurez votre navigateur pour bloquer tous les cookies ou seulement les cookies tiers.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Suppression des cookies</h4>
                    <p className="text-sm text-gray-600">
                      Supprimez les cookies existants depuis l'historique de navigation de votre navigateur.
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Important</h4>
                      <p className="text-yellow-700 text-sm mt-1">
                        La désactivation des cookies peut affecter votre expérience sur notre site et 
                        certaines fonctionnalités peuvent ne plus être disponibles.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-light mb-6">
              Questions sur les Cookies ?
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Si vous avez des questions concernant notre utilisation des cookies, 
              n'hésitez pas à nous contacter.
            </p>
            
            <Button className="bg-white text-gray-900 hover:bg-gray-100">
              privacy@kitmed.ma
            </Button>
            
            <div className="mt-8 pt-8 border-t border-gray-700">
              <p className="text-gray-400 text-sm">
                Cette politique des cookies fait partie intégrante de notre politique de confidentialité.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}