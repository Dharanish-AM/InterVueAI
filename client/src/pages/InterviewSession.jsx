import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { startInterview } from '../redux/slices/interviewSlice';
import { Send, Mic, User, Bot } from 'lucide-react';

const InterviewSession = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { session, isLoading } = useSelector((state) => state.interview);
  
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your AI interviewer today. I've analyzed your resume and I'm ready to begin. Shall we start with a brief introduction?" }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Simulate starting interview on load
    dispatch(startInterview({}));
  }, [dispatch]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "That's a great answer. Let's dig a bit deeper. Can you explain the technical challenges you faced in that situation?" 
      }]);
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Technical Interview</h1>
          <p className="text-slate-500 text-sm">Frontend Developer Role • Session ID: {id}</p>
        </div>
        <div className="flex gap-2">
          <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
            Recording
          </span>
          <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-medium">
            00:42
          </span>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="md:col-span-2 flex flex-col gap-4 h-full">
          {/* Video/Avatar Area */}
          <div className="bg-slate-900 aspect-video rounded-2xl flex items-center justify-center text-slate-400 relative overflow-hidden shadow-lg shrink-0 max-h-64">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50"></div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Bot className="w-10 h-10 text-primary-400" />
              </div>
              <p className="font-medium">AI Interviewer</p>
            </div>
          </div>
          
          {/* Chat Area */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    msg.role === 'user' ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary-600 text-white rounded-tr-none' 
                      : 'bg-slate-100 text-slate-700 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <div className="flex gap-2">
                <button className="p-3 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-primary-600 hover:border-primary-200 transition-colors">
                  <Mic className="w-5 h-5" />
                </button>
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your answer..." 
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                />
                <button 
                  onClick={handleSend}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 rounded-xl font-medium flex items-center gap-2 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6 overflow-y-auto pr-2">
          {/* Stats/Info */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4">Session Info</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span>Status</span>
                <span className="font-medium text-green-600">Live</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span>Questions</span>
                <span className="font-medium">1 / 5</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span>Current Topic</span>
                <span className="font-medium">Introduction</span>
              </div>
            </div>
          </div>

          {/* Hints */}
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-2 text-sm uppercase tracking-wide">AI Tip</h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              Try to structure your answer using the STAR method (Situation, Task, Action, Result) to provide a comprehensive response.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;
