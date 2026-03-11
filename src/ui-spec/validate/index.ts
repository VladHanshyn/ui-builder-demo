#!/usr/bin/env node
/**
 * UI Spec Validator CLI
 * 
 * Usage:
 *   npm run ui:validate                    # Validate all examples
 *   npm run ui:validate -- path/to/spec.yaml  # Validate specific file
 */

import * as path from 'path';
import * as fs from 'fs';
import {
  loadSchema,
  loadValidationConfig,
  loadPatternsConfig,
  loadUISpec,
  getUISpecFiles,
  resolvePath,
} from './loaders';
import { validateUISpec, type ValidationResult } from './validate-ui-spec';
import { printResults } from './report';

// Default paths relative to project root
const SCHEMA_PATH = 'src/ui-spec/ui-spec.schema.json';
const VALIDATION_PATH = 'src/design-system/validation/validation.yaml';
const PATTERNS_PATH = 'src/design-system/patterns/patterns.yaml';
const EXAMPLES_PATH = 'src/ui-spec/examples';

function main() {
  const args = process.argv.slice(2);
  
  // Find project root
  let projectRoot = process.cwd();
  let searchDir = __dirname;
  while (searchDir !== path.dirname(searchDir)) {
    if (fs.existsSync(path.join(searchDir, 'package.json'))) {
      projectRoot = searchDir;
      break;
    }
    searchDir = path.dirname(searchDir);
  }
  
  // Load configuration files
  const schemaPath = path.join(projectRoot, SCHEMA_PATH);
  const validationPath = path.join(projectRoot, VALIDATION_PATH);
  const patternsPath = path.join(projectRoot, PATTERNS_PATH);
  
  console.log('Loading configuration...');
  
  let schema: object;
  let validationConfig;
  let patternsConfig;
  
  try {
    schema = loadSchema(schemaPath);
    console.log(`  ✓ Schema loaded from ${SCHEMA_PATH}`);
  } catch (err) {
    console.error(`  ✖ Failed to load schema: ${(err as Error).message}`);
    process.exit(1);
  }
  
  try {
    validationConfig = loadValidationConfig(validationPath);
    console.log(`  ✓ Validation rules loaded from ${VALIDATION_PATH}`);
  } catch (err) {
    console.error(`  ✖ Failed to load validation rules: ${(err as Error).message}`);
    process.exit(1);
  }
  
  try {
    patternsConfig = loadPatternsConfig(patternsPath);
    console.log(`  ✓ Patterns loaded from ${PATTERNS_PATH}`);
  } catch (err) {
    console.error(`  ✖ Failed to load patterns: ${(err as Error).message}`);
    process.exit(1);
  }
  
  // Determine files to validate
  let filesToValidate: string[] = [];
  
  if (args.length === 0) {
    // Validate all examples
    const examplesDir = path.join(projectRoot, EXAMPLES_PATH);
    filesToValidate = getUISpecFiles(examplesDir);
    console.log(`\nValidating ${filesToValidate.length} files from ${EXAMPLES_PATH}/`);
  } else {
    // Validate specified files
    for (const arg of args) {
      const filePath = path.isAbsolute(arg) ? arg : path.join(process.cwd(), arg);
      
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${arg}`);
        process.exit(1);
      }
      
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        filesToValidate.push(...getUISpecFiles(filePath));
      } else {
        filesToValidate.push(filePath);
      }
    }
    console.log(`\nValidating ${filesToValidate.length} file(s)`);
  }
  
  if (filesToValidate.length === 0) {
    console.log('No UI Spec files found to validate.');
    process.exit(0);
  }
  
  // Validate each file
  const results: ValidationResult[] = [];
  
  for (const filePath of filesToValidate) {
    try {
      const spec = loadUISpec(filePath);
      const relativePath = path.relative(projectRoot, filePath);
      const result = validateUISpec(spec, schema, validationConfig, patternsConfig, relativePath);
      results.push(result);
    } catch (err) {
      // File load error
      results.push({
        file: path.relative(projectRoot, filePath),
        passed: false,
        errors: [{
          ruleId: 'LOAD-001',
          severity: 'error',
          message: `Failed to load file: ${(err as Error).message}`,
        }],
        warnings: [],
        info: [],
      });
    }
  }
  
  // Print results
  printResults(results);
  
  // Exit with appropriate code
  const hasErrors = results.some(r => !r.passed);
  process.exit(hasErrors ? 1 : 0);
}

main();
