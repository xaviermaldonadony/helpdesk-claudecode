import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router'
import { z } from 'zod'
import { signIn, useSession } from '../lib/auth-client'

const loginSchema = z.object({
  email: z.email({ error: 'Enter a valid email address' }),
  password: z.string().min(1, { error: 'Password is required' }),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { data: session, isPending: sessionPending } = useSession()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (sessionPending) return <p className="status">Loading…</p>
  if (session) return <Navigate to="/" replace />

  const onSubmit: SubmitHandler<LoginValues> = async (values) => {
    const result = await signIn.email(values)

    if (result.error) {
      setError('root.serverError', {
        message: result.error.message ?? 'Sign in failed',
      })
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <h1>Sign in to Helpdesk</h1>

        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            {...register('email')}
          />
        </label>
        {errors.email && (
          <p role="alert" className="form-error">{errors.email.message}</p>
        )}

        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            {...register('password')}
          />
        </label>
        {errors.password && (
          <p role="alert" className="form-error">{errors.password.message}</p>
        )}

        {errors.root?.serverError && (
          <p role="alert" className="form-error">{errors.root.serverError.message}</p>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
