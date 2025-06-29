/**
 * Monitoring Utilities for CLOI
 * 
 * Enhances the existing CI timeout protection system with metrics collection,
 * health checks, and performance monitoring without breaking working solutions.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const METRICS_FILE = path.join(__dirname, '../../.cloi/metrics.json');

/**
 * Timeout Metrics Collector
 * Tracks command execution times and timeout events
 */
export class TimeoutMetrics {
  constructor() {
    this.metrics = {
      commandTimeouts: new Map(),
      averageExecutionTime: 0,
      timeoutThreshold: 15000, // 15 seconds default from research
      totalCommands: 0,
      timedOutCommands: 0,
      successfulCommands: 0,
      lastUpdated: new Date().toISOString()
    };
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Ensure metrics directory exists
      const metricsDir = path.dirname(METRICS_FILE);
      await fs.mkdir(metricsDir, { recursive: true });
      
      // Load existing metrics if available
      try {
        const data = await fs.readFile(METRICS_FILE, 'utf8');
        const savedMetrics = JSON.parse(data);
        
        // Convert Map entries back from array format
        if (savedMetrics.commandTimeouts) {
          this.metrics.commandTimeouts = new Map(savedMetrics.commandTimeouts);
        }
        
        // Preserve other metrics
        this.metrics = { ...this.metrics, ...savedMetrics };
        delete this.metrics.commandTimeouts; // Will be set from Map above
        this.metrics.commandTimeouts = new Map(savedMetrics.commandTimeouts || []);
      } catch (error) {
        // First run - use defaults
        console.log('Initializing new metrics collection...');
      }
      
      this.initialized = true;
    } catch (error) {
      console.warn('Warning: Could not initialize metrics collection:', error.message);
    }
  }

  /**
   * Start timing a command execution
   */
  startTimer(commandName, options = {}) {
    return {
      commandName,
      startTime: Date.now(),
      timeout: options.timeout || this.metrics.timeoutThreshold,
      metadata: options.metadata || {}
    };
  }

  /**
   * End timing and record metrics
   */
  async endTimer(timer, result = {}) {
    const duration = Date.now() - timer.startTime;
    const timedOut = result.timedOut || false;
    const success = result.success !== false; // Default to true unless explicitly false

    // Update metrics
    this.metrics.totalCommands++;
    if (timedOut) {
      this.metrics.timedOutCommands++;
    } else if (success) {
      this.metrics.successfulCommands++;
    }

    // Track command-specific metrics
    const commandStats = this.metrics.commandTimeouts.get(timer.commandName) || {
      executions: 0,
      totalTime: 0,
      timeouts: 0,
      successes: 0,
      averageTime: 0,
      lastExecution: null
    };

    commandStats.executions++;
    commandStats.totalTime += duration;
    commandStats.averageTime = commandStats.totalTime / commandStats.executions;
    commandStats.lastExecution = new Date().toISOString();

    if (timedOut) {
      commandStats.timeouts++;
    } else if (success) {
      commandStats.successes++;
    }

    this.metrics.commandTimeouts.set(timer.commandName, commandStats);

    // Update overall average
    const totalTime = Array.from(this.metrics.commandTimeouts.values())
      .reduce((sum, stats) => sum + stats.totalTime, 0);
    this.metrics.averageExecutionTime = totalTime / this.metrics.totalCommands;
    this.metrics.lastUpdated = new Date().toISOString();

    // Persist metrics
    await this.saveMetrics();

    return {
      duration,
      timedOut,
      success,
      commandStats: { ...commandStats }
    };
  }

  /**
   * Get timeout statistics
   */
  getTimeoutStats() {
    const stats = {
      totalCommands: this.metrics.totalCommands,
      successfulCommands: this.metrics.successfulCommands,
      timedOutCommands: this.metrics.timedOutCommands,
      averageExecutionTime: this.metrics.averageExecutionTime,
      timeoutRate: this.metrics.totalCommands > 0 ? 
        (this.metrics.timedOutCommands / this.metrics.totalCommands * 100).toFixed(2) : 0,
      lastUpdated: this.metrics.lastUpdated,
      commandBreakdown: {}
    };

    // Add command-specific breakdown
    for (const [cmd, cmdStats] of this.metrics.commandTimeouts.entries()) {
      stats.commandBreakdown[cmd] = {
        executions: cmdStats.executions,
        averageTime: Math.round(cmdStats.averageTime),
        timeouts: cmdStats.timeouts,
        successRate: cmdStats.executions > 0 ? 
          ((cmdStats.successes / cmdStats.executions) * 100).toFixed(2) : 0,
        lastExecution: cmdStats.lastExecution
      };
    }

    return stats;
  }

  /**
   * Check for performance regressions
   */
  detectRegressions(options = {}) {
    const threshold = options.regressionThreshold || 1.5; // 50% increase
    const minExecutions = options.minExecutions || 5;
    const regressions = [];

    for (const [cmd, stats] of this.metrics.commandTimeouts.entries()) {
      if (stats.executions < minExecutions) continue;

      // Simple regression detection: if recent average is significantly higher
      // This could be enhanced with more sophisticated algorithms
      const recentExecutions = Math.min(5, stats.executions);
      const expectedTime = stats.averageTime;
      
      // For now, flag commands with high timeout rates as potential regressions
      const timeoutRate = stats.timeouts / stats.executions;
      
      if (timeoutRate > 0.2) { // More than 20% timeout rate
        regressions.push({
          command: cmd,
          issue: 'high_timeout_rate',
          timeoutRate: (timeoutRate * 100).toFixed(2) + '%',
          executions: stats.executions,
          averageTime: Math.round(stats.averageTime),
          recommendation: 'Consider increasing timeout threshold or investigating command performance'
        });
      }

      if (stats.averageTime > this.metrics.timeoutThreshold * 0.8) { // Near timeout threshold
        regressions.push({
          command: cmd,
          issue: 'approaching_timeout',
          averageTime: Math.round(stats.averageTime),
          threshold: this.metrics.timeoutThreshold,
          recommendation: 'Command execution time is approaching timeout threshold'
        });
      }
    }

    return regressions;
  }

  /**
   * Save metrics to disk
   */
  async saveMetrics() {
    try {
      // Convert Map to array for JSON serialization
      const serializable = {
        ...this.metrics,
        commandTimeouts: Array.from(this.metrics.commandTimeouts.entries())
      };
      
      await fs.writeFile(METRICS_FILE, JSON.stringify(serializable, null, 2));
    } catch (error) {
      console.warn('Warning: Could not save metrics:', error.message);
    }
  }

  /**
   * Clear all metrics (for testing or reset)
   */
  async clearMetrics() {
    this.metrics = {
      commandTimeouts: new Map(),
      averageExecutionTime: 0,
      timeoutThreshold: 15000,
      totalCommands: 0,
      timedOutCommands: 0,
      successfulCommands: 0,
      lastUpdated: new Date().toISOString()
    };
    await this.saveMetrics();
  }
}

