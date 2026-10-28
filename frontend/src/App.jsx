import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import ChatPage from './pages/ChatPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import { useAuthStore } from './store/useAuthStore'
import { Toaster } from 'react-hot-toast';
import LoadingPage from './components/Loading'
import NotFound from './pages/NotFound'



const App = () => {
  const authenticatedUser = useAuthStore((state) =>  state.authenticatedUser);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isCheckingAuth) return <LoadingPage />
  return (
    <div className={`bg-slate-900 relative flex items-center justify-center overflow-hidden ${
      authenticatedUser ? "h-dvh p-0 md:p-4" : "min-h-screen p-4"
    }`}>
      {/* Decorators - grid and glow shapes */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.08)_1px,transparent_1px)] bg-size-[40px_40px] -z-50" />

    {/* Top-left blob */}
    <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-purple-400 opacity-10 blur-3xl -z-50" />

    {/* Bottom-right blob */}
    <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-400 opacity-10 blur-3xl -z-50" /> 
    <Toaster />     
      <Routes>
        <Route
          path="/"
          element={authenticatedUser ? <ChatPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/login"
          element={authenticatedUser ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/signup"
          element={authenticatedUser ? <Navigate to="/" replace /> : <SignUpPage />}
        />
        <Route 
          path="*" 
          element={<NotFound />}
        />
      </Routes>
    </div>
  )
}

export default App
