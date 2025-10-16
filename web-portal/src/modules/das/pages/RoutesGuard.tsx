/**
 * Routes Guard Component
 * Protects DAS routes with authentication and permissions
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissionCheck } from '@/contexts/PermissionsContext';
import { SYSTEMS, DAS_SECTIONS } from '@/config/permissions-constants';
import { Card } from '@/components/ui/card';
import { ShieldX, Loader2 } from 'lucide-react';

interface RoutesGuardProps {
  children: React.ReactNode;
  requiredSection?: string;
  requiredAction?: string;
}

export const RoutesGuard: React.FC<RoutesGuardProps> = ({ 
  children,
  requiredSection = DAS_SECTIONS.DATASETS,
  requiredAction = 'List'
}) => {
  const { getSectionPermissions, isLoading } = usePermissionCheck();

  // Check if user is authenticated (basic check)
  const token = localStorage.getItem('portal:access_token');
  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  // Show loading state while fetching permissions
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading permissions...</p>
        </div>
      </div>
    );
  }

  // Get permissions for DAS system
  const permissions = getSectionPermissions(requiredSection, SYSTEMS.DAS);

  // Check if user has required permission
  const hasPermission = requiredAction === 'List' 
    ? permissions.canList 
    : requiredAction === 'Create'
    ? permissions.canCreate
    : requiredAction === 'Update'
    ? permissions.canUpdate
    : requiredAction === 'Delete'
    ? permissions.canDelete
    : false;

  // Show access denied if no permission
  if (!hasPermission) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md p-8 text-center">
          <ShieldX className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground mb-4">
            You don't have permission to access the Data Analysis Service.
          </p>
          <p className="text-xs text-muted-foreground">
            Required: {requiredAction} permission on {requiredSection}
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go Back
          </button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoutesGuard;

