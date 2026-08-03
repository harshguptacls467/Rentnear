import { useState } from 'react';
import { Send, Radio, MessageSquare } from 'lucide-react';

const AdminSupportChats = ({ liveChats, onReply, onCloseChat }) => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const selectedChat = liveChats.find(c => c.id === selectedChatId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChatId) return;
    onReply(selectedChatId, replyText);
    setReplyText('');
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[500px] flex flex-col lg:flex-row gap-6">
      {/* Sidebar List */}
      <div className="lg:w-1/3 border-r border-gray-100 pr-0 lg:pr-6 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <Radio size={14} className="text-green-500 animate-ping" /> Active Chat Queue
          </h3>
          <p className="text-gray-500 text-[10px]">Real-time visitor and support sessions.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
          {liveChats.length === 0 ? (
            <p className="text-gray-400 text-xs italic p-4 text-center">No active chats in queue.</p>
          ) : (
            liveChats.map(chat => {
              const lastMsg = chat.messages[chat.messages.length - 1];
              return (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedChatId === chat.id 
                      ? 'bg-primary/5 border-primary/30 shadow-sm' 
                      : 'bg-gray-50 border-gray-100 hover:bg-gray-100/60'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-xs text-gray-800">{chat.userName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      chat.status === 'active' ? 'bg-green-55 text-green-700' : 'bg-gray-150 text-gray-500'
                    }`}>
                      {chat.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate mb-2">{chat.email}</p>
                  {lastMsg && (
                    <p className="text-xs text-gray-600 truncate font-semibold">
                      {lastMsg.sender === 'admin' ? 'You: ' : ''}{lastMsg.text}
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Conversation Pane */}
      <div className="flex-1 flex flex-col min-h-[400px]">
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
              <div>
                <h4 className="font-bold text-sm text-gray-900">{selectedChat.userName}</h4>
                <p className="text-xs text-gray-500">{selectedChat.email} &bull; ID: {selectedChat.id}</p>
              </div>
              {selectedChat.status === 'active' && (
                <button
                  onClick={() => onCloseChat(selectedChat.id)}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all"
                >
                  Resolve & Close Ticket
                </button>
              )}
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto space-y-4 max-h-[300px] mb-4 p-2 bg-gray-50/50 rounded-2xl border border-gray-100">
              {selectedChat.messages.length === 0 ? (
                <p className="text-gray-400 text-xs italic text-center p-8">No messages yet.</p>
              ) : (
                selectedChat.messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs ${
                      m.sender === 'admin' 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none font-semibold'
                    }`}>
                      <p>{m.text}</p>
                      <span className="text-[8px] opacity-75 mt-1 block text-right">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input form */}
            {selectedChat.status === 'active' ? (
              <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Type a real-time reply as support operator..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 focus:border-primary rounded-xl px-4 py-3 text-xs font-semibold outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-2"
                >
                  <Send size={12} /> Send Response
                </button>
              </form>
            ) : (
              <div className="p-4 bg-gray-100 text-gray-500 rounded-2xl text-center text-xs font-bold">
                This support ticket has been solved/closed.
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
            <MessageSquare size={48} className="text-gray-300 mb-3 animate-bounce" />
            <h4 className="font-bold text-gray-800 text-sm">No Ticket Selected</h4>
            <p className="text-gray-400 text-xs mt-1">Select an active customer support conversation from the sidebar to chat live.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupportChats;