/**
 * Health Check System
 * Provides system health monitoring for CI/CD pipelines
 */
export class HealthCheck {
  constructor(timeoutMetrics) {
    this.metrics = timeoutMetrics;
    this.checks = new Map();
    this.lastHealthCheck = null;
  }

  /**
   * Register a health check
   */
  registerCheck(name, checkFunction, options = {}) {
    this.checks.set(name, {
      name,
      checkFunction,
      timeout: options.timeout || 5000,
      critical: options.critical || false,
      interval: options.interval || 30000 // 30 seconds default
    });
  }

  /**
   * Run all health checks
   */
  async runHealthChecks() {
    const results = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {},
      summary: {
        total: this.checks.size,
        healthy: 0,
        unhealthy: 0,
        critical_failures: 0
      }
    };

    for (const [name, check] of this.checks.entries()) {
      const checkResult = await this.runSingleCheck(check);
      results.checks[name] = checkResult;

      if (checkResult.status === 'healthy') {
        results.summary.healthy++;
      } else {
        results.summary.unhealthy++;
        if (check.critical) {
          results.summary.critical_failures++;
          results.status = 'critical';
        } else if (results.status === 'healthy') {
          results.status = 'degraded';
        }
      }
    }

    // Add timeout metrics to health check
    results.metrics = this.metrics.getTimeoutStats();
    
