import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, Trash2, Power, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// MASSIVE FAQ DATABASE
// ==========================================
const FAQ_DB = {
  "Trust & Safety": {
    "KYC & Verification": [
      { q: "How does the KYC process work?", a: "We require a government ID (Aadhaar/PAN) for all users. Our automated system verifies it instantly. This ensures everyone on the platform is a verified neighbor." },
      { q: "Is my personal data safe?", a: "Yes. Your KYC data is encrypted and securely stored. It is never shared with other users, only your verification status is displayed." },
      { q: "Do I have to verify to browse?", a: "No, browsing is completely free and open. However, you must complete KYC before you can rent an item or list an item." }
    ],
    "Insurance & Damage": [
      { q: "What happens if my item breaks?", a: "RentNear holds a security deposit on the renter's card. If an item is damaged, file a dispute within 24 hours with photos. We will compensate you from the deposit." },
      { q: "How is the security deposit calculated?", a: "Owners set their own security deposit amount. We recommend setting it to roughly 30-50% of the item's current retail value." },
      { q: "What if the renter steals my item?", a: "Theft is extremely rare due to our strict KYC checks. In the event of theft, we cooperate fully with local authorities and the renter's deposit is forfeited to you." }
    ]
  },
  "Payments & Earnings": {
    "Getting Paid": [
      { q: "When do I get paid?", a: "Payments are held in secure escrow. Once the rental period ends and the item is returned safely, funds are released to your bank account within 2-3 business days." },
      { q: "What payment methods are supported?", a: "We support UPI, Credit/Debit cards, and Net Banking via our secure Razorpay integration." },
      { q: "Are there any hidden fees?", a: "We charge a transparent 10% platform fee on all successful rentals to cover insurance, KYC costs, and payment processing." }
    ],
    "Refunds & Cancellations": [
      { q: "Can a renter cancel a booking?", a: "Yes, renters get a full refund if they cancel at least 24 hours before the pickup time. Late cancellations may incur a one-day rental fee." },
      { q: "How do security deposit refunds work?", a: "The deposit is simply an authorization hold on the card. Once the item is returned in good condition, the hold is released immediately." }
    ]
  },
  "Renting & Listing": {
    "Listing an Item": [
      { q: "How do I list my first item?", a: "Click the 'List Item' button in the dashboard. Upload 3-5 clear photos, write an honest description, set your daily price and deposit. It takes 2 minutes!" },
      { q: "What should I charge per day?", a: "A good rule of thumb is 5-10% of the item's retail value per day. Check similar listings in your area to stay competitive." },
      { q: "Can I pause my listing?", a: "Yes! In your dashboard, you can easily toggle the availability switch to 'off' if you are going out of town or using the item yourself." }
    ],
    "The Rental Process": [
      { q: "How do handovers work?", a: "You arrange a safe public meeting spot with the renter via our messaging system. Both parties inspect the item and take photos before the exchange." },
      { q: "What if the renter is late returning it?", a: "If an item is returned late without prior agreement, the renter is charged for the extra days plus a late fee, which goes directly to you." }
    ]
  },
  "Account & Tech Support": {
    "Managing Account": [
      { q: "How do I change my email?", a: "You can update your contact details in the 'Profile' section. Email changes require a verification link sent to your new address." },
      { q: "How do I delete my account?", a: "You can request account deletion from the Profile settings. Active rentals must be completed before an account can be deleted." }
    ],
    "Technical Issues": [
      { q: "The app is crashing on my phone", a: "Please try clearing your browser cache or updating your app. If the issue persists, contact tech@rentnear.com." },
      { q: "I didn't receive my OTP", a: "Please wait 60 seconds and click 'Resend OTP'. Ensure you have strong network coverage." }
    ]
  }
};

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Bot State
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState('categories'); // categories, subcategories, questions, feedback, next_action
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, currentStep]);

  // Init Chat
  useEffect(() => {
    if (messages.length === 0) {
      startChat();
    }
  }, []);

  const addBotMessage = (text, delay = 600) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, isBot: true }]);
      setIsTyping(false);
    }, delay);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, isBot: false }]);
  };

  const startChat = () => {
    setMessages([]);
    setCurrentStep('categories');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    addBotMessage("Hi! I'm your RentNear AI Assistant ✨. I have answers to hundreds of questions. What topic do you need help with?");
  };

  const clearChat = () => {
    startChat();
  };

  const endChat = () => {
    setIsOpen(false);
    setTimeout(startChat, 500); // reset in background
  };

  // Interactions
  const handleCategorySelect = (category) => {
    addUserMessage(category);
    setSelectedCategory(category);
    setCurrentStep('subcategories');
    addBotMessage(`Great. You selected "${category}". Please choose a specific subcategory:`);
  };

  const handleSubcategorySelect = (subcategory) => {
    addUserMessage(subcategory);
    setSelectedSubcategory(subcategory);
    setCurrentStep('questions');
    addBotMessage(`Here are the most common questions about "${subcategory}":`);
  };

  const handleQuestionSelect = (qObj) => {
    addUserMessage(qObj.q);
    setCurrentStep('answering');
    
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now(), text: qObj.a, isBot: true }]);
      setIsTyping(false);
      
      // Ask for feedback
      setTimeout(() => {
        setCurrentStep('feedback');
        setMessages(prev => [...prev, { id: Date.now() + 1, text: "Did this completely answer your question?", isBot: true }]);
      }, 1000);
    }, 1500);
  };

  const handleFeedback = (isSatisfied) => {
    addUserMessage(isSatisfied ? "Yes, I'm satisfied 👍" : "No, I need more help 👎");
    setCurrentStep('next_action');
    
    if (isSatisfied) {
      addBotMessage("Awesome! I'm glad I could help. What would you like to do next?");
    } else {
      addBotMessage("I'm sorry to hear that. I recommend emailing support@rentnear.com for detailed assistance. What would you like to do next?");
    }
  };

  const handleNextAction = (action) => {
    addUserMessage(action);
    if (action === "Ask another question") {
      setCurrentStep('categories');
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      addBotMessage("Alright, let's start over. What main topic do you need help with?");
    } else {
      addBotMessage("Thanks for chatting! Feel free to close the chat window or end the chat.");
      setCurrentStep('done');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white w-[350px] sm:w-[400px] h-[550px] max-h-[85vh] rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.25)] border border-gray-200 flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-navy to-navy-light p-4 flex justify-between items-center border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center relative">
                  <Bot size={24} className="text-primary-light" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-navy rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-bold text-white leading-tight flex items-center gap-1">RentNear AI <Sparkles size={14} className="text-primary" /></h3>
                  <p className="text-xs text-primary-light">Advanced Knowledge Base</p>
                </div>
              </div>
              
              {/* Header Actions */}
              <div className="flex items-center gap-1">
                <button onClick={clearChat} title="Clear Chat" className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"><Trash2 size={16} /></button>
                <button onClick={endChat} title="End Chat" className="text-gray-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/10"><Power size={16} /></button>
                <button onClick={() => setIsOpen(false)} title="Minimize" className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 ml-1"><X size={20} /></button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#F8FAFC] flex flex-col gap-4 thin-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`flex max-w-[85%] gap-2 ${msg.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-auto ${msg.isBot ? 'bg-primary/20 text-primary' : 'bg-navy text-white shadow-md'}`}>
                      {msg.isBot ? <Bot size={16} /> : <User size={16} />}
                    </div>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.isBot 
                        ? 'bg-white border border-gray-100 text-gray-700 shadow-sm rounded-bl-sm' 
                        : 'bg-navy text-white rounded-br-sm shadow-md'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex max-w-[85%] gap-2 flex-row">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-auto"><Bot size={16} /></div>
                    <div className="px-4 py-3.5 bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm flex items-center gap-1">
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Interactive Options Area */}
            {!isTyping && (
              <div className="bg-white border-t border-gray-100 p-3 max-h-[200px] overflow-y-auto thin-scrollbar shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
                
                {currentStep === 'categories' && (
                  <div className="flex flex-col gap-2">
                    {Object.keys(FAQ_DB).map(cat => (
                      <button key={cat} onClick={() => handleCategorySelect(cat)} className="flex items-center justify-between w-full text-left bg-gray-50 hover:bg-primary/5 hover:border-primary border border-gray-200 p-3 rounded-xl transition-colors text-sm font-bold text-gray-700">
                        {cat} <ChevronRight size={16} className="text-gray-400"/>
                      </button>
                    ))}
                  </div>
                )}

                {currentStep === 'subcategories' && (
                  <div className="flex flex-col gap-2">
                    {Object.keys(FAQ_DB[selectedCategory]).map(subcat => (
                      <button key={subcat} onClick={() => handleSubcategorySelect(subcat)} className="flex items-center justify-between w-full text-left bg-gray-50 hover:bg-primary/5 hover:border-primary border border-gray-200 p-3 rounded-xl transition-colors text-sm font-bold text-gray-700">
                        {subcat} <ChevronRight size={16} className="text-gray-400"/>
                      </button>
                    ))}
                    <button onClick={() => { setCurrentStep('categories'); addBotMessage("Going back to main categories..."); }} className="mt-2 text-xs text-gray-500 hover:text-primary font-bold text-center w-full py-2">
                      ← Back to Main Menu
                    </button>
                  </div>
                )}

                {currentStep === 'questions' && (
                  <div className="flex flex-col gap-2">
                    {FAQ_DB[selectedCategory][selectedSubcategory].map((qObj, idx) => (
                      <button key={idx} onClick={() => handleQuestionSelect(qObj)} className="w-full text-left bg-gray-50 hover:bg-primary/5 hover:border-primary border border-gray-200 p-3 rounded-xl transition-colors text-sm font-medium text-gray-700">
                        {qObj.q}
                      </button>
                    ))}
                    <button onClick={() => { setCurrentStep('subcategories'); addBotMessage("Going back to subcategories..."); }} className="mt-2 text-xs text-gray-500 hover:text-primary font-bold text-center w-full py-2">
                      ← Back to Subcategories
                    </button>
                  </div>
                )}

                {currentStep === 'feedback' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleFeedback(true)} className="flex-1 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 p-3 rounded-xl font-bold transition-colors">
                      <ThumbsUp size={18} /> Yes
                    </button>
                    <button onClick={() => handleFeedback(false)} className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 p-3 rounded-xl font-bold transition-colors">
                      <ThumbsDown size={18} /> No
                    </button>
                  </div>
                )}

                {currentStep === 'next_action' && (
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleNextAction("Ask another question")} className="w-full bg-primary text-white p-3 rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-sm">
                      Ask another question
                    </button>
                    <button onClick={endChat} className="w-full bg-gray-100 text-gray-700 p-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                      End Chat
                    </button>
                  </div>
                )}

                {currentStep === 'done' && (
                  <div className="text-center p-4">
                    <p className="text-sm text-gray-500 mb-3">Chat session completed.</p>
                    <button onClick={clearChat} className="text-primary font-bold text-sm hover:underline">Start New Chat</button>
                  </div>
                )}

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-primary to-primary-light text-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(13,158,117,0.4)] relative border-[3px] border-white"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <X size={28} />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <MessageSquare size={28} />
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default AIChatbot;
