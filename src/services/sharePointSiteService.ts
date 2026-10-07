import { RetrieveEnvironmentVariableValueService } from '../generated/services/RetrieveEnvironmentVariableValueService'

export async function getSharePointSiteUrl() {
  const result = await RetrieveEnvironmentVariableValueService.RetrieveEnvironmentVariableValue(
    'aur_sharepoint_site_url',
  )
  const value = result.data?.Value

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('SharePoint site URL is not configured in this environment.')
  }

  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    throw new Error('The configured SharePoint site URL is invalid.')
  }

  if (url.protocol !== 'https:') {
    throw new Error('The configured SharePoint site URL must use HTTPS.')
  }

  return url.toString().replace(/\/+$/, '')
}
