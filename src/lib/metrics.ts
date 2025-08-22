// src/lib/metrics.ts
/**
 * Enterprise-grade metrics collection system
 * ------------------------------------------
 * Provides rich metrics for monitoring application health, performance, and behaviors,
 * compatible with Prometheus and other monitoring systems.
 * 
 * Features:
 * - Multiple metric types: counters, gauges, histograms, distributions
 * - Labels/dimensions support for metrics
 * - Automatic aggregation and statistics
 * - Percentile calculations for histograms
 * - Prometheus-compatible output format
 * - Fault tolerance with graceful degradation
 * - Batching and caching capabilities
 * 
 * @version 2.0.0
 */

import { logger } from './logger';

// Types of metrics
export enum MetricType {
  COUNTER = 'counter',    // Always increasing value
  GAUGE = 'gauge',        // Value that can go up and down
  HISTOGRAM = 'histogram',// Distribution of values
  SUMMARY = 'summary'     // Summary statistics with percentiles
}

// Metadata for metrics registration
export interface MetricOptions {
  name: string;           // Metric name
  description?: string;   // Human-readable description
  type: MetricType;       // Type of metric
  labels?: string[];      // Optional label dimensions
  buckets?: number[];     // Buckets for histograms
  quantiles?: number[];   // Quantiles for summaries (0.5, 0.9, 0.95, 0.99)
  maxAgeSeconds?: number; // Maximum age of observations
  unit?: string;          // Unit of measurement
}

// Metric value with optional labels
export interface MetricValue {
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

// Internal storage for histogram observations
interface HistogramBucket {
  le: number;             // Less than or equal to
  count: number;          // Count of observations
}

// Internal storage for histogram data
interface HistogramData {
  buckets: HistogramBucket[]; // Bucket counts
  count: number;              // Total count
  sum: number;                // Sum of all observations
  min?: number;               // Minimum value
  max?: number;               // Maximum value
  recentValues: number[];     // Recent values for percentile calculation
  maxRecentValues: number;    // Maximum number of recent values to keep
}

// Internal registration for metrics
interface MetricRegistration {
  name: string;
  type: MetricType;
  description: string;
  labels: string[];
  unit?: string;
  values: Map<string, number | HistogramData>; // Keyed by label hash
  options: Partial<MetricOptions>;
}

class MetricsService {
  private metrics = new Map<string, MetricRegistration>();
  private defaultMaxRecentValues = 1000; // Default max values to keep for histograms
  private batchedOperations: Array<() => void> = [];
  private batchScheduled = false;
  private readonly batchInterval = 500; // 500ms batch interval
  
  constructor() {
    // Register core system metrics
    this.registerGauge('system_memory_usage_bytes', 'Memory usage of the application in bytes');
    this.registerGauge('system_memory_rss_bytes', 'Resident Set Size of the application in bytes');
    this.registerGauge('system_cpu_usage_percent', 'CPU usage percentage');
    this.registerCounter('system_uptime_seconds', 'Application uptime in seconds');
    this.registerCounter('system_gc_runs', 'Number of garbage collection runs');
    
    // Start collecting system metrics
    this.startSystemMetricsCollection();
  }

  /**
   * Collect system metrics at regular intervals
   */
  private startSystemMetricsCollection(): void {
    if (typeof process !== 'undefined') {
      // Collect every 30 seconds
      setInterval(() => {
        try {
          const memoryUsage = process.memoryUsage();
          this.updateGauge('system_memory_usage_bytes', memoryUsage.heapUsed);
          this.updateGauge('system_memory_rss_bytes', memoryUsage.rss);
          
          // Get uptime in seconds
          this.setCounter('system_uptime_seconds', Math.floor(process.uptime()));
        } catch (error) {
          // Non-fatal
          logger.debug('Error collecting system metrics', { error: String(error) });
        }
      }, 30000);
    }
  }

  /**
   * Schedule a batch operation
   */
  private scheduleBatch(operation: () => void): void {
    this.batchedOperations.push(operation);
    
    if (!this.batchScheduled) {
      this.batchScheduled = true;
      setTimeout(() => this.processBatch(), this.batchInterval);
    }
  }

  /**
   * Process all batched operations
   */
  private processBatch(): void {
    const operations = [...this.batchedOperations];
    this.batchedOperations = [];
    this.batchScheduled = false;
    
    for (const op of operations) {
      try {
        op();
      } catch (error) {
        logger.warn('Error processing batched metric operation', { error: String(error) });
      }
    }
  }

