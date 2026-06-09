import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS = [
  "How does KYC work?",
  "What if my item breaks?",
  "When do I get paid?",
  "How to list an item?"
];

// Advanced Mock AI Logic
const generateAIResponse = (userMessage) => {
  const msg = userMessage.toLowerCase();
  
  if (msg.includes('kyc') || msg.includes('verify') || msg.includes('identity')) {
    return "Our Bank-Grade KYC requires you to upload a valid government ID (Aadhaar or PAN). Our automated system verifies it instantly. We do this to ensure everyone on RentNear is a real, trustworthy neighbor! 🛡️";
  }
  if (msg.includes('damage') || msg.includes('break') || msg.includes('broken') || msg.includes('insurance')) {
    return "Don't worry! We hold a security deposit on the renter's card. If an item is returned damaged, simply file a Dispute within 24 hours. Our team reviews the handover photos and compensates you from the deposit. 📸✅";
  }
  if (msg.includes('pay') || msg.includes('money') || msg.includes('earn')) {
    return "Payments are processed securely via Razorpay. The money is held in escrow until the rental period finishes. Once the item is safely returned, funds are transferred to your bank account within 2-3 business days! 💸";
  }
  if (msg.includes('list') || msg.includes('upload') || msg.includes('rent my')) {
    return "Listing an item is super easy! Just click 'List Item' in the menu, upload some clear photos, set your daily price, and provide a short description. It takes less than 2 minutes! 🚀";
  }
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
    return "Hello there! 👋 I'm your RentNear AI Assistant. How can I help you make the most out of renting today?";
  }
  if (msg.includes('scam') || msg.includes('safe') || msg.includes('trust')) {
    return "Safety is our #1 priority. Between mandatory KYC, digital condition checks with photo evidence, and secure escrow payments, we've eliminated the risks of peer-to-peer renting. You're in good hands! 🤝";
  }
  
  // Catch-all
  return "That's a great question! While I'm just an AI assistant, I recommend checking our FAQ section or emailing support@rentnear.com for highly specific inquiries. Is there anything else about renting, KYC, or payments I can help with? 🤔";
};

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm your RentNear AI Assistant ✨. How can I help you today?", isBot: true }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (text = inputValue) => {
    if (!text.trim()) return;

    // Add user message
    const newMsg = { id: Date.now(), text: text, isBot: false };
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const response = generateAIResponse(text);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: response, isBot: true }]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800); // Random delay between 1.2s - 2s
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white w-[350px] sm:w-[380px] h-[500px] max-h-[80vh] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-gray-200 flex flex-col overflow-hidden mb-4"
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
                  <p className="text-xs text-primary-light">Online & Ready to help</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4 thin-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`flex max-w-[85%] gap-2 ${msg.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-auto ${msg.isBot ? 'bg-primary/20 text-primary' : 'bg-navy text-white'}`}>
                      {msg.isBot ? <Bot size={16} /> : <User size={16} />}
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.isBot 
                        ? 'bg-white border border-gray-100 text-gray-700 shadow-sm rounded-bl-sm' 
                        : 'bg-navy text-white rounded-br-sm shadow-md'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex max-w-[85%] gap-2 flex-row">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-auto">
                      <Bot size={16} />
                    </div>
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

            {/* Quick Suggestions */}
            {messages.length < 3 && !isTyping && (
              <div className="bg-gray-50 px-4 pb-2 flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSend(suggestion)}
                    className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:bg-primary/5 hover:border-primary hover:text-primary transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
              <input 
                type="text" 
                placeholder="Ask me anything..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-gray-100 text-sm border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <button 
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isTyping}
                className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors shadow-md"
              >
                <Send size={18} className={inputValue.trim() ? 'translate-x-0.5' : ''} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-br from-primary to-primary-light text-white rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(13,158,117,0.4)] relative border-2 border-white"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageSquare size={24} />
              {/* Notification dot */}
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default AIChatbot;
