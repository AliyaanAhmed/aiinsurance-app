import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { DashboardPage } from '../pages/dashboard/ExecutiveDashboard'
import { EmailQueuesPage } from '../pages/email-queues/EmailQueuesPage'
import { EmailQueueWorkspacePage } from '../pages/email-queues/EmailQueueWorkspacePage'
import { InquiriesPage } from '../pages/inquiries/InquiryListPage'
import { InquiryWorkspacePage } from '../pages/inquiries/InquiryWorkspacePage'
import { QuotesPage } from '../pages/quotes/QuotesPage'
import { QuoteWorkbenchPage } from '../pages/quotes/QuoteWorkbenchPage'
import { PolicyConversionsPage } from '../pages/policy-conversions/PolicyConversionsPage'
import { PolicyConversionWorkspacePage } from '../pages/policy-conversions/PolicyConversionWorkspacePage'
import { RenewalOperationsPage } from '../pages/renewals/RenewalOperationsPage'
import { AnalyticsPage } from '../pages/analytics/AnalyticsPage'
import { ProductsPage } from '../pages/products/ProductsPage'
import { ProductEditorPage } from '../pages/products/ProductEditorPage'
import { PolicyWorkspacePage } from '../pages/policies/PolicyWorkspacePage'
import { AccessDeniedPage } from '../pages/system/AccessDeniedPage'
import { GuardedRoute } from '../components/system/GuardedRoute'
import { AdminCatalogPage } from '../pages/admin/AdminCatalogPage'
import { AdminDetailPage } from '../pages/admin/AdminDetailPage'
import { AccountWorkspacePage } from '../pages/admin/AccountWorkspacePage'
import { ContactWorkspacePage } from '../pages/admin/ContactWorkspacePage'
import { DocumentTemplatePreviewPage } from '../pages/admin/DocumentTemplatePreviewPage'
import { EmailTemplatesPage } from '../pages/admin/EmailTemplatesPage'
import { DocumentTemplatesPage } from '../pages/admin/DocumentTemplatesPage'
import { BusinessRulesPage } from '../pages/admin/BusinessRulesPage'
import { BusinessRuleWorkspacePage } from '../pages/admin/BusinessRuleWorkspacePage'
import { PlanWorkspacePage } from '../pages/admin/PlanWorkspacePage'
import { ReinsurersPage } from '../pages/reinsurance/ReinsurersPage'
import { TreatiesPage } from '../pages/reinsurance/TreatiesPage'
import { TreatyLayersPage } from '../pages/reinsurance/TreatyLayersPage'
import { TreatyParticipationsPage } from '../pages/reinsurance/TreatyParticipationsPage'
import { RiCapacityChecksPage } from '../pages/reinsurance/RiCapacityChecksPage'
import { FacPlacementsPage } from '../pages/reinsurance/FacPlacementsPage'
import { FacOffersPage } from '../pages/reinsurance/FacOffersPage'
import { CessionsPage } from '../pages/reinsurance/CessionsPage'
import { CessionLinesPage } from '../pages/reinsurance/CessionLinesPage'
import {
  Boxes,
  BriefcaseBusiness,
  Building2,
  Layers3,
  ListChecks,
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
        path: 'email-queues',
        element: (
          <GuardedRoute bucket="leads">
            <EmailQueuesPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'email-queues/:id',
        element: (
          <GuardedRoute bucket="leads">
            <EmailQueueWorkspacePage />
          </GuardedRoute>
        ),
      },
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
        path: 'policy-conversions',
        element: (
          <GuardedRoute bucket="leads">
            <PolicyConversionsPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'policy-conversions/:id',
        element: (
          <GuardedRoute bucket="leads">
            <PolicyConversionWorkspacePage />
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
        path: 'admin/plans/:id/edit',
        element: (
          <GuardedRoute bucket="products">
            <PlanWorkspacePage />
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
            <BusinessRulesPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/business-rules/create',
        element: (
          <GuardedRoute bucket="products">
            <BusinessRuleWorkspacePage />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/business-rules/:id/edit',
        element: (
          <GuardedRoute bucket="products">
            <BusinessRuleWorkspacePage />
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
            <AccountWorkspacePage />
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
            <ContactWorkspacePage />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/email-templates',
        element: (
          <GuardedRoute bucket="admin">
            <EmailTemplatesPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'admin/document-templates',
        element: (
          <GuardedRoute bucket="admin">
            <DocumentTemplatesPage />
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
      {
        path: 'reinsurance/reinsurers',
        element: (
          <GuardedRoute bucket="admin">
            <ReinsurersPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'reinsurance/treaties',
        element: (
          <GuardedRoute bucket="admin">
            <TreatiesPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'reinsurance/treaty-layers',
        element: (
          <GuardedRoute bucket="admin">
            <TreatyLayersPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'reinsurance/treaty-participations',
        element: (
          <GuardedRoute bucket="admin">
            <TreatyParticipationsPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'reinsurance/ri-capacity-checks',
        element: (
          <GuardedRoute bucket="admin">
            <RiCapacityChecksPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'reinsurance/ri-capacity-checks/:id',
        element: (
          <GuardedRoute bucket="admin">
            <RiCapacityChecksPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'reinsurance/fac-placements',
        element: (
          <GuardedRoute bucket="admin">
            <FacPlacementsPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'reinsurance/fac-offers',
        element: (
          <GuardedRoute bucket="admin">
            <FacOffersPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'reinsurance/cessions',
        element: (
          <GuardedRoute bucket="admin">
            <CessionsPage />
          </GuardedRoute>
        ),
      },
      {
        path: 'reinsurance/cession-lines',
        element: (
          <GuardedRoute bucket="admin">
            <CessionLinesPage />
          </GuardedRoute>
        ),
      },
      { path: 'access-denied', element: <AccessDeniedPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
