'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChartBarIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  ClockIcon,
  DocumentTextIcon,
  MapPinIcon,
  UsersIcon,
  TrophyIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  FunnelIcon,
  HeartIcon,
  BanknotesIcon,
  CubeIcon,
  BuildingOfficeIcon,
  PlayIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowTrendingUpIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatDate, formatCurrency } from '@/lib/utils';

// Mock data interfaces
interface AnalyticsKPIs {
  totalViews: number;
  uniqueVisitors: number;
  conversionRate: number;
  avgSessionTime: number;
  rfpSuccess: number;
  topProducts: Array<{
    id: string;
    name: string;
    views: number;
    change: number;
    category: string;
  }>;
  revenue?: number;
  activeRFPs: number;
}

interface TrendData {
  period: string;
  views: number;
  rfps: number;
  conversions: number;
  visitors: number;
  revenue?: number;
  timestamp: string;
}

interface GeographicData {
  region: string;
  visitors: number;
  rfps: number;
  conversionRate: number;
  coordinates?: [number, number];
}

interface CategoryPerformance {
  name: string;
  performance: number;
  growth: number;
  products: number;
  totalViews: number;
  rfpCount: number;
}

interface AnalyticsData {
  kpis: AnalyticsKPIs;
  trends: TrendData[];
  geographic: GeographicData[];
  categories: CategoryPerformance[];
  realtimeData: {
    activeUsers: number;
    pageViews: number;
    activeRFPs: number;
    recentActions: Array<{
      id: string;
      type: 'view' | 'rfp' | 'download' | 'contact';
      product?: string;
      user?: string;
      timestamp: string;
      location?: string;
    }>;
  };
}

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}

