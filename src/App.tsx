import { PrintView } from './components/PrintView'
import { Shell } from './components/Shell'
import { isPrintMode } from './lib/asset'

export default function App() {
  if (isPrintMode()) return <PrintView />
  return <Shell />
}
