/**
 * Formula Evaluator for KPI Calculations
 * Supports: arithmetic (+,-,*,/), AVERAGE, SUM, MIN, MAX, IF conditions
 */

class FormulaEvaluator {
  constructor(kpiValuesMap) {
    // kpiValuesMap: { kpiId: value }
    this.values = kpiValuesMap || {};
  }

  /**
   * Evaluate a formula string
   * @param {string} formula - e.g., "v1*v2+v3" or "AVERAGE(v1,v2,v3)"
   * @returns {number} computed result
   */
  evaluate(formula) {
    if (!formula || typeof formula !== 'string') {
      throw new Error('Invalid formula');
    }

    // Replace KPI references (v1, v2, etc.) with actual values
    let expr = this.replaceKpiReferences(formula);
    
    // Handle Excel-like functions
    expr = this.replaceFunctions(expr);
    
    // Safely evaluate the mathematical expression
    return this.safeEval(expr);
  }

  /**
   * Replace vXX references with actual numeric values
   */
  replaceKpiReferences(formula) {
    return formula.replace(/v(\d+)/g, (match, kpiId) => {
      const value = this.values[parseInt(kpiId)];
      if (value === undefined || value === null) {
        console.warn(`KPI ${kpiId} not found in values map`);
        return '0'; // Default to 0 for missing values
      }
      return String(value);
    });
  }

  /**
   * Replace Excel-like functions with JavaScript equivalents
   */
  replaceFunctions(expr) {
    // AVERAGE(a,b,c) -> (a+b+c)/3
    expr = expr.replace(/AVERAGE\(([^)]+)\)/gi, (match, args) => {
      const parts = args.split(',').map(s => s.trim());
      const sum = parts.join('+');
      return `((${sum})/${parts.length})`;
    });

    // SUM(a,b,c) -> (a+b+c)
    expr = expr.replace(/SUM\(([^)]+)\)/gi, (match, args) => {
      const parts = args.split(',').map(s => s.trim());
      return `(${parts.join('+')})`;
    });

    // MIN(a,b,c) -> Math.min(a,b,c)
    expr = expr.replace(/MIN\(([^)]+)\)/gi, (match, args) => {
      return `Math.min(${args})`;
    });

    // MAX(a,b,c) -> Math.max(a,b,c)
    expr = expr.replace(/MAX\(([^)]+)\)/gi, (match, args) => {
      return `Math.max(${args})`;
    });

    // IF(condition, trueVal, falseVal) -> (condition ? trueVal : falseVal)
    expr = expr.replace(/IF\(([^,]+),([^,]+),([^)]+)\)/gi, (match, cond, trueVal, falseVal) => {
      return `((${cond}) ? (${trueVal}) : (${falseVal || 0}))`;
    });

    // Handle >= <= != operators
    expr = expr.replace(/≥/g, '>=');
    expr = expr.replace(/≤/g, '<=');
    expr = expr.replace(/=/g, '==');

    return expr;
  }

  /**
   * Safely evaluate a mathematical expression
   */
  safeEval(expr) {
    try {
      // Remove any non-mathematical characters for safety
      if (!/^[\d\s+\-*/.(),?:><!=&|]+$/.test(expr.replace(/Math\.(min|max)/g, ''))) {
        throw new Error('Formula contains invalid characters');
      }

      // Use Function constructor for safer evaluation than eval
      const result = new Function(`return ${expr}`)();
      
      // Handle division by zero, NaN, Infinity
      if (!isFinite(result)) {
        return 0;
      }
      
      return Number(result);
    } catch (error) {
      console.error('Formula evaluation error:', error);
      throw new Error(`Failed to evaluate formula: ${error.message}`);
    }
  }

  /**
   * Extract KPI IDs referenced in a formula
   * @param {string} formula
   * @returns {number[]} array of KPI IDs
   */
  static extractSourceKpiIds(formula) {
    if (!formula) return [];
    
    const matches = formula.match(/v(\d+)/g) || [];
    const ids = matches.map(m => parseInt(m.substring(1)));
    
    // Return unique IDs
    return [...new Set(ids)];
  }

  /**
   * Validate a formula syntax
   * @param {string} formula
   * @returns {boolean}
   */
  static validateFormula(formula) {
    try {
      // Check for balanced parentheses
      let count = 0;
      for (let char of formula) {
        if (char === '(') count++;
        if (char === ')') count--;
        if (count < 0) return false;
      }
      if (count !== 0) return false;

      // Check for valid function names
      const validFunctions = /^[v\d\s+\-*/.(),AVERAGESUMMINMAXIF≥≤=<>!&|]+$/i;
      if (!validFunctions.test(formula)) return false;

      return true;
    } catch (error) {
      return false;
    }
  }
}

export default FormulaEvaluator;
