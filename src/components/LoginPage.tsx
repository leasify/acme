import React, { useState } from 'react';
import { Building2, Shield, FileText, TrendingUp, Github } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Attempting login with:', { email, password: '***' });

    try {
      await login(email, password);
      console.log('Login successful');
    } catch (err) {
      console.error('Login failed:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding and Info */}
        <div className="text-center lg:text-left space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-center lg:justify-start space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">ACME</h1>
              <p className="text-sm text-accent-400 font-medium">Report Management</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-6">
            <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
              Professional
              <span className="block text-accent-400">IFRS Reporting</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-lg">
              Streamlined lease accounting reports powered by Leasify API. 
              Generate, manage, and track your IFRS compliance reports with ease.
            </p>
            
            {/* Demo Notice */}
            <div className="bg-accent-900/30 border border-accent-500/40 rounded-lg p-4 max-w-lg">
              <p className="text-accent-300 text-sm">
                <span className="font-semibold">Demo Project:</span> This is a simulation project to exemplify the Leasify API v3 capabilities and features.
              </p>
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-3 gap-6 pt-8">
              <div className="flex flex-col items-center lg:items-start space-y-2">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Secure</h3>
                  <p className="text-sm text-gray-400">Enterprise-grade security</p>
                </div>
              </div>
              <div className="flex flex-col items-center lg:items-start space-y-2">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Compliant</h3>
                  <p className="text-sm text-gray-400">IFRS 16 standards</p>
                </div>
              </div>
              <div className="flex flex-col items-center lg:items-start space-y-2">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Efficient</h3>
                  <p className="text-sm text-gray-400">Automated workflows</p>
                </div>
              </div>
            </div>
            
            {/* GitHub Link */}
            <div className="flex justify-center lg:justify-start pt-8">
              <a
                href="https://github.com/leasify/acme"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200 group"
              >
                <div className="w-8 h-8 bg-gray-700 group-hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors duration-200">
                  <Github className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">View on GitHub</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-8">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-white">Welcome Back</h3>
                  <p className="text-gray-400">Sign in to your ACME account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                  
                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />

                  {error && (
                    <div className="p-3 bg-red-900/50 border border-red-500 rounded-md">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>

                <div className="text-center">
                  <p className="text-sm text-gray-400">
                    Protected by enterprise security standards
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};