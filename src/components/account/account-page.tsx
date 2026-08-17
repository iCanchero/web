import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  CalendarDaysIcon,
  CircleUserRoundIcon,
  PhoneIcon,
  TrophyIcon,
} from 'lucide-react'

import { AccountShell } from '@/components/account/account-shell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { Skeleton } from '@/components/ui/skeleton'
import { PlayersApiError, playersApi } from '@/lib/players-api'
import { getSportLabel } from '@/lib/sports'
import type { AccountProfile } from '@/lib/players-api'

export const ACCOUNT_PROFILE_QUERY_KEY = ['account', 'profile'] as const

function getInitials(profile: AccountProfile): string {
  const value = profile.displayName ?? profile.username ?? profile.email ?? 'IC'
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function formatCreatedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No configurado'
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(date)
}

export function AccountPage() {
  const profileQuery = useQuery({
    queryKey: ACCOUNT_PROFILE_QUERY_KEY,
    queryFn: () => playersApi.getCurrentUser(),
    retry: (failureCount, error) => {
      if (
        error instanceof PlayersApiError &&
        (error.status === 401 || error.status === 404)
      ) {
        return false
      }
      return failureCount < 1
    },
  })

  return (
    <AccountShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-primary text-sm font-medium">Mi iCanchero</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Tu cuenta
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Consulta la información básica asociada con tu perfil.
          </p>
        </div>

        {profileQuery.isPending ? (
          <AccountProfileSkeleton />
        ) : profileQuery.isError ? (
          <ProfileError onRetry={() => void profileQuery.refetch()} />
        ) : (
          <AccountProfileCard profile={profileQuery.data} />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Zona de peligro</CardTitle>
            <CardDescription>
              Eliminar tu cuenta es permanente y requiere confirmar un código
              enviado a tu correo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Se eliminarán tu cuenta, perfil e identificadores directos. Las
              reservas y pagos necesarios para la operación pueden conservarse
              anonimizados y sin asociación a tu perfil.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              nativeButton={false}
              render={<Link to="/delete-account" />}
              variant="destructive"
            >
              Eliminar cuenta
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AccountShell>
  )
}

function AccountProfileCard({ profile }: { profile: AccountProfile }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="size-14">
            {profile.photoUrl && (
              <AvatarImage
                alt={profile.displayName ?? 'Perfil'}
                src={profile.photoUrl}
              />
            )}
            <AvatarFallback>{getInitials(profile)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{profile.displayName ?? 'No configurado'}</CardTitle>
              {profile.isVerified && (
                <Badge variant="secondary">Verificado</Badge>
              )}
            </div>
            <CardDescription>
              {profile.username ? `@${profile.username}` : 'No configurado'}
            </CardDescription>
            <p className="truncate text-sm">
              {profile.email ?? 'No configurado'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          <ProfileItem
            icon={PhoneIcon}
            label="Teléfono"
            value={profile.phone}
          />
          <ProfileItem
            icon={TrophyIcon}
            label="Deporte actual"
            value={getSportLabel(profile.currentSport)}
          />
          <ProfileItem
            icon={CalendarDaysIcon}
            label="Cuenta creada"
            value={formatCreatedAt(profile.createdAt)}
          />
        </ItemGroup>
      </CardContent>
    </Card>
  )
}

function ProfileItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof PhoneIcon
  label: string
  value: string | null
}) {
  return (
    <Item variant="muted">
      <ItemMedia variant="icon">
        <Icon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{label}</ItemTitle>
        <ItemDescription>{value || 'No configurado'}</ItemDescription>
      </ItemContent>
    </Item>
  )
}

function AccountProfileSkeleton() {
  return (
    <Card aria-label="Cargando perfil" role="status">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </CardContent>
    </Card>
  )
}

function ProfileError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert role="alert">
      <CircleUserRoundIcon />
      <AlertTitle>No pudimos cargar tu perfil</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <span>
          Puedes intentarlo de nuevo. La opción para eliminar tu cuenta sigue
          disponible abajo.
        </span>
        <Button onClick={onRetry} type="button" variant="outline">
          Reintentar
        </Button>
      </AlertDescription>
    </Alert>
  )
}
