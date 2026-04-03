'use client';

import React, { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  id: string;
  type: 'user' | 'scout' | 'agent';
  content: string;
  agent?: string;
  timestamp: Date;
  metadata?: any;
}

interface Agent {
  name: string;
  display_name: string;
  avatar: string;
  description: string;
  capabilities: string[];
}

const AGENTS: Record<string, Agent> = {
  millie: {
    name: 'millie',
    display_name: 'מילי',
    avatar: '📅',
    description: 'מנהלת יומנים ומשימות',
    capabilities: ['יצירת פגישות', 'עדכון יומן', 'תזכורות'],
  },
  brandon: {
    name: 'brandon',
    display_name: 'ברנדון',
    avatar: '📋',
    description: 'מנהל משימות וטסקים',
    capabilities: ['עדכון סטטוס משימות', 'דוחות התקדמות'],
  },
  steve: {
    name: 'steve',
    display_name: 'סטיב',
    avatar: '💰',
    description: 'מנהל נתונים כלכליים',
    capabilities: ['דוחות iCount', 'נתונים פיננסיים'],
  },
  kelly: {
    name: 'kelly',
    display_name: 'קלי',
    avatar: '👥',
    description: 'מנהלת לידים ולקוחות',
    capabilities: ['יצירת לידים באוריגמי', 'ניהול קשרים'],
  },
  andrea: {
    name: 'andrea',
    display_name: 'אנדריאה',
    avatar: '📄',
    description: 'מנהלת חוזים ומסמכים',
    capabilities: ['אישור חוזים', 'ניהול מסמכים'],
  },
};

