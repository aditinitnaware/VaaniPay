=====================================================
PATCH v2: THESE CHANGES OVERRIDE ANY CONFLICTING EARLIER SECTIONS
=====================================================

-----------------------------------------------------
CHANGE 1: BALANCE IS STRICTLY HIDDEN UNTIL PIN IS VERIFIED
-----------------------------------------------------
- The balance value must NEVER be present in the UI, DOM, notifications, toasts, page titles, aria-labels, TTS output or localStorage until the PIN is verified in that moment.
- Store balances only in a mock "vault" module. It exposes getBalance(accountId, pinToken) and returns data ONLY if pinToken is a valid, single-use, 10-second token issued after a correct PIN.
- Everywhere a balance could appear (Home, Profile, bank account selector, Check Balance screen, Loans, Payment review screen, history "balance after" column), show "••••••" or nothing. Bank account cards show only the bank name and last 4 digits, never the balance.
- Every route to a balance (button, voice command "check balance", "मेरा बैलेंस बताओ", "माझा बॅलन्स सांग", search bar, deep link, browser back/forward) must open the PIN gate first. No bypass.
- After PIN success: show the balance for 10 seconds with a countdown, then auto-hide and discard the token. Leaving the screen, switching tabs or backgrounding the app hides it immediately.
- The balance is spoken aloud only after PIN success and only if Voice confirmations are ON. Never speak it before.
- Wrong PIN: show "Incorrect PIN" in the selected language and speak it. 3 wrong attempts lock for 30 seconds.

-----------------------------------------------------
CHANGE 2: MULTILINGUAL "LISTEN" (TTS) WITH NATIVE-LANGUAGE NUMBERS AND A PLEASANT VOICE
-----------------------------------------------------
A. Numbers spoken in the selected language (not English)
- Build /i18n/numberToWords with converters for English (Indian system: lakh, crore), Hindi, Marathi, Tamil, Telugu, Bengali.
- Before any text goes to speechSynthesis, run it through speakableText(text, lang), which converts:
  - Amounts: "₹500" -> Marathi "पाचशे रुपये", Hindi "पाँच सौ रुपये", Tamil "ஐநூறு ரூபாய்"; "₹1,240" -> "बारा सौ चाळीस रुपये" style; "₹12,450.50" -> rupees and paise.
  - Plain numbers, mobile numbers (read digit by digit in native digit words, with short pauses after every 3-4 digits), dates ("29 Sep" -> "एकोणतीस सप्टेंबर"), times ("11:45 AM" -> "सकाळी अकरा वाजून पंचेचाळीस मिनिटे"), percentages, EMI counts, "2 days".
  - Transaction IDs: read as "transaction ID ending in ..." with last 4 digits only.
  - Strip emojis, symbols (✓ ⚠️ 🎙️ ••••), markdown and raw UPI IDs. Read UPI IDs as "name at vaani".
- Optional display setting "Native numerals" (०१२३४५६७८९ / ௦௧௨ / ౦౧౨ / ০১২): OFF by default, and it never changes the PIN keypad layout.
- The Listen button beside the notification bell reads the current screen's key information (title, main amount or status, due bills, next action) in the selected language, in short sentences.

B. Voice quality (must sound pleasant, not robotic)
- useTTS hook:
  - Wait for voices to load (onvoiceschanged) before speaking.
  - Rank voices for the locale: prefer neural or natural voices (names containing "Natural", "Neural", "Online", "Google", "Microsoft ... Online", "Swara", "Neerja", "Kalpana", "Heera", "Pallavi", "Valluvar", "Shruti"), prefer female voices by default, prefer exact locale (mr-IN, hi-IN, ta-IN, te-IN, bn-IN, en-IN), then fall back to hi-IN for Marathi (same script) with a small notice, then to any available voice.
  - Settings: rate 0.9, pitch 1.0, volume 1.0 (elders can pick Slow 0.75 / Normal 0.9 / Fast 1.05).
  - Split text into short sentences and speak them in sequence with 250-400ms pauses. This also avoids the Chrome bug where long utterances cut off.
  - Always call speechSynthesis.cancel() before a new utterance; expose speak(), stop(), pause(), isSpeaking.
  - Highlight the sentence currently being spoken on screen.
