'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { LoginLogo } from '@/components/ui/logo';
import { useAdminAuth } from '@/hooks/useAdminAuth';

// Note: Schema validation messages will be handled by component for i18n
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const t = useTranslations();
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const success = await login(data.email, data.password);
      
      if (success) {
        // Preserve current locale when redirecting after successful login
        const currentLocale = pathname?.match(/^\/(en|fr)/)?.[1] || 'fr';
        router.push(`/${currentLocale}/admin`);
      } else {
        setError('root', {
          type: 'manual',
          message: t('admin.auth.invalidCredentials'),
        });
      }
    } catch (err) {
      setError('root', {
        type: 'manual',
        message: t('admin.auth.loginError'),
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <LoginLogo className="mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 font-poppins">
            {t('admin.title')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 font-poppins">
            {t('admin.auth.signIn')}
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{t('admin.auth.signIn')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Global Error */}
              {(error || errors.root) && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">
                    {error || errors.root?.message}
                  </p>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="sr-only">
                  {t('admin.auth.emailPlaceholder')}
                </label>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder={t('admin.auth.emailPlaceholder')}
                  className={errors.email ? 'border-red-300' : ''}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="sr-only">
                  {t('admin.auth.passwordPlaceholder')}
                </label>
                <div className="relative">
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('admin.auth.passwordPlaceholder')}
                    className={errors.password ? 'border-red-300 pr-10' : 'pr-10'}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    {t('admin.auth.rememberMe')}
                  </label>
                </div>

                <div className="text-sm">
                  <button
                    type="button"
                    className="font-medium text-blue-600 hover:text-blue-500"
                    onClick={() => {
                      const currentLocale = pathname?.match(/^\/(en|fr)/)?.[1] || 'fr';
                      router.push(`/${currentLocale}/admin/forgot-password`);
                    }}
                  >
                    {t('admin.auth.forgotPassword')}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting ? t('admin.auth.signingIn') : t('admin.auth.signIn')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Development Login Info */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                {t('admin.auth.developmentMode')}
              </h3>
              <div className="text-xs text-yellow-700 space-y-1">
                <p><strong>Admin:</strong> admin@kitmed.ma / admin123</p>
                <p><strong>Editor:</strong> editor@kitmed.ma / editor123</p>
                <p><strong>Viewer:</strong> viewer@kitmed.ma / viewer123</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2024 KITMED. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}