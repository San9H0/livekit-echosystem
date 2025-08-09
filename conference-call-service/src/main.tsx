import { createRoot } from 'react-dom/client'
import { Theme, ThemePanel } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <Theme appearance="inherit" accentColor="violet" grayColor="slate" radius="large" scaling="100%">
    <App />
    {import.meta.env.DEV ? <ThemePanel /> : null}
  </Theme>
)
