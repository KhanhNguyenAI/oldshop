import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('メールアドレスが無効です'),
  password: z.string().min(8, 'パスワードは8文字以上である必要があります'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      await login(data.email, data.password);
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { email?: string[]; password?: string[]; error?: string } } };
      setError(
        error.response?.data?.email?.[0] ||
        error.response?.data?.password?.[0] ||
        error.response?.data?.error ||
        'ログインに失敗しました。もう一度お試しください。'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-2 border-red-800 text-red-900 px-4 py-3 rounded-sm shadow-[4px_4px_0px_0px_rgba(127,29,29,0.2)]">
          <p className="font-serif text-sm">⚠ {error}</p>
        </div>
      )}

      <div className="space-y-2">
        <label 
          htmlFor="email" 
          className="block text-sm font-bold text-amber-900 tracking-wider font-serif"
        >
          📧 メールアドレス
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className="w-full px-4 py-3 bg-amber-50 border-2 border-amber-800 rounded-sm shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] focus:outline-none focus:border-amber-600 focus:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15),0_0_0_3px_rgba(217,119,6,0.2)] transition-all font-mono text-amber-900 placeholder-amber-400"
          placeholder="your@email.com"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-800 font-serif italic">✗ {errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label 
          htmlFor="password" 
          className="block text-sm font-bold text-amber-900 tracking-wider font-serif"
        >
          🔑 パスワード
        </label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className="w-full px-4 py-3 bg-amber-50 border-2 border-amber-800 rounded-sm shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] focus:outline-none focus:border-amber-600 focus:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15),0_0_0_3px_rgba(217,119,6,0.2)] transition-all font-mono text-amber-900 placeholder-amber-400"
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-800 font-serif italic">✗ {errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-b from-amber-600 to-amber-800 text-amber-50 py-3 px-6 rounded-sm border-2 border-amber-900 shadow-[4px_4px_0px_0px_rgba(120,53,15,1)] hover:shadow-[2px_2px_0px_0px_rgba(120,53,15,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-[4px_4px_0px_0px_rgba(120,53,15,1)] disabled:hover:translate-x-0 disabled:hover:translate-y-0 transition-all duration-150 font-bold tracking-wider text-sm font-serif"
      >
        {isLoading ? '⏳ 処理中...' : '🚪 ログイン'}
      </button>
    </form>
  );
};

