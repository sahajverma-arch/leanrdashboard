'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/theme-provider'

const LINKS = [
  { href: '/', label: 'Overview' },
  { href: '/sales', label: 'Sales' },
  { href: '/sales-teamwise', label: 'Sales teamwise' },
  { href: '/targets', label: 'Sales Target' },
  { href: '/opportunity', label: 'Renewal opportunity' },
  { href: '/coaches', label: 'Coaches' },
  { href: '/clients', label: 'Clients' },
  { href: '/csat', label: 'CSAT' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const qs = searchParams.toString() // carry the active filters across nav
  const [email, setEmail] = useState<string | null>(null)
  const { toggle } = useTheme()

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
    <aside className="flex shrink-0 flex-col border-b border-zinc-200 bg-white p-3 md:h-screen md:w-56 md:border-b-0 md:border-r md:p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="hidden md:mb-5 md:block">
        <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">LEANR</div>
      </div>

      <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col">
        {LINKS.map((l) => {
          const active =
            l.href === '/'
              ? pathname === '/'
              : pathname === l.href || pathname.startsWith(`${l.href}/`)
          return (
            <Link
              key={l.href}
              href={qs ? `${l.href}?${qs}` : l.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
              }`}
            >
              {l.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 pt-3 md:pt-4">
        {/* Icon/label are driven by the `.dark` class (set before paint), not React
            state, so the server and client markup match — no hydration mismatch. */}
        <button
          onClick={toggle}
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <span aria-hidden="true">
            <span className="dark:hidden">🌙</span>
            <span className="hidden dark:inline">☀️</span>
          </span>
          <span className="hidden md:inline">
            <span className="dark:hidden">Dark mode</span>
            <span className="hidden dark:inline">Light mode</span>
          </span>
        </button>

        <div className="hidden md:block">
          {email && (
            <div
              className="mb-2 truncate text-xs text-zinc-400 dark:text-zinc-500"
              title={email}
            >
              {email}
            </div>
          )}
          <button
            onClick={signOut}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
