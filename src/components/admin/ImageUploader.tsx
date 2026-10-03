'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Star, UploadCloud } from 'lucide-react';

export interface ImageItem {
  id: string; // use unique ID for dnd-kit
  file?: File;
  preview: string;
  is_primary: boolean;
}

interface ImageUploaderProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
}

function SortableImageItem({ item, onDelete, onSetPrimary }: { item: ImageItem; onDelete: () => void; onSetPrimary: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative aspect-square rounded-lg border-2 overflow-hidden bg-muted group ${item.is_primary ? 'border-primary shadow-md' : 'border-transparent'}`}
    >
      <img src={item.preview} alt="preview" className="w-full h-full object-cover" />
      
      {/* Overlay Actions */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
        <div className="flex justify-between">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onSetPrimary(); }}
            className={`p-1.5 rounded-full backdrop-blur-md ${item.is_primary ? 'bg-primary text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}
            title="Set as Primary"
          >
            <Star className="w-4 h-4 fill-current" />
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-600 backdrop-blur-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Drag Handle Area */}
        <div {...attributes} {...listeners} className="flex-1 cursor-grab active:cursor-grabbing flex items-center justify-center">
          <span className="bg-black/50 text-white px-2 py-1 rounded text-xs">Drag to reorder</span>
        </div>
      </div>
      
      {item.is_primary && (
        <div className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-xs text-center font-medium py-1">
          Primary
        </div>
      )}
    </div>
  );
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      is_primary: false
    }));
    
    // Auto-set first image as primary if none exist
    if (images.length === 0 && newImages.length > 0) {
      newImages[0].is_primary = true;
    }
    
    onChange([...images, ...newImages]);
  }, [images, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = images.findIndex((i) => i.id === active.id);
      const newIndex = images.findIndex((i) => i.id === over.id);
      onChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  const setPrimary = (id: string) => {
    onChange(images.map(img => ({
      ...img,
      is_primary: img.id === id
    })));
  };

  const removeImage = (id: string) => {
    const newImages = images.filter(img => img.id !== id);
    // If we removed the primary, set the first available as primary
    if (images.find(i => i.id === id)?.is_primary && newImages.length > 0) {
      newImages[0].is_primary = true;
    }
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50'}
        `}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
        <p className="font-medium">Drag & drop images here, or click to select</p>
        <p className="text-sm text-muted-foreground mt-1">Supports JPG, PNG, WEBP up to 10MB</p>
      </div>

      {/* Grid */}
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map(i => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map(img => (
                <SortableImageItem 
                  key={img.id} 
                  item={img} 
                  onDelete={() => removeImage(img.id)}
                  onSetPrimary={() => setPrimary(img.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
