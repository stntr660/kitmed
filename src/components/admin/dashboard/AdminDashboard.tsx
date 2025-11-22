'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { 
  CubeIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  UsersIcon,
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { validateIconComponent } from '@/lib/component-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AdminDashboardStats } from '@/types/admin';
import { formatCurrency, formatDate } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  href?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

function StatCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon: Icon, 
  href,
  color = 'blue' 
}: StatCardProps) {
  const colorClasses = {
    blue: 'text-primary-600 bg-primary-50 ring-primary-200',
    green: 'text-green-600 bg-green-50 ring-green-200',
    yellow: 'text-amber-600 bg-amber-50 ring-amber-200',
    red: 'text-accent-600 bg-accent-50 ring-accent-200',
  };

  const cardContent = (
    <div className="group transition-all duration-500">
      <Card className="transition-all duration-500 border border-gray-200/60 bg-white overflow-hidden relative transform hover:-translate-y-1 hover:scale-105">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-8 relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div 
              className={`p-4 rounded-2xl ring-1 ${colorClasses[color]} transition-all duration-300 hover:scale-110 hover:rotate-2`}
            >
              <Icon className="h-8 w-8" />
            </div>
            {change !== undefined && (
              <div 
                className={`flex items-center space-x-2 px-3 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  change >= 0 
                    ? 'text-green-700 bg-green-50 ring-1 ring-green-200' 
                    : 'text-red-700 bg-red-50 ring-1 ring-red-200'
                }`}
              >
                <div className="transition-transform duration-200">
                  {change >= 0 ? (
                    <ArrowUpIcon className="h-4 w-4" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4" />
                  )}
                </div>
                <span>{Math.abs(change)}%</span>
              </div>
            )}
          </div>
          
          <div>
            <dt className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">
              {title}
            </dt>
            <dd className="text-3xl font-semibold text-gray-900 mb-2 font-poppins tracking-tight">
              {value}
            </dd>
            {changeLabel && (
              <dd className="text-sm text-gray-500 font-medium">
                {changeLabel}
              </dd>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
}

interface RecentActivity {
  id: string;
  type: 'rfp' | 'product' | 'partner' | 'user';
  title: string;
  description: string;
  time: string;
  status?: string;
  user?: string;
}

function RecentActivityCard({ activities }: { activities: RecentActivity[] }) {
  const t = useTranslations('dashboard');
  const getActivityIcon = (type: string) => {
    let IconComponent;
    
    switch (type) {
      case 'rfp':
        IconComponent = DocumentTextIcon;
        break;
      case 'product':
        IconComponent = CubeIcon;
        break;
      case 'partner':
        IconComponent = BuildingOfficeIcon;
        break;
      case 'user':
        IconComponent = UsersIcon;
        break;
      default:
        IconComponent = DocumentTextIcon;
        break;
    }
    
    return validateIconComponent(IconComponent, `ActivityIcon-${type}`);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'rfp':
        return 'text-amber-600 bg-amber-50 ring-amber-200';
      case 'product':
        return 'text-primary-600 bg-primary-50 ring-primary-200';
      case 'partner':
        return 'text-green-600 bg-green-50 ring-green-200';
      case 'user':
        return 'text-purple-600 bg-purple-50 ring-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 ring-gray-200';
    }
  };

  return (
    <Card className="border border-gray-200/60 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
          <div className="h-2 w-2 bg-primary-500 rounded-full mr-3"></div>
          {t('recentActivity')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const iconColorClass = getActivityTypeColor(activity.type);
            
            return (
              <div key={activity.id} className="group flex items-start space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200">
                <div className="flex-shrink-0">
                  <div className={`p-2 rounded-lg ring-1 ${iconColorClass} group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {activity.title}
                    </h4>
                    {activity.status && (
                      <Badge 
                        variant={getStatusColor(activity.status) as any}
                        className="text-xs"
                      >
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 font-medium">
                      {activity.time}
                    </p>
                    {activity.user && (
                      <p className="text-xs text-gray-500">
                        by <span className="font-medium">{activity.user}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Button 
            variant="outline" 
            className="w-full h-12 font-semibold hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300 transition-all duration-200"
          >
            {t('viewAllActivity')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboard() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, activityResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/admin/dashboard/activity', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('welcomeBack')}
          </p>
        </div>
        <LoadingSpinner size="lg" text={t('loading')} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('title')}</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={loadDashboardData} 
              className="mt-4"
              variant="outline"
            >
              {t('retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock data if API not available
  const mockStats: AdminDashboardStats = stats || {
    products: { total: 156, active: 142, featured: 12, recentlyAdded: 8 },
    rfpRequests: { total: 89, pending: 23, processing: 15, completed: 51 },
    partners: { total: 34, active: 31, featured: 8 },
    categories: { total: 12, active: 11, withProducts: 10 },
  };

  const mockActivity: RecentActivity[] = recentActivity.length > 0 ? recentActivity : [
    {
      id: '1',
      type: 'rfp',
      title: t('newRfpRequest'),
      description: 'RFP-2024-0034 submitted by Regional Hospital',
      time: '2 minutes ago',
      status: 'pending',
      user: 'System',
    },
    {
      id: '2',
      type: 'product',
      title: t('productUpdated'),
      description: 'Digital Ophthalmoscope specifications updated',
      time: '15 minutes ago',
      status: 'completed',
      user: 'John Smith',
    },
    {
      id: '3',
      type: 'partner',
      title: t('newPartnerAdded'),
      description: 'MedTech Solutions registered as new partner',
      time: '1 hour ago',
      status: 'completed',
      user: 'Sarah Johnson',
    },
    {
      id: '4',
      type: 'user',
      title: t('userLogin'),
      description: 'Admin user logged in from new device',
      time: '2 hours ago',
      user: 'Mike Davis',
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 -mx-10 px-10 py-12 rounded-3xl animate-in slide-in-from-top duration-600">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full transform translate-x-48 -translate-y-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full transform -translate-x-32 translate-y-32" />
        
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-2xl font-medium text-white mb-4 font-poppins tracking-tight animate-in slide-in-from-bottom duration-600 delay-200">
            {t('welcomeBackKitmed')}
          </h1>
          <p className="text-xl text-white/90 leading-relaxed max-w-2xl animate-in slide-in-from-bottom duration-600 delay-300">
            {t('welcomeSubtitle')}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: t('totalProducts'),
            value: mockStats.products.total,
            change: 5.4,
            changeLabel: t('fromLastMonth'),
            icon: CubeIcon,
            href: "/en/admin/products",
            color: "blue" as const
          },
          {
            title: t('pendingRfps'),
            value: mockStats.rfpRequests.pending,
            change: -2.1,
            changeLabel: t('fromLastWeek'),
            icon: DocumentTextIcon,
            href: "/en/admin/rfp-requests?status=pending",
            color: "yellow" as const
          },
          {
            title: t('activePartners'),
            value: mockStats.partners.active,
            change: 12.3,
            changeLabel: t('fromLastMonth'),
            icon: BuildingOfficeIcon,
            href: "/en/admin/partners",
            color: "green" as const
          },
          {
            title: t('featuredProducts'),
            value: mockStats.products.featured,
            icon: EyeIcon,
            href: "/en/admin/products?featured=true",
            color: "red" as const
          }
        ].map((stat, index) => (
          <div
            key={stat.title}
            className={`animate-in slide-in-from-bottom duration-500`}
            style={{ animationDelay: `${100 + index * 100}ms` }}
          >
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="animate-in slide-in-from-bottom duration-500 delay-600">
        <Card className="border border-gray-200/60 bg-white overflow-hidden">
          <CardHeader className="pb-6 bg-gray-50/30">
            <CardTitle className="text-2xl font-medium text-gray-900 flex items-center font-poppins">
              <div className="h-3 w-3 bg-primary-500 rounded-full mr-4 animate-pulse" />
              {t('quickActions')}
            </CardTitle>
            <p className="text-gray-600 mt-2">{t('quickActionsSubtitle')}</p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title: t('addProduct'),
                  icon: CubeIcon,
                  color: "primary",
                  description: t('addProductDesc')
                },
                {
                  title: t('addPartner'),
                  icon: BuildingOfficeIcon,
                  color: "green",
                  description: t('addPartnerDesc')
                },
                {
                  title: t('viewAnalytics'),
                  icon: ChartBarIcon,
                  color: "purple",
                  description: t('viewAnalyticsDesc')
                },
                {
                  title: t('manageUsers'),
                  icon: UsersIcon,
                  color: "amber",
                  description: t('manageUsersDesc')
                }
              ].map((action, index) => (
                <div
                  key={action.title}
                  className="animate-in slide-in-from-bottom duration-300 hover:-translate-y-1 transition-transform"
                  style={{ animationDelay: `${700 + index * 100}ms` }}
                >
                  <Button 
                    variant="outline" 
                    className={`h-32 w-full flex-col space-y-3 group border-2 transition-all duration-300 rounded-2xl p-6 ${
                      action.color === 'primary' ? 'hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700' :
                      action.color === 'green' ? 'hover:bg-green-50 hover:border-green-300 hover:text-green-700' :
                      action.color === 'purple' ? 'hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700' :
                      'hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700'
                    }`}
                  >
                    <div 
                      className={`p-3 rounded-2xl transition-all duration-300 hover:scale-110 hover:rotate-2 ${
                        action.color === 'primary' ? 'bg-primary-50 group-hover:bg-primary-100' :
                        action.color === 'green' ? 'bg-green-50 group-hover:bg-green-100' :
                        action.color === 'purple' ? 'bg-purple-50 group-hover:bg-purple-100' :
                        'bg-amber-50 group-hover:bg-amber-100'
                      }`}
                    >
                      <action.icon className={`h-7 w-7 ${
                        action.color === 'primary' ? 'text-primary-600' :
                        action.color === 'green' ? 'text-green-600' :
                        action.color === 'purple' ? 'text-purple-600' :
                        'text-amber-600'
                      }`} />
                    </div>
                    <div className="text-center">
                      <span className="font-semibold text-base block">{action.title}</span>
                      <span className="text-xs text-gray-500 mt-1 block">{action.description}</span>
                    </div>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <RecentActivityCard activities={mockActivity} />

        {/* System Overview */}
        <Card className="border border-gray-200/60 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
              <div className="h-2 w-2 bg-primary-500 rounded-full mr-3"></div>
              {t('systemOverview')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3 bg-primary-50/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-gray-600">{t('activeProducts')}</span>
                </div>
                <span className="font-semibold text-lg text-primary-600">{mockStats.products.active}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-gray-600">{t('processingRfps')}</span>
                </div>
                <span className="font-semibold text-lg text-amber-600">{mockStats.rfpRequests.processing}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-gray-600">{t('featuredPartners')}</span>
                </div>
                <span className="font-semibold text-lg text-green-600">{mockStats.partners.featured}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-gray-600">{t('categoriesWithProducts')}</span>
                </div>
                <span className="font-semibold text-lg text-purple-600">{mockStats.categories.withProducts}</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                className="w-full h-12 font-semibold hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300 transition-all duration-200"
              >
                {t('viewDetailedAnalytics')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}