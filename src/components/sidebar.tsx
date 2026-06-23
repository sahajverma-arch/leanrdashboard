'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const LINKS = [
  { href: '/', label: 'Overview' },
  { href: '/sales', label: 'Sales' },
  { href: '/coaches', label: 'Coaches' },
  { href: '/clients', label: 'Clients' },
  { href: '/csat', label: 'CSAT' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  // Don't show the dashboard chrome on the login screen.
  if (pathname === '/login') return null

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="flex shrink-0 flex-col border-b border-zinc-200 bg-white p-3 md:h-screen md:w-56 md:border-b-0 md:border-r md:p-4">
      <div className="hidden md:mb-5 md:block">
        <div className="text-lg font-bold text-zinc-900">LEANR</div>
      </div>

      <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col">
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

      <div className="hidden md:mt-auto md:block md:pt-4">
        {email && (
          <div className="mb-2 truncate text-xs text-zinc-400" title={email}>
            {email}
          </div>
        )}
        <button
          onClick={signOut}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
