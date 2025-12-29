'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BudgetVarianceReport, ExpenseCategory } from '@/types';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  CheckCircle,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BudgetVarianceReportViewProps {
  report: BudgetVarianceReport;
  onExport?: () => void;
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

const categoryLabels: Record<ExpenseCategory, string> = {
  labor: 'Labor',
  materials: 'Materials',
  software: 'Software',
  hardware: 'Hardware',
  travel: 'Travel',
  training: 'Training',
  consulting: 'Consulting',
  marketing: 'Marketing',
  overhead: 'Overhead',
  other: 'Other',
};

export function BudgetVarianceReportView({ report, onExport }: BudgetVarianceReportViewProps) {
  const isHealthy = report.cpi >= 1 && report.spi >= 1;
  const isAtRisk = report.cpi < 0.9 || report.spi < 0.9;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{report.project_title}</h2>
          <p className="text-muted-foreground">
            {report.report_period} Report: {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}
          </p>
        </div>
        <Button variant="outline" onClick={onExport}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Planned Cost</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(report.planned_cost)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Actual Cost</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={cn(
              'text-2xl font-bold',
              report.actual_cost > report.planned_cost ? 'text-red-600' : 'text-green-600'
            )}>
              {formatCurrency(report.actual_cost)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Variance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={cn(
              'text-2xl font-bold flex items-center gap-2',
              report.variance_amount < 0 ? 'text-red-600' : 'text-green-600'
            )}>
              {report.variance_amount < 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : report.variance_amount > 0 ? (
                <TrendingDown className="w-5 h-5" />
              ) : (
                <Minus className="w-5 h-5" />
              )}
              {formatCurrency(Math.abs(report.variance_amount))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatPercentage(report.variance_percentage)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Estimate at Completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(report.eac)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              ETC: {formatCurrency(report.etc)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Indices</CardTitle>
          <CardDescription>
            Cost and schedule performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cost Performance Index (CPI)</span>
                <Badge className={cn(
                  report.cpi >= 1 ? 'bg-green-100 text-green-700' :
                  report.cpi >= 0.9 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                )}>
                  {report.cpi.toFixed(2)}
                </Badge>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    'h-full rounded-full',
                    report.cpi >= 1 ? 'bg-green-500' :
                    report.cpi >= 0.9 ? 'bg-yellow-500' :
                    'bg-red-500'
                  )}
                  style={{ width: `${Math.min(report.cpi * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {report.cpi >= 1 
                  ? 'Under budget - earning more value than spending' 
                  : 'Over budget - spending more than planned'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Schedule Performance Index (SPI)</span>
                <Badge className={cn(
                  report.spi >= 1 ? 'bg-green-100 text-green-700' :
                  report.spi >= 0.9 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                )}>
                  {report.spi.toFixed(2)}
                </Badge>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    'h-full rounded-full',
                    report.spi >= 1 ? 'bg-green-500' :
                    report.spi >= 0.9 ? 'bg-yellow-500' :
                    'bg-red-500'
                  )}
                  style={{ width: `${Math.min(report.spi * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {report.spi >= 1 
                  ? 'Ahead of schedule' 
                  : 'Behind schedule'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variance by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Variance by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Planned</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.by_category.map((cat) => {
                const variancePercent = cat.planned > 0 
                  ? ((cat.variance / cat.planned) * 100) 
                  : 0;
                const isOverBudget = cat.actual > cat.planned;

                return (
                  <TableRow key={cat.category}>
                    <TableCell className="font-medium">
                      {categoryLabels[cat.category] || cat.category}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(cat.planned)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(cat.actual)}
                    </TableCell>
                    <TableCell className={cn(
                      'text-right font-medium',
                      isOverBudget ? 'text-red-600' : 'text-green-600'
                    )}>
                      {formatCurrency(Math.abs(cat.variance))}
                      <span className="text-xs ml-1">
                        ({formatPercentage(variancePercent)})
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {isOverBudget ? (
                        <AlertTriangle className="w-4 h-4 text-red-500 inline" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500 inline" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Analysis & Recommendations */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {report.analysis}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary font-medium">{index + 1}.</span>
                  <span className="text-muted-foreground">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
