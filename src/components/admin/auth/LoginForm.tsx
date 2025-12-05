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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="w-full max-w-md">
        {/* Centered Logo */}
        <div className="flex justify-center mb-8">
          <LoginLogo />
        </div>

        {/* Modern Login Card */}
        <Card className="border-0 bg-white">
          <CardContent className="p-8">
            {/* Welcome Message */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                {t('admin.auth.signIn')}
              </h1>
              <p className="text-gray-600">
                {t('admin.title')}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Global Error */}
              {(error || errors.root) && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-md">
                  <p className="text-sm text-red-700">
                    {error || errors.root?.message}
                  </p>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  {t('admin.auth.emailPlaceholder')}
                </label>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="admin@kitmed.ma"
                  className={`h-12 ${errors.email ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-blue-400'} transition-colors`}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  {t('admin.auth.passwordPlaceholder')}
                </label>
                <div className="relative">
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`h-12 pr-12 ${errors.password ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-blue-400'} transition-colors`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {t('admin.auth.rememberMe')}
                  </span>
                </label>

                <button
                  type="button"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  onClick={() => {
                    const currentLocale = pathname?.match(/^\/(en|fr)/)?.[1] || 'fr';
                    router.push(`/${currentLocale}/admin/forgot-password`);
                  }}
                >
                  {t('admin.auth.forgotPassword')}
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner />
                    <span className="ml-2">{t('admin.auth.signingIn')}</span>
                  </div>
                ) : (
                  t('admin.auth.signIn')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-400">
            © 2024 KITMED. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}