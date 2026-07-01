import { AccountsService, ContactsService } from '../generated'
import {
  Accountsaur_account_type,
  Accountsindustrycode,
  Accountsownershipcode,
} from '../generated/models/AccountsModel'

export interface SelectItem {
  value: string
  label: string
}

export interface ContactWorkspaceData {
  id: string
  fullName: string
  firstName: string
  lastName: string
  jobTitle: string
  email: string
  businessPhone: string
  mobilePhone: string
  linkedAccountId: string
  linkedAccountName: string
  status: string
  availableAccounts: Array<{ id: string; name: string; type: string }>
}

export interface AccountContactRow {
  id: string
  fullName: string
  jobTitle: string
  phone: string
  email: string
}

export interface AccountWorkspaceData {
  id: string
  name: string
  accountType: string
  accountNumber: string
  industry: string
  ownership: string
  employeeCount: string
  email: string
  mainPhone: string
  otherPhone: string
  website: string
  street1: string
  street2: string
  city: string
  stateProvince: string
  zipPostalCode: string
  countryRegion: string
  creditLimit: string
  creditHold: boolean
  status: string
  contacts: AccountContactRow[]
}

export async function getContactWorkspace(id: string): Promise<ContactWorkspaceData> {
  const normalizedContactId = normalizeDataverseId(id)
  const [contactsResult, accountsResult] = await Promise.all([
    ContactsService.getAll({
      orderBy: ['fullname asc'],
    }),
    AccountsService.getAll({
      select: ['accountid', 'name', 'aur_account_type', 'aur_account_typename'],
      orderBy: ['name asc'],
    }),
  ])

  const contact = (contactsResult.data ?? []).find(
    (item) => normalizeDataverseId(item.contactid) === normalizedContactId,
  )
  if (!contact) throw new Error('Contact not found.')

  const availableAccounts = (accountsResult.data ?? []).map((account) => ({
    id: normalizeDataverseId(account.accountid),
    name: account.name ?? 'Unnamed account',
    type: account.aur_account_typename ?? humanizeChoiceLabel(Accountsaur_account_type[account.aur_account_type as keyof typeof Accountsaur_account_type] ?? ''),
  }))
  const linkedAccount = await resolveLinkedAccount(contact, availableAccounts)

  return {
    id: normalizeDataverseId(contact.contactid),
    fullName:
      contact.fullname?.trim() ||
      `${contact.firstname ?? ''} ${contact.lastname ?? ''}`.trim() ||
      'Unnamed contact',
    firstName: contact.firstname ?? '',
    lastName: contact.lastname ?? '',
    jobTitle: contact.jobtitle ?? '',
    email: contact.emailaddress1 ?? '',
    businessPhone: contact.telephone1 ?? '',
    mobilePhone: contact.mobilephone ?? '',
    linkedAccountId: linkedAccount?.id ?? '',
    linkedAccountName: linkedAccount?.name ?? 'No linked account',
    status: contact.statuscodename ?? 'Active',
    availableAccounts,
  }
}

export async function saveContactWorkspace(
  id: string,
  payload: {
    firstName: string
    lastName: string
    jobTitle: string
    email: string
    businessPhone: string
    mobilePhone: string
    linkedAccountId?: string
  },
) {
  const updatePayload = {
    firstname: payload.firstName,
    lastname: payload.lastName,
    jobtitle: payload.jobTitle,
    emailaddress1: payload.email,
    telephone1: payload.businessPhone,
    mobilephone: payload.mobilePhone,
    ...(payload.linkedAccountId
      ? { 'msa_managingpartnerid@odata.bind': `/accounts(${normalizeDataverseId(payload.linkedAccountId)})` }
      : {}),
  }

  await ContactsService.update(id, updatePayload as never)
}

export async function getAccountWorkspace(id: string): Promise<AccountWorkspaceData> {
  const [accountResult, contactsResult] = await Promise.all([
    AccountsService.get(id),
    ContactsService.getAll({
      orderBy: ['fullname asc'],
    }),
  ])

  const account = accountResult.data
  if (!account) throw new Error('Account not found.')

  const normalizedAccountId = normalizeDataverseId(account.accountid)
  const contacts = (contactsResult.data ?? [])
    .filter((contact) => normalizeDataverseId(contact._msa_managingpartnerid_value) === normalizedAccountId)
    .map<AccountContactRow>((contact) => ({
      id: normalizeDataverseId(contact.contactid),
      fullName:
        contact.fullname?.trim() ||
        `${contact.firstname ?? ''} ${contact.lastname ?? ''}`.trim() ||
        'Unnamed contact',
      jobTitle: contact.jobtitle ?? 'No title',
      phone: contact.telephone1 ?? contact.mobilephone ?? 'No phone',
      email: contact.emailaddress1 ?? 'No email',
    }))

  return {
    id: normalizedAccountId,
    name: account.name ?? 'Unnamed account',
    accountType: account.aur_account_typename ?? enumLabel(Accountsaur_account_type, account.aur_account_type),
    accountNumber: account.accountnumber ?? '',
    industry: account.industrycodename ?? enumLabel(Accountsindustrycode, account.industrycode),
    ownership: account.ownershipcodename ?? enumLabel(Accountsownershipcode, account.ownershipcode),
    employeeCount: account.numberofemployees !== undefined ? String(account.numberofemployees) : '',
    email: account.emailaddress1 ?? '',
    mainPhone: account.telephone1 ?? '',
    otherPhone: account.telephone2 ?? '',
    website: account.websiteurl ?? '',
    street1: account.address1_line1 ?? '',
    street2: account.address1_line2 ?? '',
    city: account.address1_city ?? '',
    stateProvince: account.address1_stateorprovince ?? '',
    zipPostalCode: account.address1_postalcode ?? '',
    countryRegion: account.address1_country ?? '',
    creditLimit: account.creditlimit !== undefined ? String(account.creditlimit) : '',
    creditHold: Boolean(account.creditonhold),
    status: account.statuscodename ?? 'Active',
    contacts,
  }
}

