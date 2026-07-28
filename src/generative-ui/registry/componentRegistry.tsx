import type { ComponentType } from 'react'
import { CtaBanner } from '../../components/sections/CtaBanner'
import { DynamicChart } from '../../components/sections/DynamicChart'
import { Faq } from '../../components/sections/Faq'
import { Footer } from '../../components/sections/Footer'
import { Hero } from '../../components/sections/Hero'
import { LeadForm } from '../../components/sections/LeadForm/LeadForm'
import { LogosBand } from '../../components/sections/LogosBand'
import { Navbar } from '../../components/sections/Navbar'
import { PricingCards } from '../../components/sections/PricingCards'
import { ServicesGrid } from '../../components/sections/ServicesGrid'
import { StatsBand } from '../../components/sections/StatsBand'
import { Testimonials } from '../../components/sections/Testimonials'
import { InsuranceCalculator } from '../../components/sections/InsuranceCalculator'
import type { BlockType, SectionStyle } from '../schemas'

type RegistryComponent = ComponentType<{ props: any; style?: SectionStyle }>

export const componentRegistry: Record<BlockType, RegistryComponent> = {
  navbar: Navbar,
  hero: Hero,
  logosBand: LogosBand,
  servicesGrid: ServicesGrid,
  leadForm: LeadForm,
  testimonials: Testimonials,
  statsBand: StatsBand,
  faq: Faq,
  ctaBanner: CtaBanner,
  footer: Footer,
  dynamicChart: DynamicChart,
  insuranceCalculator: InsuranceCalculator,
  pricingCards: PricingCards,
}
