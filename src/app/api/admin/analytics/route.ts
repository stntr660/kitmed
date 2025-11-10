import { NextRequest, NextResponse } from 'next/server';

// Analytics data interfaces
interface AnalyticsData {
  overview: {
    totalRFPs: number;
    totalProducts: number;
    totalUsers: number;
    totalRevenue: number;
    trends: {
      rfps: number;
      products: number;
      users: number;
      revenue: number;
    };
  };
  rfpAnalytics: {
    conversionRate: number;
    averageResponseTime: number;
    statusDistribution: Array<{ status: string; count: number; percentage: number }>;
    monthlyData: Array<{ month: string; submitted: number; converted: number; revenue: number }>;
  };
  productAnalytics: {
    topCategories: Array<{ name: string; count: number; revenue: number }>;
    popularProducts: Array<{ id: string; name: string; views: number; rfpCount: number }>;
    inventoryStatus: Array<{ status: string; count: number; percentage: number }>;
  };
  userAnalytics: {
    activeUsers: number;
    newUsersThisMonth: number;
    userActivity: Array<{ date: string; active: number; new: number }>;
    roleDistribution: Array<{ role: string; count: number; percentage: number }>;
  };
  geographicData: {
    regions: Array<{ name: string; rfps: number; revenue: number; growth: number }>;
    cities: Array<{ name: string; rfps: number; revenue: number }>;
  };
}

// Mock analytics data
const mockAnalyticsData: AnalyticsData = {
  overview: {
    totalRFPs: 1247,
    totalProducts: 3892,
    totalUsers: 156,
    totalRevenue: 2847650,
    trends: {
      rfps: 12.5,
      products: 8.3,
      users: 15.7,
      revenue: 18.2,
    },
  },
  rfpAnalytics: {
    conversionRate: 68.4,
    averageResponseTime: 2.3,
    statusDistribution: [
      { status: 'pending', count: 89, percentage: 28.5 },
      { status: 'quoted', count: 145, percentage: 46.5 },
      { status: 'converted', count: 78, percentage: 25.0 },
    ],
    monthlyData: [
      { month: '2024-01', submitted: 98, converted: 67, revenue: 245000 },
      { month: '2024-02', submitted: 112, converted: 76, revenue: 287500 },
      { month: '2024-03', submitted: 134, converted: 91, revenue: 342100 },
      { month: '2024-04', submitted: 127, converted: 89, revenue: 318750 },
      { month: '2024-05', submitted: 156, converted: 108, revenue: 398200 },
      { month: '2024-06', submitted: 143, converted: 95, revenue: 367800 },
    ],
  },
  productAnalytics: {
    topCategories: [
      { name: 'Imagerie Médicale', count: 487, revenue: 892000 },
      { name: 'Équipements de Diagnostic', count: 324, revenue: 567800 },
      { name: 'Mobilier Médical', count: 298, revenue: 445600 },
      { name: 'Instruments Chirurgicaux', count: 267, revenue: 389200 },
      { name: 'Équipements de Laboratoire', count: 189, revenue: 287400 },
    ],
    popularProducts: [
      { id: '1', name: 'IRM Siemens 3T', views: 2847, rfpCount: 45 },
      { id: '2', name: 'Scanner CT Philips', views: 2156, rfpCount: 38 },
      { id: '3', name: 'Échographe GE Voluson', views: 1923, rfpCount: 32 },
      { id: '4', name: 'Table de Chirurgie Maquet', views: 1678, rfpCount: 28 },
      { id: '5', name: 'Moniteur Patient Philips', views: 1456, rfpCount: 25 },
    ],
    inventoryStatus: [
      { status: 'available', count: 3245, percentage: 83.4 },
      { status: 'low_stock', count: 456, percentage: 11.7 },
      { status: 'out_of_stock', count: 191, percentage: 4.9 },
    ],
  },
  userAnalytics: {
    activeUsers: 89,
    newUsersThisMonth: 23,
    userActivity: [
      { date: '2024-11-01', active: 78, new: 3 },
      { date: '2024-11-02', active: 82, new: 5 },
      { date: '2024-11-03', active: 85, new: 2 },
      { date: '2024-11-04', active: 91, new: 4 },
      { date: '2024-11-05', active: 88, new: 1 },
      { date: '2024-11-06', active: 94, new: 6 },
      { date: '2024-11-07', active: 89, new: 2 },
    ],
    roleDistribution: [
      { role: 'viewer', count: 89, percentage: 57.1 },
      { role: 'editor', count: 45, percentage: 28.8 },
      { role: 'admin', count: 18, percentage: 11.5 },
      { role: 'super_admin', count: 4, percentage: 2.6 },
    ],
  },
  geographicData: {
    regions: [
      { name: 'Casablanca-Settat', rfps: 445, revenue: 1250000, growth: 15.3 },
      { name: 'Rabat-Salé-Kénitra', rfps: 298, revenue: 867500, growth: 22.1 },
      { name: 'Fès-Meknès', rfps: 187, revenue: 445600, growth: 8.7 },
      { name: 'Marrakech-Safi', rfps: 156, revenue: 378900, growth: 12.4 },
      { name: 'Tanger-Tétouan-Al Hoceïma', rfps: 134, revenue: 298700, growth: 18.9 },
      { name: 'Oriental', rfps: 89, revenue: 234500, growth: 5.2 },
    ],
    cities: [
      { name: 'Casablanca', rfps: 298, revenue: 845600 },
      { name: 'Rabat', rfps: 187, revenue: 567800 },
      { name: 'Marrakech', rfps: 145, revenue: 398200 },
      { name: 'Fès', rfps: 123, revenue: 324700 },
      { name: 'Tanger', rfps: 98, revenue: 256900 },
    ],
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || '30d';
    const type = searchParams.get('type') || 'overview';

    // In a real implementation, you would filter data based on dateRange
    // and return specific analytics based on the type parameter
    
    let responseData;
    
    switch (type) {
      case 'overview':
        responseData = {
          overview: mockAnalyticsData.overview,
          timestamp: new Date().toISOString(),
        };
        break;
      case 'rfp':
        responseData = {
          rfpAnalytics: mockAnalyticsData.rfpAnalytics,
          timestamp: new Date().toISOString(),
        };
        break;
      case 'products':
        responseData = {
          productAnalytics: mockAnalyticsData.productAnalytics,
          timestamp: new Date().toISOString(),
        };
        break;
      case 'users':
        responseData = {
          userAnalytics: mockAnalyticsData.userAnalytics,
          timestamp: new Date().toISOString(),
        };
        break;
      case 'geographic':
        responseData = {
          geographicData: mockAnalyticsData.geographicData,
          timestamp: new Date().toISOString(),
        };
        break;
      case 'all':
      default:
        responseData = {
          ...mockAnalyticsData,
          timestamp: new Date().toISOString(),
        };
        break;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}