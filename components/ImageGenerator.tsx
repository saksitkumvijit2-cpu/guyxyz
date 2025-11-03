
import React, { useState, useCallback } from 'react';
// FIX: AI features are disabled.
// import { generateImage } from '../services/geminiService';
import { Spinner } from './Icons';

const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];

export const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!prompt) {
      setError('กรุณาป้อนคำสั่งเพื่อสร้างรูปภาพ');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    try {
      // FIX: AI features are disabled. The call to generateImage is removed and an error is shown instead.
      // const resultBase64 = await generateImage(prompt, aspectRatio);
      // setGeneratedImage(`data:image/jpeg;base64,${resultBase64}`);
      setError('คุณสมบัติด้าน AI ถูกปิดใช้งาน');
    } catch (err) {
      // setError('สร้างรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      setError('คุณสมบัติด้าน AI ถูกปิดใช้งาน');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, aspectRatio]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow space-y-6">
      <div>
        <label htmlFor="prompt-gen" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          คำสั่งสำหรับสร้างภาพ
        </label>
        <textarea
          id="prompt-gen"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="เช่น ภาพเมืองแห่งอนาคตตอนพระอาทิตย์ตก, ภาพเสมือนจริง"
          className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500 text-black dark:text-gray-100"
        />
      </div>

      <div>
          <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">อัตราส่วนภาพ</label>
          <select id="aspect-ratio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md text-black dark:text-gray-100">
              {aspectRatios.map(ar => <option key={ar} value={ar}>{ar}</option>)}
          </select>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full flex justify-center items-center bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
      >
        {isLoading ? <><Spinner /> กำลังสร้าง...</> : 'สร้างรูปภาพ'}
      </button>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <div className="w-full mt-6 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center min-h-[300px]">
        {isLoading ? (
            <div className="text-center text-gray-500">
                <Spinner />
                <p>กำลังสร้างผลงานชิ้นเอกของคุณ...</p>
            </div>
        ) : generatedImage ? (
          <img src={generatedImage} alt="Generated" className="max-h-[80vh] max-w-full rounded-lg shadow-lg" />
        ) : (
          <span className="text-gray-500">รูปภาพที่คุณสร้างจะปรากฏที่นี่</span>
        )}
      </div>
    </div>
  );
};
