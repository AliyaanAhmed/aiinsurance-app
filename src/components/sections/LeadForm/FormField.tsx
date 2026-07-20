import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Controller, type Control, type FieldValues, type UseFormRegister } from 'react-hook-form'
import type { FormField as FormFieldSchema } from '../../../generative-ui/schemas'

type FormFieldProps = {
  field: FormFieldSchema
  register: UseFormRegister<FieldValues>
  control: Control<FieldValues>
}

export function FormField({ field, register, control }: FormFieldProps) {
  if (field.kind === 'select') {
    return (
      <label className="form-field">
        <span>{field.label}</span>
        <select {...register(field.id)}>
          <option value="">Select one</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    )
  }

  if (field.kind === 'radio') {
    return (
      <fieldset className="form-field">
        <legend>{field.label}</legend>
        <div className="choice-row">
          {field.options?.map((option) => (
            <label key={option}>
              <input type="radio" value={option} {...register(field.id)} />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
    )
  }

  if (field.kind === 'checkbox') {
    return (
      <label className="form-field checkbox-field">
        <input type="checkbox" {...register(field.id)} />
        <span>{field.label}</span>
      </label>
    )
  }

  if (field.kind === 'textarea') {
    return (
      <label className="form-field">
        <span>{field.label}</span>
        <textarea placeholder={field.placeholder} {...register(field.id)} />
      </label>
    )
  }

  if (field.kind === 'richtext') {
    return (
      <Controller
        name={field.id}
        control={control}
        render={({ field: richTextField }) => <RichTextField label={field.label} value={String(richTextField.value ?? '')} onChange={richTextField.onChange} />}
      />
    )
  }

  if (field.kind === 'fileUpload') {
    return (
      <label className="form-field">
        <span>{field.label}</span>
        <input type="file" {...register(field.id)} />
      </label>
    )
  }

  return (
    <label className="form-field">
      <span>{field.label}</span>
      <input type={field.kind} placeholder={field.placeholder} {...register(field.id)} />
    </label>
  )
}

function RichTextField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        bulletList: false,
        orderedList: false,
        horizontalRule: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getText()),
    immediatelyRender: false,
  })

  return (
    <label className="form-field">
      <span>{label}</span>
      <EditorContent editor={editor} className="richtext-field" />
    </label>
  )
}
