import { useQueryClient } from '@tanstack/react-query'
import { useBlocker, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangleIcon,
  MailIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { REGEXP_ONLY_DIGITS } from 'input-otp'

import { useAuth } from '@/components/auth/auth-provider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { Spinner } from '@/components/ui/spinner'
import {
  DELETION_CONFIRMATION_PENDING_KEY,
  createDeletionDeadline,
  formatBlockerDate,
  formatDeletionRemaining,
  getRemainingDeletionSeconds,
  isAmbiguousDeletionError,
  isDeletionCodeComplete,
  parseDeletionDeadline,
  sanitizeDeletionCode,
} from '@/lib/account-deletion'
import { PlayersApiError, playersApi } from '@/lib/players-api'
import type { AccountDeletionBlocker } from '@/lib/players-api'

const SUPPORT_EMAIL = 'icancheroapp@gmail.com'

type ScreenState =
  | { kind: 'loading' }
  | { kind: 'ready-to-request'; message?: string }
  | { kind: 'requesting' }
  | { kind: 'code-entry'; deadline: number; message?: string }
  | { kind: 'blocked'; blockers: AccountDeletionBlocker[] }
  | { kind: 'policy-blocked'; title: string; detail: string }
  | { kind: 'request-error'; message: string }
  | { kind: 'confirming'; deadline: number | null }
  | { kind: 'ambiguous-retry'; deadline: number | null; message: string }

function hasPendingMarker(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.sessionStorage.getItem(DELETION_CONFIRMATION_PENDING_KEY) === 'true'
  )
}

function setPendingMarker(): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(DELETION_CONFIRMATION_PENDING_KEY, 'true')
  }
}

function clearPendingMarker(): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(DELETION_CONFIRMATION_PENDING_KEY)
  }
}

function policyTitle(code?: string): string {
  if (code === 'club_ownership_transfer_required') {
    return 'Transfiere la propiedad del club'
  }
  if (code === 'admin_account_deletion_forbidden') {
    return 'Esta cuenta requiere atención del equipo'
  }
  return 'No encontramos un perfil activo'
}

