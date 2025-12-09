/**
 * Category name translations from English to Japanese
 */
export const categoryTranslations: Record<string, string> = {
  // Parent Categories
  'Electronics': '電子機器',
  'Furniture': '家具',
  'Kitchen & Appliances': 'キッチン・家電',
  'Vehicles & Accessories': '車両・アクセサリー',
  'Fashion': 'ファッション',
  'Hobby': '趣味',
  'Hardware & Tools': 'ハードウェア・工具',
  
  // Electronics Subcategories
  'Smartphone': 'スマートフォン',
  'Laptop': 'ノートパソコン',
  'Tablet': 'タブレット',
  'Monitor': 'モニター',
  'Camera': 'カメラ',
  'Smartwatch': 'スマートウォッチ',
  'Headphones': 'ヘッドフォン',
  'Speakers': 'スピーカー',
  'Game Console': 'ゲーム機',
  'Printer': 'プリンター',
  'PC Accessories': 'PCアクセサリー',
  
  // Furniture Subcategories
  'Sofa': 'ソファ',
  'Desk': 'デスク',
  'Chair': '椅子',
  'Bookshelf': '本棚',
  'Wardrobe': 'ワードローブ',
  'Bed': 'ベッド',
  'Gaming Chair': 'ゲーミングチェア',
  
  // Kitchen & Appliances Subcategories
  'Refrigerator': '冷蔵庫',
  'Washing Machine': '洗濯機',
  'Microwave': '電子レンジ',
  'Rice Cooker': '炊飯器',
  'Stove': 'コンロ',
  'Air Fryer': 'エアフライヤー',
  'Blender': 'ブレンダー',
  'Cookware Set': '調理器具セット',
  'Kitchen Tools': 'キッチンツール',
  
  // Vehicles & Accessories Subcategories
  'Bicycle': '自転車',
  'Used Motorcycle': '中古バイク',
  'Helmet': 'ヘルメット',
  'Lock': 'ロック',
  'Mirrors': 'ミラー',
  'Accessories': 'アクセサリー',
  
  // Fashion Subcategories
  'Clothes': '衣類',
  'Shoes': '靴',
  'Bags': 'バッグ',
  'Jewelry': 'ジュエリー',
  'Watch': '時計',
  
  // Hobby Subcategories
  'Musical Instruments': '楽器',
  'Decor': 'デコレーション',
  'Model & Figures': 'モデル・フィギュア',
  'Board Games': 'ボードゲーム',
  
  // Hardware & Tools Subcategories
  'Drill': 'ドリル',
  'Cutter': 'カッター',
  'Welding Mini': 'ミニ溶接機',
  'Ladder': 'はしご',
  'Tool Kits': '工具セット',
  'Screwdriver Set': 'ドライバーセット',
  'Laser Measure': 'レーザー距離計',
  'Paint Tools': '塗装工具',
  'Wrenches': 'レンチ',
  'Air Blower': 'エアブロワー',
  'Mini Air Compressor': 'ミニエアコンプレッサー',
  'Electric Pump': '電動ポンプ',
};

/**
 * Translate category name from English to Japanese
 * @param categoryName - Category name in English
 * @returns Category name in Japanese, or original name if translation not found
 */
export const translateCategoryName = (categoryName: string): string => {
  return categoryTranslations[categoryName] || categoryName;
};

