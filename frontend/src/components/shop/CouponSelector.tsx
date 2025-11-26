import React, { useState, useEffect } from 'react';
import { couponService } from '../../services/couponService';
import type { Coupon } from '../../types/coupon';
import toast from 'react-hot-toast';

interface CouponSelectorProps {
    onSelect: (code: string) => void;
    onCancel: () => void;
}

export const CouponSelector: React.FC<CouponSelectorProps> = ({ onSelect, onCancel }) => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCoupons = async () => {
            try {
                const data = await couponService.list();
                setCoupons(data);
            } catch (error) {
                console.error(error);
                toast.error('クーポンの読み込みに失敗しました');
            } finally {
                setLoading(false);
            }
        };
        loadCoupons();
    }, []);

    if (loading) return <div className="text-sm text-stone-500 p-2">Loading...</div>;

    if (coupons.length === 0) {
        return (
            <div className="p-3 bg-white border border-stone-200 rounded-md text-center text-sm text-stone-500">
                利用可能なクーポンはありません
                <button onClick={onCancel} className="block w-full mt-2 text-amber-600 hover:underline">閉じる</button>
            </div>
        );
    }

    return (
        <div className="bg-white border border-stone-200 rounded-md shadow-lg max-h-60 overflow-y-auto z-50 absolute top-full left-0 w-full mt-1">
            <div className="p-2 border-b border-stone-100 flex justify-between items-center bg-stone-50 sticky top-0">
                <span className="text-xs font-bold text-stone-700">利用可能なクーポン</span>
                <button onClick={onCancel} className="text-xs text-stone-500 hover:text-stone-800">✕</button>
            </div>
            <div className="p-2 space-y-2">
                {coupons.map(coupon => (
                    <button
                        key={coupon.id}
                        onClick={() => onSelect(coupon.code)}
                        className="w-full text-left p-2 hover:bg-amber-50 rounded border border-transparent hover:border-amber-200 transition-colors group"
                    >
                        <div className="flex justify-between items-baseline">
                            <span className="font-bold text-amber-700 text-sm">{coupon.code}</span>
                            <span className="text-xs font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">{coupon.display_text}</span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1 line-clamp-1 group-hover:text-stone-700">{coupon.description}</p>
                        {coupon.min_order_value !== '0.00' && (
                             <p className="text-[10px] text-stone-400 mt-0.5">最低注文額: ¥{parseInt(coupon.min_order_value).toLocaleString()}</p>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