  /**
   * Get or create a metric registration
   */
  private getOrCreateMetric(options: MetricOptions): MetricRegistration {
    const { name, type, description = '', labels = [] } = options;
    
    if (this.metrics.has(name)) {
      const existing = this.metrics.get(name)!;
      
      // Validate type matches
      if (existing.type !== type) {
        logger.warn(`Metric ${name} already exists with different type: ${existing.type} vs ${type}`);
      }
      
      return existing;
    }
    
    // Create a new registration
    const registration: MetricRegistration = {
      name,
      type,
      description,
      labels,
      unit: options.unit,
      values: new Map(),
      options
    };
    
    this.metrics.set(name, registration);
    logger.debug(`Registered metric: ${name} (${type})`);
    
    return registration;
  }

  /**
   * Create a label hash for lookups
   */
  private getLabelHash(labels: Record<string, string> = {}): string {
    // For no labels, use a consistent key
    if (Object.keys(labels).length === 0) {
      return '__no_labels__';
    }
    
    // Sort keys for consistent hashing
    const sortedKeys = Object.keys(labels).sort();
    return sortedKeys.map(key => `${key}:${labels[key]}`).join(',');
  }

  /**
   * Register a counter metric
   */
  registerCounter(name: string, description: string = '', labels: string[] = []): void {
    try {
      this.getOrCreateMetric({
        name,
        description,
        type: MetricType.COUNTER,
        labels
      });
    } catch (error) {
      logger.warn(`Failed to register counter ${name}`, { error: String(error) });
    }
  }

  /**
   * Register a gauge metric
   */
  registerGauge(name: string, description: string = '', labels: string[] = []): void {
    try {
      this.getOrCreateMetric({
        name,
        description,
        type: MetricType.GAUGE,
        labels
      });
    } catch (error) {
      logger.warn(`Failed to register gauge ${name}`, { error: String(error) });
    }
  }

  /**
   * Register a histogram metric
   */
  registerHistogram(
    name: string, 
    description: string = '', 
    options: Partial<MetricOptions> = {}
  ): void {
    try {
      // Default buckets if not provided
      const buckets = options.buckets || [
        0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10
      ];
      
      this.getOrCreateMetric({
        name,
        description,
        type: MetricType.HISTOGRAM,
        labels: options.labels || [],
        buckets,
        maxAgeSeconds: options.maxAgeSeconds || 60, // 1 minute default
        unit: options.unit
      });
    } catch (error) {
      logger.warn(`Failed to register histogram ${name}`, { error: String(error) });
    }
  }

  /**
   * Register a summary metric (with quantiles)
   */
  registerSummary(
    name: string, 
    description: string = '', 
    options: Partial<MetricOptions> = {}
  ): void {
    try {
      // Default quantiles if not provided
      const quantiles = options.quantiles || [0.5, 0.9, 0.95, 0.99];
      
      this.getOrCreateMetric({
        name,
        description,
        type: MetricType.SUMMARY,
        labels: options.labels || [],
        quantiles,
        maxAgeSeconds: options.maxAgeSeconds || 60, // 1 minute default
        unit: options.unit
      });
    } catch (error) {
      logger.warn(`Failed to register summary ${name}`, { error: String(error) });
    }
  }

  /**
   * Increment a counter by a specified amount
   */
  increment(name: string, value: number = 1, labels: Record<string, string> = {}): void {
    try {
      if (value < 0) {
        logger.warn(`Counter ${name} received negative increment: ${value}`);
        return;
      }
      
      this.scheduleBatch(() => {
        const metric = this.metrics.get(name);
        if (!metric) {
          // Auto-register if not found
          this.registerCounter(name);
          this.increment(name, value, labels);
          return;
        }
        
        if (metric.type !== MetricType.COUNTER) {
          logger.warn(`Metric ${name} is not a counter, but a ${metric.type}`);
          return;
        }
        
        const labelHash = this.getLabelHash(labels);
        const currentValue = (metric.values.get(labelHash) as number) || 0;
        metric.values.set(labelHash, currentValue + value);
      });
    } catch (error) {
      logger.warn(`Failed to increment counter ${name}`, { error: String(error) });
    }
  }

