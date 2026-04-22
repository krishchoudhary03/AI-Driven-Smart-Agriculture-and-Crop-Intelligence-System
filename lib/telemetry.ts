/**
 * Telemetry and monitoring utilities for real-time data collection
 */

export interface TelemetryEvent {
  timestamp: string
  eventType: string
  userId?: string
  metadata?: Record<string, unknown>
  duration?: number
}

export interface SensorReading {
  timestamp: string
  deviceId: string
  sensorType: string
  value: number
  unit: string
  accuracy?: number
}

export interface TelemetryConfig {
  enabled: boolean
  batchSize: number
  flushIntervalMs: number
  endpoint: string
  retryAttempts: number
}

/**
 * Telemetry buffer for batching events
 */
export class TelemetryBuffer {
  private buffer: TelemetryEvent[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor(
    private config: TelemetryConfig,
    private onFlush?: (events: TelemetryEvent[]) => Promise<void>
  ) {
    this.startAutoFlush()
  }

  /**
   * Add event to buffer
   */
  addEvent(event: Omit<TelemetryEvent, 'timestamp'>): void {
    if (!this.config.enabled) return

    const telemetryEvent: TelemetryEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    }

    this.buffer.push(telemetryEvent)

    if (this.buffer.length >= this.config.batchSize) {
      this.flush()
    }
  }

  /**
   * Flush buffered events
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return

    const events = this.buffer.splice(0)

    if (this.onFlush) {
      try {
        await this.onFlush(events)
      } catch (error) {
        console.error('Failed to flush telemetry:', error)
        // Re-add events to buffer for retry
        this.buffer.unshift(...events)
      }
    }
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    this.flushInterval = setInterval(
      () => this.flush(),
      this.config.flushIntervalMs
    )
  }

  /**
   * Stop auto-flush and flush remaining events
   */
  async stop(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    await this.flush()
  }

  /**
   * Get buffer size
   */
  getBufferSize(): number {
    return this.buffer.length
  }
}

/**
 * Real-time sensor data collector
 */
export class SensorDataCollector {
  private readings: SensorReading[] = []
  private lastReading: Map<string, SensorReading> = new Map()

  constructor(private maxReadings: number = 1000) {}

  /**
   * Add sensor reading
   */
  addReading(reading: Omit<SensorReading, 'timestamp'>): void {
    const sensorReading: SensorReading = {
      ...reading,
      timestamp: new Date().toISOString(),
    }

    this.readings.push(sensorReading)
    this.lastReading.set(reading.deviceId, sensorReading)

    // Keep only recent readings
    if (this.readings.length > this.maxReadings) {
      this.readings.shift()
    }
  }

  /**
   * Get last reading for a device
   */
  getLastReading(deviceId: string): SensorReading | undefined {
    return this.lastReading.get(deviceId)
  }

  /**
   * Get readings in time range
   */
  getReadingsByTimeRange(
    startTime: Date,
    endTime: Date
  ): SensorReading[] {
    const start = startTime.getTime()
    const end = endTime.getTime()

    return this.readings.filter((reading) => {
      const time = new Date(reading.timestamp).getTime()
      return time >= start && time <= end
    })
  }

  /**
   * Get average value for sensor type
   */
  getAverageValue(sensorType: string): number {
    const readings = this.readings.filter((r) => r.sensorType === sensorType)

    if (readings.length === 0) return 0

    return (
      readings.reduce((sum, r) => sum + r.value, 0) / readings.length
    )
  }

  /**
   * Get all readings
   */
  getAllReadings(): SensorReading[] {
    return [...this.readings]
  }

  /**
   * Clear readings
   */
  clearReadings(): void {
    this.readings = []
    this.lastReading.clear()
  }
}

/**
 * MQTT-based telemetry publisher
 */
export interface MqttConfig {
  brokerUrl: string
  clientId: string
  username?: string
  password?: string
  topics: Record<string, string>
}

/**
 * HTTP-based telemetry publisher
 */
export class HttpTelemetryPublisher {
  constructor(private endpoint: string) {}

