'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/store/useStore'
import { isValidEmail, isValidUsername } from '@/lib/utils'
import { SITE_NAME, VALIDATION } from '@/lib/constants'
import apiClient from '@/lib/api-client'

export function AuthModals() {
  const { modal, closeModal, openModal } = useStore()

  if (modal.type !== 'login' && modal.type !== 'register') return null

  return (
    <>
      {modal.type === 'login' && (
        <LoginModal
          isOpen={modal.isOpen}
          onClose={closeModal}
          onSwitchToRegister={() => openModal('register')}
        />
      )}
      {modal.type === 'register' && (
        <RegisterModal
          isOpen={modal.isOpen}
          onClose={closeModal}
          onSwitchToLogin={() => openModal('login')}
        />
      )}
    </>
  )
}

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToRegister: () => void
}

function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const { addToast } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNeedsVerification(false)

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
        // Check if the error is about email verification
        if (result.error.toLowerCase().includes('verify')) {
          setNeedsVerification(true)
        }
        setIsLoading(false)
        return
      }

      addToast({ type: 'success', message: 'Welcome back!' })
      onClose()
      setEmail('')
      setPassword('')
      // Refresh the page to update session
      window.location.reload()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address first')
      return
    }
    
    setIsResending(true)
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        addToast({ type: 'success', message: 'Verification email sent! Check your inbox.' })
      } else {
        addToast({ type: 'error', message: data.error || 'Failed to send verification email' })
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to send verification email' })
    } finally {
      setIsResending(false)
    }
  }

  const handleOAuthSignIn = (provider: 'google' | 'github') => {
    signIn(provider, { callbackUrl: '/' })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sign in" size="sm">
      <div className="text-center mb-6">
        <Image 
          src="/growtube.png" 
          alt="GrowthTube" 
          width={48} 
          height={48} 
          className="mx-auto mb-3"
        />
        <p className="text-[var(--text-secondary)]">Sign in to {SITE_NAME}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
            {needsVerification && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="mt-2 w-full text-sm text-blue-500 hover:text-blue-400 font-medium disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend verification email'}
              </button>
            )}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-5 h-5" />}
          autoComplete="email"
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-5 h-5" />}
          rightIcon={
            <button type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          }
          autoComplete="current-password"
        />

        <div className="text-right">
          <button type="button" className="text-sm text-blue-500 hover:text-blue-400">
            Forgot password?
          </button>
        </div>

        <Button type="submit" fullWidth isLoading={isLoading}>
          Sign in
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-[var(--text-secondary)]">Don&apos;t have an account? </span>
        <button onClick={onSwitchToRegister} className="text-blue-500 hover:text-blue-400 font-medium">
          Sign up
        </button>
      </div>

      {/* OAuth Buttons */}
      <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
        <p className="text-center text-sm text-[var(--text-secondary)] mb-4">Or continue with</p>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={() => handleOAuthSignIn('google')}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={() => handleOAuthSignIn('github')}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-center text-xs text-[var(--text-tertiary)]">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </Modal>
  )
}

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToLogin: () => void
}

function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const { addToast } = useStore()
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required'
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (!isValidUsername(formData.username)) {
      newErrors.username = 'Username must be 3-30 characters, letters, numbers, and underscores only'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < VALIDATION.minPasswordLength) {
      newErrors.password = `Password must be at least ${VALIDATION.minPasswordLength} characters`
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Register user
      await apiClient.register({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        displayName: formData.displayName,
      })

      // Show success message - user needs to verify email before signing in
      setRegisteredEmail(formData.email)
      setRegistrationSuccess(true)
      addToast({ type: 'success', message: 'Account created! Please check your email to verify.' })

      setFormData({
        displayName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      })
    } catch (err: any) {
      setErrors({ general: err.error || 'Registration failed. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail }),
      })
      
      if (response.ok) {
        addToast({ type: 'success', message: 'Verification email sent!' })
      } else {
        const data = await response.json()
        addToast({ type: 'error', message: data.error || 'Failed to resend email' })
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to resend verification email' })
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Show success view after registration
  if (registrationSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Verify your email" size="sm">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Check your inbox</h3>
          <p className="text-[var(--text-secondary)] mb-2">
            We&apos;ve sent a verification link to:
          </p>
          <p className="text-[var(--accent)] font-medium mb-6">{registeredEmail}</p>
          <p className="text-sm text-[var(--text-tertiary)] mb-6">
            Click the link in the email to verify your account and start using {SITE_NAME}.
          </p>
          
          <div className="space-y-3">
            <Button onClick={onSwitchToLogin} fullWidth>
              Go to Sign In
            </Button>
            <Button 
              variant="outline" 
              fullWidth 
              onClick={handleResendVerification}
              isLoading={isLoading}
            >
              Resend verification email
            </Button>
          </div>
          
          <p className="text-xs text-[var(--text-tertiary)] mt-4">
            Didn&apos;t receive the email? Check your spam folder.
          </p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create account" size="sm">
      <div className="text-center mb-6">
        <Image 
          src="/growtube.png" 
          alt="GrowthTube" 
          width={48} 
          height={48} 
          className="mx-auto mb-3"
        />
        <p className="text-[var(--text-secondary)]">Join {SITE_NAME} today</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {errors.general}
          </div>
        )}

        <Input
          label="Display Name"
          placeholder="How others will see you"
          value={formData.displayName}
          onChange={(e) => updateField('displayName', e.target.value)}
          leftIcon={<User className="w-5 h-5" />}
          error={errors.displayName}
        />

        <Input
          label="Username"
          placeholder="Choose a unique username"
          value={formData.username}
          onChange={(e) => updateField('username', e.target.value.toLowerCase())}
          leftIcon={<span className="text-[var(--text-secondary)]">@</span>}
          error={errors.username}
          helperText="Letters, numbers, and underscores only"
        />

        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
          leftIcon={<Mail className="w-5 h-5" />}
          error={errors.email}
          autoComplete="email"
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Create a password"
          value={formData.password}
          onChange={(e) => updateField('password', e.target.value)}
          leftIcon={<Lock className="w-5 h-5" />}
          rightIcon={
            <button type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          }
          error={errors.password}
          autoComplete="new-password"
        />

        <Input
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => updateField('confirmPassword', e.target.value)}
          leftIcon={<Lock className="w-5 h-5" />}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <Button type="submit" fullWidth isLoading={isLoading}>
          Create account
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-[var(--text-secondary)]">Already have an account? </span>
        <button onClick={onSwitchToLogin} className="text-blue-500 hover:text-blue-400 font-medium">
          Sign in
        </button>
      </div>

      <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
        <p className="text-center text-xs text-[var(--text-tertiary)]">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </Modal>
  )
}
