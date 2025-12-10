import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';

interface FAQItem {
  question: string;
  answer: string;
  link: string;
}

export const RobotAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ text: string; delay: number }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const messageAreaRef = useRef<HTMLDivElement>(null);
  const typingIndicatorRef = useRef<HTMLDivElement>(null);
  const chatMessageRef = useRef<HTMLDivElement>(null);

  // Danh sách các dịch vụ ngoài (không hiển thị trên navbar)
  const services = React.useMemo(() => [
    {
      icon: '💰',
      title: '買取価格',
      description: 'スクラップ買取価格一覧をご確認いただけます。金属、雑品、プラスチック、木材など、様々な種類の買取価格を掲載しています。',
      link: '/buyback-price'
    },
    {
      icon: '🎁',
      title: '無料あげます',
      description: '使わないものを誰かに譲りましょう。無償譲渡・交換のコミュニティです。地球にやさしいリサイクルコミュニティ。',
      link: '/free-items'
    },
    {
      icon: '🤖',
      title: 'AI価格設定',
      description: 'AIが商品情報を分析し、公正な価格を提案します。日本市場の相場を参考に、買い手に有利な価格を設定します。',
      link: '/ai-pricing'
    },
  ], []);

  const faqs: FAQItem[] = [
    {
      question: "当店の商品をお探しですか？",
      answer: "当店へようこそ！質の高い商品がたくさんございます。ぜひご覧ください！",
      link: "/shop"
    },
    {
      question: "当店についてもっと知りたいですか？",
      answer: "私たちはReHome Marketです。あなたの生活に、時を超えた価値を提供します。ぜひ私たちのストーリーをご覧ください！",
      link: "/about"
    },
    {
      question: "お問い合わせをご希望ですか？",
      answer: "いつでもお客様をサポートする準備ができています！お問い合わせページからご連絡いただければ、最善のアドバイスをいたします。",
      link: "/contact"
    },
    {
      question: "予約をご希望ですか？",
      answer: "店舗での直接相談をご希望の場合は、予約をお取りいただけます。最善のサービスを提供いたします！",
      link: "/booking"
    },
    {
      question: "買取価格？",
      answer: "スクラップ買取価格一覧をご確認いただけます。金属、雑品、プラスチック、木材など、様々な種類の買取価格を掲載しています。",
      link: "/buyback-price"
    },
    {
      question: "無料であげるサービスについて知りたいですか？",
      answer: "使わないものを誰かに譲りましょう。無償譲渡・交換のコミュニティです。地球にやさしいリサイクルコミュニティ。家具、家電、服飾、本・雑誌、おもちゃ、スポーツ用品など、様々なアイテムを無料で譲り合えます。",
      link: "/free-items"
    },
    {
      question: "AI価格設定サービスについて知りたいですか？",
      answer: "AIが商品情報を分析し、公正な価格を提案します。日本市場の相場（メルカリ、ヤフオクなど）を参考に、買い手に有利な価格を設定します。商品の状態、市場需要、処理コストなどを総合的に考慮して価格を決定します。",
      link: "/ai-pricing"
    },
    {
      question: "返品・交換について知りたいですか？",
      answer: "OldShopでは、商品の状態とお届けからの経過日数に応じて返品・交換を受け付けています。新品は7日以内100%返金、8-30日以内80%返金。未使用に近い・目立った傷や汚れなし・やや傷や汚れありは3日以内100%返金可能です。詳細な返品ポリシーをご確認ください。",
      link: "/return-policy"
    }
  ];

  useEffect(() => {
    // Tạo script messages cho các dịch vụ
    const script: Array<{ text: string; delay: number }> = [
      {
        text: "こんにちは！👋 私は<span class='bubble-highlight'>ロボット</span>です。",
        delay: 1000
      },
      {
        text: "当店では、様々なサービスをご提供しております。下記のサービスをご確認ください！",
        delay: 2000
      }
    ];

    // Thêm messages cho từng dịch vụ
    services.forEach((service) => {
      const serviceLink = `/ReHomeMarket${service.link}`;
      
      script.push({
        text: `${service.icon} <strong><a href="${serviceLink}" class="bubble-highlight hover:underline">${service.title}</a></strong><br/>${service.description}`,
        delay: 3000
      });
    });

    script.push({
      text: "ご相談が必要な場合は、下記のホットラインまでお問い合わせください！❤️",
      delay: 3000
    });

    setMessages(script);
  }, [services]);

  useEffect(() => {
    if (messages.length === 0) return;

    const playScript = () => {
      if (currentIndex >= messages.length) {
        return;
      }

      setIsTyping(true);
      
      setTimeout(() => {
        setIsTyping(false);
        setCurrentIndex(prev => prev + 1);
      }, 500);
    };

    if (currentIndex < messages.length) {
      const timer = setTimeout(playScript, currentIndex === 0 ? 500 : messages[currentIndex - 1].delay);
      return () => clearTimeout(timer);
    }
  }, [messages, currentIndex]);

  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  }, [currentIndex, isTyping]);

  useEffect(() => {
    if (isChatOpen && chatMessageRef.current) {
      chatMessageRef.current.scrollTop = chatMessageRef.current.scrollHeight;
    }
  }, [isChatOpen, selectedQuestion]);

  const handleQuestionClick = (question: string) => {
    setSelectedQuestion(question);
  };

  const selectedFAQ = faqs.find(faq => faq.question === selectedQuestion);

  return (
    <div className="flex flex-col md:flex-row items-center justify-center p-4 min-h-[600px] bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl my-8 border-2 border-amber-200 shadow-lg">
      {/* Robot Section */}
      <div className="w-full md:w-1/3 flex flex-col items-center justify-center mb-8 md:mb-0">
        <div className="mb-2 text-amber-800 font-bold text-xs md:text-sm animate-pulse cursor-pointer" onClick={() => setIsChatOpen(true)}>
          Click here 👇
        </div>
        <div 
          className="robot-container cursor-pointer hover:scale-105 transition-transform duration-300"
          onClick={() => setIsChatOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsChatOpen(true);
            }
          }}
          aria-label="チャットボットを開く"
        >
          {/* Antenna */}
          <div className="antenna"></div>
          
          {/* Head */}
          <div className="head">
            <div className="eye-container">
              <div className="eye"></div>
              <div className="eye"></div>
            </div>
          </div>
          
          {/* Body */}
          <div className="body">
            <div className="chest-screen">
              <div className="heartbeat"></div>
            </div>
            {/* Arms */}
            <div className="arm left"></div>
            <div className="arm right"></div>
          </div>
          
          {/* Shadow */}
          <div className="shadow"></div>
        </div>
        <div className="mt-4 text-amber-800 font-bold tracking-widest text-sm bg-amber-100 border-2 border-amber-300 px-4 py-1 rounded-full shadow-sm">
          AI ASSISTANT
        </div>
      </div>

      {/* Messages Section */}
      <div className="w-full md:w-1/2 h-full flex flex-col justify-center relative">
        <div className="absolute -top-10 left-4 text-amber-700 text-sm italic">
          *自動で紹介中...
        </div>
        <div className="bubble-container" ref={messageAreaRef}>
          {messages.slice(0, currentIndex).map((msg, idx) => (
            <div key={idx} className="bubble" dangerouslySetInnerHTML={{ __html: msg.text }} />
          ))}
          {isTyping && (
            <div className="typing-indicator" ref={typingIndicatorRef}>
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          )}
        </div>
      </div>

      <style>{`
       /* --- ROBOT CSS ART --- */
        .robot-container {
            position: relative;
            width: 250px;
            height: 350px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            animation: float 3s ease-in-out infinite;
            z-index: 10;
            filter: drop-shadow(0 20px 40px rgba(0,0,0,0.15));
        }

        .head {
             width: 140px;
             height: 120px;
             background: linear-gradient(145deg, #fef3c7, #fde68a);
             border: 3px solid #d97706;
             border-radius: 50px 50px 35px 35px;
             position: relative;
             display: flex;
             justify-content: center;
             align-items: center;
             box-shadow: 
                 inset -8px -8px 16px rgba(0,0,0,0.15),
                 inset 8px 8px 16px rgba(255,255,255,0.7),
                 0 10px 30px rgba(217, 119, 6, 0.2);
         }

        .antenna {
             position: absolute;
             top: -35px;
             width: 8px;
             height: 35px;
             background: linear-gradient(180deg, #d97706, #b45309);
             left: 50%;
             transform: translateX(-50%);
             border-radius: 10px 10px 0 0;
             box-shadow: 0 0 10px rgba(217, 119, 6, 0.3);
         }
 
         .antenna::after {
             content: '';
             position: absolute;
             top: -14px;
             left: -9px;
             width: 26px;
             height: 26px;
             background: radial-gradient(circle, #f59e0b, #d97706);
             border-radius: 50%;
             border: 3px solid #b45309;
             animation: blink-light 2s infinite;
             box-shadow: 0 0 20px rgba(245, 158, 11, 0.6);
         }

        .eye-container {
            display: flex;
            gap: 28px;
            margin-top: 10px;
        }

         .eye {
             width: 32px;
             height: 32px;
             background: radial-gradient(circle at 30% 30%, #fbbf24, #f59e0b);
             border-radius: 50%;
             border: 4px solid #78350f;
             box-shadow: 
                 0 0 20px rgba(251, 191, 36, 0.8),
                 inset -2px -2px 8px rgba(0,0,0,0.3),
                 inset 2px 2px 6px rgba(255,255,255,0.5);
             animation: blink-eye 5s infinite;
             position: relative;
         }
 
         .eye::before {
             content: '';
             position: absolute;
             width: 10px;
             height: 10px;
             background: rgba(255,255,255,0.9);
             border-radius: 50%;
             top: 6px;
             left: 8px;
             box-shadow: 0 0 8px rgba(255,255,255,0.8);
         }

        .mouth {
            position: absolute;
            bottom: 25px;
            width: 50px;
            height: 8px;
            background: #475569;
            border-radius: 0 0 25px 25px;
            box-shadow: inset 0 -2px 4px rgba(0,0,0,0.3);
        }

         .body {
             width: 130px;
             height: 140px;
             background: linear-gradient(145deg, #fde68a, #fcd34d);
             border: 3px solid #d97706;
             border-radius: 25px;
             margin-top: -15px;
             position: relative;
             z-index: -1;
             display: flex;
             flex-direction: column;
             align-items: center;
             padding-top: 30px;
             box-shadow: 
                 inset -10px -10px 20px rgba(0,0,0,0.15),
                 inset 10px 10px 20px rgba(255,255,255,0.5),
                 0 15px 35px rgba(217, 119, 6, 0.2);
         }

         .chest-screen {
             width: 90px;
             height: 60px;
             background: linear-gradient(145deg, #78350f, #92400e);
             border-radius: 15px;
             display: flex;
             justify-content: center;
             align-items: center;
             border: 2px solid #b45309;
             box-shadow: 
                 inset 0 2px 10px rgba(0,0,0,0.5),
                 0 0 20px rgba(245, 158, 11, 0.4);
         }
 
         .heartbeat {
             width: 60px;
             height: 5px;
             background: linear-gradient(90deg, transparent, #f59e0b, transparent);
             box-shadow: 0 0 10px #f59e0b;
             animation: pulse-line 1.5s infinite linear;
         }

        .control-buttons {
            display: flex;
            gap: 10px;
            margin-top: 12px;
        }

        .control-button {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 2px solid #475569;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }

        .btn-red { background: radial-gradient(circle, #ef4444, #dc2626); }
        .btn-yellow { background: radial-gradient(circle, #fbbf24, #f59e0b); }
        .btn-green { background: radial-gradient(circle, #22c55e, #16a34a); }

         .arm {
             position: absolute;
             width: 30px;
             height: 95px;
             background: linear-gradient(145deg, #fef3c7, #fde68a);
             border: 3px solid #d97706;
             border-radius: 20px;
             top: 25px;
             box-shadow: 
                 inset -4px -4px 8px rgba(0,0,0,0.15),
                 inset 4px 4px 8px rgba(255,255,255,0.5),
                 0 5px 15px rgba(217, 119, 6, 0.15);
         }
 
         .arm::after {
             content: '';
             position: absolute;
             bottom: -18px;
             left: 50%;
             transform: translateX(-50%);
             width: 35px;
             height: 35px;
             background: linear-gradient(145deg, #fde68a, #fcd34d);
             border: 3px solid #d97706;
             border-radius: 50%;
             box-shadow: 
                 inset -3px -3px 6px rgba(0,0,0,0.15),
                 inset 3px 3px 6px rgba(255,255,255,0.5);
         }

        .arm.left {
            left: -38px;
            transform: rotate(15deg);
            transform-origin: top center;
            animation: wave 3s ease-in-out infinite;
        }

        .arm.right {
            right: -38px;
            transform: rotate(-15deg);
            transform-origin: top center;
            animation: wave-right 3s ease-in-out infinite;
        }

        .legs {
            display: flex;
            gap: 20px;
            margin-top: -8px;
            position: relative;
            z-index: -2;
        }

         .leg {
             width: 35px;
             height: 45px;
             background: linear-gradient(145deg, #fef3c7, #fde68a);
             border: 3px solid #d97706;
             border-radius: 10px 10px 15px 15px;
             box-shadow: 
                 inset -3px -3px 6px rgba(0,0,0,0.15),
                 inset 3px 3px 6px rgba(255,255,255,0.5);
         }
 
         .leg::after {
             content: '';
             position: absolute;
             bottom: -12px;
             left: 50%;
             transform: translateX(-50%);
             width: 40px;
             height: 18px;
             background: linear-gradient(145deg, #b45309, #92400e);
             border-radius: 15px;
             border: 2px solid #d97706;
             box-shadow: 0 4px 10px rgba(217, 119, 6, 0.3);
         }

        .shadow {
            width: 140px;
            height: 25px;
            background: radial-gradient(ellipse, rgba(0,0,0,0.2), transparent);
            border-radius: 50%;
            margin-top: 20px;
            animation: shadow-scale 3s ease-in-out infinite;
        }
            @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
            }
            @keyframes shadow-scale {
            0%, 100% { transform: scale(1); opacity: 0.2; }
            50% { transform: scale(0.8); opacity: 0.1; }
            }
             @keyframes blink-light {
             0%, 50%, 100% { background: #f59e0b; box-shadow: 0 0 0 transparent; }
             25% { background: #fbbf24; box-shadow: 0 0 15px #f59e0b; }
             }
            @keyframes blink-eye {
            0%, 96%, 100% { transform: scaleY(1); }
            98% { transform: scaleY(0.1); }
            }
             @keyframes wave {
             0%, 100% { transform: rotate(15deg); }
             50% { transform: rotate(35deg); }
             }
             @keyframes wave-right {
             0%, 100% { transform: rotate(-15deg); }
             50% { transform: rotate(-35deg); }
             }
            @keyframes pulse-line {
            0% { width: 10%; opacity: 0.5; }
            50% { width: 80%; opacity: 1; }
            100% { width: 10%; opacity: 0.5; }
            }
            .bubble-container {
            max-width: 500px;
            height: 400px;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 15px;
            scrollbar-width: none;
            -ms-overflow-style: none;
            }
            .bubble-container::-webkit-scrollbar {
            display: none;
            }
             .bubble {
             background: linear-gradient(145deg, #fffbeb, #fef3c7);
             padding: 15px 20px;
             border-radius: 20px;
             border-bottom-left-radius: 2px;
             box-shadow: 0 4px 15px rgba(217, 119, 6, 0.1);
             font-size: 16px;
             color: #78350f;
             line-height: 1.5;
             opacity: 0;
             transform: translateY(20px);
             animation: popIn 0.5s forwards;
             position: relative;
             max-width: 90%;
             align-self: flex-start;
             border: 2px solid #fcd34d;
             }
             .bubble-highlight {
             color: #d97706;
             font-weight: 700;
             }
             .bubble a {
             color: #d97706;
             text-decoration: none;
             }
             .bubble a:hover {
             color: #b45309;
             text-decoration: underline;
             }
             .bubble-price {
             display: flex;
             align-items: center;
             gap: 8px;
             margin-top: 8px;
             flex-wrap: wrap;
             }
             .bubble-price-original {
             text-decoration: line-through;
             color: #9ca3af;
             font-size: 0.85em;
             }
             .bubble-price-sale {
             color: #dc2626;
             font-weight: bold;
             font-size: 1.15em;
             }
             .bubble-discount-badge {
             display: inline-block;
             background: linear-gradient(135deg, #ef4444, #dc2626);
             color: white;
             padding: 3px 10px;
             border-radius: 12px;
             font-size: 0.75em;
             font-weight: bold;
             box-shadow: 0 2px 6px rgba(220, 38, 38, 0.4);
             white-space: nowrap;
             }
            @keyframes popIn {
            to {
                opacity: 1;
                transform: translateY(0);
            }
            }
             .typing-indicator {
             background: linear-gradient(145deg, #fffbeb, #fef3c7);
             padding: 10px 15px;
             border-radius: 20px;
             border-bottom-left-radius: 2px;
             width: fit-content;
             margin-bottom: 10px;
             box-shadow: 0 2px 10px rgba(217, 119, 6, 0.1);
             border: 2px solid #fcd34d;
             }
             .dot {
             display: inline-block;
             width: 8px;
             height: 8px;
             border-radius: 50%;
             background-color: #f59e0b;
             margin-right: 3px;
             animation: bounce 1.4s infinite ease-in-out both;
             }
            .dot:nth-child(1) { animation-delay: -0.32s; }
            .dot:nth-child(2) { animation-delay: -0.16s; }
            @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
            }

        /* Chat Modal Styles */
        .chat-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease-in-out;
        }

        .chat-modal {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease-out;
        }

        .chat-header {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          padding: 20px;
          border-radius: 20px 20px 0 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: linear-gradient(to bottom, #fffbeb, #fef3c7);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .chat-bubble-robot {
          background: linear-gradient(145deg, #fffbeb, #fef3c7);
          padding: 12px 16px;
          border-radius: 18px;
          border-bottom-left-radius: 4px;
          max-width: 85%;
          align-self: flex-start;
          box-shadow: 0 2px 8px rgba(217, 119, 6, 0.15);
          border: 1px solid #fcd34d;
        }

        .chat-bubble-user {
          background: linear-gradient(145deg, #f59e0b, #d97706);
          padding: 12px 16px;
          border-radius: 18px;
          border-bottom-right-radius: 4px;
          max-width: 85%;
          align-self: flex-end;
          color: white;
          box-shadow: 0 2px 8px rgba(217, 119, 6, 0.2);
        }

        .question-button {
          background: white;
          border: 2px solid #fcd34d;
          padding: 12px 16px;
          border-radius: 12px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(217, 119, 6, 0.1);
        }

        .question-button:hover {
          background: #fef3c7;
          border-color: #f59e0b;
          transform: translateX(4px);
          box-shadow: 0 4px 8px rgba(217, 119, 6, 0.2);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .chat-messages::-webkit-scrollbar-track {
          background: #fef3c7;
          border-radius: 10px;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: #f59e0b;
          border-radius: 10px;
        }

        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: #d97706;
        }

        .robot-head-small {
          width: 28px;
          height: 24px;
          background: linear-gradient(145deg, #fef3c7, #fde68a);
          border: 2px solid #d97706;
          border-radius: 14px 14px 10px 10px;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 4px;
          padding-top: 3px;
        }

        .robot-eye-small {
          width: 5px;
          height: 5px;
          background: #78350f;
          border-radius: 50%;
          animation: blink-icon 3s infinite;
        }

        @keyframes blink-icon {
          0%, 90%, 100% { opacity: 1; }
          95% { opacity: 0.3; }
        }
      `}</style>

      {/* Chat Modal */}
      {isChatOpen && (
        <div 
          className="chat-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsChatOpen(false);
              setSelectedQuestion(null);
            }
          }}
        >
          <div className="chat-modal">
            {/* Chat Header */}
            <div className="chat-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <div className="robot-head-small">
                    <div className="robot-eye-small"></div>
                    <div className="robot-eye-small"></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">AI Assistant</h3>
                  <p className="text-amber-100 text-xs">いつでもサポートいたします</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsChatOpen(false);
                  setSelectedQuestion(null);
                }}
                className="text-white hover:text-amber-100 transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center"
                aria-label="チャットを閉じる"
              >
                ×
              </button>
            </div>

            {/* Chat Messages */}
            <div className="chat-messages" ref={chatMessageRef}>
              {/* Welcome Message */}
              <div className="chat-bubble-robot">
                <p className="text-amber-900">
                  <strong>こんにちは！👋</strong> 私はReHome MarketのAIアシスタントです。 
                  当店についてお手伝いできます。 
                  下記から質問をお選びください！
                </p>
              </div>

              {/* Questions List */}
              {!selectedQuestion && (
                <div className="space-y-3 mt-2">
                  {faqs.map((faq, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuestionClick(faq.question)}
                      className="question-button w-full"
                    >
                      <p className="text-amber-900 font-medium">{faq.question}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Question and Answer */}
              {selectedQuestion && selectedFAQ && (
                <>
                  <div className="chat-bubble-user">
                    <p className="text-white font-medium">{selectedQuestion}</p>
                  </div>
                  <div className="chat-bubble-robot">
                    <p className="text-amber-900">{selectedFAQ.answer}</p>
                    <Link
                      to={selectedFAQ.link}
                      className="mt-3 inline-block px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                      onClick={() => {
                        setIsChatOpen(false);
                        setSelectedQuestion(null);
                      }}
                    >
                      詳しく見る →
                    </Link>
                  </div>
                  <div className="mt-2">
                    <button
                      onClick={() => setSelectedQuestion(null)}
                      className="text-amber-600 hover:text-amber-700 text-sm font-medium underline"
                    >
                      ← 質問に戻る
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

