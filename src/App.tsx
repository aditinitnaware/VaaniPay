import React, { useState, useEffect, useRef } from 'react';
import { AppLanguage, Contact, BankAccount, BillItem, Transaction, ScratchCard, AccessibilitySettings, ParsedVoiceIntent } from './types';
import { DEMO_PIN, INITIAL_BANK_ACCOUNTS, INITIAL_CONTACTS, INITIAL_BILLS, INITIAL_TRANSACTIONS, INITIAL_SCRATCH_CARDS, CURRENT_USER } from './data/mockData';
import { getTranslation } from './i18n/translations';
import { PinScreen } from './components/PinScreen';
import { TopBar } from './components/TopBar';
import { BottomNav, NavTab } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { RewardsScreen } from './screens/RewardsScreen';
import { LoansScreen } from './screens/LoansScreen';
import { SipScreen } from './screens/SipScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SimplifiedHomeScreen } from './screens/SimplifiedHomeScreen';
import { VoiceOnlyModal } from './screens/VoiceOnlyModal';
import { ScanModal } from './components/ScanModal';
import { CheckBalanceModal } from './components/CheckBalanceModal';
import { ReceiveQrModal } from './components/ReceiveQrModal';
import { DueBillsModal } from './components/DueBillsModal';
import { PayModal, PaymentFlowType } from './components/PayModal';
import { JudgesInspectPanel } from './components/JudgesInspectPanel';
import { useTTS } from './hooks/useTTS';
import { parseVoiceInput } from './engine/intentEngine';

