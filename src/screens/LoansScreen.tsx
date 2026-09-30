import React, { useState } from 'react';
import { Banknote, ArrowLeft, CheckCircle, Calculator, ShieldCheck, Calendar, Clock } from 'lucide-react';
import { AppLanguage } from '../types';
import { getTranslation } from '../i18n/translations';

interface LoansScreenProps {
  language: AppLanguage;
  onBack: () => void;
  onSpeak: (text: string) => void;
}

export const LoansScreen: React.FC<LoansScreenProps> = ({
  language,
  onBack,
  onSpeak,
}) => {
  const [loanAmount, setLoanAmount] = useState(30000);
  const [tenureMonths, setTenureMonths] = useState(12);
  const [applied, setApplied] = useState(false);

  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(language, key, params);

  // Simple monthly EMI calculation: P * r * (1+r)^n / ((1+r)^n - 1) @ 12% p.a. (1% per mo)
  const monthlyRate = 0.01;
  const emi = Math.round(
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1)
  );

  const handleApply = () => {
    setApplied(true);
    const speech = `Your loan application for ₹${loanAmount} with monthly EMI of ₹${emi} has been submitted for instant verification.`;
    onSpeak(speech);
  };

  return (
    <div className="pb-24 pt-3 px-3 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="p-1 rounded-full hover:bg-slate-100 text-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">{t('loanTitle')}</h2>
      </div>

      {/* 1. Active Loan Tracker */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold bg-blue-50 text-[#0B5CAD] px-2.5 py-0.5 rounded-full">
            Active Loan
          </span>
          <span className="text-[11px] text-slate-400 font-mono">Ref: L2W-982187</span>
        </div>

        <h3 className="text-sm font-bold text-slate-900">{t('loanActiveTitle')}</h3>
        <p className="text-xs text-slate-500">Bajaj Auto Finance Limited</p>

        {/* EMI details */}
        <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <span className="text-[10px] text-slate-400 block">{t('loanEmiTracker')}</span>
            <span className="text-base font-bold text-slate-900">₹3,200 / mo</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Next Due Date</span>
            <span className="text-xs font-semibold text-amber-700 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5" /> Oct 04, 2026
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
            <span>Repaid: 16 of 24 EMIs</span>
            <span className="font-bold text-[#0B5CAD]">67%</span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div className="bg-[#0B5CAD] h-full rounded-full" style={{ width: '67%' }} />
          </div>
        </div>
      </div>

      {/* 2. Interactive Personal Loan Offer & Calculator */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {t('loanApplyBtn')}
            </h3>
            <p className="text-[11px] text-slate-500">{t('loanPreApproved')}</p>
          </div>
        </div>

        {/* Loan Amount Slider */}
        <div className="my-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-slate-600">Loan Amount</span>
            <span className="text-base font-extrabold text-[#0B5CAD]">
              ₹{loanAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <input
            type="range"
            min={10000}
            max={50000}
            step={5000}
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0B5CAD]"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>₹10,000</span>
            <span>₹50,000</span>
          </div>
        </div>

        {/* Tenure Slider */}
        <div className="my-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-slate-600">Tenure</span>
            <span className="text-sm font-bold text-slate-900">{tenureMonths} Months</span>
          </div>
          <input
            type="range"
            min={6}
            max={24}
            step={3}
            value={tenureMonths}
            onChange={(e) => setTenureMonths(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0B5CAD]"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>6 mos</span>
            <span>24 mos</span>
          </div>
        </div>

        {/* EMI Result Summary */}
        <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-100 flex items-center justify-between text-xs mb-4">
          <div>
            <span className="text-[10px] text-blue-700 font-semibold block uppercase">
              Estimated Monthly EMI
            </span>
            <span className="text-2xl font-extrabold text-[#0B5CAD]">₹{emi}</span>
            <span className="text-[10px] text-slate-500 block">@ 12% p.a. fixed interest</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Processing Fee</span>
            <span className="text-xs font-bold text-slate-800">Zero (Waived)</span>
          </div>
        </div>

        {applied ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h5 className="font-bold">Application In Review!</h5>
              <p className="text-[10px] text-emerald-700">Simulated pre-approval check completed.</p>
            </div>
          </div>
        ) : (
          <button
            onClick={handleApply}
            className="w-full py-3 rounded-xl bg-[#0B5CAD] text-white font-semibold text-xs hover:bg-blue-800 transition-colors shadow-sm"
          >
            Apply for ₹{loanAmount.toLocaleString('en-IN')} Loan
          </button>
        )}
      </div>
    </div>
  );
};
