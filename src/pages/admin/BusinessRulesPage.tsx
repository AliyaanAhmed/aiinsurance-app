import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { FilePenLine, Pencil, Plus } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  getBusinessRulesCatalog,
  type BusinessRuleListItem,
} from '../../services/businessRulesService'

export function BusinessRulesPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const { data, loading, error } = useAsyncData(getBusinessRulesCatalog, [])

  const filteredRules = useMemo(() => {
    const rules = data ?? []
    return rules.filter((rule) => {
      const matchesCategory = categoryFilter === 'All' || rule.categoryLabel === categoryFilter
      const matchesSearch =
        !search.trim() ||
        [rule.name, rule.categoryLabel, rule.parentRuleName]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [categoryFilter, data, search])

  const categories = useMemo(
    () => ['All', ...new Set((data ?? []).map((rule) => rule.categoryLabel).filter(Boolean))],
    [data],
  )

  const columns = useMemo<ColumnDef<BusinessRuleListItem>[]>(
    () => [
      {
        header: 'Rule',
        cell: ({ row }) => (
          <div className="space-y-1">
            <Link
              to={`/admin/business-rules/${row.original.id}/edit`}
              className="font-semibold text-primary transition hover:text-primary/80 hover:underline"
            >
              {row.original.name}
            </Link>
          </div>
        ),
      },
      {
        header: 'Parent Category',
        cell: ({ row }) => (
          <div className="space-y-2">
            <Badge variant="review">{row.original.categoryLabel}</Badge>
            <p className="text-[12px] text-muted-foreground">
              {row.original.parentRuleName || 'No property rule linked'}
            </p>
          </div>
        ),
      },
      {
        header: 'Consequences',
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="text-lg font-semibold">{row.original.consequenceCount}</p>
            <p className="text-[12px] text-muted-foreground">Linked action records</p>
          </div>
        ),
      },
      {
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" asChild className="bg-white dark:bg-[#1E293B]">
              <Link to={`/admin/business-rules/${row.original.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  const stats = useMemo(() => {
    const rules = data ?? []
    return [
      { label: 'Total Rules', value: String(rules.length), helper: 'Active underwriting logic records.' },
      {
        label: 'Linked Consequences',
        value: String(rules.reduce((sum, rule) => sum + rule.consequenceCount, 0)),
        helper: 'Operational outcomes tied to business rules.',
      },
      {
        label: 'Categorized',
        value: String(rules.filter((rule) => rule.categoryLabel !== 'Uncategorized').length),
        helper: 'Rules already classified into an underwriting bucket.',
      },
      {
        label: 'Property Linked',
        value: String(rules.filter((rule) => Boolean(rule.parentRuleName)).length),
        helper: 'Rules already connected to a parent property rule.',
      },
    ]
  }, [data])

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FilePenLine}
        eyebrow="Admin Workspace"
        title="Business Rules"
        description="Manage rule metadata, category classification, property linkage, and the downstream consequences that operational teams should trigger when a rule applies."
        actions={
          <Button asChild>
            <Link to="/admin/business-rules/create">
              <Plus className="h-4 w-4" />
              Add Rule
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} variant="interactive" className="space-y-2">
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.helper}</p>
          </Card>
        ))}
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search rules or categories"
      >
        <Select
          value={categoryFilter}
          onValueChange={setCategoryFilter}
          options={categories.map((category) => ({
            value: category,
            label: category === 'All' ? 'All Categories' : category,
          }))}
          className="min-w-[230px] rounded-full bg-white dark:bg-[#1E293B]"
        />
      </FilterBar>

      {loading ? (
        <Card className="text-sm text-muted-foreground">Loading business rule library...</Card>
      ) : error ? (
        <Card className="border-danger/20 bg-danger/5 text-sm text-danger">{error}</Card>
      ) : (
        <DataTable
          columns={columns}
          data={filteredRules}
          emptyTitle="No business rules found"
          emptyDescription="Try adjusting the search or category filter, or create a new rule to start building consequence workflows."
        />
      )}
    </div>
  )
}
