import React, { useState, useMemo } from 'react';
import {
  Search,
  Mic,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Share2,
  FileText,
  X,
  Volume2,
} from 'lucide-react';
import { AppLanguage, Transaction, TransactionType } from '../types';
import { getTranslation } from '../i18n/translations';
import { useSpeech } from '../hooks/useSpeech';

interface HistoryScreenProps {
  language: AppLanguage;
  transactions: Transaction[];
  onSpeak: (text: string) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  language,
  transactions,
  onSpeak,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [voiceSummary, setVoiceSummary] = useState<string | null>(null);

  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(language, key, params);

  const { isListening, transcript, startListening, stopListening } = useSpeech(language);

  // When voice search produces transcript
  React.useEffect(() => {
    if (transcript && !isListening) {
      handleVoiceQuery(transcript);
    }
  }, [transcript, isListening]);

  const handleVoiceQuery = (queryText: string) => {
    setSearchQuery(queryText);
    const lower = queryText.toLowerCase();

    // Check if searching for a specific contact
    const matchedContact = ['raju', 'राजू', 'aditi', 'अदिती', 'mom', 'आई', 'amit', 'अमित', 'priya', 'प्रिया', 'sharma', 'शर्मा'].find(
      (name) => lower.includes(name)
    );

    if (matchedContact) {
      const filtered = transactions.filter(
        (tx) => tx.title.toLowerCase().includes(matchedContact.toLowerCase()) ||
          (matchedContact === 'राजू' && tx.title.includes('Raju')) ||
          (matchedContact === 'अदिती' && tx.title.includes('Aditi')) ||
          (matchedContact === 'आई' && tx.title.includes('Mom'))
      );

      const totalSent = filtered
        .filter((tx) => tx.type === 'sent')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const summaryText = `Found ${filtered.length} transactions for ${matchedContact}. Total sent: ₹${totalSent}.`;
      setVoiceSummary(summaryText);
      onSpeak(summaryText);
    } else {
      const summaryText = `Showing search results for "${queryText}".`;
      setVoiceSummary(summaryText);
      onSpeak(summaryText);
    }
  };

