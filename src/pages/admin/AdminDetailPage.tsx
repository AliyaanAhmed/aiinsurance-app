import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, Landmark, Users } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { getAdminDetail } from '../../services/adminDetailService'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/layout/PageHeader'
import type { AdminEntityKey } from '../../domain/app'

const iconByEntity = {
  'business-units': Landmark,
  users: Users,
  accounts: Building2,
  contacts: Users,
} satisfies Record<'business-units' | 'users' | 'accounts' | 'contacts', typeof Building2>

const listPathByEntity: Record<'business-units' | 'users' | 'accounts' | 'contacts', string> = {
  'business-units': '/admin/business-units',
  users: '/admin/users',
  accounts: '/admin/accounts',
  contacts: '/admin/contacts',
}

interface AdminDetailPageProps {
  entity: Extract<AdminEntityKey, 'business-units' | 'users' | 'accounts' | 'contacts'>
}

export function AdminDetailPage({ entity }: AdminDetailPageProps) {
  const { id = '' } = useParams()
  const detailEntity = entity
  const Icon = iconByEntity[detailEntity] ?? Building2
  const { data, loading, error } = useAsyncData(() => getAdminDetail(detailEntity, id), [detailEntity, id])

  if (loading) return <Card>Loading detail workspace...</Card>
  if (error || !data) return <Card>{error ?? 'Record not found.'}</Card>

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to={listPathByEntity[detailEntity] ?? '/'} >
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </Link>
      </Button>
      <PageHeader
        icon={Icon}
        eyebrow={data.eyebrow}
        title={data.title}
        description={data.description}
        actions={<Badge variant={data.status.toLowerCase() === 'active' ? 'approved' : 'neutral'}>{data.status}</Badge>}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.fields.map((field) => (
          <Card key={field.label} variant="premium" className="space-y-3">
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{field.label}</p>
            <p className="text-base font-semibold">{field.value}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