export function VirtualOfficeChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'scout',
      content: 'שלום גל! 👋 אני Scout, המזכירה הווירטואלית שלך. אני יכולה לעזור לך עם יומנים, משימות, נתונים ועוד. מה תרצה לעשות היום?',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const identifyIntentAndAgent = (userMessage: string): { agent: string | null, action: string | null, confidence: number } => {
    const message = userMessage.toLowerCase();

    // Calendar/scheduling patterns
    if (message.includes('יומן') || message.includes('פגישה') || message.includes('תור') ||
        message.includes('לקבוע') || message.includes('calendar') || message.includes('meeting')) {
      return { agent: 'millie', action: 'calendar_management', confidence: 0.9 };
    }

    // Task management patterns
    if (message.includes('משימה') || message.includes('טסק') || message.includes('סטטוס') ||
        message.includes('task') || message.includes('הושלם') || message.includes('בעבודה')) {
      return { agent: 'brandon', action: 'task_management', confidence: 0.85 };
    }

    // Financial/accounting patterns
    if (message.includes('כסף') || message.includes('חשבון') || message.includes('icount') ||
        message.includes('דוח') || message.includes('הכנסה') || message.includes('הוצאה')) {
      return { agent: 'steve', action: 'financial_data', confidence: 0.8 };
    }

    // CRM/leads patterns
    if (message.includes('לקוח') || message.includes('ליד') || message.includes('אוריגמי') ||
        message.includes('origami') || message.includes('קשר') || message.includes('פתיחת')) {
      return { agent: 'kelly', action: 'crm_management', confidence: 0.8 };
    }

    // Contract/document patterns
    if (message.includes('חוזה') || message.includes('מסמך') || message.includes('אישור') ||
        message.includes('contract') || message.includes('נבדק') || message.includes('חתום')) {
      return { agent: 'andrea', action: 'document_management', confidence: 0.75 };
    }

    return { agent: null, action: null, confidence: 0 };
  };

  const executeAgentAction = async (agent: string, action: string, userMessage: string): Promise<any> => {
    // Mock implementation - in real version this would call the virtual-office-execute function
    console.log(`[Scout] Delegating to ${agent} for ${action}:`, userMessage);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (agent === 'millie') {
      return {
        success: true,
        result: {
          message: '✅ בדקתי את היומן שלך. יש לך זמן פנוי מחר ב-10:00. אפתח לך פגישה?',
          calendar_link: 'https://calendar.google.com/calendar',
        }
      };
    }

    if (agent === 'brandon') {
      return {
        success: true,
        result: {
          message: '📋 יש לך 5 משימות פתוחות. 2 בעדיפות גבוהה. האם תרצה שאעדכן סטטוס של איזושהי משימה?',
          tasks_count: 5,
          high_priority: 2,
        }
      };
    }

    return {
      success: false,
      error: `${agent} לא מוכן עדיין`,
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Scout analyzes the message
      const scoutThinking: Message = {
        id: `scout-${Date.now()}`,
        type: 'scout',
        content: '🤔 אני מנתחת את הבקשה שלך...',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, scoutThinking]);

      // Identify intent and agent
      const { agent, action, confidence } = identifyIntentAndAgent(userMessage.content);

      if (!agent || confidence < 0.7) {
        // Scout couldn't identify clear intent
        const scoutResponse: Message = {
          id: `scout-response-${Date.now()}`,
          type: 'scout',
          content: '🤷‍♀️ לא הבנתי בדיוק מה אתה רוצה שאעשה. אני יכולה לעזור עם:\n\n📅 יומנים ופגישות (מילי)\n📋 משימות וטסקים (ברנדון)\n💰 נתונים כלכליים (סטיב)\n👥 לידים ולקוחות (קלי)\n📄 חוזים ומסמכים (אנדריאה)\n\nמה מהאפשרויות האלה מעניין אותך?',
          timestamp: new Date(),
        };
        setMessages(prev => prev.slice(0, -1).concat([scoutResponse]));
        setIsLoading(false);
        return;
      }

      // Scout delegates to appropriate agent
      const agentInfo = AGENTS[agent];
      const scoutDelegation: Message = {
        id: `scout-delegation-${Date.now()}`,
        type: 'scout',
        content: `🎯 העברתי את הבקשה ל${agentInfo.display_name} ${agentInfo.avatar} - היא מומחית ב${agentInfo.description}`,
        timestamp: new Date(),
      };
      setMessages(prev => prev.slice(0, -1).concat([scoutDelegation]));

      // Execute agent action
      const result = await executeAgentAction(agent, action!, userMessage.content);

      if (result.success) {
        const agentResponse: Message = {
          id: `agent-${agent}-${Date.now()}`,
          type: 'agent',
          content: result.result.message,
          agent: agentInfo.display_name,
          timestamp: new Date(),
          metadata: result.result,
        };
        setMessages(prev => [...prev, agentResponse]);
      } else {
        const scoutError: Message = {
          id: `scout-error-${Date.now()}`,
          type: 'scout',
          content: `❌ מצטערת, ${agentInfo.display_name} נתקלה בבעיה: ${result.error}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, scoutError]);
      }

    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'scout',
        content: '❌ אירעה שגיאה בעיבוד הבקשה. אנא נסה שוב.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Virtual Office</h3>
          <p className="text-sm text-gray-600">Scout + הצוות הווירטואלי</p>
        </div>
        <div className="flex space-x-2">
          {Object.values(AGENTS).map((agent) => (
            <div
              key={agent.name}
              className="flex flex-col items-center p-2 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-gray-200 transition-colors"
              title={`${agent.display_name} - ${agent.description}`}
            >
              <span className="text-xl mb-1">{agent.avatar}</span>
              <span className="text-xs font-medium text-gray-700">{agent.display_name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-xs lg:max-w-md px-3 py-2 rounded-lg
                ${message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.type === 'scout'
                  ? 'bg-gray-100 text-gray-800 border border-gray-200'
                  : 'bg-green-100 text-green-800 border border-green-200'
                }
              `}
            >
              {message.type !== 'user' && (
                <div className="flex items-center mb-1">
                  <span className="text-sm font-medium">
                    {message.type === 'scout' ? '🤖 Scout' : `${AGENTS[message.agent?.toLowerCase() || '']?.avatar || '👤'} ${message.agent}`}
                  </span>
                </div>
              )}
              <p className="text-sm whitespace-pre-line">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 border border-gray-200 px-3 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse flex space-x-1">
                  <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                </div>
                <span className="text-sm">עובד...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex space-x-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="כתוב כאן מה אתה רוצה לעשות..."
            className="
              flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              text-sm
            "
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="
              px-4 py-2 bg-blue-600 text-white rounded-lg font-medium
              hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            שלח
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {[
            '📅 תקבע לי פגישה מחר',
            '📋 מה המשימות הפתוחות שלי?',
            '💰 איך החודש הכלכלית?',
            '👥 פתח ליד חדש באוריגמי',
            '📄 סמן את החוזה כנבדק'
          ].map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setInputValue(suggestion)}
              className="
                px-2 py-1 text-xs bg-white border border-gray-200 rounded
                hover:border-gray-300 hover:bg-gray-50 transition-colors
                text-gray-700
              "
              disabled={isLoading}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}