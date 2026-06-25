import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { DashboardPage } from '../pages/dashboard/ExecutiveDashboard'
import { InquiriesPage } from '../pages/inquiries/InquiryListPage'
import { InquiryWorkspacePage } from '../pages/inquiries/InquiryWorkspacePage'
import { QuotesPage } from '../pages/quotes/QuotesPage'
import { QuoteWorkbenchPage } from '../pages/quotes/QuoteWorkbenchPage'
import { RenewalOperationsPage } from '../pages/renewals/RenewalOperationsPage'
import { AnalyticsPage } from '../pages/analytics/AnalyticsPage'
import { ProductsPage } from '../pages/products/ProductsPage'
import { ProductEditorPage } from '../pages/products/ProductEditorPage'
import { PolicyWorkspacePage } from '../pages/policies/PolicyWorkspacePage'
import { AccessDeniedPage } from '../pages/system/AccessDeniedPage'
import { GuardedRoute } from '../components/system/GuardedRoute'
import { AdminCatalogPage } from '../pages/admin/AdminCatalogPage'
import { AdminDetailPage } from '../pages/admin/AdminDetailPage'
import { DocumentTemplatePreviewPage } from '../pages/admin/DocumentTemplatePreviewPage'
import {
  Boxes,
  BriefcaseBusiness,
  Building2,
  FilePenLine,
  Files,
  Layers3,
  ListChecks,
  Mail,
  NotebookTabs,
  ScanLine,
  ServerCog,
  ShieldPlus,
  ShieldX,
  Users,
} from 'lucide-react'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: 'inquiries',
        element: (
          <GuardedRoute bucket="leads">
            <InquiriesPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'inquiries/:id',
        element: (
          <GuardedRoute bucket="leads">
            <InquiryWorkspacePage />
          </GuardedRoute>
        ),
      },
      {
        path: 'quotes',
        element: (
          <GuardedRoute bucket="leads">
            <QuotesPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'quotes/:id/edit',
        element: (
          <GuardedRoute bucket="leads">
            <QuoteWorkbenchPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'renewals',
        element: (
          <GuardedRoute bucket="leads">
            <RenewalOperationsPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'policies/:id',
        element: (
          <GuardedRoute bucket="leads">
            <PolicyWorkspacePage />
          </GuardedRoute>
        ),
      },
      {
        path: 'analytics',
        element: (
          <GuardedRoute bucket="leads">
            <AnalyticsPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/products',
        element: (
          <GuardedRoute bucket="products">
            <ProductsPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/products/create',
        element: (
          <GuardedRoute bucket="products">
            <ProductEditorPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/products/:id/edit',
        element: (
          <GuardedRoute bucket="products">
            <ProductEditorPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/plans',
        element: (
          <GuardedRoute bucket="products">
            <AdminCatalogPage entity="plans" icon={Boxes} />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/coverages',
        element: (
          <GuardedRoute bucket="products">
            <AdminCatalogPage entity="coverages" icon={ShieldPlus} />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/benefits',
        element: (
          <GuardedRoute bucket="products">
            <AdminCatalogPage entity="benefits" icon={BriefcaseBusiness} />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/inclusions',
        element: (
          <GuardedRoute bucket="products">
            <AdminCatalogPage entity="inclusions" icon={Layers3} />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/exclusions',
        element: (
          <GuardedRoute bucket="products">
            <AdminCatalogPage entity="exclusions" icon={ShieldX} />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/warranties',
        element: (
          <GuardedRoute bucket="products">
            <AdminCatalogPage entity="warranties" icon={ScanLine} />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/deductibles',
        element: (
          <GuardedRoute bucket="products">
            <AdminCatalogPage entity="deductibles" icon={ListChecks} />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/business-rules',
        element: (
          <GuardedRoute bucket="products">
            <AdminCatalogPage entity="business-rules" icon={FilePenLine} />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/policies',
        element: (
          <GuardedRoute bucket="admin">
            <AdminCatalogPage entity="policies" icon={NotebookTabs} />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/business-units',
        element: (
          <GuardedRoute bucket="admin">
            <AdminCatalogPage entity="business-units" icon={ServerCog} />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/business-units/:id',
        element: (
          <GuardedRoute bucket="admin">
            <AdminDetailPage entity="business-units" />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/users',
        element: (
          <GuardedRoute bucket="admin">
            <AdminCatalogPage entity="users" icon={Users} />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/users/:id',
        element: (
          <GuardedRoute bucket="admin">
            <AdminDetailPage entity="users" />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/brokers',
        element: (
          <GuardedRoute bucket="admin">
            <AdminCatalogPage entity="brokers" icon={BriefcaseBusiness} />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/accounts',
        element: (
          <GuardedRoute bucket="admin">
            <AdminCatalogPage entity="accounts" icon={Building2} />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/accounts/:id',
        element: (
          <GuardedRoute bucket="admin">
            <AdminDetailPage entity="accounts" />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/contacts',
        element: (
          <GuardedRoute bucket="admin">
            <AdminCatalogPage entity="contacts" icon={Users} />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/contacts/:id',
        element: (
          <GuardedRoute bucket="admin">
            <AdminDetailPage entity="contacts" />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/email-templates',
        element: (
          <GuardedRoute bucket="admin">
            <AdminCatalogPage entity="email-templates" icon={Mail} />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/document-templates',
        element: (
          <GuardedRoute bucket="admin">
            <AdminCatalogPage entity="document-templates" icon={Files} />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/document-templates/preview/:templateId',
        element: (
          <GuardedRoute bucket="admin">
            <DocumentTemplatePreviewPage />
          </GuardedRoute>
        ),
      },
      { path: 'access-denied', element: <AccessDeniedPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
