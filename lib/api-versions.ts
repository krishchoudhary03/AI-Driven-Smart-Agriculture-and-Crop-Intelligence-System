export const API_VERSIONS = {
  V1: 'v1',
  V2: 'v2',
} as const

export type ApiVersion = typeof API_VERSIONS[keyof typeof API_VERSIONS]

export const DEFAULT_API_VERSION: ApiVersion = 'v2'
export const SUPPORTED_VERSIONS: ApiVersion[] = ['v1', 'v2']

export function getApiVersion(headers: Headers): ApiVersion {
  const headerVersion = headers.get('x-api-version')
  if (headerVersion && SUPPORTED_VERSIONS.includes(headerVersion as ApiVersion)) {
    return headerVersion as ApiVersion
  }
  return DEFAULT_API_VERSION
}

export const responseFormatters = {
  v1: (data: any) => ({
    success: data.error ? false : true,
    data,
    timestamp: new Date().toISOString(),
  }),
  v2: (data: any) => ({
    status: data.error ? 'error' : 'success',
    data,
    timestamp: new Date().toISOString(),
    apiVersion: 'v2',
  }),
}
