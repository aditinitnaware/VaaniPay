import React from 'react';
import {
  QrCode,
  Users,
  Phone,
  AtSign,
  Landmark,
  Eye,
  ArrowDownLeft,
  ArrowUpRight,
  Zap,
  Tv,
  Smartphone,
  Droplet,
  Flame,
  Wifi,
  Car,
  CreditCard,
  Home as HomeIcon,
  Shield,
  GraduationCap,
  Banknote,
  TrendingUp,
  Coins,
  Percent,
  ChevronRight,
  Mic,
  Search,
  BellRing,
  AlertTriangle,
} from 'lucide-react';
import {
  AppLanguage,
  Contact,
  BankAccount,
  BillItem,
  Transaction,
  ParsedVoiceIntent,
} from '../types';
import { getTranslation } from '../i18n/translations';
import { VoiceCard } from '../components/VoiceCard';
import { PaymentFlowType } from '../components/PayModal';

interface HomeScreenProps {
  language: AppLanguage;
  contacts: Contact[];
  accounts: BankAccount[];
  bills: BillItem[];
  recentTransactions: Transaction[];
  onStartPayment: (
    flowType: PaymentFlowType,
    recipient?: {
      name: string;
      upiId: string;
      phone?: string;
      avatarColor?: string;
      initials?: string;
      isVerified?: boolean;
      isNew?: boolean;
    },
    amount?: number
  ) => void;
  onOpenCheckBalance: () => void;
  onOpenReceiveQr: () => void;
  onOpenScan: () => void;
  onOpenBillDetails: (bill: BillItem) => void;
  onOpenSection: (section: string) => void;
  onViewAllHistory: () => void;
  onExecuteVoiceIntent: (parsed: ParsedVoiceIntent) => void;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  onInspectIntent?: (parsed: ParsedVoiceIntent) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  language,
  contacts,
  accounts,
  bills,
  recentTransactions,
  onStartPayment,
  onOpenCheckBalance,
  onOpenReceiveQr,
  onOpenScan,
  onOpenBillDetails,
  onOpenSection,
  onViewAllHistory,
  onExecuteVoiceIntent,
  onSpeak,
  isSpeaking,
  onInspectIntent,
}) => {
  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(language, key, params);

  // Find most urgent unpaid bill
  const urgentBill = bills.find((b) => !b.paid && (b.isOverdue || b.daysRemaining <= 3));

  // Recharge & Bills grid items
  const billCategories = [
    { key: 'billMobile', icon: Smartphone, color: 'bg-blue-100 text-blue-700', cat: 'mobile' },
    { key: 'billElectricity', icon: Zap, color: 'bg-amber-100 text-amber-700', cat: 'electricity' },
    { key: 'billDth', icon: Tv, color: 'bg-purple-100 text-purple-700', cat: 'dth' },
    { key: 'billFastag', icon: Car, color: 'bg-emerald-100 text-emerald-700', cat: 'fastag' },
    { key: 'billGas', icon: Flame, color: 'bg-orange-100 text-orange-700', cat: 'gas' },
    { key: 'billWater', icon: Droplet, color: 'bg-cyan-100 text-cyan-700', cat: 'water' },
    { key: 'billBroadband', icon: Wifi, color: 'bg-indigo-100 text-indigo-700', cat: 'broadband' },
    { key: 'billCreditCard', icon: CreditCard, color: 'bg-rose-100 text-rose-700', cat: 'credit_card' },
    { key: 'billLoanEmi', icon: Banknote, color: 'bg-teal-100 text-teal-700', cat: 'loan_emi' },
    { key: 'billRent', icon: HomeIcon, color: 'bg-stone-100 text-stone-700', cat: 'rent' },
    { key: 'billInsurance', icon: Shield, color: 'bg-sky-100 text-sky-700', cat: 'insurance' },
    { key: 'billEducation', icon: GraduationCap, color: 'bg-yellow-100 text-yellow-800', cat: 'education' },
  ];

  return (
    <div className="pb-24 pt-2 px-3 space-y-4">
      {/* 1. Search & Voice Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-1.5 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          onClick={() => onStartPayment('contact')}
          readOnly
          className="flex-1 bg-transparent py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none cursor-pointer"
        />
        <button
          onClick={() => {
            // Trigger voice input on VoiceCard
            const micBtn = document.querySelector('button[aria-label="Tap & Speak"]') as HTMLButtonElement;
            if (micBtn) micBtn.click();
          }}
          className="p-2 bg-blue-50 text-[#0B5CAD] rounded-xl hover:bg-blue-100 active:scale-95 transition-all mr-0.5"
          title={t('searchMic')}
          aria-label={t('searchMic')}
        >
          <Mic className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Urgent Bill Banner (Amber / Red) */}
      {urgentBill && (
        <div
          onClick={() => onOpenBillDetails(urgentBill)}
          className={`rounded-2xl p-3.5 border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
            urgentBill.isOverdue
              ? 'bg-red-50/90 border-red-200 text-red-900'
              : 'bg-amber-50/90 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                urgentBill.isOverdue ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
              }`}
            >
              <BellRing className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                    urgentBill.isOverdue ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {urgentBill.isOverdue
                    ? t('billAlertOverdue')
                    : t('billAlertDueDays', { days: urgentBill.daysRemaining })}
                </span>
                <span className="text-xs font-bold">
                  {language === 'mr'
                    ? urgentBill.billerNameMr || urgentBill.billerName
                    : language === 'hi'
                    ? urgentBill.billerNameHi || urgentBill.billerName
                    : urgentBill.billerName}
                </span>
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">
                ₹{urgentBill.amount.toLocaleString('en-IN')} is due for payment
              </p>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenBillDetails(urgentBill);
            }}
            className="px-3 py-1.5 bg-[#0B5CAD] text-white rounded-xl text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
          >
            {t('billAlertPayNow')}
          </button>
        </div>
      )}

      {/* 3. Primary Actions Grid (8 Actions) */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
        {/* Row 1: 4 Large Icon Buttons */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <button
            onClick={onOpenScan}
            className="flex flex-col items-center group active:scale-95 transition-transform"
          >
            <div className="w-13 h-13 rounded-2xl bg-blue-50 text-[#0B5CAD] flex items-center justify-center group-hover:bg-[#0B5CAD] group-hover:text-white transition-colors shadow-2xs">
              <QrCode className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 mt-2 leading-tight">
              {t('actionScanQr')}
            </span>
          </button>

          <button
            onClick={() => onStartPayment('contact')}
            className="flex flex-col items-center group active:scale-95 transition-transform"
          >
            <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-2xs">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 mt-2 leading-tight">
              {t('actionPayContact')}
            </span>
          </button>

          <button
            onClick={() => onStartPayment('phone')}
            className="flex flex-col items-center group active:scale-95 transition-transform"
          >
            <div className="w-13 h-13 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-2xs">
              <Phone className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 mt-2 leading-tight">
              {t('actionPayPhone')}
            </span>
          </button>

          <button
            onClick={() => onStartPayment('upi')}
            className="flex flex-col items-center group active:scale-95 transition-transform"
          >
            <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-2xs">
              <AtSign className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 mt-2 leading-tight">
              {t('actionPayUpi')}
            </span>
          </button>
        </div>

        {/* Row 2: Secondary 4 Icon Buttons */}
        <div className="grid grid-cols-4 gap-2 text-center mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => onStartPayment('contact')}
            className="flex flex-col items-center group active:scale-95 transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium text-slate-600 mt-1.5 leading-tight">
              {t('actionBankTransfer')}
            </span>
          </button>

          <button
            onClick={onOpenCheckBalance}
            className="flex flex-col items-center group active:scale-95 transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
              <Eye className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium text-slate-600 mt-1.5 leading-tight">
              {t('actionCheckBalance')}
            </span>
          </button>

          <button
            onClick={onOpenReceiveQr}
            className="flex flex-col items-center group active:scale-95 transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
              <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-[10px] font-medium text-slate-600 mt-1.5 leading-tight">
              {t('actionReceiveMoney')}
            </span>
          </button>

          <button
            onClick={() => onStartPayment('contact')}
            className="flex flex-col items-center group active:scale-95 transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
              <ArrowUpRight className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[10px] font-medium text-slate-600 mt-1.5 leading-tight">
              {t('actionRequestMoney')}
            </span>
          </button>
        </div>
      </div>

      {/* 4. Hero Voice Assistant Card */}
      <VoiceCard
        language={language}
        contacts={contacts}
        onExecuteIntent={onExecuteVoiceIntent}
        onSpeak={onSpeak}
        isSpeaking={isSpeaking}
        onInspectIntent={onInspectIntent}
      />

      {/* 5. People / Recent Contacts (Horizontal Grid) */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {t('sectionPeople')}
          </h3>
          <button
            onClick={() => onStartPayment('contact')}
            className="text-xs font-semibold text-[#0B5CAD] hover:underline"
          >
            {t('seeAll')}
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() =>
                onStartPayment('contact', {
                  name: contact.name,
                  upiId: contact.upiId,
                  phone: contact.phone,
                  avatarColor: contact.avatarColor,
                  initials: contact.initials,
                  isVerified: contact.isVerified,
                })
              }
              className="flex flex-col items-center shrink-0 w-16 group active:scale-95 transition-transform"
            >
              <div
                className={`w-13 h-13 rounded-full ${contact.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow-md group-hover:ring-2 group-hover:ring-[#0B5CAD]`}
              >
                {contact.initials}
              </div>
              <span className="text-xs font-medium text-slate-800 mt-1.5 truncate w-full text-center">
                {language === 'mr' && contact.nameMr
                  ? contact.nameMr.split(' ')[0]
                  : language === 'hi' && contact.nameHi
                  ? contact.nameHi.split(' ')[0]
                  : contact.name.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 6. Recharge & Bills Section (Grid of 12) */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {t('sectionBills')}
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-3 text-center">
          {billCategories.map((item) => {
            const Icon = item.icon;
            const existingBill = bills.find((b) => b.category === item.cat);

            return (
              <button
                key={item.key}
                onClick={() => {
                  if (existingBill) {
                    onOpenBillDetails(existingBill);
                  } else {
                    onStartPayment('bill', {
                      name: t(item.key),
                      upiId: `${item.cat}@billdesk`,
                    });
                  }
                }}
                className="flex flex-col items-center group active:scale-95 transition-transform"
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center group-hover:scale-105 transition-all shadow-2xs`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold text-slate-700 mt-1.5 leading-tight line-clamp-2 h-7 flex items-center">
                  {t(item.key)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 7. Money & Investments Section */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          {t('sectionInvestments')}
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Loans Card */}
          <div
            onClick={() => onOpenSection('loans')}
            className="p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 hover:border-blue-200 cursor-pointer transition-all active:scale-95"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0B5CAD] text-white flex items-center justify-center">
                <Banknote className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">{t('loanTitle')}</h4>
                <span className="text-[10px] text-blue-700 font-semibold">Pre-approved ₹50k</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Check EMI & apply instantly</p>
          </div>

          {/* SIP Mutual Funds Card */}
          <div
            onClick={() => onOpenSection('sip')}
            className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 hover:border-emerald-200 cursor-pointer transition-all active:scale-95"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">{t('sipTitle')}</h4>
                <span className="text-[10px] text-emerald-700 font-semibold">Portfolio +13.6%</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Invest ₹500/month</p>
          </div>

          {/* Digital Gold Card */}
          <div
            onClick={() => onOpenSection('gold')}
            className="p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 hover:border-amber-200 cursor-pointer transition-all active:scale-95"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">{t('goldTitle')}</h4>
                <span className="text-[10px] text-amber-800 font-semibold">24K 99.9% Pure</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Start from ₹10</p>
          </div>

          {/* Credit Score Card */}
          <div
            onClick={() => onOpenSection('credit_score')}
            className="p-3 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 hover:border-purple-200 cursor-pointer transition-all active:scale-95"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">{t('creditScoreTitle')}</h4>
                <span className="text-[10px] text-purple-700 font-semibold">785 Excellent</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Free monthly refresh</p>
          </div>
        </div>
      </div>

      {/* 8. Offers & Rewards Carousel Banner */}
      <div
        onClick={() => onOpenSection('rewards')}
        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-3xl p-4 shadow-md cursor-pointer hover:brightness-105 active:scale-95 transition-all flex items-center justify-between"
      >
        <div>
          <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase">
            Surprise Scratch Cards
          </span>
          <h4 className="text-sm font-bold mt-1">Win up to ₹50 on your next transfer!</h4>
          <p className="text-[11px] text-amber-100">Tap to see your scratch cards & cashback</p>
        </div>
        <ChevronRight className="w-6 h-6 text-white shrink-0 ml-2" />
      </div>

      {/* 9. Recent Transactions Preview (3 items) */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {t('sectionRecentTrans')}
          </h3>
          <button
            onClick={onViewAllHistory}
            className="text-xs font-semibold text-[#0B5CAD] hover:underline"
          >
            {t('seeAll')}
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentTransactions.slice(0, 3).map((tx) => (
            <div
              key={tx.id}
              onClick={onViewAllHistory}
              className="py-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-xl px-1 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                    tx.type === 'received'
                      ? 'bg-emerald-100 text-emerald-700'
                      : tx.status === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {tx.type === 'received' ? '+' : '-'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{tx.title}</h4>
                  <p className="text-[10px] text-slate-400">
                    {new Date(tx.timestamp).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-sm font-bold tabular-nums ${
                    tx.type === 'received'
                      ? 'text-emerald-600'
                      : tx.status === 'failed'
                      ? 'text-slate-400 line-through'
                      : 'text-slate-900'
                  }`}
                >
                  {tx.type === 'received' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                </span>
                <span
                  className={`block text-[10px] font-semibold ${
                    tx.status === 'success'
                      ? 'text-emerald-600'
                      : tx.status === 'failed'
                      ? 'text-red-500'
                      : 'text-amber-500'
                  }`}
                >
                  {t(
                    tx.status === 'success'
                      ? 'statusSuccess'
                      : tx.status === 'failed'
                      ? 'statusFailed'
                      : 'statusPending'
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
