import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../services/authService';

const resetPasswordSchema = z.object({
  email: z.string().email('メールアドレスが無効です'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .regex(/[A-Z]/, 'パスワードには大文字が必要です')
    .regex(/[a-z]/, 'パスワードには小文字が必要です')
    .regex(/\d/, 'パスワードには数字が必要です'),
  confirmPassword: z.string(),
  otpCode: z.string().length(6, '認証コードは6桁である必要があります'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onSuccess, onCancel }) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [verifiedOtpCode, setVerifiedOtpCode] = useState('');
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
    getValues,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  });

  const handleSendOTP = async () => {
    const isEmailValid = await trigger('email');
    if (!isEmailValid) return;

    const emailValue = getValues('email');
    setError(null);
    setSendingOTP(true);

    try {
      await authService.sendOTP({ email: emailValue });
      setEmail(emailValue);
      setStep('otp');
      setError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { email?: string[]; error?: string; message?: string } }; message?: string };
      setError(
        error.response?.data?.email?.[0] ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        '認証コードを送信できませんでした。もう一度お試しください。'
      );
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    const isOtpValid = await trigger('otpCode');
    if (!isOtpValid) {
      return;
    }

    const otpValue = getValues('otpCode');
    setError(null);
    setVerifyingOTP(true);

    try {
      await authService.verifyOTP(email, otpValue);
      setVerifiedOtpCode(otpValue);
      setStep('password');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { otp_code?: string[]; error?: string } } };
      setError(
        error.response?.data?.otp_code?.[0] ||
        error.response?.data?.error ||
        '認証コードが正しくないか、有効期限が切れています。'
      );
    } finally {
      setVerifyingOTP(false);
    }
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (step === 'email') {
      await handleSendOTP();
      return;
    }

    if (step === 'otp') {
      await handleVerifyOTP();
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await authService.resetPassword({
        email,
        password: data.password,
        otp_code: verifiedOtpCode,
      });
      setSuccess('パスワードがリセットされました。ログインしてください。');
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { email?: string[]; password?: string[]; otp_code?: string[]; error?: string } } };
      setError(
        error.response?.data?.email?.[0] ||
        error.response?.data?.password?.[0] ||
        error.response?.data?.otp_code?.[0] ||
        error.response?.data?.error ||
        'パスワードのリセットに失敗しました。もう一度お試しください。'
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

      {success && (
        <div className="bg-green-50 border-2 border-green-800 text-green-900 px-4 py-3 rounded-sm shadow-[4px_4px_0px_0px_rgba(22,101,52,0.3)]">
          <p className="font-serif text-sm">✓ {success}</p>
        </div>
      )}

      {/* Step 1: Email */}
      {step === 'email' && (
        <>
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
              {...register('email', { required: 'メールアドレスは必須です' })}
              className="w-full px-4 py-3 bg-amber-50 border-2 border-amber-800 rounded-sm shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] focus:outline-none focus:border-amber-600 focus:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15),0_0_0_3px_rgba(217,119,6,0.2)] transition-all font-mono text-amber-900 placeholder-amber-400"
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-800 font-serif italic">✗ {errors.email.message}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gradient-to-b from-stone-300 to-stone-400 text-stone-800 py-3 px-4 rounded-sm border-2 border-stone-600 shadow-[3px_3px_0px_0px_rgba(87,83,78,1)] hover:shadow-[1px_1px_0px_0px_rgba(87,83,78,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150 font-bold tracking-wider text-xs font-serif"
            >
              ← キャンセル
            </button>
            <button
              type="button"
              disabled={sendingOTP}
              onClick={handleSendOTP}
              className="flex-1 bg-gradient-to-b from-amber-600 to-amber-800 text-amber-50 py-3 px-6 rounded-sm border-2 border-amber-900 shadow-[4px_4px_0px_0px_rgba(120,53,15,1)] hover:shadow-[2px_2px_0px_0px_rgba(120,53,15,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-[4px_4px_0px_0px_rgba(120,53,15,1)] disabled:hover:translate-x-0 disabled:hover:translate-y-0 transition-all duration-150 font-bold tracking-wider text-sm font-serif"
            >
              {sendingOTP ? '⏳ 送信中...' : '📮 認証コードを送信'}
            </button>
          </div>
        </>
      )}

      {/* Step 2: OTP */}
      {step === 'otp' && (
        <>
          <div className="bg-amber-50 border-2 border-amber-700 px-5 py-4 rounded-sm shadow-[4px_4px_0px_0px_rgba(180,83,9,0.3)]">
            <p className="font-serif text-amber-900 font-bold mb-2">
              📬 認証コードを送信しました
            </p>
            <p className="font-mono text-amber-800 text-sm bg-amber-100 px-3 py-2 border border-amber-600 rounded-sm mb-3">
              {email}
            </p>
            <div className="bg-yellow-100 border-l-4 border-yellow-800 px-3 py-2">
              <p className="text-xs text-yellow-900 font-serif">
                💡 <strong>開発モード:</strong> Djangoターミナルで認証コードを確認してください
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <label 
              htmlFor="otpCode" 
              className="block text-sm font-bold text-amber-900 tracking-wider font-serif text-center"
            >
              🔐 認証コードを入力
            </label>
            <input
              id="otpCode"
              type="text"
              maxLength={6}
              {...register('otpCode', { required: '認証コードは必須です' })}
              className="w-full px-4 py-4 bg-amber-50 border-2 border-amber-800 rounded-sm shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] focus:outline-none focus:border-amber-600 focus:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15),0_0_0_3px_rgba(217,119,6,0.2)] transition-all text-center text-3xl tracking-[0.5em] font-bold text-amber-900 placeholder-amber-300"
              placeholder="000000"
            />
            {errors.otpCode && (
              <p className="mt-1 text-xs text-red-800 font-serif italic text-center">✗ {errors.otpCode.message}</p>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('email')}
              className="flex-1 bg-gradient-to-b from-stone-300 to-stone-400 text-stone-800 py-3 px-4 rounded-sm border-2 border-stone-600 shadow-[3px_3px_0px_0px_rgba(87,83,78,1)] hover:shadow-[1px_1px_0px_0px_rgba(87,83,78,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150 font-bold tracking-wider text-xs font-serif"
            >
              ← 戻る
            </button>
            <button
              type="button"
              disabled={verifyingOTP}
              onClick={handleVerifyOTP}
              className="flex-1 bg-gradient-to-b from-amber-600 to-amber-800 text-amber-50 py-3 px-4 rounded-sm border-2 border-amber-900 shadow-[4px_4px_0px_0px_rgba(120,53,15,1)] hover:shadow-[2px_2px_0px_0px_rgba(120,53,15,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-[4px_4px_0px_0px_rgba(120,53,15,1)] disabled:hover:translate-x-0 disabled:hover:translate-y-0 transition-all duration-150 font-bold tracking-wider text-xs font-serif"
            >
              {verifyingOTP ? '⏳ 確認中...' : '✓ 認証する'}
            </button>
          </div>
        </>
      )}

      {/* Step 3: Password */}
      {step === 'password' && (
        <>
          <div className="bg-green-50 border-2 border-green-800 px-5 py-4 rounded-sm shadow-[4px_4px_0px_0px_rgba(22,101,52,0.3)]">
            <p className="font-serif text-green-900 font-bold text-center">
              ✓ メールアドレスの認証が完了しました！
            </p>
          </div>
          <input type="hidden" {...register('email')} value={email} />
          <input type="hidden" {...register('otpCode')} value={verifiedOtpCode} />
          
          <div className="space-y-2">
            <label 
              htmlFor="password" 
              className="block text-sm font-bold text-amber-900 tracking-wider font-serif"
            >
              🔑 新しいパスワード
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
            <div className="bg-amber-100 border-l-4 border-amber-700 px-3 py-2 mt-2">
              <p className="text-xs text-amber-900 font-serif">
                📝 <strong>要件:</strong> 8文字以上、大文字・小文字・数字を含む
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label 
              htmlFor="confirmPassword" 
              className="block text-sm font-bold text-amber-900 tracking-wider font-serif"
            >
              🔒 パスワード確認
            </label>
            <input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              className="w-full px-4 py-3 bg-amber-50 border-2 border-amber-800 rounded-sm shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] focus:outline-none focus:border-amber-600 focus:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15),0_0_0_3px_rgba(217,119,6,0.2)] transition-all font-mono text-amber-900 placeholder-amber-400"
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-800 font-serif italic">✗ {errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('otp')}
              className="flex-1 bg-gradient-to-b from-stone-300 to-stone-400 text-stone-800 py-3 px-4 rounded-sm border-2 border-stone-600 shadow-[3px_3px_0px_0px_rgba(87,83,78,1)] hover:shadow-[1px_1px_0px_0px_rgba(87,83,78,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150 font-bold tracking-wider text-xs font-serif"
            >
              ← 戻る
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-b from-amber-600 to-amber-800 text-amber-50 py-3 px-4 rounded-sm border-2 border-amber-900 shadow-[4px_4px_0px_0px_rgba(120,53,15,1)] hover:shadow-[2px_2px_0px_0px_rgba(120,53,15,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-[4px_4px_0px_0px_rgba(120,53,15,1)] disabled:hover:translate-x-0 disabled:hover:translate-y-0 transition-all duration-150 font-bold tracking-wider text-xs font-serif"
            >
              {isLoading ? '⏳ 処理中...' : '✓ パスワードをリセット'}
            </button>
          </div>
        </>
      )}
    </form>
  );
};

