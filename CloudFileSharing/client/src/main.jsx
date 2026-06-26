import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from "react-router-dom";
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <App />
            <Toaster
              position="top-right"
              gutter={12}
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1E293B',
                  color: '#F8FAFC',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  padding: '12px 16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                },
                success: {
                  iconTheme: { primary: '#10B981', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#EF4444', secondary: '#fff' },
                },
                loading: {
                  iconTheme: { primary: '#4F46E5', secondary: '#fff' },
                },
              }}
            />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>
)
