const rawProducts = [{"id":1,"name_en":"Men's Casual Cotton Shirt","name_bn":"পুরুষদের ক্যাজুয়াল কটন শার্ট","slug":"mens-casual-cotton-shirt","short_description_en":"100% Cotton, Slim Fit, Breathable","short_description_bn":"১০০% কটন, স্লিম ফিট, আরামদায়ক","description_en":"<p>Perfect for daily wear or casual outings, this cotton shirt offers comfort and style.</p>","description_bn":"<p>দৈনন্দিন ব্যবহার বা ক্যাজুয়াল আউটিংয়ের জন্য এই কটন শার্টটি চমৎকার আরাম ও স্টাইল প্রদান করে।</p>","base_price":"1200.00","compare_price":"1500.00","cost_price":"800.00","sku_prefix":null,"specifications":null,"highlights":null,"is_active":true,"is_featured":true,"category_id":1,"size_guide_id":null,"category":{"id":1,"name_en":"Men","name_bn":"পুরুষ","description_en":"Men's clothing and fashion.","description_bn":"পুরুষদের পোশাক এবং ফ্যাশন।","slug":"men","icon":"user","image":"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80","position":1,"is_active":true,"banner_image":null,"is_featured":0,"show_home":0,"show_menu":1,"css_class":null,"parent_id":null},"variants":[{"id":1,"product_id":1,"sku":"MCS-BLK-M","barcode":null,"color":"Black","size":"M","weight_grams":null,"price":1200,"cost_price":0,"stock":50,"reserved_stock":0,"low_stock_threshold":5,"available_stock":50,"is_active":true,"is_low_stock":false,"created_at":"2026-09-30T20:21:29.000000Z","updated_at":"2026-09-30T20:21:29.000000Z"},{"id":2,"product_id":1,"sku":"MCS-BLK-L","barcode":null,"color":"Black","size":"L","weight_grams":null,"price":1200,"cost_price":0,"stock":45,"reserved_stock":0,"low_stock_threshold":5,"available_stock":45,"is_active":true,"is_low_stock":false,"created_at":"2026-09-30T20:21:29.000000Z","updated_at":"2026-09-30T20:21:29.000000Z"},{"id":3,"product_id":1,"sku":"MCS-WHT-M","barcode":null,"color":"White","size":"M","weight_grams":null,"price":1200,"cost_price":0,"stock":60,"reserved_stock":0,"low_stock_threshold":5,"available_stock":60,"is_active":true,"is_low_stock":false,"created_at":"2026-09-30T20:21:29.000000Z","updated_at":"2026-09-30T20:21:29.000000Z"}],"images":[{"id":1,"path":"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=85","url":"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=85","is_primary":true,"position":0}],"primary_image_url":"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=85","current_price":"1200.00","is_in_stock":true,"seo_title":null,"seo_description":null,"views_count":1,"created_at":"2026-09-30T20:21:29.000000Z","updated_at":"2026-09-30T20:24:56.000000Z"}];

const searchQuery = "";
const selectedCategory = "all";
const selectedBrands = [];
const minPrice = 0;
const maxPrice = 250000;
const inStockOnly = false;
const featuredOnly = false;
const discountOnly = false;
const sort = "featured";

const filteredProducts = rawProducts.filter((product) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchTitle = (product.name_en || '').toLowerCase().includes(query) || (product.name_bn || '').toLowerCase().includes(query);
      const matchDesc = (product.short_description_en || '').toLowerCase().includes(query) || (product.description_en || '').toLowerCase().includes(query);
      const matchSku = (product.sku_prefix || '').toLowerCase().includes(query) || (product.slug || '').toLowerCase().includes(query);
      if (!matchTitle && !matchDesc && !matchSku) return false;
    }
    if (selectedCategory && selectedCategory !== 'all') {
      const catSlug = (product.category?.slug || '').toLowerCase();
      const catId = String(product.category_id || product.category?.id || '');
      if (catSlug !== selectedCategory.toLowerCase() && catId !== selectedCategory) {
        return false;
      }
    }
    if (selectedBrands.length > 0) {
      return false; // stub
    }
    const effectivePrice = Number(product.current_price || product.base_price || 0);
    if (effectivePrice < minPrice || effectivePrice > maxPrice) {
      return false;
    }
    if (inStockOnly && product.is_in_stock === false) {
      return false;
    }
    if (featuredOnly && !product.is_featured) {
      return false;
    }
    if (discountOnly) {
      const compPrice = Number(product.compare_price || 0);
      if (!compPrice || compPrice <= effectivePrice) return false;
    }
    return true;
}).sort((a, b) => {
    const priceA = Number(a.current_price || a.base_price || 0);
    const priceB = Number(b.current_price || b.base_price || 0);
    switch (sort) {
      case 'price_low': return priceA - priceB;
      case 'price_high': return priceB - priceA;
      case 'newest': return (b.id || 0) - (a.id || 0);
      case 'discount': {
        const discA = a.compare_price ? ((Number(a.compare_price) - priceA) / Number(a.compare_price)) : 0;
        const discB = b.compare_price ? ((Number(b.compare_price) - priceB) / Number(b.compare_price)) : 0;
        return discB - discA;
      }
      case 'featured':
      default: return 0;
    }
});

console.log(filteredProducts.length);