  // Latest transaction for "Did my payment go through?" status card
  const latestTx = transactions[0];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Filter tab
      if (activeFilter === 'sent' && tx.type !== 'sent') return false;
      if (activeFilter === 'received' && tx.type !== 'received') return false;
      if (activeFilter === 'bills' && tx.type !== 'bill') return false;
      if (activeFilter === 'recharge' && tx.type !== 'recharge') return false;
      if (activeFilter === 'failed' && tx.status !== 'failed') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = tx.title.toLowerCase().includes(q);
        const matchesUtr = tx.utrNumber.toLowerCase().includes(q);
        const matchesAmt = String(tx.amount).includes(q);
        const matchesNote = tx.note?.toLowerCase().includes(q);
        return matchesTitle || matchesUtr || matchesAmt || matchesNote;
      }

      return true;
    });
  }, [transactions, activeFilter, searchQuery]);

  const filterTabs = [
    { id: 'all', label: t('filterAll') },
    { id: 'sent', label: t('filterSent') },
    { id: 'received', label: t('filterReceived') },
    { id: 'bills', label: t('filterBills') },
    { id: 'recharge', label: t('filterRecharge') },
    { id: 'failed', label: t('filterFailed') },
  ];

  return (
    <div className="pb-24 pt-3 px-3 space-y-3">
      {/* 1. Header & Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          {t('historyTitle')}
        </h2>
        <span className="text-xs text-slate-400 font-mono">
          {filteredTransactions.length} records
        </span>
      </div>

      {/* 2. "Did my payment go through?" Status Card */}
      {latestTx && (
        <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                latestTx.status === 'success'
                  ? 'bg-emerald-100 text-emerald-600'
                  : latestTx.status === 'failed'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-amber-100 text-amber-600'
              }`}
            >
              {latestTx.status === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : latestTx.status === 'failed' ? (
                <XCircle className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium">
                {t('didMyPaymentGoThrough')}
              </span>
              <h4 className="text-xs font-bold text-slate-800">
                ₹{latestTx.amount} to {latestTx.title}
              </h4>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              latestTx.status === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {t(
              latestTx.status === 'success'
                ? 'statusSuccess'
                : latestTx.status === 'failed'
                ? 'statusFailed'
                : 'statusPending'
            )}
          </span>
        </div>
      )}

      {/* 3. Search Bar with Voice */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-1.5 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('voiceSearchHistoryHint')}
          className="flex-1 bg-transparent py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setVoiceSummary(null);
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={isListening ? stopListening : startListening}
          className={`p-2 rounded-xl transition-all ${
            isListening ? 'bg-red-500 text-white voice-pulse' : 'bg-blue-50 text-[#0B5CAD] hover:bg-blue-100'
          }`}
          title="Voice Search History"
        >
          <Mic className="w-4 h-4" />
        </button>
      </div>

      {/* Voice Summary Audio Card */}
      {voiceSummary && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-2.5 text-xs text-[#0B5CAD] flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{voiceSummary}</span>
          </div>
          <button
            onClick={() => onSpeak(voiceSummary)}
            className="text-[10px] underline font-bold"
          >
            Replay
          </button>
        </div>
      )}

      {/* 4. Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === tab.id
                ? 'bg-[#0B5CAD] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 5. Transaction List */}
      <div className="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs divide-y divide-slate-100">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No transactions match this filter
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isReceived = tx.type === 'received';
            const isFailed = tx.status === 'failed';

            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="py-3 px-1 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      isReceived
                        ? 'bg-emerald-50 text-emerald-600'
                        : isFailed
                        ? 'bg-red-50 text-red-600'
                        : 'bg-blue-50 text-[#0B5CAD]'
                    }`}
                  >
                    {isReceived ? (
                      <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-[#0B5CAD]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">{tx.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[170px]">
                      {tx.subtitle || tx.recipientUpiId || tx.senderUpiId}
                    </p>
                    <span className="text-[9px] text-slate-400">
                      {new Date(tx.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-sm font-bold tabular-nums ${
                      isReceived
                        ? 'text-emerald-600'
                        : isFailed
                        ? 'text-slate-400 line-through'
                        : 'text-slate-900'
                    }`}
                  >
                    {isReceived ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-0.5 ${
                      tx.status === 'success'
                        ? 'bg-emerald-50 text-emerald-600'
                        : isFailed
                        ? 'bg-red-50 text-red-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {t(
                      tx.status === 'success'
                        ? 'statusSuccess'
                        : isFailed
                        ? 'statusFailed'
                        : 'statusPending'
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. Receipt / Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Transaction Receipt</h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 text-center">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl font-bold ${
                  selectedTx.type === 'received'
                    ? 'bg-emerald-100 text-emerald-700'
                    : selectedTx.status === 'failed'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {selectedTx.type === 'received' ? '+' : '-'}
              </div>
              <h4 className="text-sm font-bold text-slate-900">{selectedTx.title}</h4>
              <p className="text-xs text-slate-500">{selectedTx.subtitle}</p>

              <div className="text-3xl font-extrabold text-slate-900 my-3">
                ₹{selectedTx.amount.toLocaleString('en-IN')}
              </div>

              <div className="bg-slate-50 rounded-2xl p-3.5 text-left text-xs space-y-2 border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Status</span>
                  <span className="font-bold text-emerald-600 capitalize">{selectedTx.status}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>UTR / Reference</span>
                  <span className="font-mono font-bold text-slate-800">{selectedTx.utrNumber}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Date</span>
                  <span>{new Date(selectedTx.timestamp).toLocaleString()}</span>
                </div>
                {selectedTx.note && (
                  <div className="flex justify-between text-slate-600">
                    <span>Note</span>
                    <span className="italic">"{selectedTx.note}"</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  onSpeak(
                    `Transaction receipt: ₹${selectedTx.amount} with reference ${selectedTx.utrNumber} on ${new Date(
                      selectedTx.timestamp
                    ).toLocaleDateString()}`
                  );
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-50 text-[#0B5CAD] font-semibold text-xs hover:bg-blue-100 flex items-center justify-center gap-1.5"
              >
                <Volume2 className="w-4 h-4" />
                <span>Listen</span>
              </button>
              <button
                onClick={() => setSelectedTx(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
              >
                {t('done')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
