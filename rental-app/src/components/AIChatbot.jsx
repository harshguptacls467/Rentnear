import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, Trash2, Power, ThumbsUp, ThumbsDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// MASSIVE FAQ DATABASE
// ==========================================
const FAQ_DB = {
  "Trust & Safety": {
    "KYC & Verification": [
      { q: "How does KYC work?", a: "We require a government ID (Aadhaar/PAN) for all users. Our automated system verifies it instantly. This ensures everyone is a verified neighbor." },
      { q: "Is my data safe?", a: "Yes. Your KYC data is encrypted and securely stored. It is never shared with other users." },
      { q: "Do I have to verify to browse?", a: "No, browsing is free. However, you must complete KYC before you can rent or list an item." }
    ],
    "Insurance & Damage": [
      { q: "What if my item breaks?", a: "RentNear holds a security deposit on the renter's card. If damaged, file a dispute within 24 hours with photos to get compensated." },
      { q: "How is the deposit calculated?", a: "Owners set their own security deposit amount. We recommend setting it to roughly 30-50% of the item's retail value." },
      { q: "What if an item is stolen?", a: "Theft is extremely rare due to strict KYC. In such an event, we cooperate with authorities and the renter's deposit is forfeited to you." }
    ]
  },
  "Payments & Earnings": {
    "Getting Paid": [
      { q: "When do I get paid?", a: "Payments are held in secure escrow. Once the rental ends, funds are released to your bank account within 2-3 business days." },
      { q: "Payment methods?", a: "We support UPI, Credit/Debit cards, and Net Banking securely via Razorpay." },
      { q: "Are there hidden fees?", a: "We charge a transparent 10% platform fee on rentals to cover insurance and payment processing." }
    ],
    "Refunds & Cancellations": [
      { q: "Can a renter cancel?", a: "Yes, renters get a full refund if they cancel at least 24 hours before pickup." },
      { q: "How do deposit refunds work?", a: "The deposit is an authorization hold. Once the item is returned safely, the hold is released immediately." }
    ]
  },
  "Renting & Listing": {
    "Listing an Item": [
      { q: "How to list an item?", a: "Click 'List Item' in the dashboard. Upload clear photos, write a description, set your price and deposit. Takes 2 minutes!" },
      { q: "What should I charge?", a: "A good rule of thumb is 5-10% of the item's retail value per day." },
      { q: "Can I pause my listing?", a: "Yes! In your dashboard, you can toggle the availability switch to 'off' anytime." }
    ],
    "The Rental Process": [
      { q: "How do handovers work?", a: "You arrange a safe public meeting spot. Both parties inspect the item and take photos before the exchange." },
      { q: "What if it's returned late?", a: "The renter is charged for extra days plus a late fee, which goes directly to you." }
    ]
  },
  "Account Support": {
    "Managing Account": [
      { q: "How to change my email?", a: "Update your contact details in the 'Profile' section. Email changes require a verification link." },
      { q: "How to delete my account?", a: "Request deletion from Profile settings. Active rentals must be completed first." }
    ],
    "Technical Issues": [
      { q: "The app is crashing", a: "Please try clearing your browser cache or updating your app. If the issue persists, contact support." },
      { q: "I didn't receive my OTP", a: "Please wait 60 seconds and click 'Resend OTP'. Ensure you have strong network coverage." }
    ]
  }
};

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Messages state: array of { id, text, isBot, options: [] (optional) }
  const [messages, setMessages] = useState([]);
  
  // Navigation State to track where we are in the FAQ tree
  const [navState, setNavState] = useState({ category: null, subcategory: null });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (messages.length === 0) {
      sendMainMenu();
    }
  }, []);

  const clearChat = () => {
    setMessages([]);
    setNavState({ category: null, subcategory: null });
    sendMainMenu();
  };

  const endChat = () => {
    setIsOpen(false);
    setTimeout(clearChat, 500); // reset quietly in background
  };

  // --- BOT MESSAGE HELPERS ---
  
  // Send the main categories
  const sendMainMenu = () => {
    const categories = Object.keys(FAQ_DB);
    const options = categories.map(cat => ({ label: cat, action: () => handleCategory(cat) }));
    addBotMessage("Hi! I'm your RentNear AI Assistant ✨. Please choose a topic below so I can assist you:", options);
  };

  const handleCategory = (category) => {
    addUserMessage(category);
    setNavState({ category, subcategory: null });
    
    const subcategories = Object.keys(FAQ_DB[category]);
    const options = subcategories.map(sub => ({ label: sub, action: () => handleSubcategory(category, sub) }));
    options.push({ label: "⬅️ Back to Main Menu", action: sendMainMenu, isSecondary: true });

    setIsTyping(true);
    setTimeout(() => {
      addBotMessage(`Here are the subtopics for "${category}". What do you need help with?`, options, 0);
    }, 600);
  };

  const handleSubcategory = (category, subcategory) => {
    addUserMessage(subcategory);
    setNavState({ category, subcategory });
    
    const questions = FAQ_DB[category][subcategory];
    const options = questions.map(qObj => ({ label: qObj.q, action: () => handleQuestion(category, subcategory, qObj) }));
    options.push({ label: "⬅️ Back to Subcategories", action: () => handleCategory(category), isSecondary: true });

    setIsTyping(true);
    setTimeout(() => {
      addBotMessage(`Common questions about "${subcategory}":`, options, 0);
    }, 600);
  };

  const handleQuestion = (category, subcategory, qObj) => {
    addUserMessage(qObj.q);
    
    setIsTyping(true);
    setTimeout(() => {
      // Send Answer
      addBotMessage(qObj.a, null, 0);
      
      // Then ask for feedback
      setIsTyping(true);
      setTimeout(() => {
        const feedbackOptions = [
          { label: "👍 Yes, satisfied", action: () => handleFeedback(true) },
          { label: "👎 No, need more help", action: () => handleFeedback(false) }
        ];
        addBotMessage("Did this completely answer your question?", feedbackOptions, 0);
      }, 1000);
    }, 1200);
  };

  const handleFeedback = (isSatisfied) => {
    addUserMessage(isSatisfied ? "👍 Yes, satisfied" : "👎 No, need more help");
    
    const nextOptions = [
      { label: "💬 Ask another question", action: () => {
        addUserMessage("Ask another question");
        setIsTyping(true);
        setTimeout(() => sendMainMenu(), 600);
      }},
      { label: "👋 End Chat", action: () => {
        addUserMessage("End Chat");
        setIsTyping(true);
        setTimeout(() => {
          addBotMessage("Thanks for chatting! Feel free to close the window.", null, 0);
        }, 600);
      }, isSecondary: true }
    ];

    setIsTyping(true);
    setTimeout(() => {
      if (isSatisfied) {
        addBotMessage("Awesome! I'm glad I could help. What would you like to do next?", nextOptions, 0);
      } else {
        addBotMessage("I'm sorry to hear that. For detailed help, please email support@rentnear.com. What would you like to do next?", nextOptions, 0);
      }
    }, 800);
  };


  // --- CORE MESSAGE ADDERS ---

  const addBotMessage = (text, options = null, delay = 600) => {
    if (delay > 0) setIsTyping(true);
    
    const pushMsg = () => {
      // Remove options from previous messages to prevent clicking old options
      setMessages(prev => {
        const cleaned = prev.map(m => ({ ...m, options: null })); // clear old options
        return [...cleaned, { id: Date.now() + Math.random(), text, isBot: true, options }];
      });
      setIsTyping(false);
    };

    if (delay > 0) {
      setTimeout(pushMsg, delay);
    } else {
      pushMsg();
    }
  };

  const addUserMessage = (text) => {
    setMessages(prev => {
      const cleaned = prev.map(m => ({ ...m, options: null })); // user message clears bot options
      return [...cleaned, { id: Date.now() + Math.random(), text, isBot: false }];
    });
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
            className="bg-[#F8FAFC] w-[350px] sm:w-[400px] h-[550px] max-h-[85vh] rounded-[2rem] shadow-[0_10px_50px_rgba(0,0,0,0.25)] border border-gray-200 flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-navy p-4 flex justify-between items-center border-b border-navy-light shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center relative">
                  <Bot size={24} className="text-primary-light" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-navy rounded-full shadow-sm"></span>
                </div>
                <div>
                  <h3 className="font-bold text-white leading-tight flex items-center gap-1">RentNear AI <Sparkles size={14} className="text-primary" /></h3>
                  <p className="text-xs text-gray-400">Online 24/7</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button onClick={clearChat} title="Clear Chat" className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"><Trash2 size={18} /></button>
                <button onClick={endChat} title="End Chat" className="text-gray-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/10"><Power size={18} /></button>
                <button onClick={() => setIsOpen(false)} title="Minimize" className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 ml-1"><X size={22} /></button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 thin-scrollbar scroll-smooth">
              {messages.map((msg, index) => {
                const isLast = index === messages.length - 1;
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id} 
                    className={`flex flex-col ${msg.isBot ? 'items-start' : 'items-end'}`}
                  >
                    {/* The Bubble */}
                    <div className={`flex max-w-[88%] gap-2 ${msg.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-auto shadow-sm ${msg.isBot ? 'bg-white text-primary border border-gray-100' : 'bg-primary text-white'}`}>
                        {msg.isBot ? <Bot size={16} /> : <User size={16} />}
                      </div>
                      <div className={`px-4 py-3 text-[14px] leading-relaxed shadow-sm ${
                        msg.isBot 
                          ? 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-sm' 
                          : 'bg-primary text-white rounded-2xl rounded-br-sm font-medium'
                      }`}>
                        {msg.text}
                      </div>
                    </div>

                    {/* The Options (if any) rendered directly below the bot bubble */}
                    {msg.options && (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        className="mt-3 ml-10 flex flex-wrap gap-2 max-w-[90%]"
                      >
                        {msg.options.map((opt, idx) => (
                          <button 
                            key={idx}
                            onClick={opt.action}
                            className={`text-left px-4 py-2.5 rounded-xl text-[13px] font-bold shadow-sm transition-all duration-200 active:scale-95 ${
                              opt.isSecondary 
                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200' 
                                : 'bg-white text-primary border border-primary/20 hover:border-primary hover:bg-primary/5 hover:shadow-md'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex max-w-[85%] gap-2 flex-row">
                    <div className="w-8 h-8 rounded-full bg-white text-primary border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0 mt-auto"><Bot size={16} /></div>
                    <div className="px-4 py-4 bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-primary/40 rounded-full" />
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary/40 rounded-full" />
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary/40 rounded-full" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-primary to-primary-light text-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(13,158,117,0.4)] relative border-[3px] border-white z-50"
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