- Settings -> Voice: voice picker (list of available voices for the selected language), "Test voice" button, speed slider, remembered per language.
- Adapter interface TTSProvider { speak(text, lang) } with a default BrowserTTS and a stub for cloud TTS (Bhashini / Google / Azure neural) that can be swapped in for better quality. Show "Voice not installed for this language" plus install guidance if no matching voice exists.
- While TTS is speaking, pause speech recognition, then auto-resume listening when TTS ends. This prevents the app from hearing itself.

-----------------------------------------------------
CHANGE 3: VOICE "CONFIRM" MUST OPEN THE PIN CHECKOUT
-----------------------------------------------------
Implement the assistant as an explicit state machine:
IDLE -> LISTENING -> PARSED -> AWAITING_CONFIRMATION -> PIN_CHECKOUT -> PROCESSING -> SUCCESS | FAILED

- In AWAITING_CONFIRMATION, the app speaks: "Do you want to send ₹500 to Aditi? Say confirm or cancel." (number spoken in native words), shows Confirm/Cancel buttons, and auto-starts the mic in "confirmation mode".
- Confirmation mode matches only confirm/cancel phrases (fuzzy, all languages):
  - Confirm: confirm, confirm payment, yes, ok, proceed, pay, "हो", "होय", "ठीक आहे", "पुष्टी करा", "कन्फर्म", "हाँ", "हां", "भेजो", "ஆம்", "உறுதி", "అవును", "నిర్ధారించు", "হ্যাঁ", "নিশ্চিত".
  - Cancel: cancel, no, stop, back, "रद्द", "नाही", "नहीं", "रद्द करा", "வேண்டாம்", "వద్దు", "না", "বাতিল".
- On confirm (voice OR button) -> IMMEDIATELY navigate to the PIN Checkout screen showing a payment summary (recipient, amount, note) and the PIN keypad, and speak "Please enter your PIN to complete the payment." Do NOT execute the payment before a correct PIN.
- On correct PIN -> processing spinner (mock UPI simulation) -> success screen, spoken. On cancel -> back to Home, speak "Payment cancelled."
- If the reply is unclear, re-ask once ("Please say confirm or cancel"), then show the buttons only.
- Saying "confirm payment" when nothing is pending -> "There is no payment to confirm."

-----------------------------------------------------
CHANGE 4: VOICE PIN MUST WORK
-----------------------------------------------------
Root-cause fixes (must be implemented):
1. PIN INPUT MODE IS SEPARATE FROM THE INTENT ENGINE. When the PIN screen is open, all recognised speech goes ONLY to parseSpokenPin(). It is NOT run through the fraud keyword filter. (The words "PIN" and "OTP" are blocked only in the normal assistant, never on the app-lock/checkout PIN screen.)
2. Use a dedicated SpeechRecognition instance: continuous=false, interimResults=true, maxAlternatives=5, and check ALL alternatives for a valid 4-digit result. Use the UI language locale first, then automatically retry once with en-IN, because digit recognition is best there.
3. parseSpokenPin(transcript) normalises the text and returns exactly 4 digits or null:
   - Lowercase and remove filler words (pin, is, my, the, password, "माझा", "मेरा", "पिन", "आहे", "है", "hai", "ahe", "number", etc.).
   - Accept digit strings with separators: "1234", "1 2 3 4", "1-2-3-4", "1,2,3,4".
   - Accept spoken digit words in all languages: English (one two three four; "oh" and "zero" = 0), Hindi (एक दो तीन चार पाँच छह सात आठ नौ शून्य), Marathi (एक दोन तीन चार पाच सहा सात आठ नऊ शून्य), Tamil, Telugu, Bengali, and Devanagari/Tamil/Telugu/Bengali numerals (१२३४).
   - Accept grouped forms: "twelve thirty four" -> 1234, "बारा चौतीस" -> 1234, "one two three four" -> 1234, and "one thousand two hundred thirty four" -> 1234.
   - Accept romanised words: "ek do teen char", "ek don teen char".
   - If fewer than 4 digits, keep the partial digits and ask for the rest ("Please say the remaining digits"). If more than 4, use the first 4.