function KPICard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon: Icon, 
  color = 'blue',
  trend,
  loading = false
}: KPICardProps) {
  const colorClasses = {
    blue: 'text-primary-600 bg-primary-50 ring-primary-200',
    green: 'text-green-600 bg-green-50 ring-green-200',
    yellow: 'text-amber-600 bg-amber-50 ring-amber-200',
    red: 'text-red-600 bg-red-50 ring-red-200',
    purple: 'text-purple-600 bg-purple-50 ring-purple-200',
  };

  if (loading) {
    return (
      <Card className="border border-gray-200/60">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className={`h-12 w-12 rounded-2xl ${colorClasses[color]}`}></div>
              <div className="h-8 w-16 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200/60 hover:shadow-md transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className={`p-3 rounded-2xl ring-1 ${colorClasses[color]} transition-transform group-hover:scale-110`}>
            <Icon className="h-6 w-6" />
          </div>
          {change !== undefined && (
            <div 
              className={`flex items-center space-x-1 px-3 py-1 rounded-xl text-xs font-semibold ${
                change >= 0 
                  ? 'text-green-700 bg-green-50 ring-1 ring-green-200' 
                  : 'text-red-700 bg-red-50 ring-1 ring-red-200'
              }`}
            >
              {change >= 0 ? (
                <ArrowUpIcon className="h-3 w-3" />
              ) : (
                <ArrowDownIcon className="h-3 w-3" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        
        <div>
          <dt className="text-sm font-medium text-gray-600 mb-2 uppercase tracking-wider">
            {title}
          </dt>
          <dd className="text-2xl font-bold text-gray-900 mb-1 font-poppins">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </dd>
          {changeLabel && (
            <dd className="text-xs text-gray-500 font-medium">
              {changeLabel}
            </dd>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface FilterState {
  dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year';
  categories: string[];
  regions: string[];
  customerType: 'all' | 'hospital' | 'clinic' | 'lab';
}

export function AnalyticsDashboard() {
  const t = useTranslations('admin.analytics');
  const tCommon = useTranslations('common');
  
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'month',
    categories: [],
    regions: [],
    customerType: 'all',
  });

  // Mock data for demonstration
  const mockAnalyticsData: AnalyticsData = useMemo(() => ({
    kpis: {
      totalViews: 45672,
      uniqueVisitors: 12845,
      conversionRate: 3.8,
      avgSessionTime: 267,
      rfpSuccess: 78.5,
      revenue: 2350000,
      activeRFPs: 34,
      topProducts: [
        { id: '1', name: 'Digital Ophthalmoscope Pro', views: 2847, change: 12.5, category: 'Ophthalmology' },
        { id: '2', name: 'Cardiac Monitor Elite', views: 2156, change: -3.2, category: 'Cardiology' },
        { id: '3', name: 'MRI Scanner 3T', views: 1893, change: 8.7, category: 'Radiology' },
        { id: '4', name: 'Ventilator Advanced', views: 1654, change: 15.3, category: 'Critical Care' },
        { id: '5', name: 'Ultrasound System', views: 1298, change: 5.9, category: 'Radiology' },
      ]
    },
    trends: Array.from({ length: 30 }, (_, i) => ({
      period: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      views: Math.floor(Math.random() * 2000) + 1000,
      rfps: Math.floor(Math.random() * 50) + 10,
      conversions: Math.floor(Math.random() * 20) + 5,
      visitors: Math.floor(Math.random() * 800) + 200,
      revenue: Math.floor(Math.random() * 100000) + 50000,
      timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
    })),
    geographic: [
      { region: 'Casablanca-Settat', visitors: 3845, rfps: 89, conversionRate: 4.2 },
      { region: 'Rabat-Salé-Kénitra', visitors: 2967, rfps: 67, conversionRate: 3.8 },
      { region: 'Marrakech-Safi', visitors: 2134, rfps: 45, conversionRate: 3.1 },
      { region: 'Tanger-Tétouan-Al Hoceïma', visitors: 1876, rfps: 38, conversionRate: 2.9 },
      { region: 'Fès-Meknès', visitors: 1542, rfps: 32, conversionRate: 2.7 },
    ],
    categories: [
      { name: 'Cardiology', performance: 95, growth: 12.5, products: 45, totalViews: 8934, rfpCount: 23 },
      { name: 'Radiology', performance: 88, growth: 8.7, products: 38, totalViews: 7632, rfpCount: 19 },
      { name: 'Critical Care', performance: 92, growth: 15.3, products: 29, totalViews: 6845, rfpCount: 17 },
      { name: 'Ophthalmology', performance: 89, growth: 6.4, products: 31, totalViews: 5967, rfpCount: 14 },
      { name: 'Laboratory', performance: 85, growth: 4.2, products: 52, totalViews: 5234, rfpCount: 12 },
    ],
    realtimeData: {
      activeUsers: 127,
      pageViews: 543,
      activeRFPs: 8,
      recentActions: [
        { id: '1', type: 'view', product: 'Digital Ophthalmoscope', user: 'Dr. Hassan', timestamp: new Date().toISOString(), location: 'Casablanca' },
        { id: '2', type: 'rfp', product: 'Cardiac Monitor', user: 'Hospital Ben Sina', timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), location: 'Rabat' },
        { id: '3', type: 'download', product: 'MRI Scanner Specs', user: 'Clinic Al Amal', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), location: 'Marrakech' },
        { id: '4', type: 'contact', product: 'Ventilator', user: 'CHU Mohammed VI', timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(), location: 'Fès' },
      ]
    }
  }), []);

  useEffect(() => {
    loadAnalyticsData();
  }, [filters]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // In production, this would be an actual API call
      // const response = await fetch('/api/admin/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(filters),
      // });
      
      setData(mockAnalyticsData);
    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const handleExportPDF = async () => {
    // Mock PDF export functionality
    const blob = new Blob(['Mock Analytics Report PDF Content'], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleExportCSV = async () => {
    if (!data) return;
    
    const csvContent = [
      'Date,Views,RFPs,Conversions,Visitors,Revenue',
      ...data.trends.map(trend => 
        `${trend.period},${trend.views},${trend.rfps},${trend.conversions},${trend.visitors},${trend.revenue || 0}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'view': return EyeIcon;
      case 'rfp': return DocumentTextIcon;
      case 'download': return ArrowDownTrayIcon;
      case 'contact': return UsersIcon;
      default: return EyeIcon;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'view': return 'text-blue-600 bg-blue-50';
      case 'rfp': return 'text-amber-600 bg-amber-50';
      case 'download': return 'text-green-600 bg-green-50';
      case 'contact': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-900 font-poppins">{t('title')}</h1>
          <p className="mt-2 text-gray-600">{t('subtitle')}</p>
        </div>
        <LoadingSpinner size="lg" text={tCommon('loading')} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-900 font-poppins">{t('title')}</h1>
        </div>
        <Card className="border border-red-200">
          <CardContent className="p-8 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadAnalyticsData} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-medium text-gray-900 font-poppins">{t('title')}</h1>
          <p className="mt-2 text-gray-600">{t('subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Range Filter */}
          <div className="relative">
            <select 
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
              className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
              <option value="today">{t('periods.today')}</option>
              <option value="week">{t('periods.week')}</option>
              <option value="month">{t('periods.month')}</option>
              <option value="quarter">{t('periods.quarter')}</option>
              <option value="year">{t('periods.year')}</option>
            </select>
            <ChevronDownIcon className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
          
          {/* Export Buttons */}
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="flex items-center space-x-2 h-10"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span>CSV</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExportPDF}
            className="flex items-center space-x-2 h-10"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span>PDF</span>
          </Button>
          
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 h-10"
          >
            {refreshing ? (
              <LoadingSpinner size="sm" />
            ) : (
              <ArrowTrendingUpIcon className="h-4 w-4" />
            )}
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          title={t('kpis.totalViews')}
          value={data?.kpis.totalViews || 0}
          change={8.2}
          changeLabel="from last month"
          icon={EyeIcon}
          color="blue"
          loading={loading}
        />
        <KPICard
          title={t('kpis.uniqueVisitors')}
          value={data?.kpis.uniqueVisitors || 0}
          change={5.7}
          changeLabel="from last month"
          icon={UsersIcon}
          color="green"
          loading={loading}
        />
        <KPICard
          title={t('kpis.conversionRate')}
          value={data ? `${data.kpis.conversionRate}%` : '0%'}
          change={-2.1}
          changeLabel="from last month"
          icon={CursorArrowRaysIcon}
          color="yellow"
          loading={loading}
        />
        <KPICard
          title={t('kpis.rfpSuccess')}
          value={data ? `${data.kpis.rfpSuccess}%` : '0%'}
          change={12.3}
          changeLabel="from last month"
          icon={TrophyIcon}
          color="purple"
          loading={loading}
        />
      </div>

      {/* Real-time Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Stats */}
        <Card className="border border-gray-200/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
              Live Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <PlayIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Active Users</span>
                </div>
                <span className="text-lg font-bold text-green-600">{data?.realtimeData.activeUsers || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <EyeIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Page Views (Today)</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{data?.realtimeData.pageViews || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium text-gray-600">Active RFPs</span>
                </div>
                <span className="text-lg font-bold text-amber-600">{data?.realtimeData.activeRFPs || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="border border-gray-200/60 lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
              <div className="h-2 w-2 bg-primary-500 rounded-full mr-3"></div>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {data?.realtimeData.recentActions.map((action) => {
                const Icon = getActivityIcon(action.type);
                const colorClass = getActivityColor(action.type);
                
                return (
                  <div key={action.id} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {action.type === 'view' ? 'Product viewed' :
                             action.type === 'rfp' ? 'RFP submitted' :
                             action.type === 'download' ? 'Spec downloaded' :
                             'Contact requested'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {action.product} by {action.user}
                          </p>
                          {action.location && (
                            <div className="flex items-center space-x-1 mt-1">
                              <MapPinIcon className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{action.location}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {formatTimeAgo(action.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Performance */}
        <Card className="border border-gray-200/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
              <TrophyIcon className="h-5 w-5 text-amber-500 mr-3" />
              {t('kpis.topProducts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.kpis.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center space-x-4 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-amber-100 text-amber-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {product.views.toLocaleString()} views
                          </span>
                        </div>
                      </div>
                      <div className={`flex items-center space-x-1 text-xs font-medium ${
                        product.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {product.change >= 0 ? (
                          <ArrowUpIcon className="h-3 w-3" />
                        ) : (
                          <ArrowDownIcon className="h-3 w-3" />
                        )}
                        <span>{Math.abs(product.change)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card className="border border-gray-200/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
              <MapPinIcon className="h-5 w-5 text-green-500 mr-3" />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.geographic.map((region, index) => (
                <div key={region.region} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">{region.region}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">
                      {region.visitors.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {region.rfps} RFPs ({region.conversionRate}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance */}
      <Card className="border border-gray-200/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
            <CubeIcon className="h-5 w-5 text-primary-500 mr-3" />
            Medical Category Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Growth
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RFPs
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.categories.map((category) => (
                  <tr key={category.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className={`h-2 w-16 rounded-full ${
                          category.performance >= 90 ? 'bg-green-200' :
                          category.performance >= 80 ? 'bg-yellow-200' : 'bg-red-200'
                        }`}>
                          <div 
                            className={`h-2 rounded-full ${
                              category.performance >= 90 ? 'bg-green-500' :
                              category.performance >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${category.performance}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {category.performance}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center space-x-1 text-sm font-medium ${
                        category.growth >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {category.growth >= 0 ? (
                          <ArrowUpIcon className="h-4 w-4" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4" />
                        )}
                        <span>{Math.abs(category.growth)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.products}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.totalViews.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.rfpCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Chart Placeholder Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Trends Chart Placeholder */}
        <Card className="border border-gray-200/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
              <ChartBarIcon className="h-5 w-5 text-primary-500 mr-3" />
              Traffic & Conversion Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl flex items-center justify-center border border-primary-100">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 text-primary-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600 mb-2">Interactive Chart Area</p>
                <p className="text-xs text-gray-500 max-w-xs">
                  Time series visualization showing views, RFPs, and conversions over selected period
                </p>
              </div>
            </div>
            
            {/* Chart Legend */}
            <div className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Views</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-amber-500 rounded-full"></div>
                <span className="text-sm text-gray-600">RFPs</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Conversions</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card className="border border-gray-200/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium text-gray-900 flex items-center">
              <FunnelIcon className="h-5 w-5 text-purple-500 mr-3" />
              RFP Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { stage: 'Product Views', count: 45672, percentage: 100, color: 'bg-blue-500' },
                { stage: 'Product Details', count: 12845, percentage: 28, color: 'bg-indigo-500' },
                { stage: 'RFP Initiated', count: 3421, percentage: 7.5, color: 'bg-purple-500' },
                { stage: 'RFP Submitted', count: 1734, percentage: 3.8, color: 'bg-pink-500' },
                { stage: 'RFP Converted', count: 1361, percentage: 3.0, color: 'bg-green-500' },
              ].map((stage, index) => (
                <div key={stage.stage} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{stage.stage}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-gray-900">
                        {stage.count.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500">({stage.percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${stage.color}`}
                      style={{ width: `${stage.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Optimization Insights</span>
              </div>
              <p className="text-sm text-green-700">
                Your RFP conversion rate of 3.0% is above the medical equipment industry average of 2.1%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}