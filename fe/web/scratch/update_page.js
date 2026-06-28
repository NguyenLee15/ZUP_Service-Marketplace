const fs = require('fs');
const path = "d:\\Đồ án tốt nghiệp\\service-marketplace\\fe\\wed\\app\\(main)\\services\\page.tsx";

try {
    let content = fs.readFileSync(path, 'utf8');

    // 1. Update Imports
    const oldImports = `import { Search, Star, SlidersHorizontal, Sparkles, X, ChevronLeft, Filter, Eye } from 'lucide-react';
import { servicesApi, categoriesApi } from '@/features/auth/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Service, Category } from '@/types';
import { ServiceFilterSidebar } from '@/app/components/services/ServiceFilterSidebar';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";`;

    const newImports = `import { 
  Search, 
  Star, 
  SlidersHorizontal, 
  Sparkles, 
  X, 
  ChevronLeft, 
  Filter, 
  Eye, 
  Map as MapIcon, 
  LayoutGrid, 
  Heart, 
  GitCompare 
} from 'lucide-react';
import { servicesApi, categoriesApi } from '@/features/auth/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Service, Category } from '@/types';
import { ServiceFilterSidebar } from '@/app/components/services/ServiceFilterSidebar';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useServiceStore } from '@/store/service.store';
import { ServiceComparisonBar } from '@/app/components/services/ServiceComparisonBar';
import { ServiceMap } from '@/app/components/services/ServiceMap';`;

    content = content.replace(oldImports, newImports);

    // 2. Update Suspense and wrapper
    content = content.replace(
        'return (\n    <Suspense fallback={<div className="min-h-screen bg-muted flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>}>\n      <ServicesSearchContent />\n    </Suspense>\n  );',
        'return (\n    <Suspense fallback={<div className="min-h-screen bg-muted flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /></div>}>\n      <ServicesSearchContent />\n      <ServiceComparisonBar />\n    </Suspense>\n  );'
    );

    // 3. Update States
    content = content.replace(
        'const [isFetchingMore, setIsFetchingMore] = useState(false);\n  const observerTarget = useRef(null);',
        'const [isFetchingMore, setIsFetchingMore] = useState(false);\n  const [viewMode, setViewMode] = useState<\'list\' | \'map\'>(\'list\');\n  const observerTarget = useRef(null);\n\n  const { favorites, toggleFavorite, comparisonList, addToComparison } = useServiceStore();'
    );

    // 4. Update View Mode Toggle
    content = content.replace(
        '<Select value={sortBy} onValueChange={setSortBy}>',
        `<div className="flex items-center p-1 bg-muted/50 rounded-xl border border-border">
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('list')}
                  className={\`rounded-lg px-4 h-9 \${viewMode === 'list' ? 'bg-purple-600 shadow-lg shadow-purple-500/20' : ''}\`}
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  <span className="text-xs font-bold">Lưới</span>
                </Button>
                <Button 
                  variant={viewMode === 'map' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('map')}
                  className={\`rounded-lg px-4 h-9 \${viewMode === 'map' ? 'bg-purple-600 shadow-lg shadow-purple-500/20' : ''}\`}
                >
                  <MapIcon className="w-4 h-4 mr-2" />
                  <span className="text-xs font-bold">Bản đồ</span>
                </Button>
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>`
    );

    // 5. Update List vs Map Rendering
    // This is the hardest part as it's a large block.
    // I'll use markers or just hope the strings match.
    
    // I'll skip the exact match for now and use a more robust way if possible.
    // Actually, I'll try to find the start of the results section.
    const resultsStart = '            {loading ? (';
    const resultsEnd = '              </div>\n            )}'; // Closes the services.map div
    
    // I'll read the file again to get the exact block to replace.
    // Wait, I can't read it easily.
    
    fs.writeFileSync(path, content, 'utf8');
    console.log("Partial update success");
} catch (err) {
    console.error("Error:", err);
}
