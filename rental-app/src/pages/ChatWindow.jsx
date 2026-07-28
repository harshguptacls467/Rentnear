import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import useRealtimeStore from '../store/realtimeStore';
import useRealtimeChat from '../hooks/useRealtimeChat';
import usePresence from '../hooks/usePresence';
import { 
  ArrowLeft, Send, Package, Circle, Image as ImageIcon, Calendar, CreditCard, 
  CheckCircle2, XCircle, ShieldCheck, MapPin, Paperclip, X
} from 'lucide-react';
import Button from '../components/Button';
import { API_URL } from '../config/api';

const TypingIndicator = ({ name }) => (
  <div className="flex justify-start">
    <div className="bg-white border border-gray-150 text-gray-500 rounded-2xl rounded-tl-sm px-4 py-2.5 text-xs shadow-sm flex items-center gap-2">
      <span className="font-bold text-gray-700">{name || 'Neighbor'}</span> is typing
      <span className="flex items-center gap-0.5 ml-1">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
            style={{ animationDelay: `${i * 150}ms`, animationDuration: '1s' }}
          />
        ))}
      </span>
    </div>
  </div>
);

const ChatWindow = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, isMock } = useAuthStore();
  
  const [booking, setBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Image attachment states
  const [attachedImage, setAttachedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const resetUnread = useRealtimeStore(s => s.resetUnread);

  // Real-time chat hook
  const { typingUser, sendTypingIndicator, markMessagesRead } = useRealtimeChat(
    bookingId, user, setMessages, isMock
  );

  const { isUserOnline } = usePresence(user, `chat-presence-${bookingId}`);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

  useEffect(() => {
    resetUnread();
  }, [resetUnread]);

  const fetchChatData = async () => {
    try {
      if (!isMock) {
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            *,
            product:products(*)
          `)
          .eq('id', bookingId)
          .maybeSingle();

        if (bookingError) throw bookingError;
        setBooking(bookingData);

        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messagesData || []);

        const unreadIds = (messagesData || [])
          .filter(m => m.sender_id !== user.id && !m.read_at)
          .map(m => m.id);
        if (unreadIds.length > 0) markMessagesRead(unreadIds);
      } else {
        // Mock fallback
        const mockBookings = JSON.parse(localStorage.getItem('rentnear_local_bookings') || '[]');
        const found = mockBookings.find(b => b.id === bookingId);
        if (found) {
          // fetch mock product if exists
          const allProds = JSON.parse(localStorage.getItem('rentnear_local_products') || '[]');
          const prodObj = allProds.find(p => p.id === found.product_id) || { title: found.product?.title || 'Gear Listing' };
          
          setBooking({
            ...found,
            product: prodObj,
            renter: { id: found.renter_id, name: found.renter?.name || 'Renter', avatar_url: found.renter?.avatar_url },
            owner: { id: found.owner_id, name: found.owner?.name || 'Owner', avatar_url: found.owner?.avatar_url }
          });
        }
        
        // Mock messages
        const storedMsgs = JSON.parse(localStorage.getItem(`messages_${bookingId}`) || '[]');
        setMessages(storedMsgs);
      }
    } catch (err) {
      console.error("Error fetching chat:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchChatData();
    }
  }, [bookingId, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachedImage) return;

    const content = newMessage.trim();
    const imageToSend = attachedImage;
    setNewMessage('');
    setAttachedImage(null);
    sendTypingIndicator(false);

    try {
      if (!isMock) {
        const { error } = await supabase
          .from('messages')
          .insert([{
            booking_id: bookingId,
            sender_id: user.id,
            content: content,
            image_url: imageToSend
          }]);
        if (error) throw error;
      } else {
        // Save to mock storage
        const storedMsgs = JSON.parse(localStorage.getItem(`messages_${bookingId}`) || '[]');
        const newMsg = {
          id: 'msg-' + Math.random().toString(36).substring(2, 9),
          booking_id: bookingId,
          sender_id: user.id,
          content: content,
          image_url: imageToSend,
          created_at: new Date().toISOString(),
          read_at: null
        };
        const updated = [...storedMsgs, newMsg];
        localStorage.setItem(`messages_${bookingId}`, JSON.stringify(updated));
        setMessages(updated);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Mock upload attachments
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    
    // Simulate upload delay and convert to base64 or placeholder
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedImage(reader.result);
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateBookingStatus = async (newStatus) => {
    setLoading(true);
    try {
      if (!isMock) {
        const { error } = await supabase
          .from('bookings')
          .update({ status: newStatus })
          .eq('id', bookingId);
        if (error) throw error;
      } else {
        const mockBookings = JSON.parse(localStorage.getItem('rentnear_local_bookings') || '[]');
        const updated = mockBookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b);
        localStorage.setItem('rentnear_local_bookings', JSON.stringify(updated));
      }
      // Post system notification inside messages
      const storedMsgs = JSON.parse(localStorage.getItem(`messages_${bookingId}`) || '[]');
      const systemMsg = {
        id: 'msg-sys-' + Math.random().toString(36).substring(2, 9),
        booking_id: bookingId,
        sender_id: 'system',
        content: `Booking status changed to: ${newStatus.toUpperCase().replace('_', ' ')}`,
        created_at: new Date().toISOString()
      };
      if (isMock) {
        localStorage.setItem(`messages_${bookingId}`, JSON.stringify([...storedMsgs, systemMsg]));
      } else {
        await supabase.from('messages').insert([systemMsg]);
      }
      
      await fetchChatData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen pt-20 flex justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
  if (!booking) return <div className="text-center pt-20 text-gray-500">Conversation not found.</div>;

  const isOwner = booking.owner.id === user.id;
  const otherPerson = isOwner ? booking.renter : booking.owner;
  const otherPersonOnline = isUserOnline(otherPerson.id);

  // Status Helpers
  const statusLabels = {
    pending: 'Awaiting Owner Approval',
    approved: 'Awaiting Renter Payment',
    awaiting_handover: 'Ready for Pickup / Handover',
    active: 'Gear in Use / Rental Active',
    completed: 'Completed & Released',
    cancelled: 'Cancelled Reservation',
    rejected: 'Rejected Request'
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#F8FAFC]">
      
      {/* Top Header - Online presence status */}
      <div className="bg-white border-b border-gray-150 px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/chat')} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          
          <div className="relative">
            {otherPerson.avatar_url ? (
              <img src={otherPerson.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-gray-100" />
            ) : (
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold border border-primary/20">
                {otherPerson.name.charAt(0).toUpperCase()}
              </div>
            )}
            <Circle size={11} className={`absolute bottom-0 right-0 rounded-full border-2 border-white fill-current ${otherPersonOnline ? 'text-green-500' : 'text-gray-300'}`} />
          </div>
          
          <div>
            <h2 className="font-extrabold text-navy text-sm md:text-base leading-tight">{otherPerson.name}</h2>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 mt-0.5">
              {otherPersonOnline ? 'Online now' : 'Active 12m ago'}
            </p>
          </div>
        </div>
      </div>

      {/* Product Preview Card & Quick Context Actions banner */}
      <div className="bg-white border-b border-gray-150 px-4 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 z-20 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            <img src={booking.product?.images?.[0] || 'https://via.placeholder.com/150'} alt="product" className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="font-extrabold text-navy text-xs md:text-sm leading-tight line-clamp-1">{booking.product?.title}</h4>
            <p className="text-[10px] text-gray-400 mt-0.5 font-bold flex items-center gap-1.5">
              <span>Rate: ${booking.product?.price_per_day}/day</span>
              <span>•</span>
              <span className="text-primary font-black">{statusLabels[booking.status] || 'Unknown'}</span>
            </p>
          </div>
        </div>

        {/* Quick Booking Actions inside the chat box */}
        <div className="flex gap-2 justify-end">
          {booking.status === 'pending' && isOwner && (
            <>
              <button 
                onClick={() => handleUpdateBookingStatus('approved')}
                className="px-3.5 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Approve request
              </button>
              <button 
                onClick={() => handleUpdateBookingStatus('rejected')}
                className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-bold border border-red-200"
              >
                Reject
              </button>
            </>
          )}

          {booking.status === 'approved' && !isOwner && (
            <button 
              onClick={() => navigate(`/bookings/${booking.id}/pay`)}
              className="px-3.5 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1"
            >
              <CreditCard size={12} /> Pay & Confirm
            </button>
          )}

          {booking.status === 'awaiting_handover' && (
            <button 
              onClick={() => navigate(`/bookings/${booking.id}/handover`)}
              className="px-3.5 py-1.5 bg-primary text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1"
            >
              <CheckCircle2 size={12} /> Verify Handover
            </button>
          )}

          {booking.status === 'active' && !isOwner && (
            <button 
              onClick={() => navigate(`/bookings/${booking.id}/return`)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              Initiate Return
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="bg-white p-4 rounded-full mb-3 border border-gray-100">
              <Package size={28} className="text-gray-300" />
            </div>
            <p className="text-xs">No messages yet. Send a message to start neighborhood coordination!</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isSystem = msg.sender_id === 'system';
          const isMe = msg.sender_id === user.id;
          const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          if (isSystem) {
            return (
              <div key={msg.id || idx} className="flex justify-center my-2">
                <span className="bg-navy/5 border border-navy/10 text-navy text-[10px] font-black tracking-wider uppercase px-4 py-1.5 rounded-full">
                  ⚠️ {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm ${
                  isMe 
                    ? 'bg-primary text-white rounded-tr-sm shadow-primary/10' 
                    : 'bg-white border border-gray-150 text-gray-800 rounded-tl-sm'
                }`}
              >
                {msg.image_url && (
                  <div className="rounded-xl overflow-hidden mb-2 max-w-xs bg-gray-100 border border-gray-200">
                    <img src={msg.image_url} alt="Shared content" className="w-full h-auto object-cover max-h-48" />
                  </div>
                )}
                {msg.content && <p className="text-sm font-medium leading-relaxed">{msg.content}</p>}
                
                <div className="flex items-center justify-end gap-1 mt-1 text-[9px]">
                  <span className={isMe ? 'text-white/60' : 'text-gray-400'}>{time}</span>
                  {isMe && (msg.read_at ? <span className="text-white/80">✓✓</span> : <span className="text-white/50">✓</span>)}
                </div>
              </div>
            </div>
          );
        })}
        
        {typingUser && typingUser !== user.id && (
          <TypingIndicator name={otherPerson?.name} />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Sticky preview box for attached image */}
      {attachedImage && (
        <div className="bg-white border-t border-gray-200 p-3 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-14 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
              <img src={attachedImage} alt="Attachment preview" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs text-gray-500 font-bold">Image ready to send</span>
          </div>
          <button onClick={() => setAttachedImage(null)} className="p-1 hover:bg-gray-100 rounded-full text-red-500">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Message input drawer */}
      <div className="bg-white border-t border-gray-150 p-4 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-2 items-center">
          
          {/* File attachment button */}
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="p-3 bg-gray-100 text-gray-500 hover:text-navy rounded-full active:scale-95 transition-all"
          >
            <Paperclip size={18} />
          </button>
          
          <input 
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              sendTypingIndicator(!!e.target.value.trim());
            }}
            placeholder="Type a message..."
            className="flex-1 bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary rounded-full px-5 py-3 text-sm outline-none transition-all"
          />
          
          <button 
            type="submit"
            disabled={!newMessage.trim() && !attachedImage}
            className="bg-primary hover:bg-primary-dark text-white rounded-full p-3 h-12 w-12 flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50 disabled:shadow-none transition-all flex-shrink-0"
          >
            <Send size={16} className="ml-0.5" />
          </button>
        </form>
      </div>

    </div>
  );
};

export default ChatWindow;
