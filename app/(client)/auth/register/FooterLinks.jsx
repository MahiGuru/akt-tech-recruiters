import Link from 'next/link'

export default function FooterLinks() {
  return (
    <div className="mt-8 text-center">
      <p className="text-sm text-secondary-600">
        Already have an account?{' '}
        <Link
          href="/auth/login"
          className="font-semibold text-primary-600 hover:text-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
        >
          Sign in here
        </Link>
      </p>
      <p className="text-xs text-secondary-500 mt-4">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="underline hover:text-secondary-700">Terms of Service</Link>
        {' '}and{' '}
        <Link href="/privacy" className="underline hover:text-secondary-700">Privacy Policy</Link>
      </p>
    </div>
  )
}