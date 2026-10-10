# App Design Context

The maintained visual reference is INSURANCE_APP_DESIGN_GUIDE.md. Runtime theme tokens in src/styles/globals.css and shared controls in src/components/ui remain authoritative.

Inquiry field additions reuse the existing Field, ReadOnlyValue, and Select controls, two-column desktop layout, and stacked mobile layout. Dependent choice fields use numeric backend values, clear the dependent selection when the parent changes, and persist clearing as null through the normal Save action.

Vehicle Value displays the average of the backend text range without overwriting the source range. Quote PDFs use the Al-Buhaira logo; this does not change application branding.

Premium monetary fields use comma-grouped amount displays. The shared AmountInput shows the raw decimal value during editing and formatted grouping on blur; form state and backend payloads retain numeric values. Percentage fields keep their existing controls.

Underwriting Action is a separate two-column section immediately after Details. Quote creation copies saved inquiry total charge and gross premium, copies the selected plan VAT directly, and retains loading premium at 10 percent of gross premium without adding it to the copied total.
