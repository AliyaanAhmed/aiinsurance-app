import { useEffect, useMemo, useRef, useState, type ChangeEvent, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { FilePenLine, FileSpreadsheet, Filter, LoaderCircle, Plus, RotateCcw, SendHorizontal, Sparkles, Upload, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import type { SelectOption } from '../../components/ui/Select'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  BUSINESS_RULE_INQUIRY_TYPE_OPTIONS,
  getBusinessRulesCatalog,
  importBusinessRulesWorkbook,
  type BusinessRuleListItem,
} from '../../services/businessRulesService'

type ColumnFilterKey = 'rule' | 'category' | 'property' | 'inquiryType' | 'consequences'

type BusinessRuleColumnFilters = {
  rule: { operator: 'contains' | 'equals'; value: string }
  category: { value: string }
  property: { value: string }
  inquiryType: { value: string }
  consequences: { min: string; max: string }
}

const defaultColumnFilters: BusinessRuleColumnFilters = {
  rule: { operator: 'contains', value: '' },
  category: { value: '' },
  property: { value: '' },
  inquiryType: { value: '' },
  consequences: { min: '', max: '' },
}

export function BusinessRulesPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeFilterKey, setActiveFilterKey] = useState<ColumnFilterKey | null>(null)
  const [columnFilters, setColumnFilters] = useState<BusinessRuleColumnFilters>(defaultColumnFilters)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantBusy, setAssistantBusy] = useState(false)
  const [selectedWorkbookName, setSelectedWorkbookName] = useState('')
  const [recentImportedNames, setRecentImportedNames] = useState<string[]>([])
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([
    {
      id: 'assistant-welcome',
      role: 'assistant',
      content:
        'Upload an Excel workbook and I will create business-rule records using Rule Name, Category, Property, and Inquiry Type.',
    },
  ])
  const { data, loading, error } = useAsyncData(getBusinessRulesCatalog, [refreshKey])

  useEffect(() => {
    if (!assistantOpen) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [assistantMessages, assistantBusy, assistantOpen])

  const filteredRules = useMemo(() => {
    const rules = data ?? []
    return rules.filter((rule) => {
      const matchesSearch =
        !search.trim() ||
        [rule.name, rule.categoryLabel, rule.parentRuleName, rule.inquiryTypeLabel]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())
      if (!matchesSearch) return false

      const ruleValue = rule.name.trim().toLowerCase()
      const ruleFilterValue = columnFilters.rule.value.trim().toLowerCase()
      if (ruleFilterValue) {
        const matchesRule =
          columnFilters.rule.operator === 'equals'
            ? ruleValue === ruleFilterValue
            : ruleValue.includes(ruleFilterValue)
        if (!matchesRule) return false
      }

      const categoryValue = normalizeFilterValue(rule.categoryLabel)
      const categoryFilterValue = normalizeFilterValue(columnFilters.category.value)
      if (categoryFilterValue && categoryValue !== categoryFilterValue) return false

      const propertyValue = normalizeFilterValue(rule.parentRuleName || 'No property rule linked')
      const propertyFilterValue = normalizeFilterValue(columnFilters.property.value)
      if (propertyFilterValue && propertyValue !== propertyFilterValue) return false

      const inquiryTypeValue = normalizeFilterValue(rule.inquiryTypeLabel)
      const inquiryTypeFilterValue = normalizeFilterValue(columnFilters.inquiryType.value)
      if (inquiryTypeFilterValue && inquiryTypeValue !== inquiryTypeFilterValue) return false

      const consequenceMin = columnFilters.consequences.min ? Number(columnFilters.consequences.min) : null
      const consequenceMax = columnFilters.consequences.max ? Number(columnFilters.consequences.max) : null
      if (consequenceMin !== null && rule.consequenceCount < consequenceMin) return false
      if (consequenceMax !== null && rule.consequenceCount > consequenceMax) return false

      return true
    })
  }, [columnFilters, data, search])

  const categoryOptions = useMemo<SelectOption[]>(
    () =>
      [...new Set((data ?? []).map((rule) => rule.categoryLabel).filter(Boolean))]
        .sort()
        .map((option) => ({ label: option, value: normalizeFilterValue(option) })),
    [data],
  )
  const propertyOptions = useMemo<SelectOption[]>(
    () =>
      [...new Set((data ?? []).map((rule) => rule.parentRuleName || 'No property rule linked').filter(Boolean))]
        .sort()
        .map((option) => ({ label: option, value: normalizeFilterValue(option) })),
    [data],
  )
  const inquiryTypeOptions = useMemo<SelectOption[]>(
    () =>
      BUSINESS_RULE_INQUIRY_TYPE_OPTIONS.map((option) => ({
        label: option.label,
        value: normalizeFilterValue(option.label),
      })),
    [],
  )
  const activeFilterCount = countActiveFilters(columnFilters)

  const columns = useMemo<ColumnDef<BusinessRuleListItem>[]>(
    () => [
      {
        id: 'rule',
        header: () => (
          <FilterHeader
            label="Rule"
            active={isColumnFilterActive('rule', columnFilters)}
            isOpen={activeFilterKey === 'rule'}
            onToggle={() => setActiveFilterKey((current) => (current === 'rule' ? null : 'rule'))}
            onClose={() => setActiveFilterKey(null)}
          >
            <ColumnFilterPanel
              activeKey="rule"
              filters={columnFilters}
              categoryOptions={categoryOptions}
              propertyOptions={propertyOptions}
              inquiryTypeOptions={inquiryTypeOptions}
              onChange={setColumnFilters}
            />
          </FilterHeader>
        ),
        cell: ({ row }) => (
          <div className="max-w-[280px] space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/admin/business-rules/${row.original.id}/edit`}
                className="block break-words font-semibold text-primary transition hover:text-primary/80 hover:underline"
              >
                {row.original.name}
              </Link>
              {recentImportedNames.includes(normalizeFilterValue(row.original.name)) ? (
                <span className="inline-flex items-center rounded-full border border-[#b9e6cd] bg-[#eefaf3] px-2.5 py-1 text-[11px] font-semibold text-[#257a4f] dark:border-[#2d6c4d] dark:bg-[#123223] dark:text-[#93d7b3]">
                  Imported
                </span>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: 'category',
        header: () => (
          <FilterHeader
            label="Category"
            active={isColumnFilterActive('category', columnFilters)}
            isOpen={activeFilterKey === 'category'}
            onToggle={() => setActiveFilterKey((current) => (current === 'category' ? null : 'category'))}
            onClose={() => setActiveFilterKey(null)}
          >
            <ColumnFilterPanel
              activeKey="category"
              filters={columnFilters}
              categoryOptions={categoryOptions}
              propertyOptions={propertyOptions}
              inquiryTypeOptions={inquiryTypeOptions}
              onChange={setColumnFilters}
            />
          </FilterHeader>
        ),
        cell: ({ row }) => <Badge variant="review">{row.original.categoryLabel}</Badge>,
      },
      {
        id: 'property',
        header: () => (
          <FilterHeader
            label="Property"
            active={isColumnFilterActive('property', columnFilters)}
            isOpen={activeFilterKey === 'property'}
            onToggle={() => setActiveFilterKey((current) => (current === 'property' ? null : 'property'))}
            onClose={() => setActiveFilterKey(null)}
          >
            <ColumnFilterPanel
              activeKey="property"
              filters={columnFilters}
              categoryOptions={categoryOptions}
              propertyOptions={propertyOptions}
              inquiryTypeOptions={inquiryTypeOptions}
              onChange={setColumnFilters}
            />
          </FilterHeader>
        ),
        cell: ({ row }) => (
          <div className="max-w-[220px]">
            <span className="inline-flex max-w-full items-center rounded-full border border-primary/14 bg-primary/[0.07] px-2.5 py-1 text-[12px] font-semibold text-primary dark:border-primary/22 dark:bg-primary/16 dark:text-slate-100">
              <span className="truncate">
                {row.original.parentRuleName || 'No property rule linked'}
              </span>
            </span>
          </div>
        ),
      },
      {
        id: 'inquiryType',
        header: () => (
          <FilterHeader
            label="Inquiry Type"
            active={isColumnFilterActive('inquiryType', columnFilters)}
            isOpen={activeFilterKey === 'inquiryType'}
            onToggle={() => setActiveFilterKey((current) => (current === 'inquiryType' ? null : 'inquiryType'))}
            onClose={() => setActiveFilterKey(null)}
          >
            <ColumnFilterPanel
              activeKey="inquiryType"
              filters={columnFilters}
              categoryOptions={categoryOptions}
              propertyOptions={propertyOptions}
              inquiryTypeOptions={inquiryTypeOptions}
              onChange={setColumnFilters}
            />
          </FilterHeader>
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.inquiryTypeValue ? 'new' : 'neutral'}>
            {row.original.inquiryTypeLabel}
          </Badge>
        ),
      },
      {
        id: 'consequences',
        header: () => (
          <FilterHeader
            label="Consequences"
            active={isColumnFilterActive('consequences', columnFilters)}
            isOpen={activeFilterKey === 'consequences'}
            onToggle={() => setActiveFilterKey((current) => (current === 'consequences' ? null : 'consequences'))}
            onClose={() => setActiveFilterKey(null)}
          >
            <ColumnFilterPanel
              activeKey="consequences"
              filters={columnFilters}
              categoryOptions={categoryOptions}
              propertyOptions={propertyOptions}
              inquiryTypeOptions={inquiryTypeOptions}
              onChange={setColumnFilters}
            />
          </FilterHeader>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="text-lg font-semibold">{row.original.consequenceCount}</p>
            <p className="text-[12px] text-muted-foreground">Linked action records</p>
          </div>
        ),
      },
    ],
    [activeFilterKey, categoryOptions, columnFilters, inquiryTypeOptions, propertyOptions, recentImportedNames],
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
      <Card className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-glow">
            <FilePenLine className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Admin Workspace
            </p>
            <h1 className="text-[28px] font-bold leading-tight">Business Rules</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Manage rule metadata, category classification, property linkage, and the downstream consequences that operational teams should trigger when a rule applies.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link to="/admin/business-rules/create">
              <Plus className="h-4 w-4" />
              Add Rule
            </Link>
          </Button>
        </div>
      </Card>

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
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="rounded-full bg-white dark:bg-[#1E293B]"
          disabled={activeFilterCount === 0 && !search.trim()}
          onClick={() => {
            setSearch('')
            setColumnFilters(defaultColumnFilters)
            setActiveFilterKey(null)
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Clear Filters
        </Button>
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
          preserveHeaderOnEmpty
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleWorkbookSelection}
      />

      <div className="fixed bottom-6 right-6 z-40">
        <Button
          type="button"
          className="h-[60px] w-[60px] rounded-full border border-primary bg-primary text-white shadow-[0_18px_40px_rgba(37,99,235,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-dark dark:border-primary dark:bg-primary dark:text-white dark:hover:bg-primary-dark"
          onClick={() => setAssistantOpen((current) => !current)}
          aria-label="Open Business Rule AI Assistant"
        >
          <Sparkles className="h-4.5 w-4.5" />
        </Button>
      </div>

      {assistantOpen ? (
        <div className="fixed bottom-6 right-6 z-50 flex h-[560px] w-[408px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[28px] border border-primary/12 bg-white shadow-[0_28px_60px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#102033]">
          <div className="shrink-0 border-b border-border-soft bg-[linear-gradient(180deg,rgba(248,251,255,0.98)_0%,rgba(255,255,255,0.96)_100%)] p-4 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.95)_0%,rgba(16,32,51,0.92)_100%)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_12px_26px_rgba(37,99,235,0.22)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">AI Business Rule Assistant</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    Underwriting import copilot
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => setAssistantOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 rounded-2xl border border-primary/10 bg-primary/[0.05] px-3 py-2 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/5">
              Upload an Excel workbook and I will turn each valid row into a business rule for this page.
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col bg-[linear-gradient(180deg,rgba(247,250,252,0.95)_0%,rgba(255,255,255,0.98)_100%)] px-4 py-4 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.9)_0%,rgba(16,32,51,0.92)_100%)]">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {assistantMessages.map((message) => (
                <AssistantMessageBubble key={message.id} message={message} />
              ))}
              {assistantBusy ? (
                <div className="rounded-[22px] border border-primary/15 bg-white px-4 py-4 shadow-soft dark:border-primary/20 dark:bg-white/5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Importing business rules</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        Upload received for <span className="font-semibold text-foreground">{selectedWorkbookName || 'uploaded workbook'}</span>. Creating business rules now.
                      </p>
                      <div className="h-2.5 overflow-hidden rounded-full bg-primary/10">
                        <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            <div className="mt-4 shrink-0 rounded-[24px] border border-border-soft bg-white/96 p-4 shadow-soft dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="bg-white dark:bg-white/10"
                  disabled={assistantBusy}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload Excel
                </Button>
                <div className="min-w-0 flex-1 rounded-full border border-dashed border-border-soft px-3 py-2 text-xs text-muted-foreground dark:border-white/10">
                  {selectedWorkbookName || 'No workbook selected yet'}
                </div>
              </div>
              <div className="mt-3 flex items-end gap-2">
                <textarea
                  value={assistantInput}
                  onChange={(event) => setAssistantInput(event.target.value)}
                  placeholder="Ask about the import flow..."
                  className="form-field-surface min-h-[88px] flex-1 rounded-[18px] border border-border px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
                <Button
                  type="button"
                  size="icon"
                  className="h-11 w-11 rounded-2xl"
                  disabled={assistantBusy}
                  onClick={handleAssistantPrompt}
                >
                  <SendHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )

  function appendAssistantMessage(content: string, role: AssistantMessage['role'] = 'assistant') {
    setAssistantMessages((current) => [
      ...current,
      {
        id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role,
        content,
      },
    ])
  }

  function handleAssistantPrompt() {
    const prompt = assistantInput.trim()
    if (!prompt) return
    appendAssistantMessage(prompt, 'user')
    setAssistantInput('')
    appendAssistantMessage(
      'Please upload an Excel file so I can validate Rule Name, Category, Property, and Inquiry Type before creating the business rules.',
    )
  }

  async function handleWorkbookSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setAssistantOpen(true)
    setSelectedWorkbookName(file.name)
    appendAssistantMessage(`Uploaded workbook: ${file.name}`, 'user')
    appendAssistantMessage('Workbook received. Starting the business-rule creation flow now.')
    setAssistantBusy(true)

    try {
      const result = await importBusinessRulesWorkbook(file)
      setRecentImportedNames(result.confirmedNames.map((name) => normalizeFilterValue(name)))
      await wait(2000)
      setRefreshKey((current) => current + 1)

      const summaryLines = [
        `Processed ${result.processedRows} data row${result.processedRows === 1 ? '' : 's'}.`,
      ]

      if (result.confirmedNames.length) {
        summaryLines.push(
          `Confirmed ${result.confirmedNames.length} new business rule${result.confirmedNames.length === 1 ? '' : 's'}: ${result.confirmedNames.join(', ')}.`,
        )
      }

      if (result.missingNames.length) {
        summaryLines.push(
          `These rows returned create responses but are still missing from the refreshed table: ${result.missingNames.join(', ')}.`,
        )
      }

      if (result.issues.length) {
        summaryLines.push(
          `Skipped rows: ${result.issues.map((issue) => `Row ${issue.rowNumber} - ${issue.message}`).join(' | ')}`,
        )
      }

      summaryLines.push('The Business Rule table has been refreshed. You can review the new records now.')

      appendAssistantMessage(summaryLines.join('\n'))
    } catch (cause) {
      appendAssistantMessage(
        cause instanceof Error
          ? `I could not complete the import: ${cause.message}`
          : 'I could not complete the import. Please verify the workbook template and try again.',
      )
    } finally {
      setAssistantBusy(false)
      event.target.value = ''
    }
  }
}

type AssistantMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
}

function AssistantMessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-[88%] rounded-[24px] px-4 py-3 shadow-soft ${
            isUser
            ? 'border border-primary/14 bg-white text-foreground dark:border-primary/20 dark:bg-[#18314f] dark:text-slate-100'
            : 'border border-border-soft bg-[#F8FBFF] text-foreground dark:border-white/10 dark:bg-white/5 dark:text-slate-100'
        }`}
      >
        <div className="flex items-start gap-3">
          {!isUser ? (
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
          ) : null}
          <div className="min-w-0">
            <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${isUser ? 'text-primary' : 'text-muted-foreground'}`}>
              {isUser ? 'You' : 'Assistant'}
            </p>
            <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground dark:text-slate-100">
              {message.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterHeader({
  label,
  active,
  isOpen,
  onToggle,
  onClose,
  children,
}: {
  label: string
  active: boolean
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  children: ReactNode
}) {
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)
  const [popupStyle, setPopupStyle] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!isOpen) return

    function updatePopupPosition() {
      if (!triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      const popupWidth = 280
      const viewportPadding = 12
      const left = Math.min(
        Math.max(viewportPadding, rect.right - popupWidth),
        window.innerWidth - popupWidth - viewportPadding,
      )

      setPopupStyle({
        top: rect.bottom + 10,
        left,
      })
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      const elementTarget = event.target instanceof Element ? event.target : null
      if (
        triggerRef.current?.contains(target) ||
        popupRef.current?.contains(target) ||
        elementTarget?.closest('[data-codex-select-content="true"]')
      ) {
        return
      }
      onClose()
    }

    updatePopupPosition()
    window.addEventListener('resize', updatePopupPosition)
    window.addEventListener('scroll', updatePopupPosition, true)
    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      window.removeEventListener('resize', updatePopupPosition)
      window.removeEventListener('scroll', updatePopupPosition, true)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [isOpen, onClose])

  return (
    <div className="relative flex items-center gap-2">
      <span>{label}</span>
      <button
        ref={triggerRef}
        type="button"
        onClick={onToggle}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition ${
          active
            ? 'border-primary/20 bg-primary/10 text-primary'
            : 'border-transparent bg-transparent text-muted-foreground hover:border-border-soft hover:bg-surface'
        }`}
        aria-label={`Filter ${label} column`}
      >
        <Filter className="h-3.5 w-3.5" />
      </button>
      {isOpen && popupStyle
        ? createPortal(
            <div
              ref={popupRef}
              className="fixed z-[80] w-[280px]"
              style={{ top: popupStyle.top, left: popupStyle.left }}
            >
              <Card className="space-y-3 rounded-[20px] border-border-soft bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.14)] dark:bg-[#102033]">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Filter</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-soft text-muted-foreground transition hover:bg-surface-soft hover:text-foreground"
                    aria-label={`Close ${label} filter`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {children}
              </Card>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function ColumnFilterPanel({
  activeKey,
  filters,
  categoryOptions,
  propertyOptions,
  inquiryTypeOptions,
  onChange,
}: {
  activeKey: ColumnFilterKey
  filters: BusinessRuleColumnFilters
  categoryOptions: SelectOption[]
  propertyOptions: SelectOption[]
  inquiryTypeOptions: SelectOption[]
  onChange: Dispatch<SetStateAction<BusinessRuleColumnFilters>>
}) {
  const [draftFilters, setDraftFilters] = useState<BusinessRuleColumnFilters>(filters)

  useEffect(() => {
    setDraftFilters(filters)
  }, [activeKey, filters])

  function applyDraft() {
    onChange(() => draftFilters)
  }

  function clearDraft() {
    const nextDraft = clearSingleFilter(activeKey, draftFilters)
    setDraftFilters(nextDraft)
    onChange(() => clearSingleFilter(activeKey, filters))
  }

  if (activeKey === 'rule') {
    const current = draftFilters.rule
    return (
      <div className="space-y-3">
        <Select
          className="h-10 rounded-xl"
          contentClassName="z-[120]"
          value={current.operator}
          onValueChange={(value) =>
            setDraftFilters((prev) => ({
              ...prev,
              rule: {
                ...prev.rule,
                operator: value as 'contains' | 'equals',
              },
            }))
          }
          options={[
            { value: 'contains', label: 'Contains' },
            { value: 'equals', label: 'Equals' },
          ]}
        />
        <Input
          className="h-10 rounded-xl"
          value={current.value}
          onChange={(event) =>
            setDraftFilters((prev) => ({
              ...prev,
              rule: {
                ...prev.rule,
                value: event.target.value,
              },
            }))
          }
          placeholder="Enter rule name"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" className="rounded-full bg-white dark:bg-[#1E293B]" onClick={clearDraft}>
            Clear
          </Button>
          <Button type="button" size="sm" className="rounded-full" onClick={applyDraft}>
            Apply
          </Button>
        </div>
      </div>
    )
  }

  if (activeKey === 'category' || activeKey === 'property' || activeKey === 'inquiryType') {
    const options =
      activeKey === 'category'
        ? categoryOptions
        : activeKey === 'property'
          ? propertyOptions
          : inquiryTypeOptions

    return (
      <div className="space-y-3">
        <Select
          className="h-10 rounded-xl"
          contentClassName="z-[120]"
          value={draftFilters[activeKey].value}
          onValueChange={(value) =>
            setDraftFilters((prev) => ({
              ...prev,
              [activeKey]: { value },
            }))
          }
          placeholder={`Select ${filterTitle(activeKey).toLowerCase()}`}
          options={[
            { value: '', label: `All ${filterTitle(activeKey)}` },
            ...options,
          ]}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" className="rounded-full bg-white dark:bg-[#1E293B]" onClick={clearDraft}>
            Clear
          </Button>
          <Button type="button" size="sm" className="rounded-full" onClick={applyDraft}>
            Apply
          </Button>
        </div>
      </div>
    )
  }

  const current = draftFilters.consequences
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          className="h-10 rounded-xl"
          type="number"
          value={current.min}
          onChange={(event) =>
            setDraftFilters((prev) => ({
              ...prev,
              consequences: {
                ...prev.consequences,
                min: event.target.value,
              },
            }))
          }
          placeholder="Minimum"
        />
        <Input
          className="h-10 rounded-xl"
          type="number"
          value={current.max}
          onChange={(event) =>
            setDraftFilters((prev) => ({
              ...prev,
              consequences: {
                ...prev.consequences,
                max: event.target.value,
              },
            }))
          }
          placeholder="Maximum"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" className="rounded-full bg-white dark:bg-[#1E293B]" onClick={clearDraft}>
          Clear
        </Button>
        <Button type="button" size="sm" className="rounded-full" onClick={applyDraft}>
          Apply
        </Button>
      </div>
    </div>
  )
}

function isColumnFilterActive(key: ColumnFilterKey, filters: BusinessRuleColumnFilters) {
  if (key === 'consequences') return Boolean(filters.consequences.min || filters.consequences.max)
  return Boolean(filters[key].value)
}

function countActiveFilters(filters: BusinessRuleColumnFilters) {
  return (['rule', 'category', 'property', 'inquiryType', 'consequences'] as ColumnFilterKey[]).reduce(
    (count, key) => count + (isColumnFilterActive(key, filters) ? 1 : 0),
    0,
  )
}

function clearSingleFilter(key: ColumnFilterKey, filters: BusinessRuleColumnFilters): BusinessRuleColumnFilters {
  return {
    ...filters,
    [key]: defaultColumnFilters[key],
  }
}

function filterTitle(key: ColumnFilterKey) {
  if (key === 'rule') return 'Rules'
  if (key === 'category') return 'Categories'
  if (key === 'property') return 'Properties'
  if (key === 'inquiryType') return 'Inquiry Types'
  return 'Consequences'
}

function normalizeFilterValue(value: string) {
  return value.trim().toLowerCase()
}

function wait(durationMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs)
  })
}
