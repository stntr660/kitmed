'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { validateIconComponent } from '@/lib/component-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AdminSearchFilters, AdminSearchResult } from '@/types/admin';
import { RFPRequest } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';

interface RFPWithDetails extends RFPRequest {
  itemCount: number;
  totalQuantity: number;
  estimatedValue?: number;
}

interface RFPListProps {
  initialFilters?: Partial<AdminSearchFilters>;
}

export function RFPList({ initialFilters = {} }: RFPListProps) {
  const router = useRouter();
  const [rfpRequests, setRFPRequests] = useState<AdminSearchResult<RFPWithDetails> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<AdminSearchFilters>({
    query: '',
    status: [],
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters,
  });

  useEffect(() => {
    loadRFPRequests();
  }, [filters]);

  const loadRFPRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/admin/rfp-requests?${params}`);

      if (response.ok) {
        const data = await response.json();
        setRFPRequests(data.data);
      } else {
        throw new Error('Failed to load RFP requests');
      }
    } catch (err) {
      console.error('Failed to load RFP requests:', err);
      setError('Failed to load RFP requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, query, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status?.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...(prev.status || []), status],
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/rfp-requests/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rfp-requests-export-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    let IconComponent;

    switch (status) {
      case 'pending':
        IconComponent = ClockIcon;
        break;
      case 'processing':
        IconComponent = ExclamationCircleIcon;
        break;
      case 'responded':
      case 'closed':
        IconComponent = CheckCircleIcon;
        break;
      default:
        IconComponent = ClockIcon;
        break;
    }

    return validateIconComponent(IconComponent, `StatusIcon-${status}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'processing':
        return 'blue';
      case 'responded':
        return 'green';
      case 'closed':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'red';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'green';
      default:
        return 'gray';
    }
  };

  if (loading && !rfpRequests) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">RFP Requests</h1>
        </div>
        <LoadingSpinner size="lg" text="Loading RFP requests..." />
      </div>
    );
  }

  // Mock data for demonstration
  const mockRFPs: RFPWithDetails[] = rfpRequests?.items || [
    {
      id: '1',
      requestNumber: 'RFP-2024-0001',
      status: 'pending',
      company: {
        name: 'Regional Medical Center',
        type: 'hospital',
        address: {
          street: '123 Medical Drive',
          city: 'Casablanca',
          postalCode: '20000',
          country: 'Morocco',
        },
      },
      contact: {
        firstName: 'Dr. Ahmed',
        lastName: 'Benali',
        email: 'ahmed.benali@rmc.ma',
        phone: '+212 522 123 456',
        position: 'Chief Medical Officer',
      },
      urgency: 'high',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      items: [],
      itemCount: 3,
      totalQuantity: 5,
      estimatedValue: 15000,
    },
    {
      id: '2',
      requestNumber: 'RFP-2024-0002',
      status: 'processing',
      company: {
        name: 'City Health Clinic',
        type: 'clinic',
        address: {
          street: '456 Health Street',
          city: 'Rabat',
          postalCode: '10000',
          country: 'Morocco',
        },
      },
      contact: {
        firstName: 'Dr. Fatima',
        lastName: 'Alami',
        email: 'fatima.alami@chc.ma',
        phone: '+212 537 987 654',
        position: 'Director',
      },
      urgency: 'medium',
      createdAt: new Date('2024-01-14'),
      updatedAt: new Date('2024-01-16'),
      items: [],
      itemCount: 2,
      totalQuantity: 8,
      estimatedValue: 8500,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">RFP Requests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage customer requests for proposals
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleExport}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">23</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Processing</p>
                <p className="text-2xl font-semibold text-gray-900">15</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Responded</p>
                <p className="text-2xl font-semibold text-gray-900">42</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-gray-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Closed</p>
                <p className="text-2xl font-semibold text-gray-900">128</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search RFP requests..."
                  value={filters.query || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {['pending', 'processing', 'responded', 'closed'].map((status) => (
                <Button
                  key={status}
                  variant={filters.status?.includes(status) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RFP Requests Table */}
      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-center">
              <p className="text-red-600">{error}</p>
              <Button onClick={loadRFPRequests} className="mt-4" variant="outline">
                Retry
              </Button>
            </div>
          ) : mockRFPs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('requestNumber')}
                    >
                      Request #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Urgency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Est. Value
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('createdAt')}
                    >
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockRFPs.map((rfp) => {
                    const StatusIcon = getStatusIcon(rfp.status);
                    return (
                      <tr key={rfp.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <StatusIcon className={`h-5 w-5 mr-2 text-${getStatusColor(rfp.status)}-500`} />
                            <span className="text-sm font-medium text-gray-900">
                              {rfp.requestNumber}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {rfp.company.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {rfp.contact.firstName} {rfp.contact.lastName}
                            </div>
                            <div className="text-xs text-gray-400">
                              {rfp.contact.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusColor(rfp.status) as any}>
                            {rfp.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getUrgencyColor(rfp.urgency) as any}>
                            {rfp.urgency}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <span className="font-medium">{rfp.itemCount}</span> items
                          </div>
                          <div className="text-xs text-gray-500">
                            {rfp.totalQuantity} total qty
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {rfp.estimatedValue ? formatCurrency(rfp.estimatedValue) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(rfp.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/admin/rfp-requests/${rfp.id}`)}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/admin/rfp-requests/${rfp.id}/respond`)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">No RFP requests found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {rfpRequests && rfpRequests.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {((rfpRequests.page - 1) * rfpRequests.pageSize) + 1} to{' '}
            {Math.min(rfpRequests.page * rfpRequests.pageSize, rfpRequests.total)} of{' '}
            {rfpRequests.total} results
          </p>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={rfpRequests.page === 1}
              onClick={() => handlePageChange(rfpRequests.page - 1)}
            >
              Previous
            </Button>

            {[...Array(Math.min(5, rfpRequests.totalPages))].map((_, i) => {
              const page = rfpRequests.page - 2 + i;
              if (page < 1 || page > rfpRequests.totalPages) return null;

              return (
                <Button
                  key={page}
                  variant={page === rfpRequests.page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              disabled={rfpRequests.page === rfpRequests.totalPages}
              onClick={() => handlePageChange(rfpRequests.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}