    // Check for performance regressions
    const regressions = this.metrics.detectRegressions();
    if (regressions.length > 0) {
      results.performance_alerts = regressions;
      if (results.status === 'healthy') {
        results.status = 'degraded';
      }
    }

    this.lastHealthCheck = results;
    return results;
  }

  /**
   * Run a single health check with timeout
   */
  async runSingleCheck(check) {
    const timer = this.metrics.startTimer(`health_check_${check.name}`, {
      timeout: check.timeout
    });

    try {
      const result = await Promise.race([
        check.checkFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), check.timeout)
        )
      ]);

      await this.metrics.endTimer(timer, { success: true });

      return {
        status: result.status || 'healthy',
        message: result.message || 'Check passed',
        duration: Date.now() - timer.startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      await this.metrics.endTimer(timer, { success: false, timedOut: error.message.includes('timeout') });

      return {
        status: 'unhealthy',
        message: error.message,
        duration: Date.now() - timer.startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get the last health check results
   */
  getLastHealthCheck() {
    return this.lastHealthCheck;
  }
}

/**
 * APM Integration Points
 * Provides hooks for Application Performance Monitoring systems
 */
export class APMIntegration {
  constructor(timeoutMetrics) {
    this.metrics = timeoutMetrics;
    this.hooks = new Map();
  }

  /**
   * Register APM hooks
   */
  registerHook(event, handler) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event).push(handler);
  }

  /**
   * Emit APM event
   */
  async emit(event, data) {
    const handlers = this.hooks.get(event) || [];
    
    for (const handler of handlers) {
      try {
        await handler(data);
      } catch (error) {
        console.warn(`APM hook error for ${event}:`, error.message);
      }
    }
  }

  /**
   * Common APM events
   */
  async recordCommandExecution(commandName, duration, success, metadata = {}) {
    await this.emit('command_execution', {
      command: commandName,
      duration,
      success,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  async recordTimeout(commandName, timeoutDuration, metadata = {}) {
    await this.emit('command_timeout', {
      command: commandName,
      timeout: timeoutDuration,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  async recordValidationResult(validationType, success, duration, metadata = {}) {
    await this.emit('validation_result', {
      type: validationType,
      success,
      duration,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }
}

// Global instances for easy access
let globalTimeoutMetrics = null;
let globalHealthCheck = null;
let globalAPM = null;

/**
 * Get or create global monitoring instances
 */
export async function getMonitoringInstances() {
  if (!globalTimeoutMetrics) {
    globalTimeoutMetrics = new TimeoutMetrics();
    await globalTimeoutMetrics.initialize();
    
    globalHealthCheck = new HealthCheck(globalTimeoutMetrics);
    globalAPM = new APMIntegration(globalTimeoutMetrics);
    
    // Register default health checks
    globalHealthCheck.registerCheck('timeout_metrics', async () => {
      const stats = globalTimeoutMetrics.getTimeoutStats();
      return {
        status: stats.timeoutRate < 10 ? 'healthy' : 'unhealthy',
        message: `Timeout rate: ${stats.timeoutRate}%`
      };
    }, { critical: true });
  }

  return {
    timeoutMetrics: globalTimeoutMetrics,
    healthCheck: globalHealthCheck,
    apm: globalAPM
  };
}

/**
 * Timeout-enhanced wrapper for command execution
 * Preserves existing timeout logic while adding monitoring
 */
export function withTimeoutMonitoring(commandName, commandFunction, options = {}) {
  return async function(...args) {
    const { timeoutMetrics, apm } = await getMonitoringInstances();
    const timer = timeoutMetrics.startTimer(commandName, options);
    
    try {
      const result = await commandFunction(...args);
      
      const metrics = await timeoutMetrics.endTimer(timer, { success: true });
      await apm.recordCommandExecution(commandName, metrics.duration, true);
      
      return result;
    } catch (error) {
      const isTimeout = error.message && (
        error.message.includes('timeout') || 
        error.message.includes('SIGTERM')
      );
      
      const metrics = await timeoutMetrics.endTimer(timer, { 
        success: false, 
        timedOut: isTimeout 
      });
      
      if (isTimeout) {
        await apm.recordTimeout(commandName, timer.timeout);
      }
      
      await apm.recordCommandExecution(commandName, metrics.duration, false);
      
      throw error;
    }
  };
} 