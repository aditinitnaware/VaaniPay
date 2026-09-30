import React, { useState } from 'react';
import { Gift, Sparkles, Copy, Share2, Check, Tag } from 'lucide-react';
import { AppLanguage, ScratchCard } from '../types';
import { getTranslation } from '../i18n/translations';

interface RewardsScreenProps {
  language: AppLanguage;
  scratchCards: ScratchCard[];
  onRevealCard: (cardId: string) => void;
  onSpeak: (text: string) => void;
}

export const RewardsScreen: React.FC<RewardsScreenProps> = ({
  language,
  scratchCards,
  onRevealCard,
  onSpeak,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeScratchModal, setActiveScratchModal] = useState<ScratchCard | null>(null);

  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(language, key, params);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText('VAANI98');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCardClick = (card: ScratchCard) => {
    if (!card.isRevealed) {
      setActiveScratchModal(card);
    } else {
      onSpeak(`You won ₹${card.amount || card.couponText} from ${card.title}`);
    }
  };

  const handleScratchReveal = () => {
    if (activeScratchModal) {
      onRevealCard(activeScratchModal.id);
      const text = activeScratchModal.amount
        ? `Congratulations! You won ₹${activeScratchModal.amount} cashback!`
        : `Congratulations! ${activeScratchModal.couponText}`;
      onSpeak(text);
      setActiveScratchModal({ ...activeScratchModal, isRevealed: true });
    }
  };

  return (
    <div className="pb-24 pt-3 px-3 space-y-4">
      {/* 1. Hero Cashback Counter */}
      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-2 text-amber-200">
          <Gift className="w-6 h-6" />
        </div>

        <span className="text-xs font-semibold text-amber-100 uppercase tracking-wider block">
          {t('cashbackEarned')}
        </span>
        <div className="text-4xl font-extrabold tracking-tight my-1 text-white">
          ₹248.00
        </div>
        <p className="text-[11px] text-amber-100">Directly credited to your primary SBI account</p>
      </div>

      {/* 2. Scratch Cards Grid */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {t('scratchCardsTitle')}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Tap to reveal</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {scratchCards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card)}
              className={`h-36 rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all active:scale-95 shadow-xs relative overflow-hidden ${
                card.isRevealed
                  ? 'bg-slate-50 border border-slate-200'
                  : `bg-gradient-to-br ${card.color} text-white`
              }`}
            >
              {!card.isRevealed ? (
                <>
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div className="text-center my-auto">
                    <span className="text-xs font-bold block">{card.title}</span>
                    <span className="text-[10px] text-white/80 mt-1 block">Tap to Scratch</span>
                  </div>
                  <div className="text-[9px] text-white/70 text-right">VaaniPay</div>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="text-center my-auto">
                    <span className="text-[10px] text-slate-400 font-medium uppercase">
                      {t('youWon')}
                    </span>
                    <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">
                      {card.amount ? `₹${card.amount}` : 'Discount'}
                    </div>
                    {card.couponText && (
                      <span className="text-[10px] text-slate-600 font-medium line-clamp-1">
                        {card.couponText}
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-emerald-700 font-semibold text-right">Claimed</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Referral Program Card */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
          {t('referralTitle')}
        </h3>
        <p className="text-xs text-slate-600 mb-3">
          Help your friends and family adopt voice payments. Both of you receive ₹25 on their first payment.
        </p>

        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-2.5">
          <div className="ml-1">
            <span className="text-[10px] text-slate-400 block">{t('referralCode')}</span>
            <span className="text-base font-mono font-bold text-[#0B5CAD]">VAANI98</span>
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Copy"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Join VaaniPay',
                    text: 'Use my code VAANI98 to join VaaniPay voice payments and get ₹25!',
                  }).catch(() => {});
                } else {
                  handleCopyCode();
                }
              }}
              className="p-2 rounded-xl bg-[#0B5CAD] text-white hover:bg-blue-800 transition-colors shadow-2xs"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Active Merchant Coupons */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Exclusive Partner Vouchers
        </h3>

        <div className="space-y-2.5">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Apollo Pharmacy</h4>
                <p className="text-[10px] text-slate-500">Flat 15% OFF on medicines</p>
              </div>
            </div>
            <button
              onClick={() => onSpeak('Voucher code VAANICARE copied for Apollo Pharmacy.')}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-[#0B5CAD] hover:bg-slate-100"
            >
              Use
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Zomato Food</h4>
                <p className="text-[10px] text-slate-500">20% OFF up to ₹100 on UPI orders</p>
              </div>
            </div>
            <button
              onClick={() => onSpeak('Voucher code VAANIEATS copied for Zomato.')}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-[#0B5CAD] hover:bg-slate-100"
            >
              Use
            </button>
          </div>
        </div>
      </div>

      {/* Scratch Modal */}
      {activeScratchModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">{activeScratchModal.title}</h3>
            <p className="text-xs text-slate-500 mb-4">Tap the card below to reveal your prize!</p>

            <div
              onClick={handleScratchReveal}
              className={`w-48 h-48 rounded-2xl mx-auto flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-lg ${
                activeScratchModal.isRevealed
                  ? 'bg-emerald-50 border-2 border-emerald-400'
                  : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white animate-pulse'
              }`}
            >
              {activeScratchModal.isRevealed ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-bold text-emerald-800">You Won!</span>
                  <span className="text-3xl font-extrabold text-emerald-600 mt-1">
                    {activeScratchModal.amount ? `₹${activeScratchModal.amount}` : 'Gift Voucher'}
                  </span>
                </>
              ) : (
                <>
                  <Gift className="w-12 h-12 mb-2" />
                  <span className="text-sm font-bold">Tap to Scratch</span>
                </>
              )}
            </div>

            <button
              onClick={() => setActiveScratchModal(null)}
              className="w-full mt-5 py-3 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
            >
              {activeScratchModal.isRevealed ? 'Claim & Done' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