  /**
   * Set a counter to an absolute value (only if greater than current)
   */
  setCounter(name: string, value: number, labels: Record<string, string> = {}): void {
    try {
      if (value < 0) {
        logger.warn(`Counter ${name} cannot be set to negative value: ${value}`);
        return;
      }
      
      this.scheduleBatch(() => {
        const metric = this.metrics.get(name);
        if (!metric) {
          // Auto-register if not found
          this.registerCounter(name);
          this.setCounter(name, value, labels);
          return;
        }
        
        if (metric.type !== MetricType.COUNTER) {
          logger.warn(`Metric ${name} is not a counter, but a ${metric.type}`);
          return;
        }
        
        const labelHash = this.getLabelHash(labels);
        const currentValue = (metric.values.get(labelHash) as number) || 0;
        
        // Only update if the new value is greater
        if (value > currentValue) {
          metric.values.set(labelHash, value);
        }
      });
    } catch (error) {
      logger.warn(`Failed to set counter ${name}`, { error: String(error) });
    }
  }

  /**
   * Update a gauge to a new value
   */
  updateGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    try {
      this.scheduleBatch(() => {
        const metric = this.metrics.get(name);
        if (!metric) {
          // Auto-register if not found
          this.registerGauge(name);
          this.updateGauge(name, value, labels);
          return;
        }
        
        if (metric.type !== MetricType.GAUGE) {
          logger.warn(`Metric ${name} is not a gauge, but a ${metric.type}`);
          return;
        }
        
        const labelHash = this.getLabelHash(labels);
        metric.values.set(labelHash, value);
      });
    } catch (error) {
      logger.warn(`Failed to update gauge ${name}`, { error: String(error) });
    }
  }

  /**
   * Increment or decrement a gauge
   */
  adjustGauge(name: string, adjustment: number, labels: Record<string, string> = {}): void {
    try {
      this.scheduleBatch(() => {
        const metric = this.metrics.get(name);
        if (!metric) {
          // Auto-register if not found
          this.registerGauge(name);
          this.updateGauge(name, adjustment, labels); // Start at adjustment value
          return;
        }
        
        if (metric.type !== MetricType.GAUGE) {
          logger.warn(`Metric ${name} is not a gauge, but a ${metric.type}`);
          return;
        }
        
        const labelHash = this.getLabelHash(labels);
        const currentValue = (metric.values.get(labelHash) as number) || 0;
        metric.values.set(labelHash, currentValue + adjustment);
      });
    } catch (error) {
      logger.warn(`Failed to adjust gauge ${name}`, { error: String(error) });
    }
  }

