"use client";

import { useState, useEffect } from 'react';
import { Send, Phone, User, Clock } from 'lucide-react';

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  direction: 'inbound' | 'outbound';
  timestamp: string;
}

interface WATIChatInterfaceProps {
  entityId?: string;
  phone?: string;
  className?: string;
}

export function WATIChatInterface({ entityId, phone, className }: WATIChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [entityName, setEntityName] = useState('');

  // Load messages from Supabase
  useEffect(() => {
    if (phone || entityId) {
      loadMessages();
    }
  }, [phone, entityId]);

  const loadMessages = async () => {
    try {
      let query = new URLSearchParams();
      if (phone) query.set('phone', phone);
      if (entityId) query.set('entity_id', entityId);

      const response = await fetch(`/api/comms/messages?${query}`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.messages);
        if (data.messages[0]?.sender_name) {
          setEntityName(data.messages[0].sender_name);
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !phone) return;

    setLoading(true);
    try {
      const response = await fetch('/api/wati/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_text',
          phone,
          text: newMessage.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Add message to local state immediately
        const optimisticMessage: ChatMessage = {
          id: `temp-${Date.now()}`,
          text: newMessage.trim(),
          sender: 'אתה',
          direction: 'outbound',
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');

        // Reload to get actual message
        setTimeout(loadMessages, 1000);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`flex flex-col bg-slate-900 border border-slate-700 rounded-lg ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-3 border-b border-slate-700 bg-slate-800/50">
        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
          <User size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-slate-200 truncate">
            {entityName || phone || 'WhatsApp Chat'}
          </h3>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Phone size={10} />
            <span>{phone}</span>
          </div>
        </div>
        <div className="text-xs text-slate-500">
          {messages.length} הודעות
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0" style={{ maxHeight: '300px' }}>
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            אין הודעות עדיין
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  message.direction === 'outbound'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <div className={`flex items-center gap-1 mt-1 text-xs ${
                  message.direction === 'outbound' ? 'text-blue-200' : 'text-slate-400'
                }`}>
                  <Clock size={10} />
                  <span>
                    {new Date(message.timestamp).toLocaleTimeString('he-IL', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="p-3 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="הקלד הודעה..."
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !newMessage.trim() || !phone}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
          >
            <Send size={14} />
            שלח
          </button>
        </div>
      </div>
    </div>
  );
}