import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { Card } from './Card'
import { EmptyState } from './EmptyState'

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  emptyTitle: string
  emptyDescription: string
  preserveHeaderOnEmpty?: boolean
}

export function DataTable<T>({
  columns,
  data,
  emptyTitle,
  emptyDescription,
  preserveHeaderOnEmpty = false,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (data.length === 0 && !preserveHeaderOnEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <Card padding="none" variant="premium" className="overflow-hidden border-border-soft">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-surface-muted/90">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-4 text-left text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr className="bg-surface">
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center"
                >
                  <div className="mx-auto max-w-md space-y-2">
                    <p className="text-base font-semibold text-foreground">{emptyTitle}</p>
                    <p className="text-sm text-muted-foreground">{emptyDescription}</p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border-soft/80 bg-surface transition duration-150 hover:bg-primary/5"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-4 align-middle text-[13px]">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
