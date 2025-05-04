"use client"
import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Activity, Heart, Lock } from 'lucide-react';
import GoogleButton from './GoogleButton';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

interface UserData {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const SignUpCard: React.FC = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const setUniversalCookie = (email: string) => {
    Cookies.set('userEmail', email, {
      secure: false, 
      sameSite: 'lax', 
      path: '/'
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleCustomSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setUniversalCookie(formData.email);

      toast.success('Account created successfully!');
      router.push('/');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (userData: UserData) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: userData.displayName,
          email: userData.email,
          photoURL: userData.photoURL,
          uid: userData.uid
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      if (userData.email) {
        setUniversalCookie(userData.email);
      }

      toast.success('Google sign-in successful!');
      router.push('/');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-5/12 bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white">
            <div className="h-full flex flex-col justify-center">
              <div className="mb-8 flex items-center">
                <Brain className="h-8 w-8 mr-3" />
                <h1 className="text-2xl font-bold">HealthMind AI</h1>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <Activity className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">Real-time mood tracking & analysis</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Heart className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">Personalized mental wellness insights</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Brain className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">AI-powered emotional support</p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:w-7/12 p-8">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                <p className="mt-2 text-sm text-gray-600">Join us in your wellness journey</p>
              </div>

              <div className="mb-6">
                <GoogleButton onSuccess={handleGoogleSuccess} mode="signup" disabled={loading} />
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or sign up with email</span>
                </div>
              </div>

              <form onSubmit={handleCustomSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="firstName">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="John"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="lastName">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Doe"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="john@example.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                    Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                      placeholder="••••••••"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                      disabled={loading}
                    >
                      <Lock className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>

                <p className="mt-4 text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <a href="/SignInPage" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign in
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpCard;
