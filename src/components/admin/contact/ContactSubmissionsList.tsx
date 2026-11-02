'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search,
  Mail,
  Phone,
  Building2,
  Calendar,
  MessageSquare,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  Archive,
  Reply,
  X,
} from 'lucide-react';

interface ContactSubmission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  items: ContactSubmission[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: 'Nouveau', color: 'bg-blue-100 text-blue-800', icon: Clock },
  read: { label: 'Lu', color: 'bg-yellow-100 text-yellow-800', icon: Eye },
  replied: { label: 'Repondu', color: 'bg-green-100 text-green-800', icon: Reply },
  archived: { label: 'Archive', color: 'bg-gray-100 text-gray-800', icon: Archive },
};

export function ContactSubmissionsList() {
  const [submissions, setSubmissions] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);
  const [stats, setStats] = useState({ new: 0, read: 0, replied: 0, archived: 0 });

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const response = await fetch(`/api/contact?${params}`);
      const result = await response.json();

      if (result.success) {
        setSubmissions(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load contact submissions');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const responses = await Promise.all([
        fetch('/api/contact?status=new&pageSize=1'),
        fetch('/api/contact?status=read&pageSize=1'),
        fetch('/api/contact?status=replied&pageSize=1'),
        fetch('/api/contact?status=archived&pageSize=1'),
      ]);

      const [newRes, readRes, repliedRes, archivedRes] = await Promise.all(
        responses.map(r => r.json())
      );

      setStats({
        new: newRes.success ? newRes.data.total : 0,
        read: readRes.success ? readRes.data.total : 0,
        replied: repliedRes.success ? repliedRes.data.total : 0,
        archived: archivedRes.success ? archivedRes.data.total : 0,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  useEffect(() => {
    loadSubmissions();
    loadStats();
  }, [page, statusFilter, search]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/contact/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        loadSubmissions();
        loadStats();
        if (selectedSubmission?.id === id) {
          setSelectedSubmission({ ...selectedSubmission, status: newStatus });
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const deleteSubmission = async () => {
    if (!submissionToDelete) return;

    try {
      const response = await fetch(`/api/contact/${submissionToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadSubmissions();
        loadStats();
        setDeleteDialogOpen(false);
        setSubmissionToDelete(null);
      }
    } catch (err) {
      console.error('Failed to delete submission:', err);
    }
  };

  const openDetailDialog = async (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setDetailDialogOpen(true);

    // Mark as read if new
    if (submission.status === 'new') {
      await updateStatus(submission.id, 'read');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages de Contact</h1>
          <p className="text-gray-500 mt-1">Gerez les messages recus via le formulaire de contact</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${statusFilter === key ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats[key as keyof typeof stats]}</p>
                  <p className="text-sm text-gray-500">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, email, entreprise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Messages ({submissions?.total || 0})</span>
            {statusFilter !== 'all' && (
              <Button variant="ghost" size="sm" onClick={() => setStatusFilter('all')}>
                <X className="h-4 w-4 mr-1" /> Effacer le filtre
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : submissions?.items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Aucun message trouve</div>
          ) : (
            <div className="divide-y">
              {submissions?.items.map((submission) => {
                const config = statusConfig[submission.status] || statusConfig.new;
                const Icon = config.icon;

                return (
                  <div
                    key={submission.id}
                    className="py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => openDetailDialog(submission)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {submission.firstName} {submission.lastName}
                          </span>
                          <Badge className={config.color}>
                            <Icon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">{submission.subject}</p>
                        <p className="text-sm text-gray-500 truncate">{submission.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {submission.email}
                          </span>
                          {submission.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {submission.phone}
                            </span>
                          )}
                          {submission.company && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {submission.company}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(submission.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSubmissionToDelete(submission.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {submissions && submissions.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                Page {submissions.page} sur {submissions.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Precedent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === submissions.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Details du message</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nom</label>
                  <p className="text-gray-900">
                    {selectedSubmission.firstName} {selectedSubmission.lastName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">
                    <a href={`mailto:${selectedSubmission.email}`} className="text-primary hover:underline">
                      {selectedSubmission.email}
                    </a>
                  </p>
                </div>
                {selectedSubmission.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telephone</label>
                    <p className="text-gray-900">
                      <a href={`tel:${selectedSubmission.phone}`} className="text-primary hover:underline">
                        {selectedSubmission.phone}
                      </a>
                    </p>
                  </div>
                )}
                {selectedSubmission.company && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Entreprise</label>
                    <p className="text-gray-900">{selectedSubmission.company}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="text-gray-900">{formatDate(selectedSubmission.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Statut</label>
                  <Badge className={statusConfig[selectedSubmission.status]?.color}>
                    {statusConfig[selectedSubmission.status]?.label}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Sujet</label>
                <p className="text-gray-900 font-medium">{selectedSubmission.subject}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Message</label>
                <div className="mt-1 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                  {selectedSubmission.message}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Changer le statut</label>
                <div className="flex gap-2 mt-2">
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <Button
                      key={key}
                      variant={selectedSubmission.status === key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateStatus(selectedSubmission.id, key)}
                    >
                      {config.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Fermer
            </Button>
            {selectedSubmission && (
              <Button asChild>
                <a href={`mailto:${selectedSubmission.email}?subject=Re: ${selectedSubmission.subject}`}>
                  <Reply className="h-4 w-4 mr-2" />
                  Repondre par email
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>Etes-vous sur de vouloir supprimer ce message ? Cette action est irreversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={deleteSubmission}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
