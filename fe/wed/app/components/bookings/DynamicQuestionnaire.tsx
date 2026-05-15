'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Sparkles, X } from 'lucide-react';

interface DynamicQuestionnaireProps {
  serviceName: string;
  description: string;
  onChange: (val: string) => void;
  error?: string;
}

const COMMON_ISSUES: Record<string, { q: string, options: string[] }[]> = {
  "điều hòa": [
    { q: "Tình trạng hiện tại của máy?", options: ["Không lạnh", "Chảy nước", "Kêu to", "Mất nguồn", "Báo lỗi trên màn hình"] },
    { q: "Loại máy lạnh?", options: ["Treo tường", "Âm trần", "Tủ đứng", "Inverter", "Máy cơ (Không Inverter)"] }
  ],
  "máy giặt": [
    { q: "Máy đang gặp sự cố gì?", options: ["Không vắt", "Không cấp nước", "Rung lắc mạnh", "Mất nguồn", "Rò rỉ nước"] },
    { q: "Kiểu máy giặt?", options: ["Cửa trước (Lồng ngang)", "Cửa trên (Lồng đứng)"] }
  ],
  "dọn dẹp": [
    { q: "Loại hình dọn dẹp?", options: ["Dọn định kỳ", "Dọn sau xây dựng", "Dọn nhà mới chuyển", "Vệ sinh sofa/đệm"] },
    { q: "Diện tích ước tính?", options: ["Dưới 50m2", "50 - 100m2", "Trên 100m2"] }
  ],
  "default": [
    { q: "Bạn đang gặp vấn đề gì?", options: ["Hư hỏng cần sửa gấp", "Bảo trì định kỳ", "Lắp đặt mới", "Cần tư vấn thêm"] }
  ]
};

export function DynamicQuestionnaire({ serviceName, description, onChange, error }: DynamicQuestionnaireProps) {
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [customText, setCustomText] = useState('');

  // Tìm bộ câu hỏi phù hợp dựa trên tên dịch vụ
  const findQuestionnaire = () => {
    const name = (serviceName || "").toLowerCase();
    for (const key of Object.keys(COMMON_ISSUES)) {
      if (name.includes(key)) return COMMON_ISSUES[key];
    }
    return COMMON_ISSUES["default"];
  };

  const questions = findQuestionnaire();

  // Khôi phục state từ description nếu re-render hoặc sửa đơn cũ
  useEffect(() => {
    if (description && selectedChips.length === 0 && customText === '') {
      // Logic đơn giản: chỉ gán customText
      // Nếu user tự gõ gì đó, chúng ta sẽ không ghi đè
    }
  }, [description]);

  // Cập nhật description tổng mỗi khi chips hoặc text thay đổi
  useEffect(() => {
    const parts = [];
    if (selectedChips.length > 0) parts.push(`[Tình trạng]: ${selectedChips.join(' - ')}`);
    if (customText) parts.push(`[Ghi chú thêm]: ${customText}`);
    
    onChange(parts.join('\n'));
  }, [selectedChips, customText]);

  const toggleChip = (chip: string) => {
    setSelectedChips(prev => 
      prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Label className="text-base font-bold text-midnight-indigo">Chi tiết yêu cầu *</Label>
        <span className="px-2 py-0.5 rounded-md bg-pale-gray text-action-blue text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Gợi ý nhanh
        </span>
      </div>

      {questions.map((qBlock, idx) => (
        <div key={idx} className="space-y-2">
          <p className="text-xs font-semibold text-slate-blue">{qBlock.q}</p>
          <div className="flex flex-wrap gap-2">
            {qBlock.options.map(opt => {
              const isSelected = selectedChips.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleChip(opt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-[background-color,border-color,color,box-shadow,transform] border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue ${
                    isSelected 
                      ? 'bg-action-blue border-action-blue text-white shadow-[var(--brand-shadow-sm)]' 
                      : 'bg-white border-platinum-tint text-slate-blue hover:border-action-blue/40 hover:bg-pale-gray'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3 h-3 inline-block mr-1 -mt-0.5" />}
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="pt-2">
        <p className="text-xs font-semibold text-slate-blue mb-2">Mô tả thêm (tùy chọn)</p>
        <Textarea 
          value={customText} 
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Nhập thêm chi tiết về vấn đề của bạn..." 
          rows={3}
          className={`resize-none ${error ? 'border-red-500 focus-visible:ring-red-500' : 'border-platinum-tint focus-visible:ring-action-blue'}`} 
        />
        {error && <p className="text-red-500 text-[10px] mt-1">{error}</p>}
      </div>
    </div>
  );
}
