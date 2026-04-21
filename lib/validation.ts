/**
 * Input validation functions for agricultural data
 */

export interface CropData {
  crop_name: string
  crop_type?: string
  field_size?: number
  location?: string
  sowing_date?: string
}

export interface SensorData {
  moisture?: number
  temperature?: number
  nitrogen?: number
  phosphorus?: number
  potassium?: number
}

export interface YieldPredictionInput extends CropData {
  sensor?: SensorData
}

/**
 * Validate crop name - must be non-empty string
 */
export function validateCropName(name: string | undefined): { valid: boolean; error?: string } {
  if (!name) {
    return { valid: false, error: 'Crop name is required' }
  }
  if (typeof name !== 'string') {
    return { valid: false, error: 'Crop name must be a string' }
  }
  if (name.trim().length === 0) {
    return { valid: false, error: 'Crop name cannot be empty' }
  }
  if (name.length > 100) {
    return { valid: false, error: 'Crop name must be less than 100 characters' }
  }
  return { valid: true }
}

/**
 * Validate base64 image string
 */
export function validateBase64Image(image: string | undefined): { valid: boolean; error?: string } {
  if (!image) {
    return { valid: false, error: 'Image is required' }
  }
  if (typeof image !== 'string') {
    return { valid: false, error: 'Image must be a string' }
  }
  if (image.length > 20_000_000) {
    return { valid: false, error: 'Image too large. Please upload an image under 15MB.' }
  }
  if (!/^data:image\/(png|jpg|jpeg|webp);base64,/.test(image) && !/^[A-Za-z0-9+/=]+$/.test(image)) {
    return { valid: false, error: 'Invalid image format' }
  }
  return { valid: true }
}

/**
 * Validate sensor data values are in reasonable ranges
 */
export function validateSensorData(sensor: SensorData | undefined): { valid: boolean; error?: string } {
  if (!sensor) {
    return { valid: true } // sensor data is optional
  }

  if (sensor.moisture !== undefined) {
    if (typeof sensor.moisture !== 'number' || sensor.moisture < 0 || sensor.moisture > 100) {
      return { valid: false, error: 'Soil moisture must be between 0-100%' }
    }
  }

  if (sensor.temperature !== undefined) {
    if (typeof sensor.temperature !== 'number' || sensor.temperature < -50 || sensor.temperature > 60) {
      return { valid: false, error: 'Temperature must be between -50°C and 60°C' }
    }
  }

  if (sensor.nitrogen !== undefined) {
    if (typeof sensor.nitrogen !== 'number' || sensor.nitrogen < 0 || sensor.nitrogen > 500) {
      return { valid: false, error: 'Nitrogen levels must be between 0-500 kg/ha' }
    }
  }

  if (sensor.phosphorus !== undefined) {
    if (typeof sensor.phosphorus !== 'number' || sensor.phosphorus < 0 || sensor.phosphorus > 500) {
      return { valid: false, error: 'Phosphorus levels must be between 0-500 kg/ha' }
    }
  }

  if (sensor.potassium !== undefined) {
    if (typeof sensor.potassium !== 'number' || sensor.potassium < 0 || sensor.potassium > 500) {
      return { valid: false, error: 'Potassium levels must be between 0-500 kg/ha' }
    }
  }

  return { valid: true }
}

/**
 * Validate field size
 */
export function validateFieldSize(size: number | undefined): { valid: boolean; error?: string } {
  if (size === undefined) {
    return { valid: true } // optional field
  }
  if (typeof size !== 'number' || size <= 0 || size > 10000) {
    return { valid: false, error: 'Field size must be between 0 and 10000 hectares' }
  }
  return { valid: true }
}

/**
 * Validate location string
 */
export function validateLocation(location: string | undefined): { valid: boolean; error?: string } {
  if (!location) {
    return { valid: true } // optional field
  }
  if (typeof location !== 'string') {
    return { valid: false, error: 'Location must be a string' }
  }
  if (location.length > 200) {
    return { valid: false, error: 'Location must be less than 200 characters' }
  }
  return { valid: true }
}

/**
 * Validate complete yield prediction input
 */
export function validateYieldPredictionInput(input: YieldPredictionInput): {
  valid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  const cropNameValidation = validateCropName(input.crop_name)
  if (!cropNameValidation.valid) {
    errors.crop_name = cropNameValidation.error || 'Invalid crop name'
  }

  const sensorValidation = validateSensorData(input.sensor)
  if (!sensorValidation.valid) {
    errors.sensor = sensorValidation.error || 'Invalid sensor data'
  }

  const fieldSizeValidation = validateFieldSize(input.field_size)
  if (!fieldSizeValidation.valid) {
    errors.field_size = fieldSizeValidation.error || 'Invalid field size'
  }

  const locationValidation = validateLocation(input.location)
  if (!locationValidation.valid) {
    errors.location = locationValidation.error || 'Invalid location'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
