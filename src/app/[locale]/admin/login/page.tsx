import { LoginForm } from '@/components/admin/auth/LoginForm';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-auto">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-600 rounded-xl">
              <span className="text-white font-bold text-xl">K</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-2xl font-semibold text-gray-900">
            KITMED Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your admin account
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}