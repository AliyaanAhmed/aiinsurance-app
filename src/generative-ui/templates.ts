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
    media?: string
  }
}

const referenceDesignSystem: DesignSystem = {
  name: 'Datanox Fleet',
  preset: 'custom',
  colors: {
    primary: '#101828',
    secondary: '#2563EB',
    accent: '#F79009',
    background: '#F3F6FA',
    surface: '#FFFFFF',
    text: '#101828',
    muted: '#526179',
  },
  typography: { display: 'grotesk', body: 'humanist' },
  radius: 'rounded',
}

const configs: Record<TemplateId, TemplateConfig> = {
  horizon: {
    name: 'Horizon', description: 'Photo-led, calm and reassuring with an editorial quote journey.', tag: 'Family & personal',
    system: { name: 'Horizon', preset: 'horizon', colors: { primary: '#0B6E75', secondary: '#2F7D68', accent: '#F28C52', background: '#F4FAF9', surface: '#FFFFFF', text: '#102A2E', muted: '#5D7274' }, typography: { display: 'grotesk', body: 'humanist' }, radius: 'soft' },
    hero: { eyebrow: 'Independent advice for real life', headline: 'Insurance that moves with your family', subheadline: 'Clear guidance, thoughtful cover and a quote journey that respects your time.', media: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=1600&q=85', variant: 'split', align: 'left', surface: 'light', visualStyle: 'editorial' },
    services: { headline: 'Cover shaped around the life you are building', layout: 'splitFeature', surface: 'light', columns: 2, media: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=1100&q=85' },
  },
  pulse: {
    name: 'Pulse', description: 'Bold cobalt, oversized type and asymmetric conversion blocks.', tag: 'Digital-first',
    system: { name: 'Pulse', preset: 'pulse', colors: { primary: '#4F46E5', secondary: '#0891B2', accent: '#F97316', background: '#F7F8FF', surface: '#FFFFFF', text: '#171B35', muted: '#626B80' }, typography: { display: 'grotesk', body: 'humanist' }, radius: 'soft' },
    hero: { eyebrow: 'Cover, without the complexity', headline: 'Move fast. Stay covered.', subheadline: 'A digital-first broker experience built around quick decisions and clear next steps.', media: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=85', variant: 'immersive', align: 'center', surface: 'dark', visualStyle: 'ctaOnly' },
    services: { headline: 'Everything important, arranged around you', layout: 'bento', surface: 'light', columns: 4 },
  },
  signal: {
    name: 'Signal', description: 'Cinematic dark surfaces and precise proof-led content.', tag: 'Specialist risk',
    system: { name: 'Signal', preset: 'signal', colors: { primary: '#1D4ED8', secondary: '#0F766E', accent: '#F59E0B', background: '#F5F8FF', surface: '#FFFFFF', text: '#101828', muted: '#5D687A' }, typography: { display: 'grotesk', body: 'humanist' }, radius: 'soft' },
    hero: { eyebrow: 'Specialist risk. Human judgement.', headline: 'Clarity for complex cover', subheadline: 'Specialist advice and a focused route from first question to tailored recommendation.', media: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=85', variant: 'split', align: 'left', surface: 'dark', visualStyle: 'dashboard' },
    services: { headline: 'A more intelligent path through risk', layout: 'list', surface: 'light', columns: 2 },
  },
  meridian: {
    name: 'Meridian', description: 'Editorial typography, coral accents and confident commercial storytelling.', tag: 'Business cover',
    system: { name: 'Meridian', preset: 'custom', colors: { primary: '#B4235A', secondary: '#6D3FC0', accent: '#E78B3E', background: '#FFF8FB', surface: '#FFFFFF', text: '#321526', muted: '#765D69' }, typography: { display: 'editorial', body: 'humanist' }, radius: 'rounded' },
    hero: { eyebrow: 'Built for ambitious businesses', headline: 'Protection for what comes next', subheadline: 'Commercial insurance with thoughtful advice, decisive service and no wasted motion.', media: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=85', variant: 'split', align: 'right', surface: 'light', visualStyle: 'editorial' },
    services: { headline: 'Expertise for every stage of growth', layout: 'splitFeature', surface: 'light', columns: 2, media: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1100&q=85' },
  },
  canopy: {
    name: 'Canopy', description: 'Fresh green, clear whitespace and approachable protection pathways.', tag: 'Health & life',
    system: { name: 'Canopy', preset: 'custom', colors: { primary: '#087F5B', secondary: '#2563B8', accent: '#E58B19', background: '#F4FBF8', surface: '#FFFFFF', text: '#17352B', muted: '#60756E' }, typography: { display: 'grotesk', body: 'humanist' }, radius: 'rounded' },
    hero: { eyebrow: 'Care that looks ahead', headline: 'Confidence for every chapter', subheadline: 'Simple life and health protection shaped around the people who depend on you.', media: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1600&q=85', variant: 'split', align: 'left', surface: 'light', visualStyle: 'carousel' },
    services: { headline: 'Protection made easier to understand', layout: 'bento', surface: 'light', columns: 4 },
  },
  northstar: {
    name: 'Northstar', description: 'High-contrast editorial layout with sharp magenta and cyan signals.', tag: 'Modern brokerage',
    system: { name: 'Northstar', preset: 'custom', colors: { primary: '#2563EB', secondary: '#0F766E', accent: '#F05A47', background: '#F7FAFF', surface: '#FFFFFF', text: '#17233B', muted: '#60708A' }, typography: { display: 'grotesk', body: 'humanist' }, radius: 'rounded' },
    hero: { eyebrow: 'A broker on your side', headline: 'Better choices begin with clarity', subheadline: 'Compare the right options, understand the trade-offs and move forward with confidence.', media: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=85', variant: 'immersive', align: 'left', surface: 'dark', visualStyle: 'editorial' },
    services: { headline: 'Advice that earns its place', layout: 'cards', surface: 'light', columns: 2 },
  },
  current: {
    name: 'Current', description: 'Airy travel-inspired storytelling with blue, aqua and coral contrast.', tag: 'Travel & lifestyle',
    system: { name: 'Current', preset: 'custom', colors: { primary: '#0077B6', secondary: '#008C7A', accent: '#FF7657', background: '#F4FBFF', surface: '#FFFFFF', text: '#163342', muted: '#607985' }, typography: { display: 'grotesk', body: 'humanist' }, radius: 'rounded' },
    hero: { eyebrow: 'Go further with confidence', headline: 'Cover made for the journey', subheadline: 'Flexible protection and human support for holidays, adventures and everything between.', media: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85', variant: 'split', align: 'left', surface: 'light', visualStyle: 'carousel' },
    services: { headline: 'Ready wherever plans take you', layout: 'splitFeature', surface: 'light', columns: 2, media: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1100&q=85' },
  },
  velocity: {
    name: 'Velocity', description: 'Performance-led black, red and silver with cinematic automotive imagery.', tag: 'Motor & performance',
    system: { name: 'Velocity', preset: 'custom', colors: { primary: '#D7263D', secondary: '#2457C5', accent: '#E5A800', background: '#FAFAFB', surface: '#FFFFFF', text: '#15171B', muted: '#626872' }, typography: { display: 'grotesk', body: 'humanist' }, radius: 'rounded' },
    hero: { eyebrow: 'Engineered for the road ahead', headline: 'Protection at full speed', subheadline: 'Responsive motor cover for everyday drivers, enthusiasts and specialist vehicles.', media: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=85', variant: 'immersive', align: 'center', surface: 'dark', visualStyle: 'ctaOnly' },
    services: { headline: 'Performance without compromise', layout: 'splitFeature', surface: 'light', columns: 2, media: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1100&q=85' },
  },
  ledger: {
    name: 'Datanox', description: 'Reference fleet-cover template with navy type, cobalt actions and premium rounded cards.', tag: 'Corporate & fleet',
    system: referenceDesignSystem,
    hero: { eyebrow: 'Corporate car & motor fleet insurance - UK', headline: 'Smarter fleet cover for growing companies', subheadline: 'Datanox helps UK businesses protect their vehicles with clear, data-led motor insurance and a fast quote journey.', media: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1600&q=85', variant: 'split', align: 'left', surface: 'dark', visualStyle: 'editorial' },
    services: { headline: 'Built for corporate fleets, not one-off policies', layout: 'cards', surface: 'light', columns: 4 },
  },
}

export const templateMeta = (Object.entries(configs) as Array<[TemplateId, TemplateConfig]>).map(([id, config]) => ({
  id,
  name: config.name,
  description: config.description,
  swatches: [referenceDesignSystem.colors.primary, referenceDesignSystem.colors.text, referenceDesignSystem.colors.background],
  tag: config.tag,
}))

function systemFor(config: TemplateConfig): DesignSystem {
  return {
    ...referenceDesignSystem,
    name: config.system.name === 'Ledger' ? referenceDesignSystem.name : `${config.name} Fleet`,
  }
}

const heroQuoteForm = {
  headline: 'Request your fleet quote',
  subheadline: 'Share a few details about your vehicles and we will outline options for your business.',
  submitLabel: 'See my fleet quote options',
  secureText: 'Your information is encrypted, handled in the UK, and never sold.',
  fields: [
    { id: 'company', kind: 'text' as const, label: 'Company name', required: true, placeholder: 'Datanox Holdings Ltd' },
    { id: 'contact', kind: 'text' as const, label: 'Contact name', required: true, placeholder: 'Jordan Rivera' },
    { id: 'email', kind: 'email' as const, label: 'Work email', required: true, placeholder: 'you@company.co.uk' },
    { id: 'phone', kind: 'tel' as const, label: 'Contact number', required: true, placeholder: '+44 20 1234 5678' },
    { id: 'postcode', kind: 'text' as const, label: 'Business postcode', required: true, placeholder: 'EC2A 4BN' },
    { id: 'fleetSize', kind: 'select' as const, label: 'Number of vehicles', required: true, placeholder: 'Select fleet size', options: ['2-5 vehicles', '6-20 vehicles', '21-50 vehicles', '51+ vehicles'] },
    { id: 'vehicleType', kind: 'select' as const, label: 'Vehicle types', required: true, placeholder: 'Select main vehicle type', options: ['Cars', 'Vans', 'Motorbikes', 'Mixed fleet'] },
  ],
}

const serviceContent: Record<TemplateId, { intro: string; items: Array<{ icon: string; title: string; description: string }> }> = {
  horizon: { intro: 'One connected advice journey for the everyday moments your family wants to protect.', items: [
    { icon: 'car', title: 'Family motor', description: 'Flexible protection for school runs, commutes and weekends away.' },
    { icon: 'home', title: 'Home and contents', description: 'Clear options for the home, belongings and routines you rely on.' },
    { icon: 'heart', title: 'Family protection', description: 'Practical guidance for life changes and longer-term confidence.' },
    { icon: 'shield', title: 'Personal advice', description: 'A human review when needs overlap or circumstances change.' },
  ] },
  pulse: { intro: 'Fast digital journeys backed by support exactly where it becomes useful.', items: [
    { icon: 'sparkles', title: 'Instant start', description: 'Begin with a short guided path tailored to the cover you need.' },
    { icon: 'car', title: 'Motor cover', description: 'Build a clearer picture of your vehicle, usage and priorities.' },
    { icon: 'home', title: 'Property cover', description: 'Protect the essentials without working through unnecessary steps.' },
    { icon: 'clock', title: 'Quick callback', description: 'Move from digital questions to a real conversation without repeating yourself.' },
  ] },
  signal: { intro: 'Specialist expertise arranged around complexity, evidence and decisive action.', items: [
    { icon: 'business', title: 'Complex placements', description: 'Structured support for risks that need more than an off-the-shelf answer.' },
    { icon: 'shield', title: 'Exposure review', description: 'Identify material gaps and priorities before entering the market.' },
    { icon: 'sparkles', title: 'Market strategy', description: 'Present the risk clearly and approach suitable insurance partners.' },
    { icon: 'clock', title: 'Ongoing oversight', description: 'Keep changes, renewals and emerging exposures visible throughout the year.' },
  ] },
  meridian: { intro: 'Commercial cover that keeps pace with changing teams, contracts and ambitions.', items: [
    { icon: 'business', title: 'Business protection', description: 'Core cover shaped around operations, clients and contractual obligations.' },
    { icon: 'shield', title: 'Professional risk', description: 'Thoughtful protection for advice, decisions and specialist services.' },
    { icon: 'home', title: 'Property and assets', description: 'Protect premises, equipment and the infrastructure behind growth.' },
    { icon: 'sparkles', title: 'Growth review', description: 'Revisit the programme as revenue, locations or services evolve.' },
  ] },
  canopy: { intro: 'Approachable protection choices for health, life and the people who count on you.', items: [
    { icon: 'heart', title: 'Life protection', description: 'Explore cover built around dependants, commitments and future plans.' },
    { icon: 'shield', title: 'Health support', description: 'Understand useful options without jargon or unnecessary pressure.' },
    { icon: 'home', title: 'Family continuity', description: 'Bring household priorities into one clear protection conversation.' },
    { icon: 'sparkles', title: 'Regular reviews', description: 'Keep protection aligned as work, family and financial needs change.' },
  ] },
  northstar: { intro: 'Independent comparison and focused advice, presented without the noise.', items: [
    { icon: 'sparkles', title: 'Clear comparison', description: 'See meaningful differences instead of a wall of near-identical options.' },
    { icon: 'shield', title: 'Advice with context', description: 'Understand why a recommendation fits your priorities and risk.' },
    { icon: 'business', title: 'Broader market view', description: 'Navigate suitable products across personal and commercial needs.' },
    { icon: 'clock', title: 'Responsive service', description: 'Move quickly when circumstances, renewals or questions arise.' },
  ] },
  current: { intro: 'Flexible cover for trips, activities and the unexpected changes around them.', items: [
    { icon: 'sparkles', title: 'Single trips', description: 'Protection for one carefully planned holiday or short break.' },
    { icon: 'clock', title: 'Annual travel', description: 'Year-round convenience for people with several journeys ahead.' },
    { icon: 'heart', title: 'Medical support', description: 'Understand the protection available when health affects travel.' },
    { icon: 'shield', title: 'Trip disruption', description: 'Explore cover for cancellations, delays and interrupted plans.' },
  ] },
  velocity: { intro: 'Specialist motor knowledge for daily driving, performance cars and valuable vehicles.', items: [
    { icon: 'car', title: 'Performance cars', description: 'Cover informed by specification, use, value and ownership details.' },
    { icon: 'shield', title: 'Agreed value options', description: 'Explore a clearer approach to protecting specialist vehicles.' },
    { icon: 'sparkles', title: 'Modified vehicles', description: 'Discuss upgrades and modifications with the right context from the start.' },
    { icon: 'clock', title: 'Responsive claims help', description: 'Know where to turn when getting back on the road matters.' },
  ] },
  ledger: { intro: 'A structured insurance programme for the assets, people and dependencies behind operations.', items: [
    { icon: 'car', title: 'Specialist fleet cover', description: 'Aligned to your mix of cars, vans and motorbikes, with options for named or any driver and business use.' },
    { icon: 'home', title: 'Corporate-first advice', description: 'Guidance for finance, fleet and HR teams on limits, excesses and risk management across your organisation.' },
    { icon: 'shield', title: 'Data-led risk insight', description: 'Use claims history and driver data to shape cover, support safer driving and manage total cost of ownership.' },
    { icon: 'business', title: 'Priority support', description: 'Clear escalation paths, UK-based support and help coordinating repairs to keep vehicles on the road.' },
  ] },
}

function style(_config: TemplateConfig, overrides: Partial<SectionStyle>): SectionStyle {
  return { variant: 'editorial', align: 'left', headingSize: 'lg', width: 'contained', surface: 'light', columns: 3, radius: 'rounded', ...overrides }
}

function pricingFor(config: TemplateConfig) {
  return {
    id: 'pricing',
    type: 'pricingCards' as const,
    action: 'upsert' as const,
    animation: { entrance: 'fadeUp' as const, stagger: true },
    style: style(config, { variant: 'editorial', surface: 'light', columns: 3, radius: 'rounded' }),
    props: {
      eyebrow: 'Coverage',
      headline: 'Coverage that fits your life',
      intro: 'Simple, honest options presented like the reference page: clear cards, rounded surfaces, and one obvious quote path.',
      plans: [
        {
          name: 'Essential',
          description: 'The essentials to stay protected.',
          price: '$39',
          period: '/month',
          features: ['Core liability protection', 'Simple claim guidance', 'Roadside support'],
          ctaLabel: 'Choose Essential',
        },
        {
          name: 'Standard',
          description: 'Our most balanced coverage option.',
          price: '$69',
          period: '/month',
          badge: 'Most popular',
          features: ['Everything in Essential', 'Collision coverage', 'Comprehensive protection', 'Rental reimbursement'],
          ctaLabel: 'Choose Standard',
        },
        {
          name: 'Complete',
          description: 'More confidence for fuller protection.',
          price: '$99',
          period: '/month',
          features: ['Everything in Standard', 'Higher protection limits', 'Priority claims handling', 'Enhanced support'],
          ctaLabel: 'Choose Complete',
        },
      ],
    },
  }
}

function serviceStyleFor(config: TemplateConfig): Partial<SectionStyle> {
  const variant = config.services.layout === 'bento'
    ? 'bento'
    : config.services.layout === 'splitFeature'
      ? 'split'
      : config.services.layout === 'list'
        ? 'minimal'
        : 'editorial'
  return { variant, surface: config.services.surface, columns: config.services.columns, radius: 'rounded' }
}

function makeTemplate(id: TemplateId): AssistantResponse {
  const config = configs[id]
  const designSystem = systemFor(config)
  const services = serviceContent[id]
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
    stage: 'intro', design_system: designSystem,
    ui_blocks: [
      { id: 'navbar', type: 'navbar', action: 'upsert', animation: { entrance: 'fadeIn', stagger: false }, style: style(config, { variant: 'minimal', surface: 'light', radius: 'rounded' }), props: { logoText: config.name, links: [{ label: 'Coverage', href: '#coverage' }, { label: 'Why us', href: '#benefits' }, { label: 'Reviews', href: '#reviews' }], ctaLabel: 'Get a quote', phone: '1-800-555-1234', sticky: true } },
      { id: 'hero', type: 'hero', action: 'upsert', animation: { entrance: 'fadeUp', stagger: false }, style: style(config, { variant: 'split', align: 'left', headingSize: 'xl', width: 'full', surface: 'dark', columns: 2, radius: 'rounded' }), props: { eyebrow: config.hero.eyebrow, headline: config.hero.headline, subheadline: config.hero.subheadline, ctaLabel: null, secondaryCtaLabel: null, backgroundStyle: 'split', visualStyle: 'editorial', media: { type: 'image', src: config.hero.media, alt: 'Business fleet vehicle on the road' }, quoteForm: heroQuoteForm, overlay: { style: 'none', color: '#101828', opacity: 0, direction: 'left' }, slides: [] } },
      { id: 'services', type: 'servicesGrid', action: 'upsert', animation: { entrance: 'fadeUp', stagger: true }, style: style(config, serviceStyleFor(config)), props: { eyebrow: 'Benefits', headline: config.services.headline, intro: services.intro, layout: config.services.layout, iconSize: 'lg', iconColor: 'primary', spacing: 'normal', cardPadding: 'normal', showNumbers: false, items: services.items, media: config.services.media ? { type: 'image', src: config.services.media, alt: 'Business-relevant insurance service image' } : undefined } },
      pricingFor(config),
      { id: 'testimonials', type: 'testimonials', action: 'upsert', animation: { entrance: 'fadeUp', stagger: true }, style: style(config, { variant: 'editorial', surface: 'light', columns: 2, radius: 'rounded' }), props: { eyebrow: 'Reviews', headline: 'Advice that feels clear from the start', items: [{ quote: 'The process was straightforward, and every recommendation was explained in plain language.', name: 'Jordan M.', role: 'Policyholder' }, { quote: 'We understood our options and knew exactly what would happen next.', name: 'Alex R.', role: 'Business owner' }] } },
      { id: 'faq', type: 'faq', action: 'upsert', animation: { entrance: 'fadeUp', stagger: false }, style: style(config, { variant: 'editorial', surface: 'light', columns: 2, radius: 'rounded' }), props: { headline: 'Questions, answered', items: [{ q: 'Can I speak to an adviser?', a: 'Yes. The quote flow can route visitors to a callback or consultation.' }, { q: 'Can this form match my process?', a: 'Yes. Its fields, steps and calls to action can be generated from your requirements.' }, { q: 'Is this a binding quote?', a: 'No. The page can collect enquiry details and show illustrative estimates, but final terms depend on underwriting.' }] } },
      { id: 'cta', type: 'ctaBanner', action: 'upsert', animation: { entrance: 'fadeUp', stagger: false }, style: style(config, { variant: 'minimal', surface: 'brand', columns: 2, radius: 'rounded' }), props: { headline: 'Ready for a clearer conversation?', subheadline: 'Start with a few useful details and take the next step with confidence.', ctaLabel: 'Get my free quote' } },
      { id: 'footer', type: 'footer', action: 'upsert', animation: { entrance: 'fadeIn', stagger: false }, style: style(config, { variant: 'minimal', headingSize: 'sm', surface: 'dark' }), props: { logoText: config.name, columns: [{ title: 'Explore', links: [{ label: 'Cover', href: '#cover' }, { label: 'Contact', href: '#contact' }] }, { title: 'Information', links: [{ label: 'Privacy', href: '#privacy' }, { label: 'Terms', href: '#terms' }] }], social: [], disclaimer: 'Demo copy. Add broker-approved regulatory and consent wording before publishing.' } },
    ],
  })
}

export const landingTemplates = Object.fromEntries(
  (Object.keys(configs) as TemplateId[]).map((id) => [id, makeTemplate(id)]),
) as Record<TemplateId, AssistantResponse>
