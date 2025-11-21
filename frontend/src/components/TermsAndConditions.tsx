import React, { useState, useRef } from 'react';

interface TermsAndConditionsProps {
  onAccept: () => void;
  onCancel: () => void;
}

export const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ onAccept, onCancel }) => {
  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      // Allow small margin of error (5px)
      if (scrollTop + clientHeight >= scrollHeight - 5) {
        setHasReadToBottom(true);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950 bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-amber-50 w-full max-w-2xl rounded-sm shadow-2xl border-4 border-amber-800 flex flex-col max-h-[90vh] relative">
        {/* Header */}
        <div className="p-4 border-b-2 border-amber-200 bg-amber-100">
          <h2 className="text-xl font-bold text-amber-900 font-serif text-center">
            📄 利用規約 (Điều khoản sử dụng)
          </h2>
        </div>

        {/* Scrollable Content */}
        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-6 font-serif text-amber-900 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-amber-600 scrollbar-track-amber-100"
        >
          <div className="text-center mb-4">
            <p className="font-bold">最終更新日：{new Date().toLocaleDateString('ja-JP')}</p>
            <p className="mt-2">
              本規約は、ReHome Market（以下「当社」）が提供するウェブサイトおよびサービスの利用条件を定めるものです。
              本サイトにアクセスし、サービスをご利用いただくことで、本規約に同意したものとみなします。
            </p>
          </div>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-amber-300 inline-block">I. 定義</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>「本ウェブサイト」：当社が運営する公式サイト</li>
              <li>「ユーザー」：本サイトを利用して中古品を購入またはハウスクリーニングを予約する個人</li>
              <li>「サービス」：中古品販売・中古品買取・ハウスクリーニング予約サービス</li>
              <li>「当社」：ReHome Market（東京都福生市武蔵野台1-3-9東福生マンション）</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-amber-300 inline-block">II. サービス内容</h3>
            <p className="font-bold mt-2">中古品販売サービス</p>
            <p>家電、家具、生活用品などの中古品を販売します。商品状態は正確に記載するよう努めます。</p>
            
            <p className="font-bold mt-2">ハウスクリーニング予約サービス</p>
            <p>ユーザーは本サイトから希望日時を予約できます。料金はコースにより明確に表示されます。</p>
            
            <p className="font-bold mt-2">中古品買取サービス（任意）</p>
            <p>当社は査定後、提示金額に基づき買取を行います。</p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-amber-300 inline-block">III. アカウントについて</h3>
            <p>ユーザーは有効なメールアドレスでアカウント登録を行う必要があります。入力情報は正確かつ最新でなければなりません。</p>
            <p>アカウントにおける全ての行為はユーザー自身の責任となります。不正行為・法令違反が確認された場合、当社はアカウント停止または削除を行うことがあります。</p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-amber-300 inline-block">IV. セキュリティとOTP認証</h3>
            <p>新規登録時、メールアドレスの OTP 認証が必要です。パスワード・OTP は第三者と共有しないでください。</p>
            <p>当社は暗号化技術によりユーザー情報の保護に努めます。</p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-amber-300 inline-block">V. 支払い方法について</h3>
            <p>当社では以下の支払い方法に対応しています：</p>
            <ol className="list-decimal pl-5 space-y-2 mt-2">
              <li>
                <strong>郵送による配送（郵便）</strong><br/>
                Visa/MasterCard による事前決済が必須です。配送料は決済画面で表示されます。
              </li>
              <li>
                <strong>直接配送（対面）</strong><br/>
                事前決済または代金引換（COD）の選択が可能です。
              </li>
              <li>
                <strong>ハウスクリーニング</strong><br/>
                コースにより、全額前払いまたは 30% の予約金が必要となる場合があります。追加料金が発生する場合は、作業前にお知らせします。
              </li>
            </ol>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-amber-300 inline-block">VI. 配送ポリシー</h3>
            <p>配送時間はユーザーの住所により異なります。ユーザーが誤った住所を入力した場合、当社は責任を負いません。</p>
            <p>商品の色味や状態は、撮影環境によって多少異なる場合があります。</p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-amber-300 inline-block">VII. 返品・返金ポリシー</h3>
            <p>商品到着後 <strong>3日以内</strong> であれば返品可能です。商品は受取時と同じ状態で返却する必要があります。</p>
            <p className="mt-2">以下の商品は返品不可とします：</p>
            <ul className="list-disc pl-5">
              <li>ユーザーによる破損</li>
              <li>「返品不可」と明記されている商品</li>
            </ul>
            <p className="mt-2">返金は返品確認後、5～7営業日以内に処理されます。</p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-amber-300 inline-block">VIII. ハウスクリーニングに関する規定</h3>
            <p>作業環境が安全でないと判断した場合、スタッフは作業を拒否する権利を有します。</p>
            <p>ユーザーは作業に必要な電気・水などを利用可能な状態にしておく必要があります。</p>
            <p className="font-bold mt-2">キャンセルについて：</p>
            <ul className="list-disc pl-5">
              <li>24時間前まで：無料</li>
              <li>24時間以内：料金の 30% を請求します</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-amber-300 inline-block">IX. 免責事項</h3>
            <p>当社は以下による損害について責任を負いません：</p>
            <ul className="list-disc pl-5">
              <li>ネットワーク障害・機器故障</li>
              <li>アカウントの不正使用</li>
              <li>天災・事故などの不可抗力</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-amber-300 inline-block">X. 知的財産権</h3>
            <p>本サイトに掲載されているロゴ、画像、文章などの著作権は当社に帰属します。事前の許可なく複製・転用することは禁止されています。</p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-amber-300 inline-block">XI. 個人情報の取得と利用</h3>
            <p>当社は以下の情報を取得する場合があります：</p>
            <ul className="list-disc pl-5">
              <li>メールアドレス</li>
              <li>購入・予約履歴</li>
              <li>配送情報</li>
              <li>ログイン用 Cookie（Access Token / Refresh Token）</li>
            </ul>
            <p className="mt-2">取得したデータは <strong>第三者に販売いたしません。</strong></p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-amber-300 inline-block">XII. 規約の変更</h3>
            <p>当社は必要に応じて本規約を改訂することがあります。変更後の規約は、本サイト上に掲載した時点で効力を持ちます。</p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 border-b border-amber-300 inline-block">XIII. お問い合わせ</h3>
            <p><strong>ReHome Market</strong></p>
            <p>住所：東京都福生市武蔵野台1-3-9東福生マンション</p>
            <p>メールアドレス：9.7nguyenvantuankhanh@gmail.com</p>
            <p>電話番号：080-xxxx-xxxx</p>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t-2 border-amber-200 bg-amber-50">
          <div className="flex items-center justify-center mb-4">
            <label className={`flex items-center gap-2 cursor-pointer ${!hasReadToBottom ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <input 
                type="checkbox" 
                disabled={!hasReadToBottom}
                checked={isAccepted}
                onChange={(e) => setIsAccepted(e.target.checked)}
                className="w-5 h-5 text-amber-600 border-2 border-amber-800 rounded focus:ring-amber-500"
              />
              <span className="font-bold text-amber-900">
                利用規約に同意します (Tôi đồng ý với điều khoản sử dụng)
              </span>
            </label>
          </div>
          
          {!hasReadToBottom && (
            <p className="text-center text-red-600 text-sm mb-4 animate-pulse">
              👇 最後までスクロールして確認してください (Vui lòng cuộn xuống cuối để đọc hết)
            </p>
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={onCancel}
              className="px-6 py-2 border-2 border-amber-800 text-amber-900 font-bold rounded-sm hover:bg-amber-100 transition-colors"
            >
              キャンセル (Hủy)
            </button>
            <button
              onClick={onAccept}
              disabled={!isAccepted}
              className="px-6 py-2 bg-amber-800 text-amber-50 font-bold rounded-sm shadow-[4px_4px_0px_0px_rgba(120,53,15,0.5)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(120,53,15,0.5)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all"
            >
              同意して進む (Đồng ý và tiếp tục)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

