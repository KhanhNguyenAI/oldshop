import { useState, useEffect } from 'react';
import { couponService } from '../../services/couponService';
import type { Coupon } from '../../types/coupon';
import toast from 'react-hot-toast';

const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(Number(price));
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
};

export default function CouponsPanel() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputCode, setInputCode] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = async () => {
        try {
            const data = await couponService.list();
            setCoupons(data);
        } catch (error) {
            console.error('Failed to load coupons', error);
            toast.error('クーポンを読み込めませんでした');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputCode.trim()) return;

        setSaving(true);
        try {
            await couponService.save(inputCode);
            toast.success('クーポンを獲得しました！');
            loadCoupons(); // Refresh list
            setInputCode('');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'クーポンが見つかりません');
        } finally {
            setSaving(false);
        }
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success('クーポンコードをコピーしました');
    };

    if (loading) {
        return <div className="p-8 text-center text-stone-500">Loading coupons...</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-serif text-stone-800 border-b pb-2">My Coupons</h2>

            {/* Input Form for Private Coupons */}
            <form onSubmit={handleSaveCoupon} className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex gap-2 items-center">
                <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="クーポンコードを入力して追加"
                    className="flex-1 px-4 py-2 border border-stone-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    disabled={saving}
                />
                <button
                    type="submit"
                    disabled={saving || !inputCode.trim()}
                    className="bg-amber-600 text-white px-6 py-2 rounded hover:bg-amber-700 disabled:opacity-50 transition-colors font-medium"
                >
                    {saving ? 'Checking...' : '追加'}
                </button>
            </form>

            {coupons.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-stone-200">
                    <p className="text-stone-500">現在利用可能なクーポンはありません。</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {coupons.map((coupon) => (
                        <div 
                            key={coupon.id} 
                            className={`bg-white border-2 border-dashed rounded-lg p-4 flex flex-col justify-between hover:border-amber-400 transition-colors relative overflow-hidden ${
                                coupon.is_saved ? 'border-amber-400 bg-amber-50/30' : 'border-stone-300'
                            }`}
                        >
                            {/* Status Badges */}
                            <div className="absolute top-0 right-0 flex">
                                {coupon.is_saved && (
                                    <div className="px-3 py-1 text-xs text-white bg-amber-500 mr-1 rounded-bl">
                                        Saved
                                    </div>
                                )}
                                <div className={`px-3 py-1 text-xs text-white ${coupon.status === 'active' ? 'bg-green-500' : 'bg-stone-400'}`}>
                                    {coupon.status === 'active' ? 'Active' : 'Expired'}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-baseline gap-2 mb-2 pr-16">
                                    <h3 className="text-2xl font-bold text-amber-600">{coupon.display_text}</h3>
                                    {coupon.min_order_value !== '0.00' && (
                                        <span className="text-xs text-stone-500">
                                            Min order: {formatPrice(coupon.min_order_value)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-stone-600 mb-3">{coupon.description}</p>
                                <div className="text-xs text-stone-400 space-y-1">
                                    <p>有効期限: {formatDate(coupon.start_date)} ~ {formatDate(coupon.end_date)}</p>
                                    {coupon.max_discount && (
                                        <p>最大割引: {formatPrice(coupon.max_discount)}</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                                <code className="bg-stone-100 px-2 py-1 rounded text-lg font-mono text-stone-700 tracking-wider">
                                    {coupon.code}
                                </code>
                                <button 
                                    onClick={() => copyToClipboard(coupon.code)}
                                    className="text-sm text-amber-600 hover:text-amber-700 font-medium px-3 py-1 hover:bg-amber-50 rounded transition-colors"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
