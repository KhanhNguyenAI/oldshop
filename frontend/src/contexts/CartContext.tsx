import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { CartItem, CartContextType } from '../types/cart';
import type { Product } from '../types/product';
import type { Coupon } from '../types/coupon';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { cartService } from '../services/cartService';
import { couponService } from '../services/couponService';

interface ExtendedCartContextType extends CartContextType {
    cartIconRef: React.RefObject<HTMLButtonElement | null>;
    addToCartWithFlyEffect: (product: Product, imageSrc: string, startElement: HTMLElement) => void;
}

const CartContext = createContext<ExtendedCartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    
    // Initialize cart from localStorage
    const [items, setItems] = useState<CartItem[]>(() => {
        const savedCart = localStorage.getItem('oldshop_cart');
        if (savedCart) {
            try {
                return JSON.parse(savedCart);
            } catch (error) {
                console.error('Failed to parse cart from localStorage:', error);
                return [];
            }
        }
        return [];
    });

    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const cartIconRef = useRef<HTMLButtonElement>(null);
    
    // Flying image state
    const [flyingImage, setFlyingImage] = useState<{
        src: string;
        style: React.CSSProperties;
    } | null>(null);

    // Track previous user to detect logout vs initial load
    const prevUserRef = useRef(user);

    // Sync/Load cart when user logs in
    useEffect(() => {
        const syncAndLoadCart = async () => {
            if (user) {
                try {
                    // Check if we have local items to sync
                    const localCartRaw = localStorage.getItem('oldshop_cart');
                    let localItems: CartItem[] = [];
                    if (localCartRaw) {
                        localItems = JSON.parse(localCartRaw);
                    }

                    if (localItems.length > 0) {
                        // Sync local items to DB
                        const syncedItems = await cartService.sync(localItems);
                        setItems(syncedItems);
                        // Clear local storage as we now rely on DB
                        localStorage.removeItem('oldshop_cart');
                    } else {
                        // Just fetch existing DB cart
                        const dbItems = await cartService.get();
                        setItems(dbItems);
                    }
                } catch (error) {
                    console.error('Failed to sync cart:', error);
                }
            } else if (prevUserRef.current) {
                // User WAS logged in, now logged out -> clear items
                setItems([]);
                setAppliedCoupon(null); // Clear coupon on logout
            }
        };

        syncAndLoadCart();
        prevUserRef.current = user;
    }, [user]);

    // Save cart to localStorage ONLY if user is NOT logged in
    useEffect(() => {
        if (!user) {
            localStorage.setItem('oldshop_cart', JSON.stringify(items));
        }
        
        // Reset coupon if cart becomes empty
        if (items.length === 0 && appliedCoupon) {
            setAppliedCoupon(null);
        }
    }, [items, user, appliedCoupon]);

    const addToCart = async (product: Product, quantity: number = 1) => {
        // Validation
        const existingItem = items.find(item => item.product.id === product.id);
        const currentQty = existingItem ? existingItem.quantity : 0;
        const stockLimit = product.stock_quantity;

        if (currentQty + quantity > stockLimit) {
            toast.error(`在庫数(${stockLimit}点)を超える注文はできません。`);
            return;
        }

        if (user) {
            // API Call
            try {
                const updatedItems = await cartService.add(product.id, quantity);
                setItems(updatedItems);
                toast.success('カートに追加しました');
            } catch (error) {
                console.error('Failed to add to cart:', error);
                toast.error('カートへの追加に失敗しました');
            }
        } else {
            // Local State Update
            setItems(prevItems => {
                const existingItemIndex = prevItems.findIndex(item => item.product.id === product.id);
                
                if (existingItemIndex > -1) {
                    return prevItems.map((item, index) => 
                        index === existingItemIndex
                            ? { ...item, quantity: item.quantity + quantity }
                            : item
                    );
                } else {
                    return [...prevItems, { product, quantity }];
                }
            });
            toast.success('カートに追加しました');
        }
    };

    const addToCartWithFlyEffect = async (product: Product, imageSrc: string, startElement: HTMLElement) => {
        const currentItem = items.find(item => item.product.id === product.id);
        const currentQty = currentItem ? currentItem.quantity : 0;
        
        if (currentQty + 1 > product.stock_quantity) {
             toast.error(`在庫数(${product.stock_quantity}点)を超える注文はできません。`);
             return;
        }

        // Perform Add
        if (user) {
            try {
                const updatedItems = await cartService.add(product.id, 1);
                setItems(updatedItems);
            } catch (error) {
                console.error('Failed to add to cart:', error);
                toast.error('カートへの追加に失敗しました');
                return; // Stop animation if failed
            }
        } else {
            setItems(prevItems => {
                const existingItemIndex = prevItems.findIndex(item => item.product.id === product.id);
                if (existingItemIndex > -1) {
                    return prevItems.map((item, index) => 
                        index === existingItemIndex
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    );
                } else {
                    return [...prevItems, { product, quantity: 1 }];
                }
            });
        }

        // Trigger animation
        if (!cartIconRef.current) return;

        const startRect = startElement.getBoundingClientRect();
        const endRect = cartIconRef.current.getBoundingClientRect();

        const startX = startRect.left + startRect.width / 2;
        const startY = startRect.top + startRect.height / 2;
        const endX = endRect.left + endRect.width / 2;
        const endY = endRect.top + endRect.height / 2;

        setFlyingImage({
            src: imageSrc,
            style: {
                position: 'fixed',
                left: `${startX}px`,
                top: `${startY}px`,
                width: '100px',
                height: '100px',
                objectFit: 'cover',
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 9999,
                transform: 'translate(-50%, -50%)',
                transition: 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
                opacity: 1,
            }
        });

        requestAnimationFrame(() => {
            setTimeout(() => {
                setFlyingImage(prev => prev ? {
                    ...prev,
                    style: {
                        ...prev.style,
                        left: `${endX}px`,
                        top: `${endY}px`,
                        width: '20px',
                        height: '20px',
                        opacity: 0.5,
                    }
                } : null);
            }, 50);
        });

        setTimeout(() => {
            setFlyingImage(null);
            toast.success('カートに追加しました');
        }, 850);
    };

    const removeFromCart = async (productId: string) => {
        if (user) {
            try {
                const updatedItems = await cartService.remove(productId);
                setItems(updatedItems);
            } catch (error) {
                console.error('Failed to remove item:', error);
                toast.error('削除に失敗しました');
            }
        } else {
            setItems(prevItems => prevItems.filter(item => item.product.id !== productId));
        }
    };

    const updateQuantity = async (productId: string, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(productId);
            return;
        }
        
        if (user) {
            try {
                const updatedItems = await cartService.update(productId, quantity);
                setItems(updatedItems);
            } catch (error) {
                console.error('Failed to update quantity:', error);
                toast.error('数量の更新に失敗しました');
            }
        } else {
            setItems(prevItems => 
                prevItems.map(item => 
                    item.product.id === productId 
                        ? { ...item, quantity } 
                        : item
                )
            );
        }
    };

    const clearCart = async () => {
        if (user) {
            try {
                await cartService.clear();
                setItems([]);
            } catch (error) {
                console.error('Failed to clear cart:', error);
                setItems([]);
            }
        } else {
            setItems([]);
        }
        setAppliedCoupon(null);
    };
    
    const toggleCart = () => setIsOpen(prev => !prev);
    const closeCart = () => setIsOpen(false);

    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    
    const subtotal = items.reduce((total, item) => {
        const price = item.product.sale_price 
            ? item.product.sale_price 
            : parseFloat(item.product.price);
        return total + (isNaN(price) ? 0 : price * item.quantity);
    }, 0);

    const applyCoupon = async (code: string) => {
        if (items.length === 0) {
            toast.error('カートは空です');
            return;
        }
        
        try {
            const result = await couponService.validate(code, subtotal);
            if (result.valid && result.coupon) {
                setAppliedCoupon(result.coupon);
                toast.success('クーポンを適用しました');
            } else {
                setAppliedCoupon(null);
                toast.error(result.error || 'クーポンが無効です');
            }
        } catch {
            setAppliedCoupon(null);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        toast.success('クーポンを削除しました');
    };

    // Calculate discount
    let discountAmount = 0;
    if (appliedCoupon) {
        // Re-validate min_order_value just in case subtotal changed below limit
        if (subtotal >= parseFloat(appliedCoupon.min_order_value)) {
            if (appliedCoupon.discount_type === 'percent') {
                discountAmount = subtotal * (appliedCoupon.discount_percent / 100);
                if (appliedCoupon.max_discount) {
                    const max = parseFloat(appliedCoupon.max_discount);
                    if (discountAmount > max) discountAmount = max;
                }
            } else {
                // Fixed amount
                discountAmount = parseFloat(appliedCoupon.discount_amount);
            }
            // Discount cannot exceed subtotal
            if (discountAmount > subtotal) discountAmount = subtotal;
        }
    }

    const totalPrice = Math.max(0, subtotal - discountAmount);

    return (
        <CartContext.Provider value={{
            items,
            addToCart,
            addToCartWithFlyEffect,
            cartIconRef,
            removeFromCart,
            updateQuantity,
            clearCart,
            totalItems,
            subtotal,
            discountAmount,
            totalPrice,
            appliedCoupon,
            applyCoupon,
            removeCoupon,
            isOpen,
            toggleCart,
            closeCart
        }}>
            {children}
            {flyingImage && (
                <img 
                    src={flyingImage.src} 
                    style={flyingImage.style} 
                    className="shadow-xl border-2 border-amber-500"
                    alt="" 
                />
            )}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