  /**
   * Publish events via HTTP
   */
  async publish(events: TelemetryEvent[]): Promise<void> {
    try {
      // Skip publishing on server-side (Node.js context)
      if (typeof window === 'undefined') {
        return // Only publish from browser
      }

      // Construct absolute URL for client-side requests
      let url = this.endpoint
      if (!url.startsWith('http') && typeof window !== 'undefined') {
        const protocol = window.location.protocol
        const host = window.location.host
        url = `${protocol}//${host}${url}`
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to publish telemetry:', error)
      throw error
    }
  }
}

/**
 * Local storage telemetry publisher (fallback)
 */
export class LocalStorageTelemetryPublisher {
  private storageKey = 'telemetry_buffer'

  /**
   * Save events to local storage
   */
  async publish(events: TelemetryEvent[]): Promise<void> {
    try {
      const existing = this.getStoredEvents()
      const updated = [...existing, ...events]
      const truncated = updated.slice(-1000) // Keep last 1000 events

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.storageKey, JSON.stringify(truncated))
      }
    } catch (error) {
      console.error('Failed to save telemetry to storage:', error)
    }
  }

  /**
   * Get stored events
   */
  getStoredEvents(): TelemetryEvent[] {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return []
      }

      const stored = window.localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to retrieve telemetry:', error)
      return []
    }
  }

  /**
   * Clear stored events
   */
  clearStoredEvents(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(this.storageKey)
    }
  }
}

/**
 * Telemetry service orchestrator
 */
export class TelemetryService {
  private buffer: TelemetryBuffer
  private sensorCollector: SensorDataCollector
  private httpPublisher: HttpTelemetryPublisher

  constructor(config: TelemetryConfig) {
    this.httpPublisher = new HttpTelemetryPublisher(config.endpoint)
    this.sensorCollector = new SensorDataCollector()
    this.buffer = new TelemetryBuffer(config, (events) =>
      this.httpPublisher.publish(events)
    )
  }

  /**
   * Track event
   */
  trackEvent(
    eventType: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.buffer.addEvent({
      eventType,
      userId,
      metadata,
    })
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: Record<string, unknown>): void {
    this.trackEvent('error', undefined, {
      message: error.message,
      stack: error.stack,
      ...context,
    })
  }

  /**
   * Track sensor reading
   */
  addSensorReading(
    deviceId: string,
    sensorType: string,
    value: number,
    unit: string,
    accuracy?: number
  ): void {
    this.sensorCollector.addReading({
      deviceId,
      sensorType,
      value,
      unit,
      accuracy,
    })

    // Also track as telemetry event
    this.trackEvent('sensor_reading', undefined, {
      deviceId,
      sensorType,
      value,
      unit,
    })
  }

  /**
   * Get sensor statistics
   */
  getSensorStats(sensorType: string) {
    const readings = this.sensorCollector
      .getAllReadings()
      .filter((r) => r.sensorType === sensorType)

    if (readings.length === 0) {
      return null
    }

    const values = readings.map((r) => r.value)
    const sorted = [...values].sort((a, b) => a - b)

    return {
      count: readings.length,
      avg: readings.reduce((a, b) => a + b.value, 0) / readings.length,
      min: Math.min(...values),
      max: Math.max(...values),
      median:
        sorted[Math.floor(sorted.length / 2)],
      latest: this.sensorCollector.getLastReading(
        readings[readings.length - 1]?.deviceId || ''
      ),
    }
  }

  /**
   * Flush pending telemetry
   */
  async flush(): Promise<void> {
    await this.buffer.flush()
  }

  /**
   * Stop service and flush
   */
  async stop(): Promise<void> {
    await this.buffer.stop()
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map()

  /**
   * Measure operation duration
   */
  async measure<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now()

    try {
      return await fn()
    } finally {
      const duration = performance.now() - start
      this.recordMeasurement(label, duration)
    }
  }

  /**
   * Record measurement
   */
  private recordMeasurement(label: string, duration: number): void {
    if (!this.measurements.has(label)) {
      this.measurements.set(label, [])
    }
    this.measurements.get(label)?.push(duration)
  }

  /**
   * Get measurements statistics
   */
  getStats(label: string) {
    const measurements = this.measurements.get(label) || []

    if (measurements.length === 0) return null

    const sorted = [...measurements].sort((a, b) => a - b)
    return {
      count: measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      avg: measurements.reduce((a, b) => a + b, 0) / measurements.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    }
  }

  /**
   * Clear measurements
   */
  clear(): void {
    this.measurements.clear()
  }
}
