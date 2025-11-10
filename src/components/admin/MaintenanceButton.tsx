'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Construction, Power } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface MaintenanceButtonProps {
  currentMaintenanceMode: boolean;
  onMaintenanceModeChange: (enabled: boolean) => void;
  className?: string;
}

export function MaintenanceButton({ 
  currentMaintenanceMode, 
  onMaintenanceModeChange,
  className 
}: MaintenanceButtonProps) {
  const router = useRouter();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingState, setPendingState] = useState<boolean | null>(null);

  const handleMaintenanceToggle = (enabled: boolean) => {
    setPendingState(enabled);
    setShowConfirmDialog(true);
  };

  const confirmMaintenanceToggle = async () => {
    if (pendingState === null) return;

    // Update the maintenance mode
    onMaintenanceModeChange(pendingState);
    
    // If enabling maintenance mode, redirect to maintenance page after a short delay
    if (pendingState === true) {
      setTimeout(() => {
        router.push('/maintenance');
      }, 1000);
    }

    setShowConfirmDialog(false);
    setPendingState(null);
  };

  const cancelMaintenanceToggle = () => {
    setShowConfirmDialog(false);
    setPendingState(null);
  };

  const previewMaintenancePage = () => {
    // Open maintenance page in new tab for preview
    window.open('/maintenance', '_blank');
  };

  return (
    <>
      <div className={className}>
        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex-1">
            <div className="font-medium text-red-800 flex items-center gap-2">
              <Construction className="w-4 h-4" />
              Mode Maintenance
            </div>
            <div className="text-sm text-red-600 mt-1">
              {currentMaintenanceMode 
                ? "Le site est actuellement en mode maintenance" 
                : "Activer le mode maintenance pour les visiteurs"
              }
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={previewMaintenancePage}
                className="text-red-700 border-red-200 hover:bg-red-50"
              >
                Aperçu de la page
              </Button>
              {currentMaintenanceMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/maintenance')}
                  className="text-red-700 border-red-200 hover:bg-red-50"
                >
                  Voir la page
                </Button>
              )}
            </div>
          </div>
          <Switch
            checked={currentMaintenanceMode}
            onCheckedChange={handleMaintenanceToggle}
          />
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Power className="w-5 h-5" />
              {pendingState ? "Activer" : "Désactiver"} le Mode Maintenance
            </DialogTitle>
            <DialogDescription className="space-y-3">
              {pendingState ? (
                <div>
                  <p>Êtes-vous sûr de vouloir activer le mode maintenance ?</p>
                  <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-md text-sm text-orange-800">
                    <strong>Attention :</strong> Tous les visiteurs seront redirigés vers la page de maintenance. 
                    Seuls les administrateurs pourront accéder au site.
                  </div>
                </div>
              ) : (
                <div>
                  <p>Désactiver le mode maintenance ?</p>
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                    Le site redeviendra accessible à tous les visiteurs.
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={cancelMaintenanceToggle}>
              Annuler
            </Button>
            <Button 
              onClick={confirmMaintenanceToggle}
              variant={pendingState ? "destructive" : "default"}
              className="min-w-[100px]"
            >
              {pendingState ? "Activer" : "Désactiver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}