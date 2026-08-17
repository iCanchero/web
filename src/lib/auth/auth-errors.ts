const GENERIC_AUTH_ERROR =
  'No pudimos iniciar sesión. Intenta de nuevo más tarde.'
const CREDENTIAL_ERROR = 'El correo, usuario o contraseña no son correctos.'
const RATE_LIMIT_ERROR =
  'Demasiados intentos. Espera un momento y vuelve a intentarlo.'
const GENERIC_RECOVERY_ERROR =
  'No pudimos completar la recuperación. Intenta de nuevo más tarde.'

type ErrorLike = {
  code?: unknown
  message?: unknown
}

function getCode(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return ''
  }

  const code = (error as ErrorLike).code
  return typeof code === 'string' ? code.toLowerCase() : ''
}

function getMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return ''
  }

  const message = (error as ErrorLike).message
  return typeof message === 'string' ? message.toLowerCase() : ''
}

export function isCredentialError(error: unknown): boolean {
  const code = getCode(error)
  const message = getMessage(error)
  return (
    code === 'auth/invalid-credential' ||
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password' ||
    code === 'invalid-credential' ||
    code === 'user-not-found' ||
    code === 'wrong-password' ||
    code.includes('invalid_credentials') ||
    code.includes('invalid-credential') ||
    code.includes('invalid_password') ||
    code.includes('user_not_found') ||
    message.includes('invalid credential') ||
    message.includes('wrong password') ||
    message.includes('user not found')
  )
}

export function isRateLimitError(error: unknown): boolean {
  const code = getCode(error)
  return (
    code === 'auth/too-many-requests' ||
    code === 'too-many-requests' ||
    code.includes('too_many') ||
    code.includes('rate_limit')
  )
}

export function getAuthErrorMessage(error: unknown): string {
  if (isCredentialError(error)) {
    return CREDENTIAL_ERROR
  }

  if (isRateLimitError(error)) {
    return RATE_LIMIT_ERROR
  }

  const code = getCode(error)
  const message = getMessage(error)
  if (
    code === 'configuration' ||
    code === 'auth/network-request-failed' ||
    code === 'network-request-failed' ||
    code === 'auth/internal-error' ||
    code.includes('unavailable') ||
    message.includes('network')
  ) {
    return GENERIC_AUTH_ERROR
  }

  return GENERIC_AUTH_ERROR
}

export function getPasswordResetErrorMessage(error: unknown): string {
  if (isRateLimitError(error)) {
    return RATE_LIMIT_ERROR
  }

  const code = getCode(error)
  if (
    code.includes('invalid') ||
    code.includes('expired') ||
    code.includes('verification')
  ) {
    return 'El código o enlace ya no es válido. Solicita uno nuevo.'
  }

  return GENERIC_RECOVERY_ERROR
}

export const authErrorMessages = {
  generic: GENERIC_AUTH_ERROR,
  credentials: CREDENTIAL_ERROR,
  rateLimit: RATE_LIMIT_ERROR,
  recovery: GENERIC_RECOVERY_ERROR,
} as const
