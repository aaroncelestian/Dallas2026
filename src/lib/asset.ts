/** Public-folder asset URL, respectful of Vite `base`. */
export function asset(path: string): string {
  const clean = path.replace(/^\/+/, '')
  return `${import.meta.env.BASE_URL}${clean}`
}

export function isPresentMode(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('present')
}
