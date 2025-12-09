import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/bookingService';
import type { Booking } from '../../types/booking';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

export const BookingsPanel: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchBookings = async () => {
    try {
      const data = await bookingService.list();
      // Handle both array and paginated response
      const bookingsArray = Array.isArray(data) ? data : (data.results || []);
      setBookings(bookingsArray);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('予約履歴の取得に失敗しました');
      setBookings([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('本当にこの予約をキャンセルしますか？')) return;

    try {
      const updatedBooking = await bookingService.cancel(bookingId);
      setBookings(prevBookings => 
        prevBookings.map(b => b.id === bookingId ? updatedBooking : b)
      );
      toast.success('予約をキャンセルしました。');
    } catch (error: any) {
      console.error('Failed to cancel booking:', error);
      toast.error(error.response?.data?.error || '予約のキャンセルに失敗しました。');
    }
  };

  const handleRebook = async (booking: Booking) => {
    if (!window.confirm('この予約を再予約しますか？予約ページに移動して日付を選択できます。')) return;

    try {
      // Navigate to booking page with pre-filled data
      // We'll pass the booking ID in state so the booking wizard can pre-fill
      navigate('/booking', { 
        state: { 
          rebookFrom: booking.id,
          bookingData: {
            roomSize: booking.room_size,
            trashLevel: booking.trash_level,
            truckType: booking.truck_type,
            address: booking.address,
            hasElevator: booking.has_elevator,
            customerInfo: {
              name: booking.customer_name,
              phone: booking.customer_phone,
              email: booking.customer_email,
              notes: booking.notes || '',
            }
          }
        } 
      });
    } catch (error: any) {
      console.error('Failed to rebook:', error);
      toast.error('再予約の処理に失敗しました。');
    }
  };

  const statusLabels: Record<string, string> = {
    pending: '保留中',
    confirmed: '確定済み',
    completed: '完了',
    cancelled: 'キャンセル',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const roomSizeLabels: Record<string, string> = {
    '1R': '1R',
    '1K': '1K',
    '1DK': '1DK',
    '1LDK': '1LDK',
    '2DK': '2DK',
    '2LDK': '2LDK',
    '3LDK': '3LDK',
    'house': '一戸建て',
  };

  const trashLevelLabels: Record<string, string> = {
    low: '少ない',
    medium: '普通',
    high: '多い',
  };

  const truckTypeLabels: Record<string, string> = {
    light: '軽トラック',
    '1t': '1t トラック',
    '2t': '2t トラック',
    '2t_full': '2t 満載',
    '2_trucks': '2台',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-2xl font-serif font-bold text-amber-900 border-b-2 border-amber-200 pb-2">
        予約履歴
      </h3>

      {!Array.isArray(bookings) || bookings.length === 0 ? (
        <div className="text-center py-12 bg-stone-50 rounded-xl border border-stone-100">
          <span className="text-4xl block mb-4">📅</span>
          <p className="text-stone-500 font-serif">予約履歴がありません。</p>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="text-sm text-stone-600">
                  <span className="block font-bold text-stone-900 mb-1">
                    予約日: {new Date(booking.booking_date).toLocaleDateString('ja-JP')}
                  </span>
                  <span>予約番号: #{booking.id}</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg text-amber-900">
                    {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(
                      Number(booking.total_price)
                    )}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      statusColors[booking.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {statusLabels[booking.status] || booking.status}
                  </span>
                </div>
              </div>

              {/* Booking Details */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-stone-700 mb-2">予約詳細</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-stone-500">部屋サイズ:</span>
                          <span className="font-medium text-stone-900">
                            {roomSizeLabels[booking.room_size] || booking.room_size}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">ゴミの量:</span>
                          <span className="font-medium text-stone-900">
                            {trashLevelLabels[booking.trash_level] || booking.trash_level}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">トラックタイプ:</span>
                          <span className="font-medium text-stone-900">
                            {truckTypeLabels[booking.truck_type] || booking.truck_type}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">時間:</span>
                          <span className="font-medium text-stone-900">{booking.time_slot}</span>
                        </div>
                        {booking.has_elevator && (
                          <div className="flex justify-between">
                            <span className="text-stone-500">エレベーター:</span>
                            <span className="font-medium text-stone-900">あり</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-stone-700 mb-2">お客様情報</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-stone-500">名前:</span>
                          <span className="font-medium text-stone-900 ml-2">
                            {booking.customer_name}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-500">電話番号:</span>
                          <span className="font-medium text-stone-900 ml-2">
                            {booking.customer_phone}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-500">メール:</span>
                          <span className="font-medium text-stone-900 ml-2">
                            {booking.customer_email}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-stone-700 mb-2">住所</h4>
                      <p className="text-sm text-stone-900">{booking.address}</p>
                    </div>

                    {booking.notes && (
                      <div>
                        <h4 className="text-sm font-bold text-stone-700 mb-2">備考</h4>
                        <p className="text-sm text-stone-600 whitespace-pre-wrap">{booking.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Images */}
                {booking.images && booking.images.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-stone-200">
                    <h4 className="text-sm font-bold text-stone-700 mb-3">画像</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {booking.images.map((image) => (
                        <div
                          key={image.id}
                          className="aspect-square bg-stone-100 rounded border border-stone-200 overflow-hidden"
                        >
                          <img
                            src={image.image_url}
                            alt={`Booking ${booking.id} image ${image.id}`}
                            className="w-full h-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
                            onError={(e) => {
                              // Fallback nếu ảnh không load được
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/300x300?text=Image+Not+Found';
                            }}
                            onClick={() => window.open(image.image_url, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="text-xs text-stone-500">
                  作成日: {new Date(booking.created_at).toLocaleDateString('ja-JP')} {new Date(booking.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex gap-2">
                  {booking.status === 'pending' && (
                    <button 
                      onClick={() => handleCancelBooking(booking.id)}
                      className="text-sm text-red-600 hover:text-red-800 font-medium border border-red-200 bg-white px-3 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      ✕ 予約をキャンセル
                    </button>
                  )}
                  {booking.status === 'cancelled' && (
                    <button 
                      onClick={() => handleRebook(booking)}
                      className="text-sm text-amber-600 hover:text-amber-800 font-medium border border-amber-200 bg-white px-3 py-1 rounded hover:bg-amber-50 transition-colors flex items-center gap-1"
                    >
                      🔄 再予約する
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

