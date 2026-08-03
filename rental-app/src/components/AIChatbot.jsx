import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, Trash2, Power, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import Button from './Button';

const AIRentalAssistant = () => {
  const { user, isMock } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [sessionToken, setSessionToken] = useState(null);

  const messagesEndRef = useRef(null);

  // Load backend session token
  useEffect(() => {
    const loadSession = async () => {
      if (isMock) return;
      try {
        const { supabase } = await import('../supabaseClient');
        const { data } = await supabase.auth.getSession();
        setSessionToken(data?.session?.access_token);
      } catch (err) {
        console.warn('Unable to get session token:', err);
      }
    };
    loadSession();
  }, [isMock]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (messages.length === 0) {
      sendWelcomeMessage();
    }
  }, []);

  const sendWelcomeMessage = () => {
    setMessages([
      {
        id: 'welcome',
        text: "Hi! I'm your RentNear AI Rental Assistant ✨. I can help you find products near you, explain security deposits, check cancellation policies, or simulate custom item pricing. Ask me anything!",
        isBot: true,
        suggestedFollowUps: [
          'Find a camera under $80',
          'How do security deposits work?',
          'Who is the most trusted owner?'
        ]
      }
    ]);
  };

  const handleSendMessage = async (textToSend) => {
    const prompt = textToSend.trim();
    if (!prompt) return;

    // Add user message
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), text: prompt, isBot: false }]);
    setInputText('');
    setIsTyping(true);

    try {
      if (isMock) {
        // Mock Response generator fallback
        setTimeout(() => {
          let responseText = `I searched our local inventory catalog for "${prompt}". here are some matches:`;
          let richCards = [];
          
          if (prompt.toLowerCase().includes('camera')) {
            richCards = [
              { id: '1', title: 'Sony A7 IV Camera', price_per_day: 65.00, category: 'Cameras', images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500'] }
            ];
          } else if (prompt.toLowerCase().includes('drill')) {
            richCards = [
              { id: '2', title: 'Bosch Power Drill', price_per_day: 25.00, category: 'Tools', images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500'] }
            ];
          }

          setMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            text: richCards.length > 0 ? responseText : `I couldn\'t find direct inventory matching "${prompt}" in our mock database. Try asking for "camera" or "drill" to view mock rich cards!`,
            isBot: true,
            richCards,
            suggestedFollowUps: ['What is the deposit policy?', 'Can I reschedule delivery?']
          }]);
          setIsTyping(false);
        }, 1200);
      } else {
        // Real API query
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/ai/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify({ prompt })
        });

        const data = await res.json();
        if (data.success) {
          setMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            text: data.response,
            isBot: true,
            richCards: data.richCards || [],
            suggestedFollowUps: data.suggestedFollowUps || []
          }]);
        } else {
          throw new Error(data.error?.message || 'Failed to query assistant.');
        }
        setIsTyping(false);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        text: `Error: ${err.message}. Please try again later.`,
        isBot: true
      }]);
      setIsTyping(false);
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
            className="bg-[#F8FAFC] w-[350px] sm:w-[400px] h-[550px] max-h-[85vh] rounded-[2rem] shadow-[0_15px_50px_rgba(0,0,0,0.3)] border border-gray-200 flex flex-col overflow-hidden mb-4 animate-fade-in"
          >
            {/* Header */}
            <div className="bg-navy p-4 flex justify-between items-center border-b border-navy-light shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center relative">
                  <Bot size={24} className="text-primary-light" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-navy rounded-full shadow-sm"></span>
                </div>
                <div>
                  <h3 className="font-bold text-white leading-tight flex items-center gap-1">
                    AI Rental Assistant
                    <Sparkles size={14} className="text-indigo-400" />
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Verified Agent</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button onClick={() => { setMessages([]); sendWelcomeMessage(); }} title="Restart" className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"><RefreshCw size={18} /></button>
                <button onClick={() => setIsOpen(false)} title="Close" className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"><X size={22} /></button>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.isBot ? 'items-start' : 'items-end'} space-y-1`}>
                  <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs font-semibold leading-relaxed shadow-sm ${
                    msg.isBot ? 'bg-white text-gray-800 border border-gray-150' : 'bg-primary text-white'
                  }`}>
                    {msg.text}
                  </div>

                  {/* Render Rich Listing Cards */}
                  {msg.isBot && msg.richCards && msg.richCards.length > 0 && (
                    <div className="w-full space-y-2 mt-2">
                      {msg.richCards.map(card => (
                        <div key={card.id} className="bg-white border border-gray-150 rounded-2xl p-3 flex gap-3 shadow-sm hover:border-indigo-400/50 transition-all">
                          <img src={card.images?.[0] || 'https://via.placeholder.com/80'} alt="Listing" className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-navy text-xs truncate">{card.title}</div>
                            <div className="text-[10px] text-gray-400">{card.category}</div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-black text-xs text-primary">${card.price_per_day}/day</span>
                              <Button
                                onClick={() => { window.location.href = `/products/${card.id}`; }}
                                className="px-3 py-1 text-[10px] uppercase font-black"
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Render Suggested Follow-ups */}
                  {msg.isBot && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 justify-start max-w-full">
                      {msg.suggestedFollowUps.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(q)}
                          className="bg-white border border-gray-250 hover:border-indigo-400 hover:text-indigo-600 transition-all rounded-full px-3 py-1 text-[10px] font-bold text-gray-500 shadow-sm"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 text-gray-400 text-xs pl-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }} className="p-4 bg-white border-t border-gray-200 flex gap-2 items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask your assistant anything..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-3 bg-primary hover:bg-indigo-600 disabled:opacity-40 text-white rounded-xl shadow-md transition-all"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-br from-primary to-indigo-600 hover:from-indigo-600 hover:to-primary text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 z-40 relative border border-white/10"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

export default AIRentalAssistant;
