import type { AgreementStatus, ValidationReport } from './types';

export interface StatusBadge {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
}

export interface SeverityBadge {
  icon: string;
  label: string;
  color: string;
}

export interface MergeRecommendation {
  canMerge: boolean;
  recommendation: string;
  action: string;
}

export interface DiagnosticInfo {
  passedChecks: number;
  totalChecks: number;
  criticalIssues: number;
}

export function getStatusBadge(status: AgreementStatus): StatusBadge {
  switch (status) {
    case 'pass':
      return {
        icon: '✓',
        label: 'Pass',
        color: 'text-[#3de8c8]',
        bgColor: 'bg-[#3de8c8]/10'
      };
    case 'warn':
      return {
        icon: '⚠',
        label: 'Warning',
        color: 'text-[#f5a623]',
        bgColor: 'bg-[#f5a623]/10'
      };
    case 'fail':
      return {
        icon: '✖',
        label: 'Fail',
        color: 'text-[#ff4444]',
        bgColor: 'bg-[#ff4444]/10'
      };
    default:
      return {
        icon: '?',
        label: 'Unknown',
        color: 'text-[#6b5f4d]',
        bgColor: 'bg-[#221c18]'
      };
  }
}

export function getSeverityBadge(severity: 'critical' | 'warning' | 'info'): SeverityBadge {
  switch (severity) {
    case 'critical':
      return {
        icon: '🚨',
        label: 'Critical',
        color: 'text-[#ff4444]'
      };
    case 'warning':
      return {
        icon: '⚠️',
        label: 'Warning',
        color: 'text-[#f5a623]'
      };
    case 'info':
      return {
        icon: 'ℹ️',
        label: 'Info',
        color: 'text-[#3de8c8]'
      };
  }
}

export function getMergeRecommendationDetailed(report: ValidationReport): MergeRecommendation {
  const canMerge = report.overallStatus === 'pass' || report.overallStatus === 'warn';
  
  if (report.overallStatus === 'pass') {
    return {
      canMerge: true,
      recommendation: 'Systems are in agreement. Safe to merge Performance Engine metrics.',
      action: 'You can proceed with confidence to use Performance Engine data.'
    };
  }
  
  if (report.overallStatus === 'warn') {
    return {
      canMerge: true,
      recommendation: 'Systems mostly agree with minor differences.',
      action: 'Review the differences below, then proceed cautiously with merging.'
    };
  }
  
  return {
    canMerge: false,
    recommendation: 'Systems disagree significantly. Do not merge yet.',
    action: 'Keep bridge mode active and resolve calibration issues before merging.'
  };
}

export function getDiagnosticInfo(report: ValidationReport): DiagnosticInfo {
  const totalChecks = report.metricComparisons.length + report.splitComparisons.length;
  const passedChecks = [
    ...report.metricComparisons.filter(m => m.status === 'pass'),
    ...report.splitComparisons.filter(s => s.status === 'pass')
  ].length;
  
  const criticalIssues = report.overallStatus === 'fail' ? report.likelyIssues.length : 0;
  
  return {
    passedChecks,
    totalChecks,
    criticalIssues
  };
}

export function formatReportAsText(report: ValidationReport): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(70));
  lines.push('PERFORMANCE VALIDATION REPORT');
  lines.push('='.repeat(70));
  lines.push('');
  
  lines.push(`Overall Status: ${report.overallStatus.toUpperCase()}`);
  lines.push(`Summary: ${report.summary}`);
  lines.push('');
  
  lines.push(`Should Trust Speed: ${report.shouldTrustSpeed ? 'YES' : 'NO'}`);
  lines.push(`Should Trust Power: ${report.shouldTrustPower ? 'YES' : 'NO'}`);
  lines.push('');
  
  if (report.metricComparisons.length > 0) {
    lines.push('METRIC COMPARISONS');
    lines.push('-'.repeat(70));
    for (const metric of report.metricComparisons) {
      lines.push(`${metric.label}:`);
      lines.push(`  Existing: ${metric.existingValue?.toFixed(2) ?? 'N/A'} ${metric.unit}`);
      lines.push(`  Engine:   ${metric.engineValue?.toFixed(2) ?? 'N/A'} ${metric.unit}`);
      lines.push(`  Difference: ${metric.differencePercent?.toFixed(1) ?? 'N/A'}%`);
      lines.push(`  Status: ${metric.status}`);
      lines.push(`  ${metric.message}`);
      lines.push('');
    }
  }
  
  if (report.splitComparisons.length > 0) {
    lines.push('SPLIT COMPARISONS');
    lines.push('-'.repeat(70));
    for (const split of report.splitComparisons) {
      lines.push(`Target: ${split.targetKmh} km/h`);
      lines.push(`  Existing Time: ${split.existingTimeS?.toFixed(2) ?? 'N/A'} s`);
      lines.push(`  Engine Time:   ${split.engineTimeS?.toFixed(2) ?? 'N/A'} s`);
      lines.push(`  Time Diff:     ${split.timeDifferenceS?.toFixed(2) ?? 'N/A'} s`);
      lines.push(`  Status: ${split.status}`);
      lines.push('');
    }
  }
  
  if (report.likelyIssues.length > 0) {
    lines.push('IDENTIFIED ISSUES');
    lines.push('-'.repeat(70));
    for (const issue of report.likelyIssues) {
      lines.push(`• ${issue}`);
    }
    lines.push('');
  }
  
  if (report.suggestedChecks.length > 0) {
    lines.push('SUGGESTED CHECKS');
    lines.push('-'.repeat(70));
    for (const check of report.suggestedChecks) {
      lines.push(`• ${check}`);
    }
    lines.push('');
  }
  
  lines.push('='.repeat(70));
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('='.repeat(70));
  
  return lines.join('\n');
}
