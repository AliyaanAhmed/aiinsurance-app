import type { z } from 'zod'
import { ArrowUpRight } from 'lucide-react'
import type { footerPropsSchema, SectionStyle } from '../../generative-ui/schemas'

type FooterProps = z.infer<typeof footerPropsSchema>

export function Footer({ props, style }: { props: FooterProps; style?: SectionStyle }) {
  return (
    <footer className={`lp-footer footer-variant-${style?.variant ?? 'editorial'}`}>
      <div className="footer-brand">
        <span className="footer-mark" aria-hidden="true">{props.logoText.charAt(0)}</span>
        <strong>{props.logoText}</strong>
      </div>
      <div className="footer-columns">
        {props.columns.map((column) => (
          <div key={column.title}>
            <h3>{column.title}</h3>
            {column.links.map((link) => (
              <a key={link.label} href={link.href}>
                <span>{link.label}</span><ArrowUpRight aria-hidden="true" />
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        {props.disclaimer ? <p className="disclaimer">{props.disclaimer}</p> : <span />}
        <span className="footer-signature">{props.logoText}</span>
      </div>
    </footer>
  )
}
