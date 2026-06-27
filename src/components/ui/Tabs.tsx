import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../../lib/cn'
import type { ComponentPropsWithoutRef, ElementRef, ComponentType } from 'react'
import { forwardRef } from 'react'

export const Tabs = TabsPrimitive.Root

export const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'flex w-full flex-wrap gap-1.5 rounded-[20px] border border-border-soft bg-surface p-1.5 md:flex-nowrap',
      className,
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

export const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    icon?: ComponentType<{ className?: string }>
  }
>(({ className, icon: Icon, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-[16px] px-3.5 py-2 text-[13px] font-semibold text-muted-foreground transition hover:bg-surface-muted data-[state=active]:bg-primary data-[state=active]:text-white',
      className,
    )}
    {...props}
  >
    {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
    <span className="truncate">{children}</span>
  </TabsPrimitive.Trigger>
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

export const TabsContent = TabsPrimitive.Content
