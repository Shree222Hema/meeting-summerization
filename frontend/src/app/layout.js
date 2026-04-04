import './globals.css'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'AI Meeting Summarizer',
  description: 'AI-Based Automated Meeting Summarization and Action Item Extraction System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main>
          <SessionProviderWrapper>
            <Navbar />
            {children}
          </SessionProviderWrapper>
        </main>
      </body>
    </html>
  )
}
