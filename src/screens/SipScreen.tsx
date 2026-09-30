import React, { useState } from 'react';
import { TrendingUp, ArrowLeft, PlusCircle, CheckCircle, Calendar, ShieldCheck, X } from 'lucide-react';
import { AppLanguage } from '../types';
import { getTranslation } from '../i18n/translations';

interface SipScreenProps {
  language: AppLanguage;
  onBack: () => void;
  onSpeak: (text: string) => void;
}

export const SipScreen: React.FC<SipScreenProps> = ({
  language,
  onBack,
  onSpeak,
}) => {
  const [showNewSipModal, setShowNewSipModal] = useState(false);
  const [selectedFund, setSelectedFund] = useState('HDFC Top 100 Large Cap');
  const [sipAmount, setSipAmount] = useState('1000');
  const [activeSips, setActiveSips] = useState([
    {
      id: 'sip-1',
      name: 'HDFC Top 100 Fund',
      category: 'Large Cap Equity',
      monthlyAmount: 1000,
      nextDate: 'Oct 05, 2026',
      totalInvested: 12000,
      currentValue: 13800,
    },
    {
      id: 'sip-2',
      name: 'SBI Bluechip Growth',
      category: 'Diversified Equity',
      monthlyAmount: 500,
      nextDate: 'Oct 15, 2026',
      totalInvested: 6000,
      currentValue: 6650,
    },
  ]);

  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(language, key, params);

  const totalInvested = activeSips.reduce((sum, s) => sum + s.totalInvested, 0);
  const totalCurrent = activeSips.reduce((sum, s) => sum + s.currentValue, 0);
  const gain = totalCurrent - totalInvested;
  const gainPercent = ((gain / totalInvested) * 100).toFixed(1);

  const handleCreateSip = () => {
    const amt = parseInt(sipAmount, 10) || 500;
    const newSip = {
      id: `sip-${Date.now()}`,
      name: selectedFund,
      category: 'Direct Equity',
      monthlyAmount: amt,
      nextDate: 'Nov 01, 2026',
      totalInvested: amt,
      currentValue: amt,
    };
    setActiveSips([...activeSips, newSip]);
    setShowNewSipModal(false);
    onSpeak(`New SIP for ${selectedFund} with ₹${amt} per month has been created.`);
  };

  return (
    <div className="pb-24 pt-3 px-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 rounded-full hover:bg-slate-100 text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">{t('sipTitle')}</h2>
        </div>
        <button
          onClick={() => setShowNewSipModal(true)}
          className="px-3 py-1.5 bg-[#0B5CAD] text-white rounded-xl text-xs font-semibold hover:bg-blue-800 transition-colors flex items-center gap-1 shadow-xs"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Start SIP</span>
        </button>
      </div>

      {/* 1. Portfolio Summary Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <span className="text-xs text-emerald-100 uppercase tracking-wider block">
          {t('sipPortfolio')}
        </span>
        <div className="text-3xl font-extrabold tracking-tight my-1">
          ₹{totalCurrent.toLocaleString('en-IN')}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-emerald-400/40 text-xs">
          <div>
            <span className="text-[10px] text-emerald-200 block">Total Invested</span>
            <span className="font-bold text-white">₹{totalInvested.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-200 block">Total Returns</span>
            <span className="font-bold text-emerald-200">+₹{gain.toLocaleString('en-IN')} ({gainPercent}%)</span>
          </div>
        </div>
      </div>

      {/* 2. Active SIPs List */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Active Monthly SIPs
        </h3>

        <div className="space-y-3">
          {activeSips.map((sip) => (
            <div
              key={sip.id}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-900">{sip.name}</h4>
                <p className="text-[10px] text-slate-500">{sip.category}</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-600 mt-1">
                  <Calendar className="w-3 h-3 text-[#0B5CAD]" />
                  <span>Next: {sip.nextDate}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold text-slate-900">
                  ₹{sip.monthlyAmount} / mo
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                  Value: ₹{sip.currentValue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New SIP Modal */}
      {showNewSipModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">{t('sipStartBtn')}</h3>
              <button
                onClick={() => setShowNewSipModal(false)}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Select Fund
                </label>
                <select
                  value={selectedFund}
                  onChange={(e) => setSelectedFund(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 bg-slate-50 focus:outline-none"
                >
                  <option value="HDFC Top 100 Large Cap">HDFC Top 100 Large Cap</option>
                  <option value="SBI Nifty 50 Index Fund">SBI Nifty 50 Index Fund</option>
                  <option value="ICICI Prudential Balanced Advantage">ICICI Prudential Balanced Advantage</option>
                  <option value="Parag Parikh Flexi Cap Fund">Parag Parikh Flexi Cap Fund</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Monthly SIP Amount
                </label>
                <div className="flex gap-2">
                  {['500', '1000', '2000', '5000'].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setSipAmount(amt)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        sipAmount === amt
                          ? 'bg-[#0B5CAD] text-white border-[#0B5CAD]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-[11px] text-slate-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0B5CAD] shrink-0 mt-0.5" />
                <span>Simulated auto-debit on the 1st of every month from your primary SBI account.</span>
              </div>
            </div>

            <button
              onClick={handleCreateSip}
              className="w-full py-3 rounded-xl bg-[#0B5CAD] text-white font-semibold text-xs hover:bg-blue-800 transition-colors shadow-sm"
            >
              Start ₹{sipAmount} Monthly SIP
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
