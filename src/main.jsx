import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3200,
            style: {
              borderRadius: '14px',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              background: 'rgba(15, 23, 42, 0.92)',
              color: '#e2e8f0',
              boxShadow: '0 18px 40px rgba(2, 6, 23, 0.35)',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#052e16',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#fff1f2',
              },
            },
          }}
        />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)