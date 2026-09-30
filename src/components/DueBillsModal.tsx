import React, { useEffect } from 'react';
import { X, Calendar, AlertCircle, CheckCircle, ArrowRight, BellRing } from 'lucide-react';
import { AppLanguage, BillItem } from '../types';
import { getTranslation } from '../i18n/translations';

interface DueBillsModalProps {
  language: AppLanguage;
  bills: BillItem[];
  onClose: () => void;
  onPayBill: (bill: BillItem) => void;
  onMarkPaid: (billId: string) => void;
  onSpeak: (text: string) => void;
}

export const DueBillsModal: React.FC<DueBillsModalProps> = ({
  language,
  bills,
  onClose,
  onPayBill,
  onMarkPaid,
  onSpeak,
}) => {
  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(language, key, params);

  const unpaidBills = bills.filter((b) => !b.paid && (b.isOverdue || b.daysRemaining <= 5));
  const mostUrgent = unpaidBills[0];

  useEffect(() => {
    if (mostUrgent) {
      const urgentStatus = mostUrgent.isOverdue
        ? t('billAlertOverdue')
        : t('billAlertDueDays', { days: mostUrgent.daysRemaining });
      const name =
        language === 'mr'
          ? mostUrgent.billerNameMr || mostUrgent.billerName
          : language === 'hi'
          ? mostUrgent.billerNameHi || mostUrgent.billerName
          : mostUrgent.billerName;

      const speech = t('billPopupReadout', {
        count: unpaidBills.length,
        name,
        amount: mostUrgent.amount,
        status: urgentStatus,
      });

      onSpeak(speech);
    }
  }, []);

  if (unpaidBills.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <BellRing className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('billPopupTitle')}</h3>
              <p className="text-[10px] text-slate-400">
                {unpaidBills.length} {t('billAlertDueDays', { days: '...' })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bills list */}
        <div className="space-y-2.5 my-3 max-h-[260px] overflow-y-auto pr-1">
          {unpaidBills.map((bill) => {
            const billName =
              language === 'mr'
                ? bill.billerNameMr || bill.billerName
                : language === 'hi'
                ? bill.billerNameHi || bill.billerName
                : bill.billerName;

            const isOverdue = bill.isOverdue;

            return (
              <div
                key={bill.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isOverdue
                    ? 'bg-red-50/70 border-red-200'
                    : 'bg-amber-50/70 border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOverdue
                            ? 'bg-red-600 text-white'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {isOverdue
                          ? t('billAlertOverdue')
                          : t('billAlertDueDays', { days: bill.daysRemaining })}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-1.5">{billName}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">
                      No: {bill.consumerNumber}
                    </p>
                  </div>

                  <div className="text-right pl-2">
                    <div className="text-base font-extrabold text-slate-900">
                      ₹{bill.amount.toLocaleString('en-IN')}
                    </div>
                    <button
                      onClick={() => onPayBill(bill)}
                      className="mt-1 px-3 py-1 bg-[#0B5CAD] text-white rounded-lg text-xs font-semibold hover:bg-blue-800 shadow-sm transition-all"
                    >
                      {t('billAlertPayNow')}
                    </button>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                  <button
                    onClick={() => onMarkPaid(bill.id)}
                    className="text-slate-500 hover:text-emerald-700 font-medium"
                  >
                    ✓ {t('billAlertMarkPaid')}
                  </button>
                  <span className="text-slate-400">Due: {bill.dueDate}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50 transition-colors"
          >
            {t('billAlertRemindLater')}
          </button>
          <button
            onClick={() => {
              if (mostUrgent) onPayBill(mostUrgent);
            }}
            className="py-2.5 rounded-xl bg-[#0B5CAD] text-white font-semibold text-xs hover:bg-blue-800 transition-colors flex items-center justify-center gap-1 shadow-sm"
          >
            <span>{t('billAlertPayNow')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
