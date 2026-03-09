import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Construction, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { logAuditEvent } from '@/lib/auditLogger';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      logAuditEvent({ event_type: 'login_failed', event_data: { email }, status: 'failure', error_message: error.message });
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    } else {
      logAuditEvent({ event_type: 'login_success', event_data: { email }, user_id: data.user?.id });
      navigate('/dashboard');
    }
  };

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordStrong = hasMinLength && hasUppercase && hasSpecial && hasNumber;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordStrong) {
      toast({ title: 'Weak password', description: 'Must include 8+ chars, uppercase, number & special character', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Signup failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Account created!', description: 'You can now sign in.' });
      navigate('/dashboard');
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Google sign-in failed', description: String(error), variant: 'destructive' });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast({ title: 'Enter your email', variant: 'destructive' }); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Check your email', description: 'Password reset link sent.' });
      setMode('login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4">
            <Construction size={32} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">BuildForge</h1>
          <p className="text-sm text-muted-foreground mt-1">Construction Project Management</p>
        </div>

        <div className="bg-card rounded-2xl border shadow-lg p-8">
          {mode === 'login' && (
            <>
              <h2 className="text-lg font-semibold text-foreground mb-6">Sign in to your account</h2>
              <Button variant="outline" className="w-full mb-4" onClick={handleGoogle} disabled={loading}>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </Button>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or continue with email</span></div>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-1.5">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-9" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1.5">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-9 pr-9" required />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPw(!showPw)}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
              <div className="flex justify-between mt-4">
                <button className="text-sm text-primary hover:underline" onClick={() => setMode('forgot')}>Forgot password?</button>
                <button className="text-sm text-primary hover:underline" onClick={() => setMode('signup')}>Create account</button>
              </div>
            </>
          )}

          {mode === 'signup' && (
            <>
              <h2 className="text-lg font-semibold text-foreground mb-6">Create your account</h2>
              <Button variant="outline" className="w-full mb-4" onClick={handleGoogle} disabled={loading}>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign up with Google
              </Button>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or sign up with email</span></div>
              </div>
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative mt-1.5">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="name" placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} className="pl-9" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative mt-1.5">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="signup-email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-9" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative mt-1.5">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="signup-password" type={showPw ? 'text' : 'password'} placeholder="Strong password" value={password} onChange={e => setPassword(e.target.value)} className="pl-9 pr-9" required />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPw(!showPw)}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[hasMinLength, hasUppercase, hasNumber, hasSpecial].map((met, i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${met ? 'bg-emerald-500' : 'bg-muted'}`} />
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 text-[10px]">
                        <span className={hasMinLength ? 'text-emerald-600' : 'text-muted-foreground'}>✓ 8+ characters</span>
                        <span className={hasUppercase ? 'text-emerald-600' : 'text-muted-foreground'}>✓ Uppercase (A-Z)</span>
                        <span className={hasNumber ? 'text-emerald-600' : 'text-muted-foreground'}>✓ Number (0-9)</span>
                        <span className={hasSpecial ? 'text-emerald-600' : 'text-muted-foreground'}>✓ Special (!@#$)</span>
                      </div>
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
              <button className="text-sm text-primary hover:underline mt-4 block mx-auto" onClick={() => setMode('login')}>
                Already have an account? Sign in
              </button>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <h2 className="text-lg font-semibold text-foreground mb-2">Reset Password</h2>
              <p className="text-sm text-muted-foreground mb-6">Enter your email to receive a reset link.</p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <Label htmlFor="reset-email">Email</Label>
                  <Input id="reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
              <button className="text-sm text-primary hover:underline mt-4 block mx-auto" onClick={() => setMode('login')}>
                Back to login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
