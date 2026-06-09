import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import { ArrowLeft, Send, Package } from 'lucide-react';

const ChatWindow = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [booking, setBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    // 1. Fetch Booking and Initial Messages
    const fetchChatData = async () => {
      try {
        // Fetch Booking
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            *,
            product:products(title),
            renter:users!bookings_renter_id_fkey(id, name, avatar_url),
            owner:users!bookings_owner_id_fkey(id, name, avatar_url)
          `)
          .eq('id', bookingId)
          .single();

        if (bookingError) throw bookingError;
        setBooking(bookingData);

        // Fetch Messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messagesData || []);

      } catch (err) {
        console.error("Error fetching chat:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();

    // 2. Set up Realtime Subscription
    // We subscribe to INSERTs on the messages table where booking_id matches
    const channel = supabase
      .channel(`chat-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          // payload.new contains the newly inserted message row
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    // 3. CLEANUP FUNCTION (Crucial for preventing Memory Leaks)
    // When the user leaves this page, React will run this return function
    // to destroy the subscription. If we don't do this, the network connection
    // stays open forever and multiple ghost connections build up!
    return () => {
      supabase.removeChannel(channel);
    };

  }, [bookingId, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage(''); // optimistic UI clear

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          booking_id: bookingId,
          sender_id: user.id,
          content: content
        }]);

      if (error) throw error;
      // Note: We don't need to update the state here! 
      // The Supabase Realtime subscription will catch our own INSERT 
      // and append it to the screen automatically.
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!booking) {
    return <div className="text-center pt-20 text-gray-500">Conversation not found.</div>;
  }

  const isOwner = booking.owner.id === user.id;
  const otherPerson = isOwner ? booking.renter : booking.owner;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50">
      
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 flex-shrink-0 shadow-sm z-10">
        <button 
          onClick={() => navigate('/chat')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        
        <div className="flex items-center gap-3">
          {otherPerson.avatar_url ? (
            <img src={otherPerson.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
          ) : (
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold border border-primary/20">
              {otherPerson.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div>
            <h2 className="font-bold text-gray-900 leading-tight">{otherPerson.name}</h2>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Package size={12} /> {booking.product?.title}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="bg-white p-4 rounded-full mb-3 shadow-sm border border-gray-100">
              <Package size={32} className="text-gray-300" />
            </div>
            <p className="text-sm">This is the beginning of your conversation.</p>
            <p className="text-xs mt-1">Messages are end-to-end encrypted.</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === user.id;
          
          // Format time
          const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                  isMe 
                    ? 'bg-primary text-white rounded-tr-sm shadow-md shadow-primary/20' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className={`text-[10px] text-right mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                  {time}
                </p>
              </div>
            </div>
          );
        })}
        
        {/* Invisible div to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-full px-6 py-3 text-sm outline-none transition-all"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-primary hover:bg-primary-dark text-white rounded-full p-3 h-12 w-12 flex items-center justify-center shadow-lg shadow-primary/30 disabled:opacity-50 disabled:shadow-none transition-all transform active:scale-95"
          >
            <Send size={18} className="ml-1" />
          </button>
        </form>
      </div>

    </div>
  );
};

export default ChatWindow;
