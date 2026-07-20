import type { z } from 'zod'
import type { navbarPropsSchema, SectionStyle } from '../../generative-ui/schemas'
import { ArrowUpRight, Menu } from 'lucide-react'

type NavbarProps = z.infer<typeof navbarPropsSchema>

export function Navbar({ props }: { props: NavbarProps; style?: SectionStyle }) {
  return (
    <header className={props.sticky ? 'lp-navbar sticky' : 'lp-navbar'}>
      <a className="brand-lockup" href="#top"><i>{props.logoText.slice(0, 1)}</i><strong>{props.logoText}</strong></a>
      <nav>
        {props.links.map((link) => (
          <a key={link.label} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
      <div className="lp-navbar-actions">
        {props.phone ? <span>{props.phone}</span> : null}
        {props.ctaLabel ? <button type="button">{props.ctaLabel}<ArrowUpRight size={15} /></button> : null}
        <button type="button" className="mobile-menu" aria-label="Open menu"><Menu size={19} /></button>
      </div>
    </header>
  )
}
