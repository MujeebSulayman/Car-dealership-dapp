import Header from '@/components/Header'
import '@/styles/global.css'
import { Providers } from '@/services/provider'
import { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import '@rainbow-me/rainbowkit/styles.css'
import { SessionProvider } from 'next-auth/react'

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const [showChild, setShowChild] = useState<boolean>(false)

  useEffect(() => {
    setShowChild(true)
  }, [])

  if (!showChild || typeof window === 'undefined') {
    return null
  } else {
    return (
      <SessionProvider session={session}>
        <Providers>
          <div className="bg-black min-h-screen flex flex-col text-white">
            <Header />
            <Component {...pageProps} />
            <ToastContainer
              position="bottom-center"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
            />
            <footer className="text-center py-20 text-gray-400 text-sm">
              © 2024 HemDealer. All rights reserved.
            </footer>
          </div>
        </Providers>
      </SessionProvider>
    )
  }
}
