import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useAuthStore from '../store/authStore';
import { MessageSquare, ChevronRight, Package } from 'lucide-react';

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        // Fetch all bookings where user is involved
        const { data: bookings, error: dbError } = await supabase
          .from('bookings')
          .select(`
            id,
            status,
            product:products(title, images),
            renter:users!bookings_renter_id_fkey(id, name, avatar_url),
            owner:users!bookings_owner_id_fkey(id, name, avatar_url)
          `)
          .or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (dbError) throw dbError;
        setConversations(bookings || []);
      } catch {
        setError('Failed to load conversations.');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare className="text-primary w-8 h-8" />
          <h1 className="text-3xl font-extrabold text-gray-900">Messages</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {conversations.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No conversations yet</h3>
              <p>Your messages with renters and owners will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map((chat) => {
                const isOwner = chat.owner.id === user.id;
                const otherPerson = isOwner ? chat.renter : chat.owner;
                const roleLabel = isOwner ? 'Renter' : 'Owner';

                return (
                  <div 
                    key={chat.id}
                    onClick={() => navigate(`/chat/${chat.id}`)}
                    className="p-6 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        {otherPerson.avatar_url ? (
                          <img src={otherPerson.avatar_url} alt="avatar" className="w-14 h-14 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xl border border-primary/20">
                            {otherPerson.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                      </div>
                      
                      {/* Details */}
                      <div>
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          {otherPerson.name}
                          <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md">
                            {roleLabel}
                          </span>
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Package size={14} /> {chat.product?.title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-gray-400 group-hover:text-primary transition-colors">
                      <div className="text-right hidden sm:block">
                        <span className="text-xs uppercase font-bold tracking-widest text-gray-400 block mb-1">Status</span>
                        <span className="text-sm font-medium text-gray-700 capitalize">{chat.status}</span>
                      </div>
                      <ChevronRight size={24} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Chat;
