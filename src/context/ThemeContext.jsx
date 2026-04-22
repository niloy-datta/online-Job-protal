import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved) setIsDark(saved === 'dark')
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    if (isDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [isDark])

  const value = {
    isDark,
    setIsDark,
    bgClass: isDark
      ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
      : 'bg-[radial-gradient(circle_at_top_left,#dff6f3_0,#eff7fb_32%,#f7fbff_62%,#ffffff_100%)]',
    cardClass: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white/80 border-white/70',
    headerClass: isDark ? 'bg-slate-800/95 border-slate-700' : 'bg-white/90 border-white/70',
    textClass: isDark ? 'text-slate-100' : 'text-slate-900',
    subTextClass: isDark ? 'text-slate-400' : 'text-slate-500',
    inputClass: isDark ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400',
    buttonClass: isDark ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700',
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
