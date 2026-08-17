import { isPrintMode } from './lib/asset'
import { printDocumentHtml } from './lib/printDocument'

if (isPrintMode()) {
  document.open()
  document.write(printDocumentHtml())
  document.close()
} else {
  void bootDeck()
}

async function bootDeck() {
  await import('./styles/tokens.css')
  const [{ StrictMode }, { createRoot }, { default: App }] = await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('./App'),
  ])
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