export function DeleteAccountScreen() {
  const { finishAccountDeletion, logout } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [state, setState] = useState<ScreenState>({ kind: 'loading' })
  const [code, setCode] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const mountedRef = useRef(true)
  const requestPromiseRef = useRef<Promise<void> | null>(null)
  const confirmPromiseRef = useRef<Promise<void> | null>(null)
  const cleanupPromiseRef = useRef<Promise<void> | null>(null)
  const allowTerminalNavigationRef = useRef(false)
  const codeInputRef = useRef<HTMLInputElement | null>(null)

  const isTerminalTransition =
    state.kind === 'confirming' || state.kind === 'ambiguous-retry'

  useBlocker({
    shouldBlockFn: ({ next }) =>
      !allowTerminalNavigationRef.current ||
      next.pathname !== '/account-deleted',
    enableBeforeUnload: true,
    disabled: !isTerminalTransition,
  })

  const focusCode = useCallback(() => {
    window.setTimeout(() => codeInputRef.current?.focus(), 0)
  }, [])

  const clearDefiniteConfirmation = useCallback(() => {
    clearPendingMarker()
    setCode('')
  }, [])

  const handleUnauthorized = useCallback(async () => {
    clearPendingMarker()
    try {
      await logout()
    } catch (error) {
      console.error('No pudimos cerrar la sesión vencida.', error)
    }
    if (mountedRef.current) {
      setState({
        kind: 'request-error',
        message: 'Tu sesión venció. Inicia sesión de nuevo para continuar.',
      })
    }
  }, [logout])

  const initialize = useCallback(async () => {
    setState({ kind: 'loading' })
    try {
      const status = await playersApi.getDeletionStatus()
      if (!mountedRef.current) return
      if (status.blockers.length > 0) {
        setCode('')
        setState({ kind: 'blocked', blockers: status.blockers })
        return
      }
      const deadline = parseDeletionDeadline(status.expiresAt)
      if (
        status.deletionRequested &&
        deadline !== null &&
        getRemainingDeletionSeconds(deadline) > 0
      ) {
        setState({ kind: 'code-entry', deadline })
        return
      }
      setState({ kind: 'ready-to-request' })
    } catch (error) {
      if (!mountedRef.current) return
      if (error instanceof PlayersApiError && error.status === 401) {
        await handleUnauthorized()
        return
      }
      if (
        error instanceof PlayersApiError &&
        error.status === 404 &&
        error.code === 'profile_not_provisioned'
      ) {
        if (hasPendingMarker()) {
          setState({
            kind: 'ambiguous-retry',
            deadline: null,
            message:
              'Vuelve a ingresar el código original para comprobar si la eliminación ya fue aceptada.',
          })
          return
        }
        setState({
          kind: 'policy-blocked',
          title: policyTitle(error.code),
          detail:
            'La identidad de acceso no tiene un perfil activo de iCanchero asociado.',
        })
        return
      }
      setState({
        kind: 'request-error',
        message:
          error instanceof Error
            ? error.message
            : 'No pudimos consultar el estado de tu cuenta.',
      })
    }
  }, [handleUnauthorized])

  useEffect(() => {
    mountedRef.current = true
    void initialize()
    return () => {
      mountedRef.current = false
    }
  }, [initialize])

  useEffect(() => {
    if (
      state.kind !== 'code-entry' &&
      state.kind !== 'confirming' &&
      state.kind !== 'ambiguous-retry'
    ) {
      return
    }

    const refreshClock = () => setNow(Date.now())
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshClock()
    }
    const timer = window.setInterval(refreshClock, 1_000)
    window.addEventListener('focus', refreshClock)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refreshClock)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [state.kind])

  const handleRequest = useCallback(() => {
    if (requestPromiseRef.current) return requestPromiseRef.current

    const request = (async () => {
      if (mountedRef.current) setState({ kind: 'requesting' })
      try {
        const response = await playersApi.requestAccountDeletion()
        const deadline = createDeletionDeadline(response.expiresIn)
        if (!mountedRef.current) return
        if (deadline === null) {
          setState({
            kind: 'request-error',
            message:
              'El servicio devolvió una vigencia inválida. Intenta de nuevo.',
          })
          return
        }
        setCode('')
        setNow(Date.now())
        setState({ kind: 'code-entry', deadline })
        focusCode()
      } catch (error) {
        if (!mountedRef.current) return
        if (error instanceof PlayersApiError && error.status === 401) {
          await handleUnauthorized()
        } else if (
          error instanceof PlayersApiError &&
          error.code === 'account_deletion_blocked_by_active_bookings'
        ) {
          setCode('')
          setState({ kind: 'blocked', blockers: error.blockers })
        } else if (
          error instanceof PlayersApiError &&
          (error.code === 'club_ownership_transfer_required' ||
            error.code === 'admin_account_deletion_forbidden' ||
            error.code === 'profile_not_provisioned')
        ) {
          setState({
            kind: 'policy-blocked',
            title: policyTitle(error.code),
            detail: error.message,
          })
        } else {
          setState({
            kind: 'request-error',
            message:
              error instanceof Error
                ? error.message
                : 'No pudimos enviar el código.',
          })
        }
      }
    })().finally(() => {
      requestPromiseRef.current = null
    })
    requestPromiseRef.current = request
    return request
  }, [focusCode, handleUnauthorized])

  const finishCleanup = useCallback(() => {
    if (cleanupPromiseRef.current) return cleanupPromiseRef.current
    const cleanup = (async () => {
      queryClient.removeQueries({ queryKey: ['account'] })
      await finishAccountDeletion()
      clearPendingMarker()
      allowTerminalNavigationRef.current = true
      await navigate({ to: '/account-deleted', replace: true })
    })()
    cleanupPromiseRef.current = cleanup
    return cleanup
  }, [finishAccountDeletion, navigate, queryClient])

  const handleConfirm = useCallback(() => {
    if (confirmPromiseRef.current || !isDeletionCodeComplete(code)) {
      return confirmPromiseRef.current ?? Promise.resolve()
    }

    const submittedCode = code
    const deadline =
      state.kind === 'code-entry' || state.kind === 'ambiguous-retry'
        ? state.deadline
        : null
    setPendingMarker()
    setState({ kind: 'confirming', deadline })

    const confirmation = (async () => {
      try {
        await playersApi.confirmAccountDeletion(submittedCode)
        await finishCleanup()
      } catch (error) {
        if (!mountedRef.current) return
        if (isAmbiguousDeletionError(error)) {
          setDialogOpen(false)
          setState({
            kind: 'ambiguous-retry',
            deadline,
            message:
              'No recibimos una respuesta definitiva. Conserva este código y reintenta la eliminación.',
          })
          return
        }

        clearPendingMarker()
        if (error instanceof PlayersApiError && error.status === 401) {
          setDialogOpen(false)
          await handleUnauthorized()
        } else if (
          error instanceof PlayersApiError &&
          error.code === 'account_deletion_blocked_by_active_bookings'
        ) {
          setDialogOpen(false)
          setCode('')
          setState({ kind: 'blocked', blockers: error.blockers })
        } else if (
          error instanceof PlayersApiError &&
          (error.code === 'club_ownership_transfer_required' ||
            error.code === 'admin_account_deletion_forbidden')
        ) {
          setDialogOpen(false)
          setState({
            kind: 'policy-blocked',
            title: policyTitle(error.code),
            detail: error.message,
          })
        } else if (
          error instanceof PlayersApiError &&
          error.code === 'deletion_challenge_invalid'
        ) {
          setDialogOpen(false)
          setCode('')
          setState({
            kind: 'code-entry',
            deadline: deadline ?? Date.now(),
            message: error.message,
          })
          focusCode()
        } else if (
          error instanceof PlayersApiError &&
          (error.code === 'deletion_challenge_missing' ||
            error.code === 'deletion_challenge_expired' ||
            error.code === 'deletion_challenge_attempts_exceeded')
        ) {
          setDialogOpen(false)
          clearDefiniteConfirmation()
          setState({ kind: 'ready-to-request', message: error.message })
        } else {
          setDialogOpen(false)
          setState({
            kind: 'code-entry',
            deadline: deadline ?? Date.now(),
            message:
              error instanceof Error
                ? error.message
                : 'No pudimos confirmar la eliminación.',
          })
        }
      }
    })().finally(() => {
      confirmPromiseRef.current = null
    })
    confirmPromiseRef.current = confirmation
    return confirmation
  }, [
    clearDefiniteConfirmation,
    code,
    finishCleanup,
    focusCode,
    handleUnauthorized,
    state,
  ])

  const deadline =
    state.kind === 'code-entry' ||
    state.kind === 'confirming' ||
    state.kind === 'ambiguous-retry'
      ? state.deadline
      : null
  const remaining = deadline ? getRemainingDeletionSeconds(deadline, now) : 0
  const expired = deadline !== null && remaining === 0

  if (state.kind === 'loading') {
    return <LoadingCard />
  }

  if (state.kind === 'blocked') {
    return <BlockerState blockers={state.blockers} onRefresh={initialize} />
  }

  if (state.kind === 'policy-blocked') {
    return (
      <PolicyState
        detail={state.detail}
        onLogout={() => void logout()}
        title={state.title}
      />
    )
  }

  if (state.kind === 'request-error') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No pudimos continuar</CardTitle>
          <CardDescription>{state.message}</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-wrap gap-2">
          <Button onClick={() => void initialize()} type="button">
            Reintentar
          </Button>
          <SupportButton />
        </CardFooter>
      </Card>
    )
  }

  if (state.kind === 'ready-to-request' || state.kind === 'requesting') {
    const pending = state.kind === 'requesting'
    return (
      <Card>
        <CardHeader>
          <CardTitle>Eliminar tu cuenta</CardTitle>
          <CardDescription>
            Te enviaremos un código de seis dígitos al correo asociado con tu
            cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {state.kind === 'ready-to-request' && state.message && (
            <Alert>
              <AlertTitle>Necesitas un código nuevo</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <DeletionDisclosure />
        </CardContent>
        <CardFooter>
          <Button
            disabled={pending}
            onClick={() => void handleRequest()}
            type="button"
          >
            {pending && <Spinner data-icon="inline-start" />}
            {pending ? 'Enviando código…' : 'Enviar código de verificación'}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const ambiguous = state.kind === 'ambiguous-retry'
  const confirming = state.kind === 'confirming'
  const validationMessage =
    state.kind === 'code-entry' || state.kind === 'ambiguous-retry'
      ? state.message
      : undefined

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            {ambiguous ? 'Reintentar eliminación' : 'Ingresa tu código'}
          </CardTitle>
          <CardDescription>
            {ambiguous
              ? state.message
              : 'Escribe el código de seis dígitos que enviamos a tu correo.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {validationMessage && !ambiguous && (
            <Alert variant="destructive">
              <AlertTitle>No pudimos confirmar</AlertTitle>
              <AlertDescription>{validationMessage}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            <Field data-invalid={Boolean(validationMessage && !ambiguous)}>
              <FieldLabel htmlFor="deletion-code">
                Código de verificación
              </FieldLabel>
              <InputOTP
                id="deletion-code"
                aria-invalid={Boolean(validationMessage && !ambiguous)}
                autoComplete="one-time-code"
                disabled={confirming}
                maxLength={6}
                onChange={(value) => setCode(sanitizeDeletionCode(value))}
                pattern={REGEXP_ONLY_DIGITS}
                ref={codeInputRef}
                value={code}
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }, (_, index) => (
                    <InputOTPSlot
                      aria-invalid={Boolean(validationMessage && !ambiguous)}
                      index={index}
                      key={index}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {ambiguous ? (
                <FieldDescription>
                  El reintento es seguro aunque la vigencia mostrada haya
                  terminado.
                </FieldDescription>
              ) : expired ? (
                <FieldError>El código venció. Solicita uno nuevo.</FieldError>
              ) : (
                <FieldDescription>
                  Vigencia restante:{' '}
                  <span className="tabular-nums">
                    {formatDeletionRemaining(remaining)}
                  </span>
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
          <DeletionDisclosure />
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          {expired && !ambiguous ? (
            <Button onClick={() => void handleRequest()} type="button">
              Enviar código nuevo
            </Button>
          ) : (
            <Button
              disabled={!isDeletionCodeComplete(code) || confirming}
              onClick={() => setDialogOpen(true)}
              type="button"
              variant="destructive"
            >
              {ambiguous ? 'Reintentar eliminación' : 'Continuar'}
            </Button>
          )}
        </CardFooter>
      </Card>

      <AlertDialog
        onOpenChange={(open) => {
          if (!confirming) setDialogOpen(open)
        }}
        open={dialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar tu cuenta definitivamente?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Tu cuenta, perfil e
              identificadores directos se eliminarán; algunos registros
              operativos pueden conservarse anonimizados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirming}>
              Cancelar
            </AlertDialogCancel>
            <Button
              disabled={confirming}
              onClick={() => void handleConfirm()}
              type="button"
              variant="destructive"
            >
              {confirming && <Spinner data-icon="inline-start" />}
              {confirming ? 'Eliminando cuenta…' : 'Sí, eliminar mi cuenta'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function DeletionDisclosure() {
  return (
    <Alert>
      <ShieldAlertIcon />
      <AlertTitle>Qué sucede con tus datos</AlertTitle>
      <AlertDescription>
        Se eliminarán tu cuenta, perfil e identificadores directos. Las reservas
        y pagos necesarios para la operación pueden conservarse anonimizados y
        sin asociación a tu perfil. Esta acción no se puede deshacer.
      </AlertDescription>
    </Alert>
  )
}

function LoadingCard() {
  return (
    <Card aria-label="Consultando eliminación" role="status">
      <CardContent className="flex min-h-48 items-center justify-center gap-3">
        <Spinner />
        <span className="text-muted-foreground text-sm">
          Consultando el estado de tu cuenta…
        </span>
      </CardContent>
    </Card>
  )
}

function BlockerState({
  blockers,
  onRefresh,
}: {
  blockers: AccountDeletionBlocker[]
  onRefresh: () => Promise<void>
}) {
  return (
    <div className="flex flex-col gap-5">
      <Alert variant="destructive">
        <AlertTriangleIcon />
        <AlertTitle>Tu cuenta todavía tiene actividad pendiente</AlertTitle>
        <AlertDescription>
          No cancelamos ni reembolsamos nada. Resuelve cada elemento en
          iCanchero y vuelve a consultar.
        </AlertDescription>
      </Alert>
      {blockers.map((blocker) => (
        <Card key={`${blocker.type}-${blocker.bookingPublicId}`} size="sm">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>{blocker.clubName}</CardTitle>
              <Badge variant="secondary">
                {blocker.type === 'open_match' ? 'Partido abierto' : 'Reserva'}
              </Badge>
            </div>
            <CardDescription>{blocker.courtName}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <p>
              Evento: {formatBlockerDate(blocker.eventStart, blocker.timeZone)}{' '}
              – {formatBlockerDate(blocker.eventEnd, blocker.timeZone)}
            </p>
            <p>
              Podrás eliminar desde:{' '}
              {formatBlockerDate(blocker.deletionEligibleAt, blocker.timeZone)}
            </p>
            <p>
              Rol:{' '}
              {blocker.subjectRole === 'booking_owner'
                ? 'Responsable de la reserva'
                : 'Participante'}
            </p>
            <p>{blocker.isRefundable ? 'Reembolsable' : 'No reembolsable'}</p>
          </CardContent>
        </Card>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void onRefresh()} type="button">
          <RefreshCwIcon data-icon="inline-start" />
          Actualizar estado
        </Button>
        <SupportButton />
      </div>
    </div>
  )
}

function PolicyState({
  detail,
  onLogout,
  title,
}: {
  detail: string
  onLogout: () => void
  title: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{detail}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Escríbenos a {SUPPORT_EMAIL} para revisar el siguiente paso.
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <SupportButton />
        <Button onClick={onLogout} type="button" variant="outline">
          Cerrar sesión
        </Button>
      </CardFooter>
    </Card>
  )
}

function SupportButton() {
  return (
    <Button
      nativeButton={false}
      render={<a href={`mailto:${SUPPORT_EMAIL}`} />}
      variant="outline"
    >
      <MailIcon data-icon="inline-start" />
      Contactar soporte
    </Button>
  )
}
