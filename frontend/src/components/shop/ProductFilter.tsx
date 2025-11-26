import React, { useEffect, useState, useMemo } from 'react';
import type { Category, ProductFilters } from '../../types/product';
import { productService } from '../../services/productService';

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
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Build category tree
  const categoryTree = useMemo(() => {
    const rootCategories = categories.filter(c => c.parent === null);
    return rootCategories.map(parent => ({
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
    <div className="bg-white p-4 rounded-lg shadow-sm border border-amber-100">
      <div className="md:hidden mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2 px-4 bg-amber-50 text-amber-900 rounded border border-amber-200 font-serif font-bold flex justify-between items-center"
        >
          <span>絞り込み検索</span>
          <span>{isExpanded ? '▲' : '▼'}</span>
        </button>
      </div>

      <div className={`space-y-6 ${isExpanded ? 'block' : 'hidden md:block'}`}>
        {/* Search */}
        <div>
          <h3 className="font-serif font-bold text-amber-900 mb-3 border-b border-amber-100 pb-1">キーワード</h3>
          <input
            type="text"
            placeholder="何をお探しですか？"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full p-2 border border-amber-200 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-amber-50/50"
          />
        </div>

        {/* Categories Tree */}
        <div>
          <h3 className="font-serif font-bold text-amber-900 mb-3 border-b border-amber-100 pb-1">カテゴリー</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            <label className="flex items-center space-x-2 cursor-pointer hover:bg-amber-50 p-1 rounded">
              <input
                type="radio"
                name="category"
                checked={!filters.category}
                onChange={() => onFilterChange({ ...filters, category: undefined })}
                className="text-amber-600 focus:ring-amber-500"
              />
              <span className={`text-sm ${!filters.category ? 'font-bold text-amber-800' : 'text-gray-600'}`}>すべて</span>
            </label>
            
            {categoryTree.map((parent) => (
              <div key={parent.id} className="ml-1">
                <div className="flex items-center justify-between hover:bg-amber-50 rounded pr-1">
                     <label className="flex items-center space-x-2 cursor-pointer p-1 flex-grow">
                        <input
                            type="radio"
                            name="category"
                            checked={filters.category === parent.slug}
                            onChange={() => handleCategoryChange(parent.slug, parent.id)}
                            className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className={`text-sm ${filters.category === parent.slug ? 'font-bold text-amber-800' : 'text-gray-600'}`}>
                            {parent.name}
                        </span>
                    </label>
                    {parent.children.length > 0 && (
                        <button 
                            onClick={(e) => toggleExpand(parent.id, e)}
                            className="text-gray-400 hover:text-amber-600 p-1"
                        >
                            {expandedCategories.includes(parent.id) ? '▼' : '▶'}
                        </button>
                    )}
                </div>

                {/* Children */}
                {parent.children.length > 0 && expandedCategories.includes(parent.id) && (
                    <div className="ml-6 mt-1 space-y-1 border-l-2 border-amber-100 pl-2 animate-fadeIn">
                        {parent.children.map(child => (
                             <label key={child.id} className="flex items-center space-x-2 cursor-pointer hover:bg-amber-50 p-1 rounded">
                                <input
                                    type="radio"
                                    name="category"
                                    checked={filters.category === child.slug}
                                    onChange={() => handleCategoryChange(child.slug, parent.id)} // Keep parent expanded
                                    className="text-amber-600 focus:ring-amber-500 w-3 h-3"
                                />
                                <span className={`text-xs ${filters.category === child.slug ? 'font-bold text-amber-800' : 'text-gray-600'}`}>
                                    {child.name}
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
          <h3 className="font-serif font-bold text-amber-900 mb-3 border-b border-amber-100 pb-1">商品の状態</h3>
          <div className="space-y-2">
            {[
              { id: 'new', label: '新品・未使用' },
              { id: 'like_new', label: '未使用に近い' },
              { id: 'good', label: '目立った傷や汚れなし' },
              { id: 'fair', label: 'やや傷や汚れあり' },
              { id: 'poor', label: '傷や汚れあり' },
            ].map((cond) => (
              <label key={cond.id} className="flex items-center space-x-2 cursor-pointer hover:bg-amber-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={filters.condition === cond.id}
                  onChange={() => handleConditionChange(cond.id)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">{cond.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ordering */}
        <div>
           <h3 className="font-serif font-bold text-amber-900 mb-3 border-b border-amber-100 pb-1">並び替え</h3>
           <select 
              value={filters.ordering || ''} 
              onChange={(e) => onFilterChange({ ...filters, ordering: e.target.value })}
              className="w-full p-2 border border-amber-200 rounded bg-white text-sm"
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
