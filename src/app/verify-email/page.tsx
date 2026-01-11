'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SITE_NAME } from '@/lib/constants'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('no-token')
      setMessage('No verification token provided.')
      return
    }

    verifyEmail(token)
  }, [token])

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('Your email has been verified successfully!')
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to verify email')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An error occurred. Please try again.')
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-red-500 mb-2">{SITE_NAME}</h1>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Email Verification</h2>
      </div>

      {status === 'loading' && (
        <div className="py-8">
          <Loader2 className="w-16 h-16 mx-auto text-red-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verifying your email...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="py-8">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <p className="text-green-500 font-medium mb-2">{message}</p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You can now sign in to your account.
          </p>
          <Button onClick={() => router.push('/')} fullWidth>
            Go to Home & Sign In
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="py-8">
          <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <p className="text-red-500 font-medium mb-2">{message}</p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The verification link may have expired or already been used.
          </p>
          <Button onClick={() => router.push('/')} variant="outline" fullWidth>
            Go to Home
          </Button>
        </div>
      )}

      {status === 'no-token' && (
        <div className="py-8">
          <Mail className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">{message}</p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please check your email for the verification link.
          </p>
          <Button onClick={() => router.push('/')} variant="outline" fullWidth>
            Go to Home
          </Button>
        </div>
      )}
    </>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-8 text-center">
        <Suspense fallback={
          <div className="py-8">
            <Loader2 className="w-16 h-16 mx-auto text-red-500 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  )
}
