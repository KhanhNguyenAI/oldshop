import React, { useEffect, useState, useMemo } from 'react';
import type { Category, ProductFilters } from '../../types/product';
import { productService } from '../../services/productService';
import { translateCategoryName } from '../../utils/categoryTranslations';

interface ProductFilterProps {
  filters: ProductFilters;
  onFilterChange: (newFilters: ProductFilters) => void;
}

interface CategoryWithChildren extends Category {
  children: Category[];
}

export const ProductFilter: React.FC<ProductFilterProps> = ({ filters, onFilterChange }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productService.getCategories();
        // Ensure data is an array
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([]); // Set empty array on error
      }
    };
    fetchCategories();
  }, []);

  // Category display order
  const categoryOrder = [
    '電子機器 (Electronics)',
    '家具 (Furniture)',
    'キッチン・家電 (Kitchen & Appliances)',
    'ファッション (Fashion)',
    '子供向けのおもちゃ (Kids Toys)',
    '趣味・娯楽 (Hobby & Entertainment)',
    '車両・アクセサリー (Vehicles & Accessories)',
    '工具・ハードウェア (Hardware & Tools)',
    'その他 (Others)',
  ];

  // Build category tree with custom ordering
  const categoryTree = useMemo(() => {
    const rootCategories = categories.filter(c => c.parent === null);
    
    // Sort categories according to the specified order
    const sortedCategories = rootCategories.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a.name);
      const indexB = categoryOrder.indexOf(b.name);
      
      // If both are in the order list, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only A is in the list, A comes first
      if (indexA !== -1) return -1;
      // If only B is in the list, B comes first
      if (indexB !== -1) return 1;
      // If neither is in the list, maintain original order (alphabetical)
      return a.name.localeCompare(b.name);
    });
    
    return sortedCategories.map(parent => ({
      ...parent,
      children: categories.filter(c => c.parent === parent.id)
    })) as CategoryWithChildren[];
  }, [categories]);

  const handleCategoryChange = (slug: string, id: number) => {
    // Toggle selection
    if (filters.category === slug) {
       onFilterChange({ ...filters, category: undefined });
    } else {
       onFilterChange({ ...filters, category: slug });
       // Auto expand if it's a parent
       if (!expandedCategories.includes(id)) {
           setExpandedCategories([...expandedCategories, id]);
       }
    }
  };
  
  const toggleExpand = (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (expandedCategories.includes(id)) {
          setExpandedCategories(expandedCategories.filter(cid => cid !== id));
      } else {
          setExpandedCategories([...expandedCategories, id]);
      }
  };

  const handleConditionChange = (condition: string) => {
    onFilterChange({ ...filters, condition: condition === filters.condition ? undefined : condition });
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm p-5 md:p-6 rounded-lg shadow-md border border-amber-100/80 transition-all duration-300 hover:shadow-lg">
      <div className="md:hidden mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 px-4 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 rounded-lg border border-amber-200 font-serif font-bold flex justify-between items-center transition-all duration-200 hover:from-amber-100 hover:to-orange-100 hover:shadow-md active:scale-[0.98]"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            絞り込み検索
          </span>
          <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>
      </div>

      <div className={`space-y-6 transition-all duration-300 ${isExpanded ? 'block' : 'hidden md:block'}`}>
        {/* Search */}
        <div>
          <h3 className="font-serif font-bold text-amber-900 mb-3 border-b-2 border-amber-200/60 pb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            キーワード
          </h3>
          <div className="relative">
            <input
              type="text"
              placeholder="何をお探しですか？"
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="w-full p-3 pl-10 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-400 outline-none bg-amber-50/70 transition-all duration-200 hover:bg-amber-50 hover:border-amber-300 placeholder:text-amber-400/70"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Categories Tree */}
        <div>
          <h3 className="font-serif font-bold text-amber-900 mb-3 border-b-2 border-amber-200/60 pb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            カテゴリー
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-amber-50 hover:scrollbar-thumb-amber-400">
            <label className="flex items-center space-x-2 cursor-pointer hover:bg-amber-50/80 p-2 rounded-lg transition-all duration-150 group">
              <input
                type="radio"
                name="category"
                checked={!filters.category}
                onChange={() => onFilterChange({ ...filters, category: undefined })}
                className="text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
              />
              <span className={`text-sm transition-colors duration-150 ${!filters.category ? 'font-bold text-amber-800' : 'text-gray-600 group-hover:text-amber-700'}`}>すべて</span>
            </label>
            
            {categoryTree.map((parent) => (
              <div key={parent.id} className="ml-1">
                <div className="flex items-center justify-between hover:bg-amber-50/80 rounded-lg pr-1 transition-all duration-150 group">
                     <label className="flex items-center space-x-2 cursor-pointer p-2 flex-grow">
                        <input
                            type="radio"
                            name="category"
                            checked={filters.category === parent.slug}
                            onChange={() => handleCategoryChange(parent.slug, parent.id)}
                            className="text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                        />
                        <span className={`text-sm transition-colors duration-150 ${filters.category === parent.slug ? 'font-bold text-amber-800' : 'text-gray-600 group-hover:text-amber-700'}`}>
                            {translateCategoryName(parent.name)}
                        </span>
                    </label>
                    {parent.children.length > 0 && (
                        <button 
                            onClick={(e) => toggleExpand(parent.id, e)}
                            className="text-gray-400 hover:text-amber-600 p-1.5 rounded transition-all duration-200 hover:bg-amber-100 active:scale-90"
                            aria-label={expandedCategories.includes(parent.id) ? '折りたたむ' : '展開する'}
                        >
                            <svg className={`w-4 h-4 transition-transform duration-200 ${expandedCategories.includes(parent.id) ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Children */}
                {parent.children.length > 0 && expandedCategories.includes(parent.id) && (
                    <div className="ml-6 mt-1 space-y-1 border-l-2 border-amber-200/60 pl-3 animate-fadeIn">
                        {parent.children.map(child => (
                             <label key={child.id} className="flex items-center space-x-2 cursor-pointer hover:bg-amber-50/70 p-2 rounded-lg transition-all duration-150 group">
                                <input
                                    type="radio"
                                    name="category"
                                    checked={filters.category === child.slug}
                                    onChange={() => handleCategoryChange(child.slug, parent.id)} // Keep parent expanded
                                    className="text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                                />
                                <span className={`text-xs transition-colors duration-150 ${filters.category === child.slug ? 'font-bold text-amber-800' : 'text-gray-600 group-hover:text-amber-700'}`}>
                                    {translateCategoryName(child.name)}
                                </span>
                            </label>
                        ))}
                    </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div>
          <h3 className="font-serif font-bold text-amber-900 mb-3 border-b-2 border-amber-200/60 pb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            商品の状態
          </h3>
          <div className="space-y-2">
            {[
              { id: 'new', label: '新品・未使用' },
              { id: 'like_new', label: '未使用に近い' },
              { id: 'good', label: '目立った傷や汚れなし' },
              { id: 'fair', label: 'やや傷や汚れあり' },
              { id: 'poor', label: '傷や汚れあり' },
            ].map((cond) => (
              <label key={cond.id} className="flex items-center space-x-2 cursor-pointer hover:bg-amber-50/80 p-2 rounded-lg transition-all duration-150 group">
                <input
                  type="checkbox"
                  checked={filters.condition === cond.id}
                  onChange={() => handleConditionChange(cond.id)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-gray-700 group-hover:text-amber-800 transition-colors duration-150">{cond.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ordering */}
        <div>
           <h3 className="font-serif font-bold text-amber-900 mb-3 border-b-2 border-amber-200/60 pb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            並び替え
          </h3>
           <select 
              value={filters.ordering || ''} 
              onChange={(e) => onFilterChange({ ...filters, ordering: e.target.value })}
              className="w-full p-3 border border-amber-200 rounded-lg bg-amber-50/70 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-400 outline-none transition-all duration-200 hover:bg-amber-50 hover:border-amber-300 cursor-pointer"
              aria-label="並び替え"
              title="並び替え"
           >
              <option value="">新着順</option>
              <option value="price">価格が安い順</option>
              <option value="-price">価格が高い順</option>
           </select>
        </div>
      </div>
    </div>
  );
};
