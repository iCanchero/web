const bundleIdPattern = /^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/
const fingerprintPattern = /^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/
const placeholderFingerprint =
  'AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99'

function configurationError(platform: string) {
  console.error(
    `[well-known] Invalid or missing ${platform} app association configuration`,
  )
  return Response.json(
    { error: 'App association is not configured.' },
    { status: 503, headers: { 'cache-control': 'no-store' } },
  )
}

function associationResponse(body: unknown) {
  return Response.json(body, {
    headers: { 'cache-control': 'public, max-age=300' },
  })
}

export function appleAppAssociation() {
  const bundleId = process.env.IOS_BUNDLE_ID?.trim() ?? ''
  const prefix = process.env.APPLE_TEAM_ID?.trim() ?? ''
  const appId = process.env.IOS_APP_ID?.trim() || `${prefix}.${bundleId}`
  const separator = appId.indexOf('.')
  const appPrefix = appId.slice(0, separator)
  const appBundleId = appId.slice(separator + 1)

  if (
    !/^[A-Z0-9]{10}$/.test(appPrefix) ||
    !bundleIdPattern.test(appBundleId) ||
    (bundleId && appBundleId !== bundleId)
  ) {
    return configurationError('iOS')
  }

  return associationResponse({
    applinks: {
      apps: [],
      details: [{ appID: appId, paths: ['*'] }],
    },
  })
}

export function androidAppAssociation() {
  const packageName = process.env.ANDROID_PACKAGE_NAME?.trim() ?? ''
  const fingerprints = [
    ...new Set(
      (process.env.ANDROID_SHA256_FINGERPRINTS ?? '')
        .split(',')
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean),
    ),
  ]

  if (
    !bundleIdPattern.test(packageName) ||
    fingerprints.length === 0 ||
    fingerprints.some(
      (value) =>
        !fingerprintPattern.test(value) || value === placeholderFingerprint,
    )
  ) {
    return configurationError('Android')
  }

  return associationResponse([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: packageName,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ])
}