  /**
   * Record a single observation in a histogram
   */
  updateHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    try {
      this.scheduleBatch(() => {
        const metric = this.metrics.get(name);
        if (!metric) {
          // Auto-register if not found
          this.registerHistogram(name);
          this.updateHistogram(name, value, labels);
          return;
        }
        
        if (metric.type !== MetricType.HISTOGRAM) {
          logger.warn(`Metric ${name} is not a histogram, but a ${metric.type}`);
          return;
        }
        
        const labelHash = this.getLabelHash(labels);
        let histData = metric.values.get(labelHash) as HistogramData;
        
        // Initialize histogram data if it doesn't exist
        if (!histData) {
          const buckets = (metric.options.buckets || []).map(le => ({ le, count: 0 }));
          histData = {
            buckets,
            count: 0,
            sum: 0,
            min: undefined,
            max: undefined,
            recentValues: [],
            maxRecentValues: this.defaultMaxRecentValues
          };
          metric.values.set(labelHash, histData);
        }
        
        // Update histogram data
        histData.count++;
        histData.sum += value;
        histData.min = histData.min === undefined ? value : Math.min(histData.min, value);
        histData.max = histData.max === undefined ? value : Math.max(histData.max, value);
        
        // Update buckets
        for (const bucket of histData.buckets) {
          if (value <= bucket.le) {
            bucket.count++;
          }
        }
        
        // Store recent values for percentile calculation (with rolling window)
        histData.recentValues.push(value);
        if (histData.recentValues.length > histData.maxRecentValues) {
          histData.recentValues.shift();
        }
      });
    } catch (error) {
      logger.warn(`Failed to update histogram ${name}`, { error: String(error) });
    }
  }

  /**
   * Record a timing duration in a histogram
   */
  timing(name: string, durationMs: number, labels: Record<string, string> = {}): void {
    try {
      if (durationMs < 0) {
        logger.warn(`Timing ${name} received negative duration: ${durationMs}`);
        return;
      }
      
      const timerName = name.endsWith('_seconds') || name.endsWith('_milliseconds') 
        ? name 
        : `${name}_milliseconds`;
        
      this.updateHistogram(timerName, durationMs, labels);
    } catch (error) {
      logger.warn(`Failed to record timing ${name}`, { error: String(error) });
    }
  }

  /**
   * Start a timer that records duration when stopped
   */
  startTimer(name: string, labels: Record<string, string> = {}): () => void {
    const start = Date.now();
    return () => {
      try {
        const duration = Date.now() - start;
        this.timing(name, duration, labels);
      } catch (error) {
        logger.warn(`Failed to stop timer ${name}`, { error: String(error) });
      }
    };
  }

  /**
   * Generate a Prometheus-compatible metrics report
   */
  async getMetricsReport(): Promise<string> {
    const lines: string[] = [];
    
    try {
      // First, process any pending batched operations
      if (this.batchedOperations.length > 0) {
        this.processBatch();
      }
      
      // Process each registered metric
      for (const [name, metric] of this.metrics.entries()) {
        // Add metric metadata as comments
        lines.push(`# HELP ${name} ${metric.description || name}`);
        lines.push(`# TYPE ${name} ${metric.type}`);
        
        // Handle different metric types
        for (const [labelHash, value] of metric.values.entries()) {
          // Extract labels
          const labelStr = this.formatLabels(labelHash, metric.labels);
          
          if (metric.type === MetricType.COUNTER || metric.type === MetricType.GAUGE) {
            lines.push(`${name}${labelStr} ${value}`);
          } else if (metric.type === MetricType.HISTOGRAM) {
            const histData = value as HistogramData;
            
            // Add bucket lines
            for (const bucket of histData.buckets) {
              lines.push(`${name}_bucket${labelStr}{le="${bucket.le}"} ${bucket.count}`);
            }
            
            // Add sum and count lines
            lines.push(`${name}_sum${labelStr} ${histData.sum}`);
            lines.push(`${name}_count${labelStr} ${histData.count}`);
            
            // Calculate and add percentiles if we have data
            if (histData.recentValues.length > 0) {
              const sorted = [...histData.recentValues].sort((a, b) => a - b);
              
              lines.push(`# HELP ${name}_percentile Percentiles for ${name}`);
              lines.push(`# TYPE ${name}_percentile gauge`);
              
              // Add p50, p90, p95, p99 percentiles
              const percentiles = [0.5, 0.9, 0.95, 0.99];
              for (const p of percentiles) {
                const index = Math.min(
                  Math.floor(p * sorted.length),
                  sorted.length - 1
                );
                const value = sorted[index];
                lines.push(`${name}_percentile${labelStr}{quantile="${p}"} ${value}`);
              }
            }
          } else if (metric.type === MetricType.SUMMARY) {
            // For summary, we use the same data structure as histogram
            const histData = value as HistogramData;
            
            // Just output sum and count for simple summaries
            lines.push(`${name}_sum${labelStr} ${histData.sum}`);
            lines.push(`${name}_count${labelStr} ${histData.count}`);
          }
        }
        
        // Add spacing between metrics
        lines.push('');
      }
      
      return lines.join('\n');
    } catch (error) {
      logger.error('Failed to generate metrics report', { error: String(error) });
      return '# Error generating metrics report';
    }
  }

  /**
   * Format labels for Prometheus output
   */
  private formatLabels(labelHash: string, metricLabels: string[]): string {
    if (labelHash === '__no_labels__') {
      return '';
    }
    
    try {
      // Parse labelHash back into labels
      const labelPairs = labelHash.split(',');
      const labels: Record<string, string> = {};
      
      for (const pair of labelPairs) {
        const [key, ...valueParts] = pair.split(':');
        labels[key] = valueParts.join(':'); // Rejoin in case value contained colons
      }
      
      // Format as Prometheus labels
      const formattedLabels = Object.entries(labels)
        .filter(([key]) => metricLabels.includes(key)) // Only include defined labels
        .map(([key, value]) => `${key}="${this.escapeValue(value)}"`)
        .join(',');
      
      return formattedLabels ? `{${formattedLabels}}` : '';
    } catch {
      return '';
    }
  }

  /**
   * Escape label values for Prometheus
   */
  private escapeValue(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    this.metrics.clear();
    this.batchedOperations = [];
    this.batchScheduled = false;
    
    // Re-register system metrics
    this.registerGauge('system_memory_usage_bytes', 'Memory usage of the application in bytes');
    this.registerGauge('system_memory_rss_bytes', 'Resident Set Size of the application in bytes');
    this.registerGauge('system_cpu_usage_percent', 'CPU usage percentage');
    this.registerCounter('system_uptime_seconds', 'Application uptime in seconds');
  }
}

// Export singleton instance
export const metrics = new MetricsService();

// Export convenience method
export async function getMetrics(): Promise<string> {
  return metrics.getMetricsReport();
}