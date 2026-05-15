'use client';

import Image from 'next/image';
import { Category } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Zap, Droplets, Sparkles, Hammer, Home, Paintbrush, ShieldCheck, Truck, Settings, Wrench } from 'lucide-react';

const getCategoryIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('điện')) return <Zap className="w-4 h-4" />;
  if (n.includes('nước')) return <Droplets className="w-4 h-4" />;
  if (n.includes('vệ sinh')) return <Sparkles className="w-4 h-4" />;
  if (n.includes('sửa')) return <Hammer className="w-4 h-4" />;
  if (n.includes('xây')) return <Home className="w-4 h-4" />;
  if (n.includes('sơn')) return <Paintbrush className="w-4 h-4" />;
  if (n.includes('bảo vệ')) return <ShieldCheck className="w-4 h-4" />;
  if (n.includes('vận chuyển')) return <Truck className="w-4 h-4" />;
  if (n.includes('máy')) return <Settings className="w-4 h-4" />;
  return <Wrench className="w-4 h-4" />;
};

interface CategoryFilterProps {
  categories: Category[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function CategoryFilter({ categories, selectedIds, onToggle }: CategoryFilterProps) {
  const mainCategories = categories.filter(c => !c.parentId || c.level === 1);
  const getSubCategories = (parentId: number) => categories.filter(c => c.parentId === parentId);

  return (
    <div className="space-y-4 mb-8">
      <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-widest">Loại dịch vụ</h3>
      <Accordion type="multiple" className="w-full">
        {mainCategories.map((cat) => {
          const subs = getSubCategories(cat.id);
          if (subs.length === 0) {
            const isSelected = selectedIds.includes(cat.id.toString());
            return (
              <button
                type="button"
                key={cat.id} 
                aria-pressed={isSelected}
                className={`w-full flex items-center justify-between p-2 py-3 rounded-lg cursor-pointer transition-colors group/cat focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue ${isSelected ? 'bg-pale-gray text-action-blue' : 'hover:bg-muted text-muted-foreground'}`}
                onClick={() => onToggle(cat.id.toString())}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-[background-color,color,box-shadow] ${isSelected ? 'bg-action-blue text-white shadow-[var(--brand-shadow-sm)]' : 'bg-muted group-hover/cat:bg-pale-gray text-muted-foreground group-hover/cat:text-action-blue'}`}>
                    {cat.iconUrl ? <Image src={cat.iconUrl} alt={cat.name} width={16} height={16} className="w-4 h-4 object-contain" /> : getCategoryIcon(cat.name)}
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? 'font-bold' : ''}`}>{cat.name}</span>
                </div>
              </button>
            );
          }

          return (
            <AccordionItem key={cat.id} value={`cat-${cat.id}`} className="border-none">
              <AccordionTrigger className="hover:no-underline py-2 group/trigger">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-[background-color,color] bg-muted group-hover/trigger:bg-pale-gray text-muted-foreground group-hover/trigger:text-action-blue">
                    {cat.iconUrl ? <Image src={cat.iconUrl} alt={cat.name} width={16} height={16} className="w-4 h-4 object-contain" /> : getCategoryIcon(cat.name)}
                  </div>
                  <span className="text-sm font-bold">{cat.name}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-2 pl-11 space-y-1">
                {subs.map(sub => (
                  <button
                    type="button"
                    key={sub.id}
                    onClick={() => onToggle(sub.id.toString())}
                    aria-pressed={selectedIds.includes(sub.id.toString())}
                    className={`w-full text-left text-sm p-2 rounded-md cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue ${selectedIds.includes(sub.id.toString()) ? 'bg-pale-gray text-action-blue font-bold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                  >
                    {sub.name}
                  </button>
                ))}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
