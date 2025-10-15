    import { Link } from 'react-router-dom'
    import { useEffect, useState } from 'react'
    import { Button } from '@/components/ui/button'
    import { Globe, Search as SearchIcon, LogOut } from 'lucide-react'
    import i18next from 'i18next'
    import SearchModal from '../features/search/SearchModal'



    export default function CareShell({ modules = [], user, onLogout, children }) {
    const supported = ['en','ar','de','fr']
    const [lang, setLang] = useState(localStorage.getItem('lang') || i18next.language || 'en')
    function changeLang(l) {
        setLang(l); localStorage.setItem('lang', l); i18next.changeLanguage(l)
    }

    const [open, setOpen] = useState(false)
    useEffect(() => {
        function onKey(e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault(); setOpen(true)
        }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    return (
        <div className="min-h-dvh bg-gradient-to-b from-[hsl(var(--primary))]/15 via-sky-50/60 to-white">
        <header className="sticky top-0 z-10 border-b border-white/30 bg-[hsl(var(--primary))] text-white shadow-sm">
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4">
            <Link to="/" className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/95 text-[hsl(var(--primary))] font-black">C</div>
                <div className="text-lg tracking-wide font-semibold">CARE</div>
            </Link>

            <div className="flex items-center gap-3">
                <div className="relative">
                <select
                    value={lang}
                    onChange={(e) => changeLang(e.target.value)}
                    className="rounded-md bg-white/10 px-3 py-1.5 text-sm backdrop-blur border border-white/30"
                >
                    {supported.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
                </select>
                </div>

                {/* Search button (opens modal) */}
                <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setOpen(true)} title="Search (Ctrl/⌘+K)">
                <SearchIcon className="h-4 w-4" />
                </Button>

                <Button variant="outline" className="bg-white text-[hsl(var(--primary))] hover:bg-white/90" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>
            </div>
            </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-8">{children}</main>

        {/* Global search modal */}
        <SearchModal open={open} onClose={() => setOpen(false)} />
        </div>
    )
    }
