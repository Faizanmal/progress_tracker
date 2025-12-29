'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ProjectBudget, BudgetAlert } from '@/types';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BudgetOverviewCardProps {
  budget: ProjectBudget;
  alerts?: BudgetAlert[];
  onClick?: () => void;
}

const healthColors = {
  on_track: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  at_risk: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
  over_budget: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  under_budget: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
};

const healthIcons = {
  on_track: <CheckCircle className="w-4 h-4" />,
  at_risk: <AlertTriangle className="w-4 h-4" />,
  over_budget: <TrendingUp className="w-4 h-4" />,
  under_budget: <TrendingDown className="w-4 h-4" />,
};

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BudgetOverviewCard({ budget, alerts = [], onClick }: BudgetOverviewCardProps) {
  const spentPercentage = (budget.spent_amount / budget.total_budget) * 100;
  const committedPercentage = ((budget.spent_amount + budget.committed_amount) / budget.total_budget) * 100;
  const unacknowledgedAlerts = alerts.filter(a => !a.is_acknowledged);

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-shadow hover:shadow-md',
        unacknowledgedAlerts.length > 0 && 'ring-2 ring-yellow-500/50'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{budget.project_title}</CardTitle>
            <CardDescription>
              {budget.budget_type_display || budget.budget_type}
            </CardDescription>
          </div>
          <Badge className={cn('flex items-center gap-1', healthColors[budget.health])}>
            {healthIcons[budget.health]}
            {budget.health_display || budget.health.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Budget Usage</span>
            <span className="font-medium">
              {formatCurrency(budget.spent_amount, budget.currency)} / {formatCurrency(budget.total_budget, budget.currency)}
            </span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            {/* Committed (lighter) */}
            <div 
              className="absolute inset-y-0 left-0 bg-primary/30 rounded-full"
              style={{ width: `${Math.min(committedPercentage, 100)}%` }}
            />
            {/* Spent (darker) */}
            <div 
              className={cn(
                'absolute inset-y-0 left-0 rounded-full',
                spentPercentage > 100 ? 'bg-red-500' : 'bg-primary'
              )}
              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(spentPercentage)}% spent</span>
            {budget.committed_amount > 0 && (
              <span>+{Math.round((budget.committed_amount / budget.total_budget) * 100)}% committed</span>
            )}
          </div>
        </div>

        {/* Budget Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Remaining</div>
            <div className={cn(
              'text-lg font-semibold',
              budget.remaining_amount < 0 ? 'text-red-600' : 'text-green-600'
            )}>
              {formatCurrency(budget.remaining_amount, budget.currency)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Variance</div>
            <div className={cn(
              'text-lg font-semibold flex items-center gap-1',
              budget.variance_amount < 0 ? 'text-red-600' : 'text-green-600'
            )}>
              {budget.variance_amount > 0 ? (
                <TrendingDown className="w-4 h-4" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              {formatCurrency(Math.abs(budget.variance_amount), budget.currency)}
            </div>
          </div>
        </div>

        {/* Forecast */}
        {budget.forecast_at_completion > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Target className="w-4 h-4" />
                Forecast at completion
              </span>
              <span className={cn(
                'font-medium',
                budget.forecast_at_completion > budget.total_budget ? 'text-red-600' : 'text-green-600'
              )}>
                {formatCurrency(budget.forecast_at_completion, budget.currency)}
              </span>
            </div>
          </div>
        )}

        {/* Active Alerts */}
        {unacknowledgedAlerts.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {unacknowledgedAlerts.length} active alert{unacknowledgedAlerts.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