export default function App() {
  // App Lock State (Always lock on open)
  const [isAppLocked, setIsAppLocked] = useState(true);

  // Language state (defaults to Marathi as requested in demo script 1, can be chosen on PIN screen)
  const [language, setLanguage] = useState<AppLanguage>(() => {
    return (localStorage.getItem('vaani_lang') as AppLanguage) || 'mr';
  });

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [activeSubSection, setActiveSubSection] = useState<'loans' | 'sip' | null>(null);

  // App Data
  const [accounts, setAccounts] = useState<BankAccount[]>(INITIAL_BANK_ACCOUNTS);
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [bills, setBills] = useState<BillItem[]>(INITIAL_BILLS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [scratchCards, setScratchCards] = useState<ScratchCard[]>(INITIAL_SCRATCH_CARDS);

  // Accessibility Settings
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    fontSize: 'normal',
    highContrast: false,
    simplifiedMode: false,
    voiceOnlyMode: false,
    voiceConfirmations: true,
    screenReaderAuto: false,
    speechRate: 0.9,
    nativeNumerals: false,
  });

  // Modals state
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isCheckBalanceOpen, setIsCheckBalanceOpen] = useState(false);
  const [isReceiveQrOpen, setIsReceiveQrOpen] = useState(false);
  const [isDueBillsOpen, setIsDueBillsOpen] = useState(false);
  const [isVoiceOnlyModalOpen, setIsVoiceOnlyModalOpen] = useState(false);

  // Active Payment Modal
  const [activePayModal, setActivePayModal] = useState<{
    isOpen: boolean;
    flowType: PaymentFlowType;
    recipient?: any;
    amount?: number;
  }>({
    isOpen: false,
    flowType: 'contact',
  });

  // Judges Inspector state
  const [lastParsedIntent, setLastParsedIntent] = useState<ParsedVoiceIntent | null>(null);

  // Text-To-Speech hook
  const {
    speak,
    stop: stopTTS,
    isSpeaking,
    lastSpokenText,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
  } = useTTS(language, accessibility.speechRate);

  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(language, key, params);

  // Save language in localStorage
  const handleLanguageChange = (lang: AppLanguage) => {
    setLanguage(lang);
    localStorage.setItem('vaani_lang', lang);
  };

  // Inactivity lock timer: 60s in background
  useEffect(() => {
    let backgroundTimeout: NodeJS.Timeout;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        backgroundTimeout = setTimeout(() => {
          setIsAppLocked(true);
        }, 60000);
      } else {
        clearTimeout(backgroundTimeout);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(backgroundTimeout);
    };
  }, []);

  // When unlocked: show due bills summary popup if there are upcoming/overdue bills
  const handleUnlockSuccess = () => {
    setIsAppLocked(false);
    const urgentUnpaid = bills.filter((b) => !b.paid && (b.isOverdue || b.daysRemaining <= 3));
    if (urgentUnpaid.length > 0) {
      setTimeout(() => {
        setIsDueBillsOpen(true);
      }, 500);
    }
  };

  // Update Accessibility
  const handleUpdateAccessibility = (settings: Partial<AccessibilitySettings>) => {
    setAccessibility((prev) => ({ ...prev, ...settings }));
  };

  // Payment completed
  const handlePaymentSuccess = (newTx: Transaction) => {
    setTransactions((prev) => [newTx, ...prev]);

    // If bill paid, mark it paid
    if (newTx.type === 'bill') {
      setBills((prev) =>
        prev.map((b) => {
          if (newTx.title.toLowerCase().includes(b.billerName.toLowerCase())) {
            return { ...b, paid: true };
          }
          return b;
        })
      );
    }
  };

  // Execute Intent returned by voice engine
  const handleExecuteVoiceIntent = (parsed: ParsedVoiceIntent) => {
    setLastParsedIntent(parsed);

    switch (parsed.intent) {
      case 'CHECK_BALANCE':
        setIsCheckBalanceOpen(true);
        break;

      case 'SHOW_QR':
        setIsReceiveQrOpen(true);
        break;

      case 'SCAN_QR':
        setIsScanOpen(true);
        break;

      case 'TRANSACTION_HISTORY':
      case 'TRANSACTION_STATUS':
        setCurrentTab('history');
        break;

      case 'OPEN_SECTION':
        if (parsed.section === 'loans') setActiveSubSection('loans');
        else if (parsed.section === 'sip') setActiveSubSection('sip');
        else if (parsed.section === 'rewards') setCurrentTab('rewards');
        break;

      case 'PAY_BILL': {
        const matchingBill = bills.find((b) => b.category === parsed.billCategory);
        setActivePayModal({
          isOpen: true,
          flowType: 'bill',
          recipient: matchingBill
            ? {
                name: matchingBill.billerName,
                upiId: `${matchingBill.category}@billdesk`,
                isVerified: true,
              }
            : { name: 'Utility Biller', upiId: 'bill@vaani' },
          amount: parsed.amount || matchingBill?.amount,
        });
        break;
      }

      case 'RECHARGE': {
        setActivePayModal({
          isOpen: true,
          flowType: 'bill',
          recipient: { name: 'Jio Mobile Recharge', upiId: 'recharge@jio', isVerified: true },
          amount: parsed.amount || 299,
        });
        break;
      }

      case 'SEND_MONEY': {
        setActivePayModal({
          isOpen: true,
          flowType: parsed.phone ? 'phone' : 'contact',
          recipient: parsed.recipientContact
            ? {
                name: parsed.recipientContact.name,
                upiId: parsed.recipientContact.upiId,
                phone: parsed.recipientContact.phone,
                avatarColor: parsed.recipientContact.avatarColor,
                initials: parsed.recipientContact.initials,
                isVerified: parsed.recipientContact.isVerified,
              }
            : {
                name: parsed.recipient || 'New Contact',
                upiId: parsed.phone ? `${parsed.phone}@vaani` : `${parsed.recipient?.toLowerCase()}@vaani`,
                phone: parsed.phone,
                isNew: true, // Flag as new contact
              },
          amount: parsed.amount,
        });
        break;
      }

      default:
        break;
    }
  };

  // 1-Click test runner from Judges Inspector
  const handleSimulateVoiceQuery = (queryText: string) => {
    const parsed = parseVoiceInput(queryText, contacts);
    setLastParsedIntent(parsed);
    handleExecuteVoiceIntent(parsed);
    speak(`You simulated: "${queryText}". Parsed intent: ${parsed.intent}.`);
  };

  // Read current screen aloud
  const handleReadScreenAloud = () => {
    if (isSpeaking) {
      stopTTS();
      return;
    }

    let screenSummary = '';
    if (currentTab === 'home') {
      const urgent = bills.find((b) => !b.paid && (b.isOverdue || b.daysRemaining <= 3));
      screenSummary =
        'Welcome to VaaniPay. You are on Home screen. Your balance is protected by PIN. Tap Check Balance to view. Tap the microphone button in the center to speak and send money.';
      if (urgent) {
        screenSummary += ` Notice: You have an urgent ${urgent.billerName} bill of ₹${urgent.amount}.`;
      }
    } else if (currentTab === 'history') {
      screenSummary = `You are on the Transaction History screen. There are ${transactions.length} transactions recorded. Your last transaction was ₹${transactions[0]?.amount} to ${transactions[0]?.title}.`;
    } else if (currentTab === 'rewards') {
      screenSummary = `You are on the Rewards screen. You have won total cashback of ₹248. You have unrevealed scratch cards available.`;
    } else if (currentTab === 'profile') {
      screenSummary = `You are on the Profile and Accessibility screen for Ramesh Pawar. Linked account: State Bank of India. You can enable Simplified mode or change text size here.`;
    }
    speak(screenSummary);
  };

  // Font size multiplier
  const fontSizeClass =
    accessibility.fontSize === 'xlarge'
      ? 'text-lg [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_p]:text-sm'
      : accessibility.fontSize === 'large'
      ? 'text-base [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_p]:text-xs'
      : 'text-sm';

  const contrastClass = accessibility.highContrast
    ? 'bg-black text-white [&_.bg-white]:bg-slate-900 [&_.bg-white]:text-white [&_.text-slate-900]:text-white [&_.text-slate-800]:text-slate-100 [&_.text-slate-700]:text-slate-200 [&_.text-slate-600]:text-slate-300 [&_.border-slate-200]:border-slate-700'
    : 'bg-[#F4F7FA] text-[#1F2937]';

  return (
    <div className={`min-h-screen ${contrastClass} ${fontSizeClass} flex flex-col items-center justify-start selection:bg-[#0B5CAD]/20`}>
      {/* Floating Judges Inspector */}
      <JudgesInspectPanel
        lastIntent={lastParsedIntent}
        lastSpokenText={lastSpokenText}
        onSimulateVoiceQuery={handleSimulateVoiceQuery}
        language={language}
      />

      {/* Mobile-first viewport container (max-w-[430px] styled phone frame) */}
      <div className="w-full max-w-[430px] min-h-screen bg-[#F4F7FA] relative flex flex-col shadow-2xl border-x border-slate-200/60 overflow-x-hidden">
        {/* APP LOCK SCREEN GATE */}
        {isAppLocked ? (
          <PinScreen
            language={language}
            onLanguageChange={handleLanguageChange}
            onSuccess={handleUnlockSuccess}
          />
        ) : (
          <>
            {/* Top Bar */}
            <TopBar
              language={language}
              onLanguageChange={handleLanguageChange}
              unreadCount={bills.filter((b) => !b.paid && (b.isOverdue || b.daysRemaining <= 3)).length}
              onOpenNotifications={() => setIsDueBillsOpen(true)}
              onOpenProfile={() => {
                setCurrentTab('profile');
                setActiveSubSection(null);
              }}
              onReadScreenAloud={handleReadScreenAloud}
              isSpeaking={isSpeaking}
            />

            {/* Main Content Area */}
            <main className="flex-1 w-full overflow-y-auto">
              {/* Sub-sections (Loans, SIP) */}
              {activeSubSection === 'loans' ? (
                <LoansScreen
                  language={language}
                  onBack={() => setActiveSubSection(null)}
                  onSpeak={speak}
                />
              ) : activeSubSection === 'sip' ? (
                <SipScreen
                  language={language}
                  onBack={() => setActiveSubSection(null)}
                  onSpeak={speak}
                />
              ) : accessibility.simplifiedMode && currentTab === 'home' ? (
                /* Simplified Mode Home */
                <SimplifiedHomeScreen
                  language={language}
                  onSendMoney={() =>
                    setActivePayModal({
                      isOpen: true,
                      flowType: 'contact',
                    })
                  }
                  onCheckBalance={() => setIsCheckBalanceOpen(true)}
                  onScanQr={() => setIsScanOpen(true)}
                  onReceiveMoney={() => setIsReceiveQrOpen(true)}
                  onPayBills={() => {
                    const elec = bills.find((b) => b.category === 'electricity');
                    if (elec) {
                      setActivePayModal({
                        isOpen: true,
                        flowType: 'bill',
                        recipient: { name: elec.billerName, upiId: 'mseb@vaani', isVerified: true },
                        amount: elec.amount,
                      });
                    }
                  }}
                  onHelp={() =>
                    speak('VaaniPay 24x7 voice helpline is 1800 123 4567. We are here to help.')
                  }
                  onExitSimplified={() => handleUpdateAccessibility({ simplifiedMode: false })}
                  onSpeak={speak}
                />
              ) : currentTab === 'home' ? (
                /* Standard Home */
                <HomeScreen
                  language={language}
                  contacts={contacts}
                  accounts={accounts}
                  bills={bills}
                  recentTransactions={transactions}
                  onStartPayment={(flowType, recipient, amount) =>
                    setActivePayModal({
                      isOpen: true,
                      flowType,
                      recipient,
                      amount,
                    })
                  }
                  onOpenCheckBalance={() => setIsCheckBalanceOpen(true)}
                  onOpenReceiveQr={() => setIsReceiveQrOpen(true)}
                  onOpenScan={() => setIsScanOpen(true)}
                  onOpenBillDetails={(bill) => {
                    setActivePayModal({
                      isOpen: true,
                      flowType: 'bill',
                      recipient: {
                        name: bill.billerName,
                        upiId: `${bill.category}@billdesk`,
                        isVerified: true,
                      },
                      amount: bill.amount,
                    });
                  }}
                  onOpenSection={(sec) => {
                    if (sec === 'loans') setActiveSubSection('loans');
                    else if (sec === 'sip') setActiveSubSection('sip');
                    else if (sec === 'rewards') setCurrentTab('rewards');
                  }}
                  onViewAllHistory={() => setCurrentTab('history')}
                  onExecuteVoiceIntent={handleExecuteVoiceIntent}
                  onSpeak={speak}
                  isSpeaking={isSpeaking}
                  onInspectIntent={(parsed) => setLastParsedIntent(parsed)}
                />
              ) : currentTab === 'history' ? (
                /* History Tab */
                <HistoryScreen
                  language={language}
                  transactions={transactions}
                  onSpeak={speak}
                />
              ) : currentTab === 'rewards' ? (
                /* Rewards Tab */
                <RewardsScreen
                  language={language}
                  scratchCards={scratchCards}
                  onRevealCard={(cardId) => {
                    setScratchCards((prev) =>
                      prev.map((c) => (c.id === cardId ? { ...c, isRevealed: true } : c))
                    );
                  }}
                  onSpeak={speak}
                />
              ) : (
                /* Profile Tab */
                <ProfileScreen
                  language={language}
                  accounts={accounts}
                  accessibility={accessibility}
                  availableVoices={availableVoices}
                  selectedVoice={selectedVoice}
                  onSelectVoice={setSelectedVoice}
                  onUpdateAccessibility={handleUpdateAccessibility}
                  onLockApp={() => setIsAppLocked(true)}
                  onSpeak={speak}
                  onOpenCheckBalance={() => setIsCheckBalanceOpen(true)}
                />
              )}
            </main>

            {/* Bottom Nav Bar */}
            <BottomNav
              currentTab={currentTab}
              onTabChange={(tab) => {
                setCurrentTab(tab);
                setActiveSubSection(null);
              }}
              language={language}
              onScanClick={() => setIsScanOpen(true)}
            />

            {/* Modals */}
            {isScanOpen && (
              <ScanModal
                language={language}
                onClose={() => setIsScanOpen(false)}
                onScannedMerchant={(merchant) => {
                  setIsScanOpen(false);
                  setActivePayModal({
                    isOpen: true,
                    flowType: 'qr',
                    recipient: {
                      name: merchant.name,
                      upiId: merchant.upiId,
                      isVerified: merchant.verified,
                    },
                  });
                }}
              />
            )}

            {isCheckBalanceOpen && (
              <CheckBalanceModal
                language={language}
                accounts={accounts}
                voiceConfirmationsEnabled={accessibility.voiceConfirmations}
                onClose={() => setIsCheckBalanceOpen(false)}
                onSpeak={speak}
                onLanguageChange={handleLanguageChange}
              />
            )}

            {isReceiveQrOpen && (
              <ReceiveQrModal
                language={language}
                onClose={() => setIsReceiveQrOpen(false)}
                onSpeak={speak}
              />
            )}

            {isDueBillsOpen && (
              <DueBillsModal
                language={language}
                bills={bills}
                onClose={() => setIsDueBillsOpen(false)}
                onPayBill={(bill) => {
                  setIsDueBillsOpen(false);
                  setActivePayModal({
                    isOpen: true,
                    flowType: 'bill',
                    recipient: {
                      name: bill.billerName,
                      upiId: `${bill.category}@billdesk`,
                      isVerified: true,
                    },
                    amount: bill.amount,
                  });
                }}
                onMarkPaid={(billId) => {
                  setBills((prev) =>
                    prev.map((b) => (b.id === billId ? { ...b, paid: true } : b))
                  );
                  speak('Bill marked as paid.');
                }}
                onSpeak={speak}
              />
            )}

            {/* Universal Pay Modal */}
            {activePayModal.isOpen && (
              <PayModal
                language={language}
                flowType={activePayModal.flowType}
                initialRecipient={activePayModal.recipient}
                initialAmount={activePayModal.amount}
                accounts={accounts}
                contacts={contacts}
                onClose={() => setActivePayModal({ isOpen: false, flowType: 'contact' })}
                onPaymentSuccess={handlePaymentSuccess}
                onSpeak={speak}
                onLanguageChange={handleLanguageChange}
              />
            )}

            {/* Voice-Only Mode Modal */}
            {accessibility.voiceOnlyMode && (
              <VoiceOnlyModal
                language={language}
                contacts={contacts}
                onClose={() => handleUpdateAccessibility({ voiceOnlyMode: false })}
                onPaymentSuccess={handlePaymentSuccess}
                onSpeak={speak}
                onLanguageChange={handleLanguageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
