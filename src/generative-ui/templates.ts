import { assistantResponseSchema, type AssistantResponse, type DesignSystem, type SectionStyle } from './schemas.ts'

export type TemplateId = 'horizon' | 'pulse' | 'signal' | 'meridian' | 'canopy' | 'northstar' | 'current' | 'velocity' | 'ledger'

type TemplateConfig = {
  name: string
  description: string
  tag: string
  system: DesignSystem
  hero: {
    eyebrow: string
    headline: string
    subheadline: string
    media: string
    variant: SectionStyle['variant']
    align: SectionStyle['align']
    surface: SectionStyle['surface']
    visualStyle: 'editorial' | 'carousel' | 'ctaOnly' | 'dashboard'
  }
  services: {
    headline: string
    layout: 'cards' | 'bento' | 'splitFeature' | 'list'
    surface: SectionStyle['surface']
    columns: 2 | 3 | 4
  }
}

const configs: Record<TemplateId, TemplateConfig> = {
  horizon: {
    name: 'Horizon', description: 'Photo-led, calm and reassuring with an editorial quote journey.', tag: 'Family & personal',
    system: { name: 'Horizon', preset: 'horizon', colors: { primary: '#124E5A', secondary: '#4F7B72', accent: '#C49A56', background: '#F5F8F7', surface: '#FFFFFF', text: '#183238', muted: '#60757A' }, typography: { display: 'grotesk', body: 'humanist' }, radius: 'soft' },
    hero: { eyebrow: 'Independent advice for real life', headline: 'Insurance that moves with your family', subheadline: 'Clear guidance, thoughtful cover and a quote journey that respects your time.', media: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=1600&q=85', variant: 'split', align: 'left', surface: 'light', visualStyle: 'editorial' },
    services: { headline: 'Cover shaped around the life you are building', layout: 'cards', surface: 'light', columns: 2 },
  },
  pulse: {
    name: 'Pulse', description: 'Bold cobalt, oversized type and asymmetric conversion blocks.', tag: 'Digital-first',
    system: { name: 'Pulse', preset: 'pulse', colors: { primary: '#3449C5', secondary: '#6572B8', accent: '#DE745F', background: '#F6F7FC', surface: '#FFFFFF', text: '#20263B', muted: '#687087' }, typography: { display: 'grotesk', body: 'humanist' }, radius: 'soft' },
    hero: { eyebrow: 'Cover, without the complexity', headline: 'Move fast. Stay covered.', subheadline: 'A digital-first broker experience built around quick decisions and clear next steps.', media: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=85', variant: 'immersive', align: 'center', surface: 'dark', visualStyle: 'ctaOnly' },
    services: { headline: 'Everything important, arranged around you', layout: 'cards', surface: 'light', columns: 2 },
  },
  signal: {
    name: 'Signal', description: 'Cinematic dark surfaces and precise proof-led content.', tag: 'Specialist risk',
    system: { name: 'Signal', preset: 'signal', colors: { primary: '#718CDD', secondary: '#4D6F98', accent: '#8DC6BA', background: '#0B1220', surface: '#131D2C', text: '#F4F6FA', muted: '#A4AFBF' }, typography: { display: 'grotesk', body: 'humanist' }, radius: 'soft' },
    hero: { eyebrow: 'Specialist risk. Human judgement.', headline: 'Clarity for complex cover', subheadline: 'Specialist advice and a focused route from first question to tailored recommendation.', media: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=85', variant: 'split', align: 'left', surface: 'dark', visualStyle: 'dashboard' },
    services: { headline: 'A more intelligent path through risk', layout: 'cards', surface: 'light', columns: 2 },
  },
  meridian: {
    name: 'Meridian', description: 'Editorial typography, coral accents and confident commercial storytelling.', tag: 'Business cover',
    system: { name: 'Meridian', preset: 'custom', colors: { primary: '#983F50', secondary: '#705A61', accent: '#C98B62', background: '#FAF7F8', surface: '#FFFFFF', text: '#302329', muted: '#796A70' }, typography: { display: 'editorial', body: 'humanist' }, radius: 'sharp' },
    hero: { eyebrow: 'Built for ambitious businesses', headline: 'Protection for what comes next', subheadline: 'Commercial insurance with thoughtful advice, decisive service and no wasted motion.', media: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=85', variant: 'split', align: 'right', surface: 'light', visualStyle: 'editorial' },
    services: { headline: 'Expertise for every stage of growth', layout: 'cards', surface: 'light', columns: 2 },
  },
  canopy: {
    name: 'Canopy', description: 'Fresh green, clear whitespace and approachable protection pathways.', tag: 'Health & life',
    system: { name: 'Canopy', preset: 'custom', colors: { primary: '#1B725D', secondary: '#5C8373', accent: '#B59652', background: '#F4F8F5', surface: '#FFFFFF', text: '#20352F', muted: '#687B74' }, typography: { display: 'grotesk', body: 'humanist' }, radius: 'rounded' },
    hero: { eyebrow: 'Care that looks ahead', headline: 'Confidence for every chapter', subheadline: 'Simple life and health protection shaped around the people who depend on you.', media: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1600&q=85', variant: 'split', align: 'left', surface: 'light', visualStyle: 'carousel' },
    services: { headline: 'Protection made easier to understand', layout: 'cards', surface: 'light', columns: 2 },
  },
  northstar: {
    name: 'Northstar', description: 'High-contrast editorial layout with sharp magenta and cyan signals.', tag: 'Modern brokerage',
    system: { name: 'Northstar', preset: 'custom', colors: { primary: '#285E68', secondary: '#547C82', accent: '#C27056', background: '#F6F8F8', surface: '#FFFFFF', text: '#203135', muted: '#66777B' }, typography: { display: 'grotesk', body: 'humanist' }, radius: 'sharp' },
    hero: { eyebrow: 'A broker on your side', headline: 'Better choices begin with clarity', subheadline: 'Compare the right options, understand the trade-offs and move forward with confidence.', media: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=85', variant: 'immersive', align: 'left', surface: 'dark', visualStyle: 'editorial' },
    services: { headline: 'Advice that earns its place', layout: 'cards', surface: 'light', columns: 2 },
  },
  current: {
    name: 'Current', description: 'Airy travel-inspired storytelling with blue, aqua and coral contrast.', tag: 'Travel & lifestyle',
    system: { name: 'Current', preset: 'custom', colors: { primary: '#216B83', secondary: '#4D8B88', accent: '#D78063', background: '#F3F8F9', surface: '#FFFFFF', text: '#203943', muted: '#657B84' }, typography: { display: 'grotesk', body: 'humanist' }, radius: 'rounded' },
    hero: { eyebrow: 'Go further with confidence', headline: 'Cover made for the journey', subheadline: 'Flexible protection and human support for holidays, adventures and everything between.', media: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85', variant: 'split', align: 'left', surface: 'light', visualStyle: 'carousel' },
    services: { headline: 'Ready wherever plans take you', layout: 'cards', surface: 'light', columns: 2 },
  },
  velocity: {
    name: 'Velocity', description: 'Performance-led black, red and silver with cinematic automotive imagery.', tag: 'Motor & performance',
    system: { name: 'Velocity', preset: 'custom', colors: { primary: '#CF4141', secondary: '#606874', accent: '#C99A55', background: '#0D0F13', surface: '#171B21', text: '#F5F6F8', muted: '#A3A9B2' }, typography: { display: 'grotesk', body: 'humanist' }, radius: 'sharp' },
    hero: { eyebrow: 'Engineered for the road ahead', headline: 'Protection at full speed', subheadline: 'Responsive motor cover for everyday drivers, enthusiasts and specialist vehicles.', media: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=85', variant: 'immersive', align: 'center', surface: 'dark', visualStyle: 'ctaOnly' },
    services: { headline: 'Performance without compromise', layout: 'cards', surface: 'light', columns: 2 },
  },
  ledger: {
    name: 'Ledger', description: 'Structured, data-aware and quietly premium for complex business insurance.', tag: 'Corporate & fleet',
    system: { name: 'Ledger', preset: 'custom', colors: { primary: '#315F52', secondary: '#60766F', accent: '#A1AD69', background: '#F5F7F6', surface: '#FFFFFF', text: '#24342F', muted: '#6A7974' }, typography: { display: 'grotesk', body: 'humanist' }, radius: 'soft' },
    hero: { eyebrow: 'Risk, made actionable', headline: 'A clearer view of business protection', subheadline: 'Specialist insurance, practical insight and a streamlined path from exposure to action.', media: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85', variant: 'split', align: 'right', surface: 'dark', visualStyle: 'dashboard' },
    services: { headline: 'Built around operational reality', layout: 'cards', surface: 'light', columns: 2 },
  },
}

export const templateMeta = (Object.entries(configs) as Array<[TemplateId, TemplateConfig]>).map(([id, config]) => ({
  id,
  name: config.name,
  description: config.description,
  swatches: [config.system.colors.primary, config.system.colors.secondary, config.system.colors.background],
  tag: config.tag,
}))

const sharedForm = {
  headline: 'A clearer quote starts here', layout: 'multiStep' as const,
  steps: [
    { title: 'Tell us what you need', description: 'A few details help us route your enquiry to the right adviser.', fields: [
      { id: 'coverage', kind: 'select' as const, label: 'What would you like to insure?', required: true, options: ['Car', 'Home', 'Business', 'Life'] },
      { id: 'postcode', kind: 'text' as const, label: 'Postcode', required: true, placeholder: 'Enter postcode' },
    ] },
    { title: 'How can we reach you?', fields: [
      { id: 'name', kind: 'text' as const, label: 'Full name', required: true, placeholder: 'Your name' },
      { id: 'email', kind: 'email' as const, label: 'Email address', required: true, placeholder: 'you@example.com' },
      { id: 'phone', kind: 'tel' as const, label: 'Phone number', required: false, placeholder: 'Optional' },
    ] },
  ],
  submitLabel: 'Request my quote', consentText: '',
}

function style(config: TemplateConfig, overrides: Partial<SectionStyle>): SectionStyle {
  return { variant: 'editorial', align: 'left', headingSize: 'lg', width: 'contained', surface: 'light', columns: 3, radius: config.system.radius, ...overrides }
}

function calculatorFor(id: TemplateId, config: TemplateConfig) {
  const common = { currency: 'USD', disclaimer: 'Illustrative estimate only. Final pricing depends on full underwriting information.', ctaLabel: 'Continue to a full quote' }
  if (id === 'velocity' || id === 'horizon') return {
    id: 'calculator', type: 'insuranceCalculator' as const, action: 'upsert' as const, animation: { entrance: 'fadeUp' as const, stagger: false }, style: style(config, { variant: 'split', surface: 'light', columns: 2 }),
    props: { ...common, eyebrow: 'Interactive motor estimate', headline: 'See how your driving details shape the estimate', intro: 'Adjust the vehicle value, driver age and annual mileage to explore an illustrative range.', calculatorType: 'auto' as const, baseAmount: 24, resultLabel: 'Illustrative monthly range', inputs: [
      { id: 'vehicle-value', label: 'Vehicle value', min: 5000, max: 100000, step: 1000, defaultValue: 28000, prefix: '$', weight: .0012 },
      { id: 'driver-age', label: 'Driver age', min: 18, max: 80, step: 1, defaultValue: 38, suffix: ' years', weight: -.12 },
      { id: 'annual-mileage', label: 'Annual mileage', min: 2000, max: 30000, step: 1000, defaultValue: 10000, suffix: ' mi', weight: .001 },
    ] },
  }
  if (id === 'canopy') return {
    id: 'calculator', type: 'insuranceCalculator' as const, action: 'upsert' as const, animation: { entrance: 'fadeUp' as const, stagger: false }, style: style(config, { variant: 'split', surface: 'light', columns: 2 }),
    props: { ...common, eyebrow: 'Interactive protection estimate', headline: 'Explore a starting point for family protection', intro: 'Adjust a few broad factors to see an illustrative range before a full needs assessment.', calculatorType: 'life' as const, baseAmount: 12, resultLabel: 'Illustrative monthly range', inputs: [
      { id: 'age', label: 'Applicant age', min: 18, max: 70, step: 1, defaultValue: 35, suffix: ' years', weight: .22 },
      { id: 'cover-amount', label: 'Cover amount', min: 50000, max: 1000000, step: 25000, defaultValue: 250000, prefix: '$', weight: .00008 },
    ] },
  }
  if (id === 'current') return {
    id: 'calculator', type: 'insuranceCalculator' as const, action: 'upsert' as const, animation: { entrance: 'fadeUp' as const, stagger: false }, style: style(config, { variant: 'split', surface: 'light', columns: 2 }),
    props: { ...common, eyebrow: 'Interactive trip estimate', headline: 'Explore protection for the trip ahead', intro: 'Adjust trip value, duration and travellers to explore an illustrative range.', calculatorType: 'general' as const, baseAmount: 9, resultLabel: 'Illustrative trip range', inputs: [
      { id: 'trip-value', label: 'Trip value', min: 500, max: 30000, step: 500, defaultValue: 5000, prefix: '$', weight: .003 },
      { id: 'duration', label: 'Trip duration', min: 2, max: 60, step: 1, defaultValue: 10, suffix: ' days', weight: .7 },
      { id: 'travellers', label: 'Travellers', min: 1, max: 8, step: 1, defaultValue: 2, weight: 6 },
    ] },
  }
  return {
    id: 'calculator', type: 'insuranceCalculator' as const, action: 'upsert' as const, animation: { entrance: 'fadeUp' as const, stagger: false }, style: style(config, { variant: 'split', surface: 'light', columns: 2 }),
    props: { ...common, eyebrow: 'Interactive business estimate', headline: 'Explore the factors behind your cover', intro: 'Adjust business size and annual revenue to explore an illustrative starting range.', calculatorType: 'business' as const, baseAmount: 32, resultLabel: 'Illustrative monthly range', inputs: [
      { id: 'employees', label: 'Employees', min: 1, max: 250, step: 1, defaultValue: 18, weight: 1.15 },
      { id: 'revenue', label: 'Annual revenue', min: 50000, max: 5000000, step: 50000, defaultValue: 750000, prefix: '$', weight: .00004 },
    ] },
  }
}

function makeTemplate(id: TemplateId): AssistantResponse {
  const config = configs[id]
  return assistantResponseSchema.parse({
    assistant_markdown: `**${config.name} is ready as a working canvas.** Share the business details below. I will use them to recommend two or three stronger visual directions with palettes tailored to the company before rebuilding the page.`,
    questions: [
      { id: 'company', label: 'Company or brand name', kind: 'text', placeholder: 'e.g. OS Broker', required: true },
      { id: 'location', label: 'Where do you operate?', kind: 'text', placeholder: 'City, region, or country', required: true },
      { id: 'insurance', label: 'What do you insure?', kind: 'select', options: ['Car and motor', 'Home and property', 'Business and commercial', 'Health and life', 'Travel', 'Mixed products'], required: true },
      { id: 'goal', label: 'What is the main goal of this page?', kind: 'radio', options: ['Quote requests', 'Callback requests', 'Lead capture', 'Product education'], required: true },
      { id: 'audience', label: 'Who is the typical customer?', kind: 'textarea', placeholder: 'Describe the customer in one or two lines', required: true },
    ],
    template_recommendations: [],
    suggestions: ['Adapt this to my company', 'Change the color palette', 'Customize the quote form'],
    stage: 'intro', design_system: config.system,
    ui_blocks: [
      { id: 'navbar', type: 'navbar', action: 'upsert', animation: { entrance: 'fadeIn', stagger: false }, style: style(config, { variant: 'minimal', surface: 'light' }), props: { logoText: config.name, links: [{ label: 'Cover', href: '#cover' }, { label: 'Why us', href: '#why-us' }, { label: 'FAQs', href: '#faqs' }], ctaLabel: 'Start a quote', sticky: true } },
      { id: 'hero', type: 'hero', action: 'upsert', animation: { entrance: 'fadeUp', stagger: false }, style: style(config, { variant: config.hero.variant, align: config.hero.align, headingSize: 'xl', width: 'full', surface: config.hero.surface, columns: 2 }), props: { eyebrow: config.hero.eyebrow, headline: config.hero.headline, subheadline: config.hero.subheadline, ctaLabel: 'Get a quote', secondaryCtaLabel: 'Explore cover', backgroundStyle: config.hero.variant === 'split' ? 'split' : 'image', visualStyle: config.hero.visualStyle, media: { type: 'image', src: config.hero.media, alt: 'Insurance customer supported with confidence' }, overlay: { style: 'linear', color: config.system.colors.text, opacity: config.hero.surface === 'dark' ? .62 : .3, direction: config.hero.align === 'right' ? 'right' : 'left' }, slides: [{ title: 'Simple questions', description: 'A guided route with no unnecessary friction.', metric: '01' }, { title: 'Human advice', description: 'A real adviser when the details matter.', metric: '02' }] } },
      { id: 'logos', type: 'logosBand', action: 'upsert', animation: { entrance: 'fadeIn', stagger: true }, style: style(config, { variant: 'minimal', surface: 'light', columns: 4 }), props: { eyebrow: 'Trusted protection partners', logos: [{ name: 'North & Co' }, { name: 'Beacon' }, { name: 'Union' }, { name: 'Atlas' }] } },
      { id: 'services', type: 'servicesGrid', action: 'upsert', animation: { entrance: 'fadeUp', stagger: true }, style: style(config, { variant: config.services.layout === 'bento' ? 'bento' : config.services.layout === 'list' ? 'minimal' : 'editorial', surface: config.services.surface, columns: config.services.columns }), props: { eyebrow: 'Designed around your needs', headline: config.services.headline, layout: config.services.layout, iconSize: 'lg', spacing: 'airy', items: [
        { icon: 'car', title: 'Everyday cover', description: 'Protection for the journeys, people and places that matter most.' },
        { icon: 'shield', title: 'Specialist guidance', description: 'Clear recommendations when the details are less straightforward.' },
        { icon: 'sparkles', title: 'Better conversations', description: 'A focused quote path that gives advisers the right context.' },
        { icon: 'clock', title: 'Less friction', description: 'Useful questions, visible progress and a clear next step.' },
      ] } },
      calculatorFor(id, config),
      { id: 'stats', type: 'statsBand', action: 'upsert', animation: { entrance: 'fadeUp', stagger: true }, style: style(config, { variant: 'minimal', surface: 'light', columns: 3 }), props: { stats: [{ value: '4.9/5', label: 'Client experience' }, { value: '24h', label: 'Typical response' }, { value: '1:1', label: 'Adviser support' }] } },
      { id: 'testimonials', type: 'testimonials', action: 'upsert', animation: { entrance: 'fadeUp', stagger: true }, style: style(config, { variant: id === 'pulse' || id === 'northstar' ? 'carousel' : 'editorial', surface: 'light', columns: 2 }), props: { eyebrow: 'Client perspective', headline: 'Advice that feels clear from the start', items: [{ quote: 'The process was straightforward, and every recommendation was explained in plain language.', name: 'Jordan M.', role: 'Policyholder' }, { quote: 'We understood our options and knew exactly what would happen next.', name: 'Alex R.', role: 'Business owner' }] } },
      { id: 'lead-form', type: 'leadForm', action: 'upsert', animation: { entrance: 'fadeUp', stagger: false }, style: style(config, { variant: id === 'pulse' || id === 'canopy' ? 'bento' : 'split', surface: 'light', columns: 2 }), props: sharedForm },
      { id: 'faq', type: 'faq', action: 'upsert', animation: { entrance: 'fadeUp', stagger: false }, style: style(config, { variant: 'editorial', surface: 'light', columns: 2 }), props: { headline: 'The questions worth answering early', items: [{ q: 'Can I speak to an adviser?', a: 'Yes. The quote flow can route visitors to a callback or consultation.' }, { q: 'Can this form match my process?', a: 'Yes. Its fields, steps and calls to action can be generated from your requirements.' }] } },
      { id: 'cta', type: 'ctaBanner', action: 'upsert', animation: { entrance: 'fadeUp', stagger: false }, style: style(config, { variant: 'minimal', surface: 'brand', columns: 2 }), props: { headline: 'Ready for a clearer conversation?', subheadline: 'Start with a few useful details and take the next step with confidence.', ctaLabel: 'Start a quote' } },
      { id: 'footer', type: 'footer', action: 'upsert', animation: { entrance: 'fadeIn', stagger: false }, style: style(config, { variant: 'minimal', headingSize: 'sm', surface: 'dark' }), props: { logoText: config.name, columns: [{ title: 'Explore', links: [{ label: 'Cover', href: '#cover' }, { label: 'Contact', href: '#contact' }] }, { title: 'Information', links: [{ label: 'Privacy', href: '#privacy' }, { label: 'Terms', href: '#terms' }] }], social: [], disclaimer: 'Demo copy. Add broker-approved regulatory and consent wording before publishing.' } },
    ],
  })
}

export const landingTemplates = Object.fromEntries(
  (Object.keys(configs) as TemplateId[]).map((id) => [id, makeTemplate(id)]),
) as Record<TemplateId, AssistantResponse>
