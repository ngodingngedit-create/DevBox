import React, { useRef, useState, useEffect } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface DropzoneProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFileSelected,
  accept = 'image/*',
  className = '',
  title = 'Drop image here or click to browse',
  subtitle = 'Supports PNG, JPEG, GIF, WebP, SVG, AVIF, ICO up to 5 MB',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (!e.clipboardData || !e.clipboardData.files.length) return;
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelected(file);
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [onFileSelected]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition select-none ${
        isDragOver
          ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
          : 'border-neutral-700/80 bg-neutral-900/40 hover:bg-neutral-900/70 hover:border-neutral-600'
      } ${className}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300 mb-2">
        {isDragOver ? <Upload className="w-5 h-5 text-blue-400" /> : <ImageIcon className="w-5 h-5" />}
      </div>
      <p className="text-xs font-semibold text-neutral-200">{title}</p>
      <p className="text-[11px] text-neutral-400 mt-1">{subtitle}</p>
    </div>
  );
};