4. UI behaviour: each recognised digit fills one masked dot as it arrives. NEVER display the digits, log them, store them or read them aloud. Clear the transcript buffer immediately after parsing. Auto-submit when 4 digits are captured. Show a "Listening for your PIN..." state with a pulse, a Retry mic button, and always-visible keypad fallback.
5. Handle errors: microphone permission denied ("Please allow microphone access"), no-speech timeout (8s), unsupported browser -> keypad only with a friendly message.
6. Before first voice-PIN use, show: "Speak your PIN only in a private place. This is a demo PIN." Voice PIN is optional. Keypad remains default.
7. Unit tests / demo cases that MUST pass: "1234", "one two three four", "my pin is 1 2 3 4", "twelve thirty four", "ek do teen char", "एक दोन तीन चार", "१२३४", "pin is one two three four".

-----------------------------------------------------
CHANGE 5: VOICE ENTRY OF MOBILE NUMBER MUST WORK
-----------------------------------------------------
- Pay to Mobile Number screen: a 10-digit field (controlled React state, updated through setState, never by mutating the DOM directly), a big mic button "Speak the number", and a keypad fallback.
- parseSpokenMobile(transcript, lang) returns the digits found:
  - Accept "9876543210", "98765 43210", "9 8 7 6 5 4 3 2 1 0", digit words in all six languages (Hindi "नौ आठ सात छह पाँच चार तीन दो एक शून्य", Marathi "नऊ आठ सात सहा पाच चार तीन दोन एक शून्य", Tamil, Telugu, Bengali, English), Native numerals, and romanised words.
  - Handle "double nine" / "triple seven" / "डबल नाइन" / "दुहेरी नऊ" / "डबल नौ" (repeat digits), and "oh" = 0.
  - Strip "+91", "91" (when 12 digits), and a leading "0". Ignore filler words ("my number is", "मेरा नंबर है", "माझा नंबर").
  - Append digits across multiple utterances (users often speak in chunks: "98765" then "43210") up to 10 digits. Ignore extra digits. Fill the field live from interim results.
  - Use the UI locale first, then retry with en-IN if fewer than 10 digits were found.
- After 10 digits: show the number in large grouped digits (98765 43210), speak it back digit by digit, slowly, in the selected language with short pauses, then ask "Is this correct? Say yes to continue or say change." Voice commands: yes/confirm -> continue; "change", "clear", "delete last digit", "बदला", "बदलो", "मिटाओ" -> edit.
- Validate: exactly 10 digits, starts with 6-9. Otherwise show and speak an error in the selected language and let the user retry.
- Show the resolved contact name (mock lookup) or a "New number" warning, then proceed to the amount step.
- The same parser is reused for the assistant: "send 500 to 9876543210" and "9876543210 ला पाचशे रुपये पाठवा".
- Demo/test cases that MUST pass: "9876543210", "nine eight seven six five four three two one zero", "नऊ आठ सात सहा पाच चार तीन दोन एक शून्य", "double nine eight seven six five four three two one", "mera number 9876543210 hai".

-----------------------------------------------------
UPDATED DEMO CHECKLIST (add to section 12)
-----------------------------------------------------
- Balance is not visible anywhere before the PIN. Voice "check balance" -> PIN -> shown 10s -> hides.
- Listen button reads the screen in Marathi with numbers as Marathi words, in a natural voice.
- Say "send 500 rs to Aditi" -> read aloud -> "confirm payment" -> PIN checkout screen opens -> say "one two three four" -> success spoken.
- Voice PIN works with "1234", "one two three four", and "एक दोन तीन चार".
- Speak a 10-digit mobile number -> field fills -> read back -> confirm -> pay.
