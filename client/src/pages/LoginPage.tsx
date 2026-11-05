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

  if (sessionPending) return <p className="p-8 text-center">Loading…</p>
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
    <main className="grid min-h-screen place-items-center p-4">
      <form
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-gray-300 p-8"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <h1 className="text-xl font-semibold">Sign in to Helpdesk</h1>

        <label className="flex flex-col gap-1">
          Email
          <input
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            className="rounded border border-gray-400 p-2 aria-invalid:border-red-600"
            {...register('email')}
          />
        </label>
        {errors.email && (
          <p role="alert" className="m-0 text-red-600">{errors.email.message}</p>
        )}

        <label className="flex flex-col gap-1">
          Password
          <input
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            className="rounded border border-gray-400 p-2 aria-invalid:border-red-600"
            {...register('password')}
          />
        </label>
        {errors.password && (
          <p role="alert" className="m-0 text-red-600">{errors.password.message}</p>
        )}

        {errors.root?.serverError && (
          <p role="alert" className="m-0 text-red-600">{errors.root.serverError.message}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer rounded bg-gray-900 px-4 py-2 text-white hover:bg-gray-700 disabled:cursor-default disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