export async function saveAccountWorkspace(
  id: string,
  payload: {
    name: string
    accountType?: string
    industry?: string
    ownership?: string
    employeeCount: string
    email: string
    mainPhone: string
    otherPhone: string
    website: string
    street1: string
    street2: string
    city: string
    stateProvince: string
    zipPostalCode: string
    countryRegion: string
    creditLimit: string
    creditHold: boolean
  },
) {
  const accountTypeValue = findEnumKeyByLabel(Accountsaur_account_type, payload.accountType)
  const industryValue = findEnumKeyByLabel(Accountsindustrycode, payload.industry)
  const ownershipValue = findEnumKeyByLabel(Accountsownershipcode, payload.ownership)

  await AccountsService.update(
    id,
    {
      name: payload.name,
      ...(accountTypeValue ? { aur_account_type: accountTypeValue as never } : {}),
      ...(industryValue ? { industrycode: industryValue as never } : {}),
      ...(ownershipValue ? { ownershipcode: ownershipValue as never } : {}),
      numberofemployees: payload.employeeCount ? Number(payload.employeeCount) : undefined,
      emailaddress1: payload.email,
      telephone1: payload.mainPhone,
      telephone2: payload.otherPhone,
      websiteurl: payload.website,
      address1_line1: payload.street1,
      address1_line2: payload.street2,
      address1_city: payload.city,
      address1_stateorprovince: payload.stateProvince,
      address1_postalcode: payload.zipPostalCode,
      address1_country: payload.countryRegion,
      creditlimit: payload.creditLimit ? Number(payload.creditLimit) : undefined,
      creditonhold: payload.creditHold,
    } as never,
  )
}

export function getAccountTypeOptions(): SelectItem[] {
  return enumOptions(Accountsaur_account_type)
}

export function getIndustryOptions(): SelectItem[] {
  return enumOptions(Accountsindustrycode)
}

export function getOwnershipOptions(): SelectItem[] {
  return enumOptions(Accountsownershipcode)
}

function enumOptions(source: Record<number, string>): SelectItem[] {
  return Object.entries(source).map(([value, label]) => ({
    value,
    label: humanizeChoiceLabel(label),
  }))
}

function enumLabel(source: Record<number, string>, value?: string | number) {
  if (value === undefined || value === null || value === '') return ''
  const raw = source[Number(value)]
  return raw ? humanizeChoiceLabel(raw) : ''
}

function findEnumKeyByLabel(source: Record<number, string>, label?: string) {
  if (!label) return undefined
  const entry = Object.entries(source).find(([, value]) => humanizeChoiceLabel(value) === label)
  return entry ? Number(entry[0]) : undefined
}

function humanizeChoiceLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeDataverseId(value?: string) {
  return (value ?? '').replace(/[{}]/g, '').toLowerCase()
}

async function resolveLinkedAccount(
  contact: {
    _msa_managingpartnerid_value?: string
    _accountid_value?: string
    msa_managingpartneridname?: string
    accountidname?: string
    parentcustomeridname?: string
  },
  accounts: Array<{ id: string; name: string; type: string }>,
) {
  const linkedAccountId = normalizeDataverseId(
    contact._msa_managingpartnerid_value ?? contact._accountid_value,
  )

  const mappedAccount = accounts.find((account) => account.id === linkedAccountId)
  if (mappedAccount) return mappedAccount

  if (!linkedAccountId) return undefined

  try {
    const linkedAccountRecord = (await AccountsService.get(linkedAccountId)).data
    if (linkedAccountRecord) {
      return {
        id: linkedAccountId,
        name:
          linkedAccountRecord.name ??
          contact.msa_managingpartneridname ??
          contact.accountidname ??
          contact.parentcustomeridname ??
          'Linked account',
        type:
          linkedAccountRecord.aur_account_typename ??
          humanizeChoiceLabel(
            Accountsaur_account_type[
              linkedAccountRecord.aur_account_type as keyof typeof Accountsaur_account_type
            ] ?? '',
          ),
      }
    }
  } catch {
    // Fall back to any available contact annotations if the account lookup fetch is unavailable.
  }

  return {
    id: linkedAccountId,
    name:
      contact.msa_managingpartneridname ??
      contact.accountidname ??
      contact.parentcustomeridname ??
      'Linked account',
    type: '',
  }
}
