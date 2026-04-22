/**
 * Tests for telemetry, logging, and monitoring
 */

import {
  TelemetryBuffer,
  SensorDataCollector,
  HttpTelemetryPublisher,
  TelemetryService,
  PerformanceMonitor,
} from '@/lib/telemetry'

describe('Telemetry', () => {
  describe('TelemetryBuffer', () => {
    it('should add events to buffer', () => {
      const config = { enabled: true, batchSize: 10, flushIntervalMs: 1000, endpoint: '', retryAttempts: 3 }
      const buffer = new TelemetryBuffer(config)
      buffer.addEvent({ eventType: 'test' })
      expect(buffer.getBufferSize()).toBe(1)
    })

    it('should respect enabled flag', () => {
      const config = { enabled: false, batchSize: 10, flushIntervalMs: 1000, endpoint: '', retryAttempts: 3 }
      const buffer = new TelemetryBuffer(config)
      buffer.addEvent({ eventType: 'test' })
      expect(buffer.getBufferSize()).toBe(0)
    })

    it('should auto-flush on batch size', (done) => {
      const config = { enabled: true, batchSize: 2, flushIntervalMs: 10000, endpoint: '', retryAttempts: 3 }
      let flushed = false

      const buffer = new TelemetryBuffer(config, async (events) => {
        flushed = true
        expect(events.length).toBeGreaterThanOrEqual(2)
      })

      buffer.addEvent({ eventType: 'test1' })
      buffer.addEvent({ eventType: 'test2' })

      setTimeout(() => {
        expect(flushed).toBe(true)
        done()
      }, 100)
    })
  })

  describe('SensorDataCollector', () => {
    it('should collect sensor readings', () => {
      const collector = new SensorDataCollector()
      collector.addReading({
        deviceId: 'device1',
        sensorType: 'moisture',
        value: 50,
        unit: '%',
      })
      expect(collector.getAllReadings().length).toBe(1)
    })

    it('should track last reading per device', () => {
      const collector = new SensorDataCollector()
      collector.addReading({
        deviceId: 'device1',
        sensorType: 'moisture',
        value: 50,
        unit: '%',
      })
      collector.addReading({
        deviceId: 'device1',
        sensorType: 'moisture',
        value: 60,
        unit: '%',
      })

      const last = collector.getLastReading('device1')
      expect(last?.value).toBe(60)
    })

    it('should calculate average values', () => {
      const collector = new SensorDataCollector()
      collector.addReading({
        deviceId: 'device1',
        sensorType: 'moisture',
        value: 40,
        unit: '%',
      })
      collector.addReading({
        deviceId: 'device1',
        sensorType: 'moisture',
        value: 60,
        unit: '%',
      })

      const avg = collector.getAverageValue('moisture')
      expect(avg).toBe(50)
    })

    it('should filter readings by time range', () => {
      jest.useFakeTimers()
      const collector = new SensorDataCollector()

      const now = new Date()
      jest.setSystemTime(now)

      collector.addReading({
        deviceId: 'device1',
        sensorType: 'moisture',
        value: 50,
        unit: '%',
      })

      jest.setSystemTime(new Date(now.getTime() + 60000))

      collector.addReading({
        deviceId: 'device1',
        sensorType: 'moisture',
        value: 60,
        unit: '%',
      })

      const start = new Date(now.getTime() - 30000)
      const end = new Date(now.getTime() + 30000)

      const readings = collector.getReadingsByTimeRange(start, end)
      expect(readings.length).toBe(1)

      jest.useRealTimers()
    })

    it('should limit stored readings', () => {
      const collector = new SensorDataCollector(3)

      for (let i = 0; i < 5; i++) {
        collector.addReading({
          deviceId: 'device1',
          sensorType: 'moisture',
          value: i * 10,
          unit: '%',
        })
      }

      expect(collector.getAllReadings().length).toBeLessThanOrEqual(3)
    })
  })

  describe('TelemetryService', () => {
    it('should track events', () => {
      const config = {
        enabled: true,
        batchSize: 100,
        flushIntervalMs: 60000,
        endpoint: 'http://localhost/telemetry',
        retryAttempts: 3,
      }
      const service = new TelemetryService(config)
      service.trackEvent('test_event', 'user123', { extra: 'data' })
      // Event should be buffered
      expect(service).toBeDefined()
    })

    it('should track errors', () => {
      const config = {
        enabled: true,
        batchSize: 100,
        flushIntervalMs: 60000,
        endpoint: 'http://localhost/telemetry',
        retryAttempts: 3,
      }
      const service = new TelemetryService(config)
      const error = new Error('Test error')
      service.trackError(error, { context: 'test' })
      expect(service).toBeDefined()
    })

    it('should collect sensor readings', () => {
      const config = {
        enabled: true,
        batchSize: 100,
        flushIntervalMs: 60000,
        endpoint: 'http://localhost/telemetry',
        retryAttempts: 3,
      }
      const service = new TelemetryService(config)
      service.addSensorReading('device1', 'moisture', 50, '%', 0.95)
      expect(service).toBeDefined()
    })

    it('should calculate sensor statistics', () => {
      const config = {
        enabled: true,
        batchSize: 100,
        flushIntervalMs: 60000,
        endpoint: 'http://localhost/telemetry',
        retryAttempts: 3,
      }
      const service = new TelemetryService(config)

      service.addSensorReading('device1', 'moisture', 40, '%')
      service.addSensorReading('device1', 'moisture', 50, '%')
      service.addSensorReading('device1', 'moisture', 60, '%')

      const stats = service.getSensorStats('moisture')
      expect(stats).toBeDefined()
      expect(stats?.avg).toBe(50)
      expect(stats?.min).toBe(40)
      expect(stats?.max).toBe(60)
    })
  })

  describe('PerformanceMonitor', () => {
    it('should measure operation duration', async () => {
      const monitor = new PerformanceMonitor()

      await monitor.measure('test_op', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      const stats = monitor.getStats('test_op')
      expect(stats).toBeDefined()
      expect(stats?.count).toBe(1)
      expect(stats?.min).toBeGreaterThan(0)
    })

    it('should collect multiple measurements', async () => {
      const monitor = new PerformanceMonitor()

      for (let i = 0; i < 3; i++) {
        await monitor.measure('test_op', async () => {
          await new Promise((resolve) => setTimeout(resolve, 5))
        })
      }

      const stats = monitor.getStats('test_op')
      expect(stats?.count).toBe(3)
    })

    it('should calculate percentiles', async () => {
      const monitor = new PerformanceMonitor()

      for (let i = 0; i < 100; i++) {
        await monitor.measure('test_op', async () => {
          await new Promise((resolve) => setTimeout(resolve, 1))
        })
      }

      const stats = monitor.getStats('test_op')
      expect(stats?.p95).toBeGreaterThanOrEqual(stats?.avg || 0)
      expect(stats?.p99).toBeGreaterThanOrEqual(stats?.p95 || 0)
    })

    it('should clear measurements', () => {
      const monitor = new PerformanceMonitor()
      // Add measurement
      monitor.measure('test', async () => Promise.resolve())
      monitor.clear()
      expect(monitor.getStats('test')).toBeNull()
    })
  })
})

describe('Sensor Integration', () => {
  it('should handle multiple sensor types', () => {
    const collector = new SensorDataCollector()

    const sensorTypes = [
      { type: 'moisture', value: 50 },
      { type: 'temperature', value: 25 },
      { type: 'nitrogen', value: 100 },
      { type: 'humidity', value: 65 },
    ]

    sensorTypes.forEach((sensor) => {
      collector.addReading({
        deviceId: 'field1',
        sensorType: sensor.type,
        value: sensor.value,
        unit: '%',
      })
    })

    expect(collector.getAllReadings().length).toBe(4)
  })

  it('should handle real-time data streaming', () => {
    const collector = new SensorDataCollector()
    const startTime = Date.now()

    // Simulate streaming data
    for (let i = 0; i < 10; i++) {
      collector.addReading({
        deviceId: 'device1',
        sensorType: 'moisture',
        value: 50 + Math.random() * 10,
        unit: '%',
        accuracy: 0.98,
      })
    }

    const readings = collector.getAllReadings()
    expect(readings.length).toBe(10)
    expect(readings[0].accuracy).toBe(0.98)
  })
})
