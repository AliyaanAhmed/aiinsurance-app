import { PackageSearch, Trash2 } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { getProductsSummary } from '../../services/productsService'
import { PageHeader } from '../../components/layout/PageHeader'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import type { ProductSummary } from '../../domain/app'
import type { ColumnDef } from '@tanstack/react-table'
import { formatCurrency } from '../../lib/formatters'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Aur_productsesService } from '../../generated/services/Aur_productsesService'

export function ProductsPage() {
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const { data, loading, error } = useAsyncData(getProductsSummary, [refreshKey])
  const filtered = useMemo(() => {
    const records = data ?? []
    if (!search.trim()) return records
    const query = search.toLowerCase()
    return records.filter((record) =>
      [record.name, record.shortDetails, record.status].join(' ').toLowerCase().includes(query),
    )
  }, [data, search])

  async function handleDelete(id: string, name: string) {
    const confirmed = window.confirm(`Delete "${name}" from products?`)
    if (!confirmed) return
    await Aur_productsesService.delete(id)
    setRefreshKey((value) => value + 1)
  }

  const columns: ColumnDef<ProductSummary>[] = [
  {
    header: 'Product',
    cell: ({ row }) => (
      <div className="space-y-1">
        <Link to={`/admin/products/${row.original.id}/edit`} className="font-semibold text-primary transition hover:text-primary/80 hover:underline">
          {row.original.name}
        </Link>
        <p className="text-[12px] text-muted-foreground">{row.original.shortDetails}</p>
      </div>
    ),
  },
  { header: 'Inquiry Volume', accessorKey: 'inquiryVolume' },
  { header: 'Premium Total', cell: ({ row }) => formatCurrency(row.original.premiumTotal) },
  { header: 'Insured Total', cell: ({ row }) => formatCurrency(row.original.insuredTotal) },
  { header: 'Status', cell: ({ row }) => <Badge variant="approved">{row.original.status}</Badge> },
  {
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="text-danger hover:bg-danger/10 hover:text-danger"
          onClick={() => void handleDelete(row.original.id, row.original.name)}
          aria-label={`Delete ${row.original.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
]

  return (
    <div className="space-y-6">
      <PageHeader
        icon={PackageSearch}
        title="Products"
        description="Structured product administration workspace built on the live aur_products datasource."
        actions={
          <Button asChild>
            <Link to="/admin/products/create">Add Product</Link>
          </Button>
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products"
      />
      {loading ? (
        <div className="rounded-[22px] border border-border-soft bg-surface p-6 text-sm text-muted-foreground">
          Loading products...
        </div>
      ) : error ? (
        <div className="rounded-[22px] border border-danger/25 bg-danger/5 p-6 text-sm text-danger">
          {error}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyTitle="No products found"
          emptyDescription="The aur_products datasource is connected, but no product records were returned."
        />
      )}
    </div>
  )
}
