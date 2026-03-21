import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '../lib/supabase';
import { Store, Mail, Lock, Eye, EyeOff, Crown, Database, Cloud, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = getSupabase();

    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) throw error;
        
        toast.success('Welcome back!');
        navigate('/dashboard');
        
      } else {
        // Register - default to FREE plan
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              phone: formData.phone,
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          // Tag user as Free by default in user_subscriptions
          const { error: subError } = await supabase
            .from('user_subscriptions')
            .insert({
              user_id: data.user.id,
              plan_type: 'free',
              status: 'active',
              start_date: new Date().toISOString(),
              auto_renew: true
            });
          
          if (subError) console.error('Failed to create initial subscription:', subError);
        }
        
        toast.success('Account created! Please check your email to verify.');
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!formData.email) {
      toast.error('Please enter your email first');
      return;
    }
    
    setLoading(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });
      
      if (error) throw error;
      toast.success('Confirmation email resent!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-2xl mb-4">
            <Store className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 uppercase tracking-tight">Sari-Sari <span className="text-blue-600">POS</span></h1>
          <p className="text-lg text-gray-600">The complete POS system for Filipino sari-sari stores</p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-xl p-4 shadow-sm text-center border border-gray-100">
            <Database className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-semibold">Offline First</h3>
            <p className="text-sm text-gray-500">Works without internet</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center border border-gray-100">
            <Cloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-semibold">Cloud Backup</h3>
            <p className="text-sm text-gray-500">Premium feature</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center border border-gray-100">
            <Zap className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-semibold">AI Detection</h3>
            <p className="text-sm text-gray-500">Scan products instantly</p>
          </div>
        </div>

        {/* Auth Form */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex space-x-2 mb-6 bg-gray-50 p-1 rounded-xl">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                  isLogin
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                  !isLogin
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                        placeholder="Juan"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                        placeholder="Dela Cruz"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                      placeholder="09123456789"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300" size={18} />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                    placeholder="store@sarisari.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-800 border border-blue-100">
                  <p className="font-black uppercase tracking-widest mb-2 flex items-center">
                    <Crown size={14} className="mr-1 text-amber-500" />
                    Free Plan Included
                  </p>
                  <ul className="space-y-1 opacity-80 font-medium">
                    <li>• 50 products • 20 customers</li>
                    <li>• Local storage only</li>
                    <li>• Upgrade anytime to unlock cloud sync</li>
                  </ul>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center space-x-2 mt-6"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <span>{isLogin ? 'Login' : 'Create Free Account'}</span>
                )}
              </button>
            </form>

            <div className="mt-8 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400 font-bold tracking-widest">Or continue with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                className="w-full py-4 bg-white border-2 border-gray-100 rounded-2xl font-black uppercase tracking-widest text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center justify-center space-x-3 shadow-sm"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                <span>Google Account</span>
              </button>

              {isLogin && (
                <div className="text-center space-y-2">
                  <button
                    onClick={handleResendConfirmation}
                    className="text-[10px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-600 transition-all"
                  >
                    Didn't receive confirmation email? Resend
                  </button>
                  <p className="text-[9px] text-gray-400 font-medium italic">
                    Note: Supabase free tier limits emails to 3 per hour. Check spam or use Google login.
                  </p>
                </div>
              )}
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                By continuing, you agree to our Terms and Privacy Policy
              </p>
            </div>
          </div>

          {/* Premium Badge */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
              <Crown size={14} className="text-amber-500" />
              <span>Upgrade to Premium for cloud sync & more!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
