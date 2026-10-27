import { Mail, MessageCircle, UserIcon, Lock, Loader } from 'lucide-react';
import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router';

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: ""
  })

  const isSignUp = useAuthStore(state => state.isSignUp)
  const signUp = useAuthStore((state) => state.signUp);

  const handleInputChange = (e) => {
    const {name, value} = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value}
    )) 
  } 

  const handleSubmit =  (e) => {
    e.preventDefault();
    signUp(formData);
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
                  <h2 className='text-2xl font-bold text-slate-200 mb-2'>Create Account</h2>
                  <p className='text-slate-400'>Sign up for a new Account</p>
                </div>
                <form  onSubmit={handleSubmit} className='space-y-6'>
                  <div>
                    <label className='auth-input-label' htmlFor="fullName">Full Name</label>
                    <div className='relative'>
                      <UserIcon className='auth-input-icon' />
                      <input 
                        className='input'
                        type="text" 
                        id="fullName"
                        required
                        autoComplete="name"
                        name="fullName"
                        placeholder='Ash Nymd'
                        value={formData.fullName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className='auth-input-label' htmlFor="email">Email</label>
                    <div className='relative'>
                      <Mail className='auth-input-icon' />
                      <input 
                        type="email" 
                        id="email"
                        required
                        autoComplete="email"
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
                        required
                        autoComplete="new-password"
                        minLength={6}
                        name="password"
                        placeholder='Enter a strong password'
                        value={formData.password}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>   
                  
                  <button className='auth-btn' type='submit' disabled={isSignUp}>{isSignUp ? <Loader className='w-5 h-5 animate-spin mx-auto'/> : "Sign Up"}</button>                                
                </form>
                <div className='mt-6 text-center'>
                  <Link to="/login" className='auth-link'>
                    Already have an account? Login
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

export default SignUpPage
