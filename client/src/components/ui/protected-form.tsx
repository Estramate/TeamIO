import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Eye } from 'lucide-react';

interface ProtectedFormProps {
  children: ReactNode;
  title?: string;
  className?: string;
  requiresEdit?: boolean;
  requiresCreate?: boolean;
}

export function ProtectedForm({
  children,
  title,
  className = '',
  requiresEdit = false,
  requiresCreate = false,
}: ProtectedFormProps) {
  const permissions = usePermissions();

  const hasPermission = 
    (!requiresEdit || permissions.canEdit) && 
    (!requiresCreate || permissions.canCreate) &&
    !permissions.isReadOnly;

  if (!hasPermission) {
    return (
      <Card className={`${className} border-amber-200 bg-amber-50`}>
        <CardHeader>
          <CardTitle className="flex items-center text-amber-800">
            <Lock className="w-5 h-5 mr-2" />
            {title || 'Nur-Lese-Modus'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8 bg-white rounded-lg border border-amber-200">
            <div className="text-center">
              <Eye className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-amber-800 mb-2">
                Nur Ansicht verfügbar
              </h3>
              <p className="text-amber-700 text-sm max-w-md">
                Sie können die Daten einsehen, aber keine Änderungen vornehmen. 
                Eine Team-Zuordnung ist erforderlich für Bearbeitungsrechte.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
}