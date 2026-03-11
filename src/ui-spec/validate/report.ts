/**
 * Report formatting for UI Spec validation
 */

import type { ValidationResult, Violation } from './validate-ui-spec';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function colorize(text: string, color: keyof typeof colors): string {
  // Check if colors are supported
  if (!process.stdout.isTTY) {
    return text;
  }
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Format a single violation
 */
function formatViolation(violation: Violation): string {
  const severityColors: Record<string, keyof typeof colors> = {
    error: 'red',
    warning: 'yellow',
    info: 'blue',
  };
  
  const severitySymbols: Record<string, string> = {
    error: '✖',
    warning: '⚠',
    info: 'ℹ',
  };
  
  const color = severityColors[violation.severity] || 'white';
  const symbol = severitySymbols[violation.severity] || '•';
  
  let line = `  ${colorize(symbol, color)} `;
  line += colorize(`[${violation.severity.toUpperCase()}]`, color);
  line += ` ${colorize(violation.ruleId, 'dim')}: `;
  line += violation.message;
  
  if (violation.path) {
    line += colorize(` (${violation.path})`, 'dim');
  }
  
  return line;
}

/**
 * Format a single file result
 */
export function formatFileResult(result: ValidationResult): string {
  const lines: string[] = [];
  
  // File header
  const statusIcon = result.passed ? colorize('✓', 'green') : colorize('✖', 'red');
  const statusText = result.passed ? colorize('PASS', 'green') : colorize('FAIL', 'red');
  
  lines.push('');
  lines.push(`${statusIcon} ${colorize(result.file, 'bold')} ${statusText}`);
  
  // Violations
  if (result.errors.length > 0) {
    lines.push('');
    lines.push(colorize('  Errors:', 'red'));
    for (const violation of result.errors) {
      lines.push(formatViolation(violation));
    }
  }
  
  if (result.warnings.length > 0) {
    lines.push('');
    lines.push(colorize('  Warnings:', 'yellow'));
    for (const violation of result.warnings) {
      lines.push(formatViolation(violation));
    }
  }
  
  if (result.info.length > 0) {
    lines.push('');
    lines.push(colorize('  Info:', 'blue'));
    for (const violation of result.info) {
      lines.push(formatViolation(violation));
    }
  }
  
  // Summary if no violations
  if (result.errors.length === 0 && result.warnings.length === 0 && result.info.length === 0) {
    lines.push(colorize('  No issues found', 'dim'));
  }
  
  return lines.join('\n');
}

/**
 * Format summary for all results
 */
export function formatSummary(results: ValidationResult[]): string {
  const lines: string[] = [];
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  const totalInfo = results.reduce((sum, r) => sum + r.info.length, 0);
  
  lines.push('');
  lines.push(colorize('═'.repeat(50), 'dim'));
  lines.push(colorize('  VALIDATION SUMMARY', 'bold'));
  lines.push(colorize('═'.repeat(50), 'dim'));
  lines.push('');
  
  lines.push(`  Files:    ${results.length} total`);
  lines.push(`  ${colorize(`Passed:   ${passed}`, passed > 0 ? 'green' : 'dim')}`);
  lines.push(`  ${colorize(`Failed:   ${failed}`, failed > 0 ? 'red' : 'dim')}`);
  lines.push('');
  
  lines.push(`  ${colorize(`Errors:   ${totalErrors}`, totalErrors > 0 ? 'red' : 'dim')}`);
  lines.push(`  ${colorize(`Warnings: ${totalWarnings}`, totalWarnings > 0 ? 'yellow' : 'dim')}`);
  lines.push(`  ${colorize(`Info:     ${totalInfo}`, totalInfo > 0 ? 'blue' : 'dim')}`);
  lines.push('');
  
  if (failed === 0) {
    lines.push(colorize('  ✓ All validations passed!', 'green'));
  } else {
    lines.push(colorize(`  ✖ ${failed} file(s) have errors`, 'red'));
  }
  
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Print all results to console
 */
export function printResults(results: ValidationResult[]): void {
  for (const result of results) {
    console.log(formatFileResult(result));
  }
  console.log(formatSummary(results));
}
