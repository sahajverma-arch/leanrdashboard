'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/', label: 'Overview' },
  { href: '/sales', label: 'Sales' },
  { href: '/coaches', label: 'Coaches' },
  { href: '/clients', label: 'Clients' },
  { href: '/csat', label: 'CSAT' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex shrink-0 flex-row gap-1 border-b border-zinc-200 bg-white p-3 md:w-56 md:flex-col md:gap-1 md:border-b-0 md:border-r md:p-4">
      <div className="hidden md:mb-5 md:block">
        <div className="text-lg font-bold text-zinc-900">LEANR</div>
        <span className="mt-1 inline-block rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600">
          mock data
        </span>
      </div>

      <nav className="flex flex-1 flex-row gap-1 overflow-x-auto md:flex-col">
        {LINKS.map((l) => {
          const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href)
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              {l.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
