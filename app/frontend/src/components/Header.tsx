import logo from '@/assets/logo-white.svg'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-sidebar">
      <div className="flex h-14 items-center px-6">
        <img src={logo} alt="Reecall" className="h-5" />
      </div>
    </header>
  )
}
