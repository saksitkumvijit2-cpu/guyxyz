
import React, { useState, useCallback } from 'react';
// FIX: AI features are disabled.
// import { generateGroundedAnswer } from '../services/geminiService';
import { GroundingChunk } from '../types';
// FIX: Import ResearchIcon to be used in the component.
import { Spinner, ResearchIcon } from './Icons';
import { marked } from 'marked';

interface Message {
  text: string;
  isUser: boolean;
  sources?: GroundingChunk[];
}

export const ResearchAssistant: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim()) return;

    const newMessages: Message[] = [...messages, { text: prompt, isUser: true }];
    setMessages(newMessages);
    setPrompt('');
    setIsLoading(true);
    setError(null);

    try {
      // FIX: AI features are disabled. The call to generateGroundedAnswer is removed and an error is shown instead.
      // const response = await generateGroundedAnswer(prompt);
      // const text = response.text;
      // const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      // const botMessage: Message = { text, isUser: false, sources: sources || [] };
      // setMessages([...newMessages, botMessage]);
      setError('คุณสมบัติด้าน AI ถูกปิดใช้งาน');

    } catch (err) {
      // setError('ไม่สามารถรับคำตอบได้ กรุณาลองใหม่อีกครั้ง');
      setError('คุณสมบัติด้าน AI ถูกปิดใช้งาน');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, messages]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
    }
  };

  const renderMessage = (msg: Message, index: number) => {
    const htmlContent = marked.parse(msg.text);
    return (
        <div key={index} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl p-3 rounded-lg ${msg.isUser ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: htmlContent }}></div>
                {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 border-t border-gray-300 dark:border-gray-600 pt-2">
                        <h4 className="text-xs font-semibold mb-1">แหล่งข้อมูล:</h4>
                        <ul className="list-disc list-inside text-xs space-y-1">
                            {msg.sources.map((source, i) => source.web && (
                                <li key={i}>
                                    <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-primary-200 dark:text-primary-300 hover:underline">
                                        {source.web.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg h-[80vh] flex flex-col">
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 h-full flex flex-col justify-center items-center">
                    <ResearchIcon className="h-16 w-16 text-gray-400" />
                    <p className="mt-2">สอบถามเกี่ยวกับข่าวสารหรือกฎระเบียบแรงงานต่างด้าวล่าสุด</p>
                </div>
            )}
            {messages.map(renderMessage)}
            {isLoading && (
                 <div className="flex justify-start">
                    <div className="max-w-xl p-3 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center">
                        <Spinner /> <span className="ml-2">กำลังคิด...</span>
                    </div>
                </div>
            )}
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <div className="flex items-center space-x-2">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="ถามคำถาม..."
                    rows={1}
                    className="flex-grow bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-black dark:text-gray-100"
                    />
                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
                >
                    ส่ง
                </button>
            </div>
        </div>
    </div>
  );
};
