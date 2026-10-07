import inquirySchema from '../../.power/schemas/dataverse/inquiries.Schema.json'

// The Power Apps CLI regenerates this schema from the Dataverse Inquiry Type choice.
const choice = inquirySchema.schema.items.properties.aur_inquiry_type

export const INQUIRY_TYPE_OPTIONS = choice.enum.map((label, index) => ({
  value: choice['x-ms-enum-values'][index],
  label,
}))

export function inquiryTypeLabel(value?: number | null) {
  return INQUIRY_TYPE_OPTIONS.find((option) => option.value === value)?.label
}
