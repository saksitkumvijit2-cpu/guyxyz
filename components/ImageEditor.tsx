
import React, { useState, useCallback } from 'react';
// FIX: AI features are disabled.
// import { editImage } from '../services/geminiService';
import { Spinner } from './Icons';

const fileToGenerativePart = async (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  });
};

export const ImageEditor: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [originalImage, setOriginalImage] = useState<{ file: File; url: string; base64: string; mimeType: string } | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditedImage(null);
      const { base64, mimeType } = await fileToGenerativePart(file);
      setOriginalImage({
        file,
        url: URL.createObjectURL(file),
        base64,
        mimeType,
      });
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!prompt || !originalImage) {
      setError('กรุณาอัปโหลดรูปภาพและป้อนคำสั่ง');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImage(null);
    try {
      // FIX: AI features are disabled. The call to editImage is removed and an error is shown instead.
      // const resultBase64 = await editImage(prompt, originalImage.base64, originalImage.mimeType);
      // setEditedImage(`data:image/jpeg;base64,${resultBase64}`);
      setError('คุณสมบัติด้าน AI ถูกปิดใช้งาน');
    } catch (err) {
      // setError('แก้ไขรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      setError('คุณสมบัติด้าน AI ถูกปิดใช้งาน');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, originalImage]);
  
  const suggestions = [
    {en: "Add a retro filter", th: "เพิ่มฟิลเตอร์ย้อนยุค"},
    {en: "Remove the person in the background", th: "ลบคนในพื้นหลัง"},
    {en: "Make the background solid blue", th: "เปลี่ยนพื้นหลังเป็นสีน้ำเงิน"},
    {en: "Improve lighting", th: "ปรับปรุงแสง"}
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow space-y-6">
      <div>
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          อัปโหลดรูปภาพ
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex text-sm text-gray-600 dark:text-gray-400">
              <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                <span>อัปโหลดไฟล์</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
              </label>
              <p className="pl-1">หรือลากแล้ววาง</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">รองรับ PNG, JPG, GIF ขนาดไม่เกิน 10MB</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          {originalImage ? <img src={originalImage.url} alt="Original" className="max-h-full max-w-full rounded-lg" /> : <span className="text-gray-500">รูปต้นฉบับ</span>}
        </div>
        <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          {isLoading ? <Spinner /> : editedImage ? <img src={editedImage} alt="Edited" className="max-h-full max-w-full rounded-lg" /> : <span className="text-gray-500">รูปที่แก้ไขแล้ว</span>}
        </div>
      </div>

      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          คำสั่งสำหรับแก้ไข
        </label>
        <textarea
          id="prompt"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="เช่น เพิ่มฟิลเตอร์ย้อนยุค"
          className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500 text-black dark:text-gray-100"
        />
        <div className="flex flex-wrap gap-2 mt-2">
            {suggestions.map(s => (
                <button key={s.en} onClick={() => setPrompt(s.en)} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500">{s.th}</button>
            ))}
        </div>
      </div>
      
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={isLoading || !originalImage}
        className="w-full flex justify-center items-center bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
      >
        {isLoading ? <><Spinner /> กำลังแก้ไข...</> : 'ใช้การแก้ไข'}
      </button>
    </div>
  );
};
