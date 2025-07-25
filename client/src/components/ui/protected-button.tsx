import { ReactNode } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock } from 'lucide-react';

interface ProtectedButtonProps extends ButtonProps {
  children: ReactNode;
  requiresEdit?: boolean;
  requiresCreate?: boolean;
  requiresDelete?: boolean;
  requiresManagement?: boolean;
  tooltip?: string;
}

export function ProtectedButton({
  children,
  requiresEdit = false,
  requiresCreate = false,
  requiresDelete = false,
  requiresManagement = false,
  tooltip,
  disabled,
  onClick,
  ...props
}: ProtectedButtonProps) {
  const permissions = usePermissions();

  // Determine if user has required permissions
  let hasPermission = true;
  let defaultTooltip = "Sie haben keine Berechtigung für diese Aktion";

  if (requiresDelete && !permissions.canDelete) {
    hasPermission = false;
    defaultTooltip = "Nur Administratoren können Datensätze löschen";
  } else if (requiresCreate && !permissions.canCreate) {
    hasPermission = false;
    defaultTooltip = "Sie benötigen eine Team-Zuordnung um neue Einträge zu erstellen";
  } else if (requiresEdit && !permissions.canEdit) {
    hasPermission = false;
    defaultTooltip = "Sie benötigen eine Team-Zuordnung um Änderungen vorzunehmen";
  } else if (requiresManagement && (!permissions.canManageMembers && !permissions.canManageTeams && !permissions.canManageFinances)) {
    hasPermission = false;
    defaultTooltip = "Diese Funktion erfordert Verwaltungsrechte";
  } else if (permissions.isReadOnly) {
    hasPermission = false;
    defaultTooltip = "Sie haben nur Leserechte. Eine Team-Zuordnung ist erforderlich für Interaktionen";
  }

  const isDisabled = disabled || !hasPermission;
  const tooltipText = tooltip || defaultTooltip;

  const handleClick = (e: any) => {
    if (!hasPermission) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  if (!hasPermission) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <Button
                {...props}
                disabled={true}
                onClick={handleClick}
                className={`${props.className || ''} opacity-50 cursor-not-allowed`}
              >
                <Lock className="w-4 h-4 mr-2" />
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      {...props}
      disabled={isDisabled}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
}