import React, { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore';
import { Mail, MessageCircle, Lock, Loader } from 'lucide-react';
import { Link } from 'react-router';

const LoginPage = () => {
    const [formData, setFormData] = useState({
      email: "",
      password: ""
    })

  const login = useAuthStore(state => state.login);
  const isLoggingIn = useAuthStore(state => state.isLoggingIn);

  const handleInputChange = (e) => {
    const {name, value} = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value}
    )) 
  } 

  const handleSubmit =  (e) => {
    e.preventDefault();
    login(formData);
  }

  return (
    <div className='w-full min-h-screen flex items-center justify-center p-4 bg-slate-900'>
      <div className='relative w-full max-w-6xl h-162.5 md:h-200'>
        <div className='w-full flex flex-col md:flex-row'>
          {/* FORM CLOUMN - LEFT SIDE */}
          <div className='md:w-1/2 p-8 flex items-center justify-center md:border-r border-slate-600/30'>
            <div className='w-full max-w-md'>
                <div className='text-center mb-8'>
                  <MessageCircle className='mx-auto' />
                  <h2 className='text-2xl font-bold text-slate-200 mb-2'>Account Login</h2>
                  <p className='text-slate-400'>Login and access your account</p>
                </div>
                <form  onSubmit={handleSubmit} className='space-y-6'>

                  <div>
                    <label className='auth-input-label' htmlFor="email">Email</label>
                    <div className='relative'>
                      <Mail className='auth-input-icon' />
                      <input 
                        type="email" 
                        id="email"
                        className='input'
                        name="email"
                        placeholder='nymd@gmail.com'
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>     
                  <div>
                    <label className='auth-input-label' htmlFor="password">Password</label>
                    <div className='relative'>
                      <Lock className='auth-input-icon' />
                      <input 
                      className='input'
                        type="password" 
                        id="password"
                        name="password"
                        placeholder='Enter a strong password'
                        value={formData.password}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>   
                  
                  <button className='auth-btn' type='submit' disabled={isLoggingIn}>{isLoggingIn ? <Loader className='w-5 h-5 animate-spin mx-auto'/> : "Login"}</button>                                
                </form>
                <div className='mt-6 text-center'>
                  <Link to="/signup" className='auth-link'>
                    Don't have an account? Sign Up
                  </Link>
                </div>
            </div>
          </div>

            {/* FORM ILLUSTRATION - RIGHT SIDE */}
            <div className="hidden md:w-1/2 md:flex items-center justify-center p-6 bg-linear-to-bl from-slate-800/20 to-transparent">
              <div>
                <img
                  src="/login.png"
                  alt="People using mobile devices"
                  className="w-full h-auto object-contain"
                />
                <div className="mt-6 text-center">
                  <h3 className="text-xl font-medium text-cyan-400">Connect anytime, anywhere</h3>

                  <div className="mt-4 flex justify-center gap-4">
                    <span className="auth-badge">Free</span>
                    <span className="auth-badge">Easy Setup</span>
                    <span className="auth-badge">Private</span>
                  </div>
                </div>
              </div>
            </div>  
                    
        </div>
      </div>
    </div> 
  )
}

export default LoginPage;