import React, { useState, useRef } from 'react';
import { Upload, X, File as FileIcon, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface FileUploadProps {
  onUpload: (url: string) => void;
  accept?: string;
  label?: string;
  className?: string;
  initialValue?: string;
  hideLabel?: boolean;
}

export default function FileUpload({ 
  onUpload, 
  accept = "image/*", 
  label = "Upload File", 
  className, 
  initialValue,
  hideLabel
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(initialValue || null);
  const [fileName, setFileName] = useState<string | null>(initialValue ? "Existing File" : null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        
        // Image compression logic
        if (file.type.startsWith('image/')) {
          const img = new Image();
          img.src = result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Max dimension 1200px
            const MAX_SIZE = 1200;
            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Export as JPEG with 0.7 quality to significantly reduce size
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setPreview(compressedBase64);
            onUpload(compressedBase64);
          };
        } else {
          setPreview(result);
          onUpload(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setFileName(null);
    onUpload('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div 
      className={cn(
        "relative border border-dashed border-editorial-text/20 p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-editorial-muted group",
        isDragging && "bg-editorial-muted border-editorial-text border-solid",
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        accept={accept}
        onChange={handleInputChange}
      />

      {preview ? (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between border-b border-editorial-text/10 pb-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-500" size={20} />
              <div className="editorial-uppercase text-[10px] truncate max-w-[200px]">{fileName}</div>
            </div>
            <button 
              onClick={clearFile}
              className="p-1 hover:bg-red-50 text-red-500 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="aspect-video w-full overflow-hidden border border-editorial-text/10 bg-editorial-bg">
            {accept.includes('image') ? (
              <img src={preview} alt="Preview" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <FileIcon size={32} strokeWidth={1} />
                <span className="editorial-uppercase text-[8px] opacity-40">Document Selected</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-12 h-12 border border-editorial-text/20 flex items-center justify-center mx-auto mb-4 group-hover:border-editorial-text transition-colors">
            <Upload size={20} strokeWidth={1} className="opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
          {!hideLabel && (
            <>
              <div className="editorial-uppercase mb-1">{label}</div>
              <div className="text-[9px] uppercase tracking-widest opacity-40 italic">Drag & Drop or Touch to Select</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
