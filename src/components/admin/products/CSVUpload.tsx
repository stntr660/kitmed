'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Download, AlertCircle, CheckCircle, X } from 'lucide-react';

export interface ImportError {
  row: number;
  field?: string;
  message: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: ImportError[];
  filesDownloaded?: number;
  filesDeduplicationSaved?: number;
  data?: any[];
}

interface CSVUploadProps {
  onImportComplete?: (result: ImportResult) => void;
}

export function CSVUpload({ onImportComplete }: CSVUploadProps) {
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const validateFile = (file: File): string | null => {
    if (!file.name.endsWith('.csv')) {
      return t('product.form.bulkImport.validation.invalidFormat');
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      return t('product.form.bulkImport.validation.fileTooLarge');
    }
    return null;
  };

  const handleUpload = async () => {
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setResult({
        success: false,
        imported: 0,
        errors: [{ row: 0, message: validationError }],
      });
      return;
    }

    setImporting(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/admin/products/bulk-import', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult(data.data);
      if (onImportComplete) {
        onImportComplete(data.data);
      }
    } catch (error) {
      setResult({
        success: false,
        imported: 0,
        errors: [{ row: 0, message: error instanceof Error ? error.message : 'Import failed' }],
      });
    } finally {
      setImporting(false);
      setUploadProgress(0);
    }
  };

  const generateTemplate = () => {
    const headers = [
      'referenceFournisseur',
      'constructeur',
      'categoryId',
      'nom_fr',
      'nom_en',
      'description_fr',
      'description_en',
      'ficheTechnique_fr',
      'ficheTechnique_en',
      'pdfBrochureUrl',
      'imageUrls',
      'status',
      'featured'
    ];

    const sampleData = [
      'REF001',
      'Medtronic',
      'cardiology',
      'Moniteur Cardiaque Pro',
      'Cardiac Monitor Pro',
      'Moniteur cardiaque avancé avec écran haute résolution',
      'Advanced cardiac monitor with high-resolution display',
      'Écran 15 pouces, résolution 1920x1080, connectivité Wi-Fi',
      '15-inch display, 1920x1080 resolution, Wi-Fi connectivity',
      'https://example.com/brochure.pdf',
      'https://example.com/image1.jpg,https://example.com/image2.jpg',
      'active',
      'true'
    ];

    const csvContent = [
      headers.join(','),
      sampleData.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'kitmed_products_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {t('product.form.bulkImport.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Description and template download */}
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('product.form.bulkImport.description')}
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={generateTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {t('product.form.bulkImport.downloadTemplate')}
          </Button>
        </div>

        {/* File requirements */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">{t('product.form.bulkImport.requirements.title')}</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>{t('product.form.bulkImport.requirements.format')}</li>
                <li>{t('product.form.bulkImport.requirements.size')}</li>
                <li>{t('product.form.bulkImport.requirements.rows')}</li>
                <li>{t('product.form.bulkImport.requirements.encoding')}</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Required columns */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">{t('product.form.bulkImport.columns.title')}</p>
              <ul className="list-disc list-inside text-xs space-y-1">
                <li>{t('product.form.bulkImport.columns.referenceFournisseur')}</li>
                <li>{t('product.form.bulkImport.columns.constructeur')}</li>
                <li>{t('product.form.bulkImport.columns.categoryId')}</li>
                <li>{t('product.form.bulkImport.columns.nom_fr')}</li>
                <li>{t('product.form.bulkImport.columns.nom_en')}</li>
                <li>{t('product.form.bulkImport.columns.status')}</li>
              </ul>
              <p className="text-xs text-blue-600 font-medium mt-2">📁 File Downloads:</p>
              <ul className="list-disc list-inside text-xs space-y-1">
                <li><strong>pdfBrochureUrl:</strong> PDF brochure URL (downloaded with deduplication)</li>
                <li><strong>imageUrls:</strong> Comma-separated image URLs (downloaded with deduplication)</li>
                <li className="text-blue-600">💡 <strong>Smart Deduplication:</strong> Identical files are automatically detected and reused to save storage</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* File upload */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {t('product.form.bulkImport.selectFile')}
            </Button>

            {file && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  {file.name}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearFile}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              </div>
            )}
          </div>

          {file && (
            <Button
              onClick={handleUpload}
              disabled={importing}
              className="w-full"
            >
              {importing ? t('product.form.bulkImport.importing') : t('product.form.bulkImport.uploadFile')}
            </Button>
          )}

          {importing && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-gray-500 text-center">
                {uploadProgress < 100 ? t('product.form.bulkImport.importing') : t('product.form.bulkImport.processing')}
              </p>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {result.success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-2">
                    <p className="font-medium">{t('product.form.bulkImport.success')}</p>
                    <p>{t('product.form.bulkImport.results.importedCount')} {result.imported}</p>
                    {result.filesDownloaded !== undefined && result.filesDownloaded > 0 && (
                      <p className="text-sm">📁 New files downloaded: {result.filesDownloaded}</p>
                    )}
                    {result.filesDeduplicationSaved !== undefined && result.filesDeduplicationSaved > 0 && (
                      <p className="text-sm text-blue-600">♻️ Files reused through deduplication: {result.filesDeduplicationSaved}</p>
                    )}
                    {((result.filesDownloaded || 0) + (result.filesDeduplicationSaved || 0)) > 0 && (
                      <p className="text-xs text-gray-500">
                        💾 Storage saved: {Math.round(((result.filesDeduplicationSaved || 0) / ((result.filesDownloaded || 0) + (result.filesDeduplicationSaved || 0))) * 100)}% efficient
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">{t('product.form.bulkImport.error')}</p>
                </AlertDescription>
              </Alert>
            )}

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-red-600">
                    {t('product.form.bulkImport.results.errorsCount')} {result.errors.length}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowErrors(!showErrors)}
                  >
                    {showErrors
                      ? t('product.form.bulkImport.results.hideErrors')
                      : t('product.form.bulkImport.results.viewErrors')
                    }
                  </Button>
                </div>

                {showErrors && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 max-h-48 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 mb-2">
                        {error.row > 0 && (
                          <span className="font-medium">
                            {t('product.form.bulkImport.results.rowError', { row: error.row })}
                          </span>
                        )}
                        {error.field && (
                          <span className="font-medium">
                            {t('product.form.bulkImport.results.fieldError', { field: error.field })}
                          </span>
                        )}
                        {error.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="w-full"
            >
              {t('product.form.bulkImport.results.retry')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}