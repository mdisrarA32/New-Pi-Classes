'use client';

import { useState, useRef, useEffect } from 'react';
import { sendChatMessage, ChatMessagePayload } from '@/lib/api';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ isLimited: boolean; message?: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isSending, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prompt = inputPrompt.trim();
    if (!prompt || isSending || rateLimitInfo?.isLimited) return;

    const userMsg: ChatMessagePayload = {
      role: 'user',
      content: prompt,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsSending(true);

    try {
      // Pass transient history (last 6 turns)
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendChatMessage(prompt, historyPayload);

      if (res.success && res.reply) {
        const assistantMsg: ChatMessagePayload = {
          role: 'assistant',
          content: res.reply,
          id: (Date.now() + 1).toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else if (res.error) {
        if (res.error.code === 'RATE_LIMITED') {
          setRateLimitInfo({
            isLimited: true,
            message: res.error.message || 'Daily limit of 40 messages reached.',
          });
        }
        const errorMsg: ChatMessagePayload = {
          role: 'assistant',
          content: `⚠️ ${res.error.message}`,
          id: (Date.now() + 1).toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Failed to connect to AI Tutor proxy server.',
          id: (Date.now() + 1).toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Floating Chat Bubble Toggle Button (Bottom-Right, Gold Glow Accent) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI STEM Tutor Chat"
        className="fixed bottom-6 right-6 z-50 bg-[#0F1B3D] text-white p-3.5 sm:p-4 rounded-full shadow-xl shadow-[#E8B84A]/30 border border-[#E8B84A]/60 hover:scale-105 transition-all flex items-center justify-center group"
      >
        <span className="text-xl sm:text-2xl">{isOpen ? '✕' : '🤖'}</span>
        {!isOpen && (
          <span className="hidden sm:inline-block ml-2 text-xs font-semibold pr-1 text-[#E8B84A]">
            AI Tutor
          </span>
        )}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8B84A] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E8B84A]"></span>
        </span>
      </button>

      {/* Floating Chat Panel Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[380px] h-[520px] max-h-[75vh] bg-white rounded-2xl shadow-2xl border border-[#0F1B3D]/15 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header Panel */}
          <div className="bg-[#0F1B3D] text-white p-4 border-b border-[#0F1B3D]/20 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-white/10 border border-[#E8B84A]/40 flex items-center justify-center text-lg">
                🤖
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                  NPC AI STEM Tutor
                  <span className="text-[10px] font-mono font-normal bg-[#E8B84A]/20 text-[#E8B84A] px-1.5 py-0.5 rounded">
                    Groq Proxy
                  </span>
                </h3>
                <p className="text-[11px] text-[#F7F7F5]/70 font-mono">
                  Class XI/XII Physics • Chem • Bio • Math
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white text-base p-1 rounded transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Daily Quota Indicator Strip */}
          <div className="bg-[#F7F7F5] border-b border-[#0F1B3D]/10 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-[#0F1B3D]/70">
            <span>⚡ Scoped Doubts Assistant</span>
            <span className="text-[#0F1B3D]/90 font-bold">Quota: 40 msgs / day</span>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F7F7F5]/40 text-xs">
            {messages.length === 0 && (
              <div className="my-6 p-4 rounded-xl bg-white border border-[#0F1B3D]/10 text-center space-y-2 shadow-sm">
                <span className="text-2xl block">💡</span>
                <p className="font-display font-semibold text-sm text-[#0F1B3D]">
                  Ask any STEM Syllabus Question!
                </p>
                <p className="text-[#0F1B3D]/70 text-[11px] leading-relaxed">
                  I can solve Physics numericals, explain Organic reaction mechanisms, clarify Biology terms, and solve Maths formulas.
                </p>
                <div className="pt-2 flex flex-wrap gap-1.5 justify-center text-[10px] font-mono text-[#0F1B3D]/80">
                  <span className="bg-[#F7F7F5] px-2 py-1 rounded border border-[#0F1B3D]/10">
                    &quot;State Newton&apos;s 2nd Law&quot;
                  </span>
                  <span className="bg-[#F7F7F5] px-2 py-1 rounded border border-[#0F1B3D]/10">
                    &quot;Explain Photosynthesis&quot;
                  </span>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id || Math.random().toString()}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#0F1B3D] text-white rounded-br-none shadow-sm'
                      : msg.isError
                      ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-none font-mono text-[11px]'
                      : 'bg-white text-[#0F1B3D] border border-[#0F1B3D]/10 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.timestamp && (
                  <span className="text-[9px] font-mono text-[#0F1B3D]/40 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                )}
              </div>
            ))}

            {isSending && (
              <div className="flex items-center space-x-2 text-[#0F1B3D]/60 py-2">
                <div className="w-6 h-6 rounded-full bg-white border border-[#0F1B3D]/10 flex items-center justify-center text-xs">
                  🤖
                </div>
                <div className="bg-white border border-[#0F1B3D]/10 rounded-xl px-3 py-1.5 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-[#0F1B3D]/50 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-[#0F1B3D]/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-[#0F1B3D]/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            {rateLimitInfo?.isLimited && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-mono space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <span>🛑</span> Rate Limit Exceeded
                </p>
                <p>{rateLimitInfo.message}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Form Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-[#0F1B3D]/10 flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={
                  rateLimitInfo?.isLimited
                    ? 'Daily quota limit reached...'
                    : 'Ask a Class XI/XII STEM question...'
                }
                disabled={isSending || rateLimitInfo?.isLimited}
                className="flex-1 bg-[#F7F7F5] border border-[#0F1B3D]/15 rounded-xl px-3.5 py-2 text-xs text-[#0F1B3D] placeholder-[#0F1B3D]/40 focus:outline-none focus:border-[#0F1B3D] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || isSending || rateLimitInfo?.isLimited}
                className="bg-[#0F1B3D] text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-[#0F1B3D]/90 disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <span>Send</span>
              </button>
            </div>
            <p className="text-[9.5px] text-[#0F1B3D]/40 text-center font-mono">
              Client-side session • History resets on page reload
            </p>
          </form>
        </div>
      )}
    </>
  );
}
