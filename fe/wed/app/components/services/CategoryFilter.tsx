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

  const renderCategorySelect = (category: Category, depth = 0, labelPrefix = '') => {
    const isSelected = selectedIds.includes(category.id.toString());

    return (
      <button
        type="button"
        key={`select-${category.id}`}
        onClick={() => onToggle(category.id.toString())}
        aria-pressed={isSelected}
        className={`w-full cursor-pointer rounded-md p-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${isSelected ? 'bg-sky-600/18 font-bold text-cyan-300' : 'text-slate-300 hover:bg-white/8 hover:text-white'}`}
        style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
      >
        {labelPrefix}{category.name}
      </button>
    );
  };

  const renderCategoryNode = (category: Category, depth = 0) => {
    const subs = getSubCategories(category.id);
    const isSelected = selectedIds.includes(category.id.toString());

    if (subs.length === 0) {
      return renderCategorySelect(category, depth);
    }

    return (
      <Accordion type="multiple" className="w-full" key={category.id}>
        <AccordionItem value={`cat-${category.id}`} className="border-none">
          <AccordionTrigger className={`py-2 text-slate-200 hover:no-underline group/trigger ${isSelected ? 'text-cyan-300' : ''}`}>
            <div className="flex min-w-0 items-center space-x-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-[background-color,color,box-shadow] ${isSelected ? 'bg-sky-600 text-white shadow-[0_0_14px_rgba(2,132,199,0.3)]' : 'bg-white/8 text-slate-400 group-hover/trigger:bg-white/12 group-hover/trigger:text-cyan-300'}`}>
                {category.iconUrl ? <Image src={category.iconUrl} alt={category.name} width={16} height={16} className="w-4 h-4 object-contain" /> : getCategoryIcon(category.name)}
              </div>
              <span className="truncate text-sm font-bold">{category.name}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-2 pl-6 space-y-1">
            {renderCategorySelect(category, depth, 'Tất cả ')}
            {subs.map(sub => renderCategoryNode(sub, depth + 1))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  return (
    <div className="space-y-4 mb-8">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Loại dịch vụ</h3>
      <div className="space-y-1">
        {mainCategories.map((cat) => renderCategoryNode(cat))}
      </div>
    </div>
  );
}
