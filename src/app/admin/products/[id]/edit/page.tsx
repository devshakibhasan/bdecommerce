'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductVariant } from '@/types';
import { 
  Save, ArrowLeft, Package, Plus, Trash2, 
  Star, Image as ImageIcon, ExternalLink, Layers, RefreshCw,
  Upload, X, CheckCircle2, AlertTriangle, Eye, ArrowLeftRight,
  MoveLeft, MoveRight, Check, DollarSign, Tag, Link as LinkIcon,
  Sparkles, FileImage
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { syncEntityInCache } from '@/lib/cacheSync';
import { formatImageUrl } from '@/utils/image';
import SizeGuideModal from '@/components/admin/SizeGuideModal';

const PRESET_PRODUCT_IMAGES = [
  { name: 'Samsung Galaxy A55', url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=85' },
  { name: 'MacBook Air M3', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=85' },
  { name: 'Sony WH-1000XM5', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85' },
  { name: 'Apple Watch Ultra', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=85' },
  { name: 'Nike Air Max', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85' },
  { name: 'Leather Wallet', url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=85' },
];

const DEFAULT_PRODUCT_TYPES = [
  { id: 1, name_en: 'Casual Wear', slug: 'casual-wear' },
  { id: 5, name_en: 'Ethnic Wear', slug: 'ethnic-wear' },
  { id: 2, name_en: 'Formal Wear', slug: 'formal-wear' },
  { id: 3, name_en: 'Sportswear', slug: 'sportswear' },
  { id: 4, name_en: 'Winter Wear', slug: 'winter-wear' },
];

const DEFAULT_SIZE_GUIDES = [
  { id: 4, name: "Pants & Trousers Size Guide" },
  { id: 2, name: "Men's Shirt & T-Shirt Size Guide" },
  { id: 1, name: "Men's Panjabi & Kurta Size Guide" },
  { id: 3, name: "Women's Ethnic & Kurti Size Guide" },
  { id: 5, name: "Kids Wear Size Guide" },
];

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Product Type Modal State
  const [isProductTypeModalOpen, setIsProductTypeModalOpen] = useState(false);
  const [newProductTypeName, setNewProductTypeName] = useState('');

  const createProductTypeMutation = useMutation({
    mutationFn: async (payload: { name_en: string }) => await api.post('/product-types', payload),
    onSuccess: (res: any) => {
      toast.success('Product Type created successfully!');
      setIsProductTypeModalOpen(false);
      setNewProductTypeName('');
      queryClient.invalidateQueries({ queryKey: ['admin-product-types-list-v4'] });
      const newId = res?.data?.data?.id || res?.data?.id;
      if (newId) {
        setFormData(prev => ({ ...prev, product_type_id: String(newId) }));
      }
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create product type')
  });

  const handleCreateProductType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductTypeName.trim()) {
      toast.error('Please enter a product type name');
      return;
    }
    createProductTypeMutation.mutate({ name_en: newProductTypeName.trim() });
  };

  // Size Guide Modal State
  const [isSizeGuideModalOpen, setIsSizeGuideModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name_en: '',
    name_bn: '',
    slug: '',
    category_id: '',
    brand_id: '',
    product_type_id: '',
    sku_prefix: '',
    base_price: '',
    compare_price: '',
    cost_price: '',
    short_description_en: '',
    short_description_bn: '',
    description_en: '',
    description_bn: '',
    material: '',
    fit: '',
    disclaimer: '',
    size_guide_id: '',
    is_active: true,
    is_featured: false,
  });

  const [careInstructions, setCareInstructions] = useState<string[]>([]);
  const [variants, setVariants] = useState<Partial<ProductVariant>[]>([]);
  const [images, setImages] = useState<{ id?: number; url: string; is_primary: boolean; name?: string; size?: string }[]>([]);
  const [specifications, setSpecifications] = useState<{key: string; value: string}[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);

  const handleLoadPanjabiCareDefaults = () => {
    setCareInstructions([
      'Wash dark colors separately',
      'Do not bleach',
      'Wash mild detergent',
      'Cold water soft wash',
      'Wash & Warm iron inside out',
      'Do not tumble dry',
      "Don't rub",
      'Color bleed issues Wash separately',
    ]);
    toast.success('Panjabi care instructions loaded!');
  };

  const handleLoadStandardDisclaimer = () => {
    setFormData(prev => ({
      ...prev,
      disclaimer: 'Product color may slightly vary due to various monitor settings & photographic lighting sources.'
    }));
    toast.success('Standard disclaimer loaded!');
  };

  const handleLoadPanjabiTemplate = () => {
    setFormData(prev => ({
      ...prev,
      material: 'Jacquard Cotton',
      fit: 'Regular Fit',
      sku_prefix: prev.sku_prefix || 'SB-PANK-TM26-10DP-110452',
      description_en: 'This Mens Peach Karchupi Worked Panjabi is crafted from jacquard cotton fabric, offering a comfortable and premium feel. Featuring intricate Karchupi work and a regular fit, it adds a rich traditional touch to the overall look. The elegant peach color makes it a sophisticated choice for festive occasions, cultural celebrations, and special gatherings.',
      short_description_en: 'Crafted from premium jacquard cotton fabric with intricate Karchupi work in regular fit.',
      disclaimer: 'Product color may slightly vary due to various monitor settings & photographic lighting sources.'
    }));
    handleLoadPanjabiCareDefaults();
    setSpecifications([
      { key: 'Material', value: 'Jacquard Cotton' },
      { key: 'Fit', value: 'Regular Fit' },
      { key: 'Work / Craft', value: 'Intricate Karchupi Work' },
      { key: 'Sleeve', value: 'Full Sleeve' },
      { key: 'Collar / Neck', value: 'Band Collar / Mandarin' },
      { key: 'Occasion', value: 'Festive, Cultural Celebrations & Special Gatherings' },
      { key: 'Product Code', value: formData.sku_prefix || 'SB-PANK-TM26-10DP-110452' },
    ]);
    setHighlights([
      '100% Jacquard Cotton & Viscose Blend',
      'Intricate Traditional Karchupi Embroidery Work',
      'Comfortable Mandarin / Band Collar Silhouette',
      'All-Day Breathable Luxury Festive Wear'
    ]);
    toast.success('Complete Panjabi template applied!');
  };

  const handleLoadSocksCareDefaults = () => {
    setCareInstructions([
      'Machine wash warm with like colors',
      'Do not bleach',
      'Tumble dry low',
      'Do not iron',
      'Do not dry clean',
    ]);
    toast.success('Socks care instructions loaded!');
  };

  const handleLoadSocksTemplate = () => {
    setFormData(prev => ({
      ...prev,
      material: '95% Cotton & 5% Spandex Fabric.',
      fit: 'Comfort Fit',
      sku_prefix: prev.sku_prefix || 'AS-S-TM26-05EA-110955',
      description_en: 'These white socks are crafted from breathable cotton material, offering all-day comfort and a stylish pattern design. Perfect for everyday wear, they provide a soft and comfortable fit while keeping your feet fresh and stylish.',
      short_description_en: 'Crafted from breathable cotton material (95% Cotton & 5% Spandex) for all-day comfort.',
      disclaimer: 'Product color may slightly vary due to various monitor settings & photographic lighting sources.'
    }));
    handleLoadSocksCareDefaults();
    setSpecifications([
      { key: 'Material', value: '95% Cotton & 5% Spandex Fabric.' },
      { key: 'Fit / Type', value: 'Comfort Fit Ankle Socks' },
      { key: 'Pattern', value: 'Stylish Pattern Design' },
      { key: 'Breathability', value: 'High Breathability & Freshness' },
      { key: 'Color', value: 'White' },
      { key: 'Product Code', value: formData.sku_prefix || 'AS-S-TM26-05EA-110955' },
    ]);
    setHighlights([
      '95% Breathable Cotton with 5% Spandex Stretch',
      'Reinforced Heel and Toe for Extended Durability',
      'Sweat-Wicking Anti-Odor Yarn Technology',
      'Non-Slip Ribbed Cuff Band'
    ]);
    toast.success('Complete Socks template applied!');
  };

  const handleLoadBackpackCareDefaults = () => {
    setCareInstructions([
      'Wipe clean with a damp cloth or sponge',
      'Do not machine wash or soak in water',
      'Do not bleach',
      'Air dry in shade away from direct heat',
      'Do not iron',
    ]);
    toast.success('Backpack care instructions loaded!');
  };

  const handleLoadBackpackTemplate = () => {
    const backpackCat = categories.find((c: any) => 
      c.slug?.toLowerCase().includes('backpack') || 
      c.name_en?.toLowerCase().includes('backpack') ||
      c.slug?.toLowerCase().includes('accessories')
    );

    setFormData(prev => ({
      ...prev,
      category_id: prev.category_id || (backpackCat ? String(backpackCat.id) : prev.category_id),
      name_en: prev.name_en || 'Blue Water-Resistant Backpack',
      name_bn: prev.name_bn || 'ব্লু ওয়াটার-রেজিস্ট্যান্ট ব্যাকপ্যাক',
      material: 'Polyester Fabric.',
      fit: 'Spacious Everyday & Travel Backpack (Laptop Compartment)',
      sku_prefix: prev.sku_prefix || 'TA-BP-TM24-05A-001',
      description_en: 'This Blue Water-Resistant Backpack is perfect for school, travel, or everyday use. Made from durable polyester with a top zipper closure, it features soft padded adjustable straps and full back padding for extra comfort. Spacious enough for laptops and essentials, it offers both style and functionality, though it lacks USB or MP3 ports. Ideal for those on the go.',
      short_description_en: 'This Blue Water-Resistant Backpack is perfect for school, travel, or everyday use. Made from durable polyester with a top zipper closure, soft padded adjustable straps, and full back padding for extra comfort.',
      disclaimer: 'Product color may slightly vary due to various monitor settings & photographic lighting sources.'
    }));
    handleLoadBackpackCareDefaults();
    setSpecifications([
      { key: 'Material', value: 'Polyester Fabric.' },
      { key: 'Product Code', value: formData.sku_prefix || 'TA-BP-TM24-05A-001' },
      { key: 'Water Resistance', value: 'Water-Resistant Fabric' },
      { key: 'Closure Type', value: 'Top Zipper Closure' },
      { key: 'Straps', value: 'Soft Padded Adjustable Straps' },
      { key: 'Back Support', value: 'Full Back Padding for Extra Comfort' },
      { key: 'Compartments', value: 'Spacious Enough for Laptops and Essentials' },
      { key: 'Ports', value: 'No USB or MP3 Ports' },
      { key: 'Color', value: 'Blue' },
      { key: 'Ideal For', value: 'School, Travel, or Everyday Use' },
    ]);
    setHighlights([
      'Durable Water-Resistant Polyester Exterior',
      'Padded Dedicated Compartment for Up to 15.6" Laptops',
      'Ergonomic Breathable Air-Mesh Back Cushioning',
      'Reinforced Heavy-Duty Top Zippers & Shoulder Straps'
    ]);
    toast.success('Complete Backpack template applied!');
  };

  const handleLoadBeltCareDefaults = () => {
    setCareInstructions([
      'Keep away from water, moisture, and extreme heat',
      'Clean gently with a soft dry cloth or specialized leather cleaner',
      'Condition periodically with a quality leather balm',
      'Do not wash, soak, or machine clean',
      'Hang vertically or roll loosely when storing',
    ]);
    toast.success('Leather belt care instructions loaded!');
  };

  const handleLoadBeltTemplate = () => {
    const beltCat = categories.find((c: any) => 
      c.slug?.toLowerCase().includes('belt') || 
      c.name_en?.toLowerCase().includes('belt') ||
      c.slug?.toLowerCase().includes('accessories')
    );

    setFormData(prev => ({
      ...prev,
      category_id: prev.category_id || (beltCat ? String(beltCat.id) : prev.category_id),
      name_en: prev.name_en || "Men's 100% Genuine Leather Belt",
      name_bn: prev.name_bn || 'পুরুষদের ১০০% খাঁটি চামড়ার বেল্ট',
      material: '100% genuine leather.',
      fit: 'Classic Adjustable Fit (Formal & Casual)',
      sku_prefix: prev.sku_prefix || 'SA-BLT-TM26-05EA-113650',
      description_en: "Crafted from 100% original leather, this premium men's belt from leather offers durability, comfort, and timeless style. Designed with a classic finish, it is a versatile accessory that pairs effortlessly with both formal and casual outfits, making it an essential addition to any wardrobe.",
      short_description_en: "Premium men's belt crafted from 100% genuine leather with a classic finish for formal and casual wear.",
      disclaimer: 'Product color may slightly vary due to various monitor settings & photographic lighting sources.'
    }));
    handleLoadBeltCareDefaults();
    setSpecifications([
      { key: 'Material', value: '100% genuine leather.' },
      { key: 'Product Code', value: formData.sku_prefix || 'SA-BLT-TM26-05EA-113650' },
      { key: 'Buckle', value: 'Premium Alloy Metal Buckle (Anti-Rust)' },
      { key: 'Style / Finish', value: 'Classic Smooth Finish with Clean Edge Stitching' },
      { key: 'Width', value: 'Standard 35mm (1.38 inch)' },
      { key: 'Fit / Closure', value: 'Adjustable Hole Punch Fit' },
      { key: 'Occasion', value: 'Formal, Business Casual & Everyday Wear' },
      { key: 'Origin / Quality', value: '100% Original Genuine Leather' },
    ]);
    setHighlights([
      '100% Genuine Full-Grain Leather Craftsmanship',
      'Heavy-Duty Anti-Corrosion Alloy Pin Buckle',
      'Double-Edge Reinforced Perimeter Stitching',
      'Universal 35mm Width for Formal Trousers & Casual Jeans'
    ]);
    toast.success('Complete Belt template applied!');
  };

  const handleLoadWalletTemplate = () => {
    setFormData(prev => ({
      ...prev,
      material: '100% Genuine Full-Grain Leather',
      fit: 'Slim Bifold Pocket Fit',
      sku_prefix: prev.sku_prefix || 'LW-GEN-TM26-01EA-119800',
      description_en: 'Crafted from premium full-grain cowhide leather, this slim bifold wallet offers superior durability with advanced RFID protection. Designed with multiple card slots and dual cash compartments, it keeps your essentials organized without bulk.',
      short_description_en: '100% Genuine full-grain leather slim bifold wallet with built-in RFID blocking protection.',
      disclaimer: 'Product color may slightly vary due to various monitor settings & photographic lighting sources.'
    }));
    setCareInstructions([
      'Wipe with dry microfiber cloth only',
      'Keep away from moisture, prolonged direct sunlight & alcohol',
      'Use mild leather balm annually',
      'Do not bend or overfill card slots'
    ]);
    setSpecifications([
      { key: 'Material', value: '100% Genuine Full-Grain Leather' },
      { key: 'Product Code', value: formData.sku_prefix || 'LW-GEN-TM26-01EA-119800' },
      { key: 'Security', value: 'Integrated RFID-Blocking Shield' },
      { key: 'Card Capacity', value: '8 Card Slots + ID Window' },
      { key: 'Currency Pockets', value: 'Double Full-Length Cash Compartments' },
      { key: 'Style', value: 'Ergonomic Slim Bifold' },
      { key: 'Origin / Quality', value: '100% Authentic Leather' }
    ]);
    setHighlights([
      '100% Genuine Full-Grain Cowhide Leather',
      'Integrated RFID-Blocking Security Shield',
      '8 Card Slots + Double Cash Compartments',
      'Ultra-Slim Ergonomic Profile'
    ]);
    toast.success('Complete Leather Wallet template applied!');
  };

  const handleLoadTShirtTemplate = () => {
    setFormData(prev => ({
      ...prev,
      material: '100% Combed Compact Cotton (180 GSM)',
      fit: 'Regular Comfort Fit',
      sku_prefix: prev.sku_prefix || 'TS-CTN-TM26-02EA-114200',
      description_en: 'Engineered for exceptional everyday comfort, this classic crewneck T-shirt is crafted from 100% combed compact cotton at a balanced 180 GSM weight. Bio-washed with silicone enzyme treatment for a velvety handfeel and pill-resistant finish.',
      short_description_en: 'Premium 180 GSM combed compact cotton crewneck T-shirt with bio-wash softening.',
      disclaimer: 'Product color may slightly vary due to various monitor settings & photographic lighting sources.'
    }));
    setCareInstructions([
      'Machine wash cold with like colors inside out',
      'Do not bleach',
      'Tumble dry low or line dry in shade',
      'Medium iron inside out; do not iron directly on graphics',
      'Do not dry clean'
    ]);
    setSpecifications([
      { key: 'Fabric Material', value: '100% Combed Compact Cotton' },
      { key: 'Product Code', value: formData.sku_prefix || 'TS-CTN-TM26-02EA-114200' },
      { key: 'Fabric Weight', value: '180 GSM Premium Knit' },
      { key: 'Finish', value: 'Silicone Bio-Washed (Anti-Pilling)' },
      { key: 'Collar', value: '1x1 Spandex Ribbed Neckband' },
      { key: 'Fit Silhouette', value: 'Regular Comfort Fit' },
      { key: 'Dyeing', value: 'Azo-Free Reactive Color Fast Dyes' },
      { key: 'Origin', value: '100% Made in Bangladesh' }
    ]);
    setHighlights([
      '100% Combed Compact Cotton (180 GSM)',
      'Silicone Bio-Washed for Ultra-Soft Velvet Handfeel',
      'Pre-Shrunk Knit to Prevent Size Shrinkage',
      'Spandex-Reinforced Anti-Sag Ribbed Collar'
    ]);
    toast.success('Complete T-Shirt template applied!');
  };

  const handleLoadShirtTemplate = () => {
    setFormData(prev => ({
      ...prev,
      material: '100% Egyptian Giza Cotton Twill',
      fit: 'Slim / Modern Fit',
      sku_prefix: prev.sku_prefix || 'SH-CTN-TM26-03EA-116300',
      description_en: 'Exquisitely tailored from fine 100% Egyptian Giza cotton, this shirt combines a clean modern silhouette with all-day breathability. Features a fused semi-spread collar, mother-of-pearl buttons, and dual-button adjustable barrel cuffs.',
      short_description_en: 'Tailored 100% Egyptian Giza cotton shirt with wrinkle-resistant easy-iron finish.',
      disclaimer: 'Product color may slightly vary due to various monitor settings & photographic lighting sources.'
    }));
    setCareInstructions([
      'Machine wash warm gentle cycle with like colors',
      'Use mild detergent; do not use chlorine bleach',
      'Tumble dry low or hang dry immediately',
      'Warm steam iron while slightly damp for crisp look'
    ]);
    setSpecifications([
      { key: 'Material', value: '100% Egyptian Giza Cotton Twill' },
      { key: 'Product Code', value: formData.sku_prefix || 'SH-CTN-TM26-03EA-116300' },
      { key: 'Weave', value: 'Fine 80s Two-Ply Twill' },
      { key: 'Collar', value: 'Fused Semi-Spread Collar' },
      { key: 'Cuffs', value: 'Dual-Button Adjustable Barrel Cuffs' },
      { key: 'Buttons', value: 'Cross-Stitched Shatterproof Resin' },
      { key: 'Fit', value: 'Slim / Modern Fit' },
      { key: 'Occasion', value: 'Office, Business Formal & Smart Casual' }
    ]);
    setHighlights([
      '100% Long-Staple Egyptian Giza Cotton Twill',
      'Wrinkle-Resistant Easy-Care Finish',
      'Firm Fused Spread Collar & Button Cuffs',
      'Tailored Modern Silhouette'
    ]);
    toast.success('Complete Shirt template applied!');
  };

  const handleLoadDenimTemplate = () => {
    setFormData(prev => ({
      ...prev,
      material: '98% Cotton & 2% Spandex Stretch Denim (12.5 oz)',
      fit: 'Slim Straight Stretch Fit',
      sku_prefix: prev.sku_prefix || 'DN-STR-TM26-04EA-118500',
      description_en: 'Built from durable 12.5 oz ring-spun cotton denim infused with 2% elastane for unrestricted movement. Detailed with classic 5-pocket styling, heavy-duty antique brass rivets, and authentic hand-scraped fading.',
      short_description_en: 'Premium 12.5 oz comfort stretch denim pants with authentic wash and YKK zip fly.',
      disclaimer: 'Product color may slightly vary due to various monitor settings & photographic lighting sources.'
    }));
    setCareInstructions([
      'Turn inside out before washing to protect color',
      'Machine wash cold with like dark colors',
      'Do not bleach or use optical brighteners',
      'Line dry in shade; avoid high-heat tumble drying',
      'Warm iron inside out if necessary'
    ]);
    setSpecifications([
      { key: 'Material', value: '98% Cotton & 2% Spandex Stretch Denim' },
      { key: 'Product Code', value: formData.sku_prefix || 'DN-STR-TM26-04EA-118500' },
      { key: 'Fabric Weight', value: '12.5 oz Midweight Denim' },
      { key: 'Fit Silhouette', value: 'Slim Straight Stretch Fit' },
      { key: 'Fly Closure', value: 'Original YKK Brass Zipper' },
      { key: 'Pockets', value: 'Classic 5-Pocket Construction' },
      { key: 'Hardware', value: 'Reinforced Copper/Brass Rivets' },
      { key: 'Wash Style', value: 'Authentic Enzyme Stone Wash' }
    ]);
    setHighlights([
      'Premium 12.5 oz Ring-Spun Stretch Denim',
      '2-Way Comfort Stretch for All-Day Flexibility',
      'Authentic Hand-Scraped Whiskers & Fade Finish',
      'Heavy-Duty Brass Rivets & YKK Zip Fly'
    ]);
    toast.success('Complete Denim / Jeans template applied!');
  };

  const handleLoadWinterwearTemplate = () => {
    setFormData(prev => ({
      ...prev,
      material: 'Thermal Cotton Fleece & Wool Blend (320 GSM)',
      fit: 'Relaxed Thermal Layering Fit',
      sku_prefix: prev.sku_prefix || 'JK-WNT-TM26-06EA-121400',
      description_en: 'Engineered for chilly weather, this premium thermal outer layer features a dense brushed interior for exceptional body heat retention. Fitted with a wind-blocking mock collar, deep zippered hand warmer pockets, and stretch rib cuffs.',
      short_description_en: 'Heavyweight 320 GSM brushed thermal fleece jacket for superior winter warmth.',
      disclaimer: 'Product color may slightly vary due to various monitor settings & photographic lighting sources.'
    }));
    setCareInstructions([
      'Gentle machine wash cold or professional dry clean',
      'Do not bleach or wring roughly',
      'Lay flat to dry in shade to maintain silhouette',
      'Cool iron with pressing cloth if needed'
    ]);
    setSpecifications([
      { key: 'Material', value: 'Cotton Fleece & Wool Thermal Blend' },
      { key: 'Product Code', value: formData.sku_prefix || 'JK-WNT-TM26-06EA-121400' },
      { key: 'Fabric Weight', value: '320 GSM Heavyweight Thermal' },
      { key: 'Lining', value: 'Brushed Sherpa / Soft Fleece' },
      { key: 'Closure', value: 'Full-Zip Heavy-Duty Metal Fastener' },
      { key: 'Pockets', value: '2 Deep Zippered Side Pockets' },
      { key: 'Fit', value: 'Relaxed Thermal Layering Fit' },
      { key: 'Season', value: 'Winter & Cold Weather' }
    ]);
    setHighlights([
      'Heavyweight 320 GSM Brushed Thermal Interior Fleece',
      'Wind-Resistant Dense Outer Fabric Weave',
      'High-Density Ribbed Cuffs & Hem to Lock In Warmth',
      'Durable YKK Metal Zipper & Deep Fleece Pockets'
    ]);
    toast.success('Complete Winterwear template applied!');
  };

  const handleLoadWomenEthnicTemplate = () => {
    setFormData(prev => ({
      ...prev,
      material: 'Handloom Silk Blend & Pure Mercerized Cotton',
      fit: 'Graceful Traditional Draping Fit',
      sku_prefix: prev.sku_prefix || 'WM-ETH-TM26-07EA-125600',
      description_en: 'Woven with artistic finesse, this traditional ensemble showcases rich artisanal weaving complemented by delicate zari detailing along the borders. Breathable and fluid, it delivers unmatched royal poise for festive celebrations.',
      short_description_en: 'Artisanal handloom silk and mercerized cotton ethnic wear with intricate zari border.',
      disclaimer: 'Product color may slightly vary due to various monitor settings & photographic lighting sources.'
    }));
    setCareInstructions([
      'Dry clean recommended for first wash to retain luster',
      'Gentle cold water hand wash separately thereafter',
      'Do not wring or soak for prolonged time',
      'Dry flat in shade; iron on low silk setting on reverse side'
    ]);
    setSpecifications([
      { key: 'Fabric Composition', value: 'Handloom Silk Blend & Mercerized Cotton' },
      { key: 'Product Code', value: formData.sku_prefix || 'WM-ETH-TM26-07EA-125600' },
      { key: 'Weave / Craft', value: 'Traditional Jacquard Handloom Weave' },
      { key: 'Embellishment', value: 'Intricate Metallic Zari Work' },
      { key: 'Drape & Feel', value: 'Fluid, Lightweight & Highly Breathable' },
      { key: 'Occasion', value: 'Festivals, Weddings & Traditional Celebrations' },
      { key: 'Origin', value: 'Artisanal Bangladeshi Heritage Weave' }
    ]);
    setHighlights([
      'Authentic Handloom Silk Blend with Pure Mercerized Cotton',
      'Intricate Zari Border & Pallu Work by Master Artisans',
      'Soft Lightweight Drape with Breathable Comfort',
      'Includes Matching Unstitched Blouse / Dupatta Piece'
    ]);
    toast.success('Complete Women Ethnic template applied!');
  };
  const handleLoadWomenTemplate = handleLoadWomenEthnicTemplate;

    // 1. Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories-select'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/categories');
        return res?.data?.items || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      } catch {
        return [];
      }
    }
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['admin-brands-select'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/brands');
        return res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      } catch {
        return [];
      }
    }
  });

  const { data: fetchedProductTypes = [] } = useQuery({
    queryKey: ['admin-product-types-list-v4'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/product-types');
        const list = res?.data?.data || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
        return Array.isArray(list) && list.length > 0 ? list : DEFAULT_PRODUCT_TYPES;
      } catch {
        return DEFAULT_PRODUCT_TYPES;
      }
    },
    initialData: DEFAULT_PRODUCT_TYPES,
  });

  const productTypes = (Array.isArray(fetchedProductTypes) && fetchedProductTypes.length > 0)
    ? fetchedProductTypes 
    : DEFAULT_PRODUCT_TYPES;

  const { data: fetchedSizeGuides = [] } = useQuery({
    queryKey: ['admin-size-guides-select'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/size-guides');
        const list = res?.data?.data || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
        return Array.isArray(list) && list.length > 0 ? list : DEFAULT_SIZE_GUIDES;
      } catch {
        return DEFAULT_SIZE_GUIDES;
      }
    },
    initialData: DEFAULT_SIZE_GUIDES,
  });

  // 2. Fetch Product Data from Backend
  const { data: productData, isLoading, refetch } = useQuery({
    queryKey: ['admin-product-edit', id],
    queryFn: async () => {
      try {
        const res: any = await api.get(`/admin/products/${id}`);
        return res?.data?.data || res?.data || null;
      } catch (err) {
        /* silenced */
        return null;
      }
    }
  });

  const sizeGuides = useMemo(() => {
    const map = new Map<number, any>();
    // 1. Initial canonical templates
    DEFAULT_SIZE_GUIDES.forEach(g => map.set(g.id, g));
    // 2. Attached guide from productData if present
    if (productData?.size_guide?.id) {
      map.set(productData.size_guide.id, productData.size_guide);
    }
    // 3. Guides fetched from backend
    if (Array.isArray(fetchedSizeGuides)) {
      fetchedSizeGuides.forEach((g: any) => {
        if (g?.id) {
          map.set(g.id, g);
        }
      });
    }
    return Array.from(map.values());
  }, [fetchedSizeGuides, productData?.size_guide]);

  const suggestedGuide = (() => {
    if (!Array.isArray(sizeGuides) || sizeGuides.length === 0) return null;
    const nameLower = ((formData.name_en || '') + ' ' + (formData.slug || '')).toLowerCase();
    if (nameLower.includes('panjabi') || nameLower.includes('kurta') || nameLower.includes('pajama')) {
      return sizeGuides.find((g: any) => g.name.toLowerCase().includes('panjabi') || g.id === 1);
    }
    if (nameLower.includes('shirt') || nameLower.includes('t-shirt') || nameLower.includes('sweatshirt') || nameLower.includes('polo') || nameLower.includes('hoodie')) {
      return sizeGuides.find((g: any) => g.name.toLowerCase().includes('shirt') || g.id === 2);
    }
    if (nameLower.includes('kurti') || nameLower.includes('gown') || nameLower.includes('saree') || nameLower.includes('ladies') || nameLower.includes('women')) {
      return sizeGuides.find((g: any) => g.name.toLowerCase().includes('ethnic') || g.name.toLowerCase().includes('women') || g.id === 3);
    }
    if (nameLower.includes('pant') || nameLower.includes('jean') || nameLower.includes('trouser') || nameLower.includes('jogger')) {
      return sizeGuides.find((g: any) => g.name.toLowerCase().includes('pant') || g.id === 4);
    }
    if (nameLower.includes('kid') || nameLower.includes('baby') || nameLower.includes('boy') || nameLower.includes('girl')) {
      return sizeGuides.find((g: any) => g.name.toLowerCase().includes('kid') || g.id === 5);
    }
    return null;
  })();

  useEffect(() => {
    if (productData) {
      setFormData({
        name_en: productData.name_en || '',
        name_bn: productData.name_bn || '',
        slug: productData.slug || '',
        category_id: String(productData.category_id || productData.category?.id || ''),
        brand_id: String(productData.brand_id || ''),
        product_type_id: String(productData.product_type_id || ''),
        sku_prefix: productData.sku_prefix || (productData.name_en || '').substring(0, 4).toUpperCase(),
        base_price: String(productData.base_price || productData.current_price || ''),
        compare_price: String(productData.compare_price || ''),
        cost_price: String(productData.cost_price || ''),
        short_description_en: productData.short_description_en || '',
        short_description_bn: productData.short_description_bn || '',
        description_en: productData.description_en || '',
        description_bn: productData.description_bn || '',
        material: productData.material || '',
        fit: productData.fit || '',
        disclaimer: productData.disclaimer || '',
        size_guide_id: String(productData.size_guide_id || productData.size_guide?.id || ''),
        is_active: Boolean(productData.is_active ?? true),
        is_featured: Boolean(productData.is_featured ?? false),
      });

      if (productData.care_instructions) {
        if (Array.isArray(productData.care_instructions)) {
          setCareInstructions(productData.care_instructions);
        } else if (typeof productData.care_instructions === 'string') {
          try {
            const parsed = JSON.parse(productData.care_instructions);
            setCareInstructions(Array.isArray(parsed) ? parsed : [productData.care_instructions]);
          } catch {
            setCareInstructions(productData.care_instructions.split('\n').map((s: string) => s.trim()).filter(Boolean));
          }
        }
      } else {
        setCareInstructions([]);
      }

      if (productData.variants && Array.isArray(productData.variants) && productData.variants.length > 0) {
        setVariants(productData.variants);
      } else {
        setVariants([{
          sku: (productData.name_en || 'PROD').substring(0, 4).toUpperCase() + '-STD-1',
          color: 'Standard',
          size: 'Default',
          price: Number(productData.base_price || 1500),
          cost_price: 0,
          stock: 50,
          is_active: true
        }]);
      }

      if (productData.images && Array.isArray(productData.images) && productData.images.length > 0) {
        setImages(productData.images.map((img: any, i: number) => ({
          id: img.id,
          url: img.url || img.path,
          is_primary: Boolean(img.is_primary ?? (i === 0))
        })));
      } else if (productData.primary_image_url) {
        setImages([{ url: productData.primary_image_url, is_primary: true }]);
      } else {
        setImages([{ url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=85', is_primary: true }]);
      }
      
      if (productData.specifications && Array.isArray(productData.specifications)) {
        setSpecifications(productData.specifications);
      } else {
        setSpecifications([]);
      }
      
      if (productData.highlights && Array.isArray(productData.highlights)) {
        setHighlights(productData.highlights);
      } else {
        setHighlights([]);
      }
    }
  }, [productData]);

  // 3. Delete Product Mutation
  const deleteProductMutation = useMutation({
    mutationFn: async () => {
      return await api.delete(`/admin/products/${id}`);
    },
    onSuccess: () => {
      toast.success('Product deleted successfully');
      router.push('/admin/products');
    },
    onError: () => {
      toast.error('Failed to delete product');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleGenerateSlug = () => {
    if (formData.name_en) {
      const generated = formData.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setFormData(prev => ({ ...prev, slug: generated }));
      toast.success('Slug generated from product title');
    }
  };

  // Variant Matrix Handlers
  const handleAddVariant = () => {
    const prefix = formData.sku_prefix || 'SKU';
    const index = variants.length + 1;
    setVariants(prev => [
      ...prev,
      {
        sku: `${prefix}-VAR-${index}`,
        color: 'Standard',
        size: 'Default',
        weight_grams: 500,
        price: parseFloat(formData.base_price) || 1500,
        cost_price: parseFloat(formData.cost_price) || 1000,
        stock: 25,
        is_active: true,
      }
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      toast.error('At least one variant SKU is required');
      return;
    }
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: string, value: any) => {
    setVariants(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Specification Handlers
  const handleAddSpecification = () => {
    setSpecifications(prev => [...prev, { key: '', value: '' }]);
  };
  const handleRemoveSpecification = (index: number) => {
    setSpecifications(prev => prev.filter((_, i) => i !== index));
  };
  const handleSpecificationChange = (index: number, field: 'key'|'value', val: string) => {
    setSpecifications(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  // Highlight Handlers
  const handleAddHighlight = () => {
    setHighlights(prev => [...prev, '']);
  };
  const handleRemoveHighlight = (index: number) => {
    setHighlights(prev => prev.filter((_, i) => i !== index));
  };
  const handleHighlightChange = (index: number, val: string) => {
    setHighlights(prev => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  // Image Processing & Upload (Supports Files > 4MB)
  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);

    try {
      // 1. Immediately create instant local previews
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImages(prev => {
              const previewUrl = event.target!.result as string;
              if (prev.some(im => im.url === previewUrl || im.name === file.name)) return prev;
              return [
                ...prev,
                { 
                  url: previewUrl, 
                  is_primary: prev.length === 0,
                  name: file.name,
                  size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                }
              ];
            });
          }
        };
        reader.readAsDataURL(file);
      }

      // 2. Direct Multipart FormData upload to backend
      const form = new FormData();
      for (let i = 0; i < files.length; i++) {
        form.append('images[]', files[i]);
      }

      const res: any = await api.upload(`/admin/products/${id}/images`, form);
      const imageItems = Array.isArray(res?.data) 
        ? res.data 
        : (Array.isArray(res?.data?.data) ? res.data.data : []);

      if (imageItems.length > 0) {
        setImages(imageItems.map((img: any, idx: number) => ({
          id: img.id,
          url: img.url || img.path,
          is_primary: Boolean(img.is_primary ?? (idx === 0))
        })));
        toast.success(`${files.length} image(s) uploaded and saved to gallery!`);
        refetch();
      } else {
        toast.success(`${files.length} image(s) ready. Click 'Update Product & Images' to save.`);
      }
    } catch {
      toast.success(`${files.length} image(s) loaded. Click 'Update Product & Images' to commit.`);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handlePasteImageUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!imageUrlInput.trim()) return;

    setImages(prev => [
      ...prev,
      { url: imageUrlInput.trim(), is_primary: prev.length === 0 }
    ]);
    setImageUrlInput('');
    toast.success('Image link added! Click "Save Product Changes" to commit.');
  };

  const handleSelectPreset = (presetUrl: string) => {
    setImages(prev => [
      ...prev,
      { url: presetUrl, is_primary: prev.length === 0 }
    ]);
    setIsPresetsOpen(false);
    toast.success('Preset image added to gallery!');
  };

  const handleRemoveImage = async (index: number) => {
    const img = images[index];
    if (img.id) {
      try {
        await api.delete(`/admin/products/${id}/images/${img.id}`);
      } catch (e) {}
    }

    setImages(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      if (filtered.length > 0 && !filtered.some(im => im.is_primary)) {
        filtered[0].is_primary = true;
      }
      return filtered;
    });
    toast.success('Image removed');
  };

  const handleSetPrimaryImage = async (index: number) => {
    const img = images[index];
    if (img.id) {
      try {
        await api.put(`/admin/products/${id}/images/${img.id}/primary`, {});
      } catch (e) {}
    }

    setImages(prev => prev.map((im, i) => ({ ...im, is_primary: i === index })));
    toast.success('Primary display thumbnail updated');
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages(prev => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  // Submit Master Update (Updates Everything to Database)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name_en.trim()) {
      toast.error('English product title is required');
      return;
    }

    const basePrice = formData.base_price ? parseFloat(formData.base_price) : (variants[0]?.price || 0);

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
          brand_id: formData.brand_id ? parseInt(formData.brand_id) : null,
          product_type_id: formData.product_type_id ? parseInt(formData.product_type_id) : null,
          size_guide_id: formData.size_guide_id ? parseInt(formData.size_guide_id) : null,
        base_price: basePrice,
        compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        material: formData.material || null,
        fit: formData.fit || null,
        disclaimer: formData.disclaimer || null,
        care_instructions: careInstructions.filter(c => c.trim()),
        specifications: specifications.filter(s => s.key.trim() && s.value.trim()),
        highlights: highlights.filter(h => h.trim()),
        variants: variants.map(v => ({
          id: v.id,
          sku: v.sku,
          color: v.color || 'Standard',
          size: v.size || 'Default',
          price: Number(v.price) || basePrice,
          cost_price: Number(v.cost_price) || 0,
          stock: Number(v.stock) || 0,
          weight_grams: Number(v.weight_grams) || 500,
          is_active: Boolean(v.is_active)
        })),
        images: images.map((img, idx) => ({
          id: img.id,
          url: img.url,
          path: img.url,
          is_primary: Boolean(img.is_primary),
          position: idx
        }))
      };

      const res: any = await api.put(`/admin/products/${id}`, payload);
      if (res?.data) {
        const updated = res.data.data || res.data || { id: Number(id), ...payload };
        toast.success('Product details & image gallery updated successfully!');
        queryClient.setQueryData(['admin-product-edit', id], updated);
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        queryClient.invalidateQueries({ queryKey: ['admin-product-edit', id] });
        syncEntityInCache(queryClient, 'product', updated);
        refetch();
      }
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message || err?.response?.data?.error;
      const validationErrors = err?.response?.data?.errors;
      if (validationErrors && typeof validationErrors === 'object') {
        const firstError = Object.values(validationErrors).flat()[0];
        toast.error(String(firstError) || backendMessage || 'Validation failed');
      } else {
        toast.error(backendMessage || err?.message || 'Failed to update product');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center clay-card rounded-3xl space-y-4">
        <RefreshCw className="w-8 h-8 mx-auto text-primary animate-spin" />
        <p className="text-sm font-bold text-foreground">Loading Product & Image Gallery Details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Top Header Card */}
      <div className="clay-card p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-3 neu-btn rounded-2xl text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-foreground tracking-tight">
                Edit Product #{id}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-black ${
                formData.is_active ? 'bg-primary/20 text-primary dark:bg-primary/10/60 dark:text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {formData.is_active ? 'Active on Store' : 'Draft'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              Upload images over 4MB, paste image URLs, manage variant SKUs and update details.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {formData.slug && (
            <Link
              href={`/products/${formData.slug}`}
              target="_blank"
              className="p-3 neu-btn rounded-2xl text-xs font-bold flex items-center gap-1.5 text-foreground hover:text-primary transition-colors"
              title="Preview Live Page"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Storefront</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-3 neu-btn rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="neu-btn-primary px-6 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg w-full sm:w-auto"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Updating...' : 'Update Product & Images'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Product Basic Information */}
        <div className="clay-card p-6 sm:p-8 rounded-3xl space-y-5">
          <h2 className="text-sm font-black text-foreground flex items-center gap-2 border-b border-border pb-3">
            <Package className="w-4 h-4 text-primary" />
            <span>Product Information & Identification</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground">Title (English) *</label>
              <input
                type="text"
                name="name_en"
                required
                value={formData.name_en}
                onChange={handleChange}
                placeholder="e.g. Samsung Galaxy A55 5G"
                className="w-full mt-1 p-3 neu-input rounded-2xl text-xs font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground">Title (Bangla)</label>
              <input
                type="text"
                name="name_bn"
                value={formData.name_bn}
                onChange={handleChange}
                placeholder="স্যামসাং গ্যালাক্সি..."
                className="w-full mt-1 p-3 neu-input rounded-2xl text-xs font-bold focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">URL Slug</label>
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  className="text-[10px] text-primary font-bold hover:underline"
                >
                  Generate
                </button>
              </div>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="w-full mt-1 p-3 neu-input rounded-2xl text-xs font-mono focus:outline-none"
              />
            </div>

                          <div>
                <label className="text-xs font-bold text-foreground">Category</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full mt-1 p-3 neu-input rounded-2xl text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat: any) => (
                    cat.children && cat.children.length > 0 ? (
                      <optgroup key={cat.id} label={cat.name_en}>
                        <option value={cat.id}>{cat.name_en} (Main Category)</option>
                        {cat.children.map((child: any) => (
                          <option key={child.id} value={child.id}>
                            &nbsp;&nbsp;↳ {child.name_en}
                          </option>
                        ))}
                      </optgroup>
                    ) : (
                      <option key={cat.id} value={cat.id}>{cat.name_en}</option>
                    )
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Brand</label>
                <select
                  name="brand_id"
                  value={formData.brand_id}
                  onChange={handleChange}
                  className="w-full mt-1 p-3 neu-input rounded-2xl text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="">Select Brand</option>
                  {brands.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name_en || b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span>Product Type</span>
                    {formData.product_type_id ? (
                      <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">
                        {productTypes.find((t: any) => String(t.id) === String(formData.product_type_id))?.name_en || 'Selected'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        (Select Type)
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsProductTypeModalOpen(true)}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Plus size={12} /> Add Type
                  </button>
                </div>
                <select
                  name="product_type_id"
                  value={formData.product_type_id}
                  onChange={handleChange}
                  className="w-full mt-1 p-3 neu-input rounded-2xl text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    -- Select Product Type --
                  </option>
                  {productTypes.map((t: any) => (
                    <option 
                      key={t.id} 
                      value={String(t.id)}
                      className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                    >
                      {t.name_en || t.name}
                    </option>
                  ))}
                </select>

                {/* Quick Selection Interactive Pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {productTypes.map((t: any) => {
                    const isSelected = String(formData.product_type_id) === String(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, product_type_id: String(t.id) }))}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-sm scale-102 ring-2 ring-primary/30'
                            : 'neu-btn text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span>{isSelected ? '✓' : '•'}</span>
                        <span>{t.name_en || t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span>Size Guide</span>
                    {formData.size_guide_id ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                        Attached
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        (Optional)
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSizeGuideModalOpen(true)}
                      className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Plus size={12} /> Create Guide
                    </button>
                  </div>
                </div>
                <select
                  name="size_guide_id"
                  value={formData.size_guide_id}
                  onChange={handleChange}
                  className="w-full mt-1 p-3 neu-input rounded-2xl text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">-- No Size Guide (Not Assigned) --</option>
                  {sizeGuides.map((g: any) => (
                    <option key={g.id} value={g.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {g.name}
                    </option>
                  ))}
                </select>

                {/* Quick Select Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-muted-foreground font-semibold mr-0.5">Quick Select:</span>
                  {sizeGuides.slice(0, 5).map((g: any) => {
                    const isSelected = String(formData.size_guide_id) === String(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, size_guide_id: isSelected ? '' : String(g.id) }))}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-border/50'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{g.name.replace(' Size Guide', '')}
                      </button>
                    );
                  })}
                </div>

                {/* Attached Size Guide Indicator */}
                {formData.size_guide_id && (
                  <div className="mt-1.5 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5 text-[11px]">
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                      <span>✓ Attached:</span>
                      <strong className="underline">
                        {sizeGuides.find((g: any) => String(g.id) === String(formData.size_guide_id))?.name || `Guide #${formData.size_guide_id}`}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, size_guide_id: '' }))}
                      className="text-[10px] text-muted-foreground hover:text-red-500 font-bold cursor-pointer"
                    >
                      Detach
                    </button>
                  </div>
                )}

                {/* Smart Size Guide Recommendation */}
                {suggestedGuide && !formData.size_guide_id && (
                  <div className="mt-1.5 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-3 py-1.5 text-[11px]">
                    <span className="text-muted-foreground">
                      💡 Suggested: <strong className="text-primary font-bold">{suggestedGuide.name}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, size_guide_id: String(suggestedGuide.id) }))}
                      className="px-2 py-0.5 rounded-lg bg-primary text-primary-foreground font-bold text-[10px] hover:bg-primary/90 transition-all cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

            <div>
              <label className="text-xs font-bold text-foreground">SKU Prefix</label>
              <input
                type="text"
                name="sku_prefix"
                value={formData.sku_prefix}
                onChange={handleChange}
                className="w-full mt-1 p-3 neu-input rounded-2xl text-xs font-mono uppercase focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-foreground">Selling Base Price (৳) *</label>
              <input
                type="number"
                name="base_price"
                required
                value={formData.base_price}
                onChange={handleChange}
                placeholder="42999"
                className="w-full mt-1 p-3 neu-input rounded-2xl text-xs font-black focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground">Original / Compare Price (৳)</label>
              <input
                type="number"
                name="compare_price"
                value={formData.compare_price}
                onChange={handleChange}
                placeholder="45999"
                className="w-full mt-1 p-3 neu-input rounded-2xl text-xs font-bold focus:outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">Production / Making / Purchase Cost (৳)</label>
                <span className="text-[10px] text-primary font-bold">For Net Profit Analytics</span>
              </div>
              <input
                type="number"
                name="cost_price"
                value={formData.cost_price}
                onChange={handleChange}
                placeholder="e.g. 35000 (Making / Procurement cost)"
                className="w-full mt-1 p-3 neu-input rounded-2xl text-xs font-bold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Image Gallery Management Section (Full CRUD, > 4MB Uploads & Paste Link) */}
        <div className="clay-card p-6 sm:p-8 rounded-3xl space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-black text-foreground flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                <span>Product Image Gallery & Upload Center ({images.length} Images)</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Upload image files (supports files over 4MB, JPEG, PNG, WEBP, SVG) or paste any image URL.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="neu-btn-primary px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{isUploadingImage ? 'Processing...' : 'Upload Image File(s)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPresetsOpen(!isPresetsOpen)}
                className="neu-btn px-3 py-2.5 rounded-2xl text-xs font-bold text-foreground hover:text-primary"
              >
                Presets Library
              </button>
            </div>
          </div>

          {/* Drag & Drop Upload Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-2 ${
              isDragging ? 'border-primary bg-primary/10 ring-2 ring-primary/30' : 'border-border/70 hover:border-primary/50 bg-background/30'
            }`}
          >
            <div className="w-12 h-12 mx-auto neu-inset rounded-2xl flex items-center justify-center text-primary">
              <FileImage className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-foreground">
              Drag & Drop your product photos here, or <span className="text-primary underline">browse from computer</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Supports high-resolution images over 4MB (JPEG, PNG, WEBP, SVG)
            </p>
          </div>

          {/* Paste Image URL Input Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-primary" />
              <span>Or Paste Direct Image Link / Web URL:</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste Image URL (e.g. https://... or https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=85)"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handlePasteImageUrl(); } }}
                className="flex-1 p-3 neu-input rounded-2xl text-xs font-semibold focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handlePasteImageUrl()}
                className="neu-btn px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-1.5 hover:text-primary cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Link</span>
              </button>
            </div>
          </div>

          {/* Preset Picker Modal/Dropdown */}
          {isPresetsOpen && (
            <div className="neu-inset p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Click to add preset gadget image:</span>
                <button type="button" onClick={() => setIsPresetsOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {PRESET_PRODUCT_IMAGES.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => handleSelectPreset(preset.url)}
                    className="p-2 neu-flat rounded-xl text-center hover:ring-2 hover:ring-primary transition-all flex flex-col items-center gap-1.5"
                  >
                    <img src={preset.url} alt={preset.name} className="w-12 h-12 object-contain rounded-lg" />
                    <span className="text-[10px] font-bold line-clamp-1">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Existing Image Gallery Grid */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-foreground">Active Gallery Images ({images.length})</span>
              <span className="text-[11px] text-muted-foreground">Click ⭐ to set primary thumbnail</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`relative aspect-square rounded-2xl neu-inset p-1.5 overflow-hidden group border-2 transition-all ${
                    img.is_primary ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-border'
                  }`}
                >
                  <img src={formatImageUrl(img.url)} alt={img.name || "Product Gallery Tile"} 
                    className="w-full h-full object-contain rounded-xl bg-background/40" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=85';
                    }}
                  />
                  
                  {/* Action Hover Controls */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(idx)}
                        className={`p-1.5 rounded-full shadow-md cursor-pointer ${img.is_primary ? 'bg-amber-500 text-white' : 'bg-white/30 text-white hover:bg-white/50'}`}
                        title="Set as Primary Thumbnail"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-md cursor-pointer"
                        title="Delete Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Reorder Buttons */}
                    <div className="flex items-center justify-center gap-2">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveImage(idx, 'left')}
                          className="p-1 rounded bg-white/30 text-white hover:bg-white/50 cursor-pointer"
                          title="Move Left"
                        >
                          <MoveLeft className="w-3 h-3" />
                        </button>
                      )}
                      {idx < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveImage(idx, 'right')}
                          className="p-1 rounded bg-white/30 text-white hover:bg-white/50 cursor-pointer"
                          title="Move Right"
                        >
                          <MoveRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Primary Badge */}
                  {img.is_primary && (
                    <div className="absolute bottom-0 inset-x-0 bg-primary text-primary-foreground text-[9px] font-black text-center py-0.5 tracking-wider uppercase">
                      PRIMARY
                    </div>
                  )}

                  {/* Size label if available */}
                  {img.size && (
                    <div className="absolute top-1 left-1 bg-black/70 text-white text-[8px] font-mono px-1 rounded">
                      {img.size}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Variant Matrix & Stocks Full CRUD */}
        <div className="clay-card p-6 sm:p-8 rounded-3xl space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-black text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>SKU Variant Matrix & Stock Levels ({variants.length})</span>
            </h2>
            <button
              type="button"
              onClick={handleAddVariant}
              className="px-3.5 py-1.5 neu-btn rounded-xl text-xs font-bold text-primary flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Variant SKU</span>
            </button>
          </div>

          <div className="space-y-3">
            {variants.map((v, idx) => (
              <div key={idx} className="p-4 neu-inset rounded-2xl grid grid-cols-1 sm:grid-cols-7 gap-3 items-center">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">SKU Code</label>
                  <input
                    type="text"
                    value={v.sku}
                    onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                    className="w-full mt-0.5 p-2 bg-transparent text-xs font-mono font-bold text-foreground focus:outline-none border-b border-border/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Color / Shade</label>
                  <input
                    type="text"
                    value={v.color || ''}
                    onChange={(e) => handleVariantChange(idx, 'color', e.target.value)}
                    className="w-full mt-0.5 p-2 bg-transparent text-xs font-bold text-foreground focus:outline-none border-b border-border/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Size / Spec</label>
                  <input
                    type="text"
                    value={v.size || ''}
                    onChange={(e) => handleVariantChange(idx, 'size', e.target.value)}
                    className="w-full mt-0.5 p-2 bg-transparent text-xs font-bold text-foreground focus:outline-none border-b border-border/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Price (৳)</label>
                  <input
                    type="number"
                    value={v.price}
                    onChange={(e) => handleVariantChange(idx, 'price', parseFloat(e.target.value) || 0)}
                    className="w-full mt-0.5 p-2 bg-transparent text-xs font-black text-foreground focus:outline-none border-b border-border/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-primary dark:text-primary">Making / Cost (৳)</label>
                  <input
                    type="number"
                    placeholder="Cost"
                    value={v.cost_price ?? ''}
                    onChange={(e) => handleVariantChange(idx, 'cost_price', parseFloat(e.target.value) || 0)}
                    className="w-full mt-0.5 p-2 bg-transparent text-xs font-bold text-foreground focus:outline-none border-b border-border/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Stock Units</label>
                  <input
                    type="number"
                    min="0"
                    value={v.stock}
                    onChange={(e) => handleVariantChange(idx, 'stock', parseInt(e.target.value) || 0)}
                    className="w-full mt-0.5 p-2 bg-transparent text-xs font-black text-foreground focus:outline-none border-b border-border/50"
                  />
                </div>
                <div className="flex items-center justify-end">
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="p-2 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                      title="Remove Variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Descriptions & Toggles */}
        <div className="clay-card p-6 sm:p-8 rounded-3xl space-y-5">
          <h2 className="text-sm font-black text-foreground border-b border-border pb-3">Product Description & Highlights</h2>
          
          <div>
            <label className="text-xs font-bold text-foreground">Short Summary (Highlights)</label>
            <textarea
              name="short_description_en"
              rows={2}
              value={formData.short_description_en || ''}
              onChange={handleChange}
              placeholder="Key specifications, warranty, and highlights..."
              className="w-full mt-1 p-3 neu-input rounded-2xl text-xs font-semibold focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  Detailed Product Description
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Direct Text (No HTML)
                  </span>
                </label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Write natural text. Paragraphs, spacing, and bullet points are preserved automatically on product pages.
                </p>
              </div>

              {/* Quick Direct Formatting Toolbar */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      description_en: (prev.description_en ? prev.description_en + '\n• ' : '• ')
                    }));
                  }}
                  className="px-2.5 py-1 rounded-xl neu-btn text-[11px] font-bold text-foreground hover:text-primary transition-all flex items-center gap-1 cursor-pointer"
                  title="Add a bullet point"
                >
                  <span>•</span> Add Bullet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      description_en: (prev.description_en ? prev.description_en + '\n\n' : '')
                    }));
                  }}
                  className="px-2.5 py-1 rounded-xl neu-btn text-[11px] font-bold text-foreground hover:text-primary transition-all flex items-center gap-1 cursor-pointer"
                  title="Add paragraph line break"
                >
                  <span>↵</span> Paragraph Break
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sample = `Crafted from premium breathable fabric designed for all-day comfort and sophistication.

Key Details:
• Fabric: 100% Combed Compact Cotton
• Fit: Modern Regular Fit
• Finish: Bio-washed soft handfeel
• Occasion: Casual outings, workwear & evening gatherings
• Care Instructions: Machine wash cold with like colors, do not bleach.`;
                    setFormData(prev => ({
                      ...prev,
                      description_en: prev.description_en ? prev.description_en + '\n\n' + sample : sample
                    }));
                  }}
                  className="px-2.5 py-1 rounded-xl neu-btn text-[11px] font-bold text-primary hover:bg-primary/10 transition-all flex items-center gap-1 cursor-pointer"
                  title="Insert a pre-formatted clean text template"
                >
                  <span>✨</span> Insert Clean Template
                </button>
                {formData.description_en && (formData.description_en.includes('<') && formData.description_en.includes('>')) && (
                  <button
                    type="button"
                    onClick={() => {
                      const clean = (formData.description_en || '')
                        .replace(/<br\s*[\/]?>/gi, '\n')
                        .replace(/<\/p>/gi, '\n\n')
                        .replace(/<\/li>/gi, '\n')
                        .replace(/<li>/gi, '• ')
                        .replace(/<[^>]+>/g, '')
                        .replace(/&nbsp;/g, ' ')
                        .trim();
                      setFormData(prev => ({ ...prev, description_en: clean }));
                    }}
                    className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold hover:bg-amber-500/20 transition-all flex items-center gap-1 cursor-pointer"
                    title="Convert legacy HTML tags into clean direct text"
                  >
                    <span>🧹</span> Clean HTML Tags
                  </button>
                )}
              </div>
            </div>

            <textarea
              name="description_en"
              rows={6}
              value={formData.description_en || ''}
              onChange={handleChange}
              placeholder="Describe the product in detail — its styling, fit, fabric, comfort, and occasion...
Press Enter for new lines or paragraphs. You don't need to know any HTML tags!"
              className="w-full mt-1 p-3 neu-input rounded-2xl text-xs sm:text-sm font-normal leading-relaxed focus:outline-none placeholder:text-muted-foreground/60"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-foreground">Specifications (Key-Value)</label>
              <button type="button" onClick={handleAddSpecification} className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Row
              </button>
            </div>
            <div className="space-y-2">
              {specifications.map((spec, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="text" value={spec.key} onChange={e => handleSpecificationChange(idx, 'key', e.target.value)} placeholder="e.g. Color" className="w-1/3 p-2 neu-input rounded-xl text-xs" />
                  <input type="text" value={spec.value} onChange={e => handleSpecificationChange(idx, 'value', e.target.value)} placeholder="e.g. Red" className="flex-1 p-2 neu-input rounded-xl text-xs" />
                  <button type="button" onClick={() => handleRemoveSpecification(idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {specifications.length === 0 && <div className="text-xs text-muted-foreground italic py-2">No specifications added.</div>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-foreground">Key Highlights (Bullet Points)</label>
              <button type="button" onClick={handleAddHighlight} className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Highlight
              </button>
            </div>
            <div className="space-y-2">
              {highlights.map((highlight, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="text" value={highlight} onChange={e => handleHighlightChange(idx, e.target.value)} placeholder="e.g. 1 Year Official Warranty" className="flex-1 p-2 neu-input rounded-xl text-xs" />
                  <button type="button" onClick={() => handleRemoveHighlight(idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {highlights.length === 0 && <div className="text-xs text-muted-foreground italic py-2">No highlights added.</div>}
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 text-primary rounded"
              />
              <span className="text-xs font-bold text-foreground">Active & Visible on Store</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                className="w-4 h-4 text-primary rounded"
              />
              <span className="text-xs font-bold text-foreground">Feature on Homepage</span>
            </label>
          </div>
        </div>

        {/* Apparel & Panjabi Details: Material, Fit, Care Instructions & Disclaimer */}
        <div className="clay-card p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
            <div>
              <h2 className="text-sm font-black text-foreground">Apparel & Panjabi Specifications</h2>
              <p className="text-[11px] text-muted-foreground">Manage Fabric Material, Fit silhouette, Garment Care Instructions, and Color Disclaimers.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleLoadPanjabiTemplate}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold hover:bg-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ Panjabi</span>
              </button>
              <button
                type="button"
                onClick={handleLoadSocksTemplate}
                className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold hover:bg-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ Socks</span>
              </button>
              <button
                type="button"
                onClick={handleLoadBackpackTemplate}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-xs font-bold hover:bg-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ Backpack</span>
              </button>
              <button
                type="button"
                onClick={handleLoadBeltTemplate}
                className="px-3 py-1.5 rounded-xl bg-amber-700/10 text-amber-800 dark:text-amber-300 border border-amber-700/20 text-xs font-bold hover:bg-amber-700/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ Belt</span>
              </button>
              <button
                type="button"
                onClick={handleLoadWalletTemplate}
                className="px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 text-xs font-bold hover:bg-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ Wallet</span>
              </button>
              <button
                type="button"
                onClick={handleLoadTShirtTemplate}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ T-Shirt</span>
              </button>
              <button
                type="button"
                onClick={handleLoadShirtTemplate}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-bold hover:bg-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ Shirt</span>
              </button>
              <button
                type="button"
                onClick={handleLoadDenimTemplate}
                className="px-3 py-1.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-xs font-bold hover:bg-sky-500/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ Denim</span>
              </button>
              <button
                type="button"
                onClick={handleLoadWinterwearTemplate}
                className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-bold hover:bg-purple-500/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ Winterwear</span>
              </button>
              <button
                type="button"
                onClick={handleLoadWomenEthnicTemplate}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold hover:bg-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ Saree / Kurti</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">Fabric Material</label>
                <div className="flex flex-wrap gap-1 text-[10px]">
                  <button type="button" onClick={() => setFormData(p => ({ ...p, material: 'Jacquard Cotton' }))} className="text-primary hover:underline font-semibold">+ Jacquard</button>
                  <span className="text-muted-foreground">•</span>
                  <button type="button" onClick={() => setFormData(p => ({ ...p, material: '95% Cotton & 5% Spandex Fabric.' }))} className="text-primary hover:underline font-semibold">+ Cotton/Spandex</button>
                  <span className="text-muted-foreground">•</span>
                  <button type="button" onClick={() => setFormData(p => ({ ...p, material: 'Polyester Fabric.' }))} className="text-primary hover:underline font-semibold">+ Polyester</button>
                  <span className="text-muted-foreground">•</span>
                  <button type="button" onClick={() => setFormData(p => ({ ...p, material: '100% genuine leather.' }))} className="text-primary hover:underline font-semibold">+ 100% Leather</button>
                </div>
              </div>
              <input
                type="text"
                name="material"
                value={formData.material || ''}
                onChange={handleChange}
                placeholder="e.g. 100% genuine leather., Polyester Fabric"
                className="w-full mt-1.5 p-3 neu-input rounded-2xl text-xs font-semibold focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">Fit Type</label>
                <div className="flex flex-wrap gap-1 text-[10px]">
                  <button type="button" onClick={() => setFormData(p => ({ ...p, fit: 'Regular Fit' }))} className="text-primary hover:underline font-semibold">+ Regular</button>
                  <span className="text-muted-foreground">•</span>
                  <button type="button" onClick={() => setFormData(p => ({ ...p, fit: 'Comfort Fit' }))} className="text-primary hover:underline font-semibold">+ Comfort</button>
                  <span className="text-muted-foreground">•</span>
                  <button type="button" onClick={() => setFormData(p => ({ ...p, fit: 'Classic Adjustable Fit (Formal & Casual)' }))} className="text-primary hover:underline font-semibold">+ Belt Fit</button>
                </div>
              </div>
              <input
                type="text"
                name="fit"
                value={formData.fit || ''}
                onChange={handleChange}
                placeholder="e.g. Regular Fit, Tailored Fit"
                className="w-full mt-1.5 p-3 neu-input rounded-2xl text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>

          {/* Care Instructions Checklist */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-foreground">Care Instructions (Checklist)</label>
                <p className="text-[10px] text-muted-foreground">Appears with green checkmarks on the storefront product page.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadPanjabiCareDefaults}
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Load 8 Panjabi Rules
                </button>
                <button
                  type="button"
                  onClick={() => setCareInstructions(prev => [...prev, ''])}
                  className="px-2.5 py-1 rounded-lg neu-btn text-[11px] font-bold text-foreground flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Instruction
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {careInstructions.map((instruction, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 text-xs font-black">
                    ✓
                  </div>
                  <input
                    type="text"
                    value={instruction}
                    onChange={(e) => {
                      const updated = [...careInstructions];
                      updated[idx] = e.target.value;
                      setCareInstructions(updated);
                    }}
                    placeholder="e.g. Wash dark colors separately"
                    className="flex-1 p-2 neu-input rounded-xl text-xs font-semibold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCareInstructions(prev => prev.filter((_, i) => i !== idx))}
                    className="p-2 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {careInstructions.length === 0 && (
                <div className="p-4 rounded-2xl neu-inset text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <p>No care instructions configured.</p>
                  <button
                    type="button"
                    onClick={handleLoadPanjabiCareDefaults}
                    className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition-all cursor-pointer"
                  >
                    ⚡ Click to Load Official Panjabi Care Guide
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Color & Photography Disclaimer */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">Photography / Color Variation Disclaimer</label>
              <button
                type="button"
                onClick={handleLoadStandardDisclaimer}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> Load Standard Disclaimer
              </button>
            </div>
            <textarea
              name="disclaimer"
              rows={2}
              value={formData.disclaimer || ''}
              onChange={handleChange}
              placeholder="e.g. Product color may slightly vary due to various monitor settings & photographic lighting sources."
              className="w-full p-3 neu-input rounded-2xl text-xs font-medium focus:outline-none"
            />
          </div>
        </div>

        {/* Bottom Save Action Bar */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <Link href="/admin/products" className="px-6 py-3 neu-btn rounded-2xl text-xs font-bold text-muted-foreground">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="neu-btn-primary px-8 py-3.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-xl cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Updating Product & Images...' : 'Update Product & Images'}</span>
          </button>
        </div>
      </form>

      {/* Modal: Delete Product */}
      {isDeleteModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDeleteModalOpen(false);
          }}
          className="fixed inset-0 z-[110] neu-backdrop flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neu-modal rounded-3xl max-w-md w-full p-6 space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="w-12 h-12 mx-auto neu-card-inset rounded-2xl flex items-center justify-center text-red-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-foreground">Delete Product #{id}</h3>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to delete <span className="font-bold text-foreground">"{formData.name_en}"</span>? This will remove all associated variant SKUs and gallery images.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2 neu-modal-footer">
              <button onClick={() => setIsDeleteModalOpen(false)} className="neu-btn-secondary px-5 py-2.5 text-xs font-bold">
                Cancel
              </button>
              <button
                onClick={() => deleteProductMutation.mutate()}
                disabled={deleteProductMutation.isPending}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:translate-y-0.5 text-white rounded-2xl text-xs font-black shadow-md transition-all"
              >
                {deleteProductMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4-Column Table Modal: Create Size Guide */}
      <SizeGuideModal
        isOpen={isSizeGuideModalOpen}
        onClose={() => setIsSizeGuideModalOpen(false)}
        initialName={formData.name_en ? `${formData.name_en} Size Guide` : ''}
        onSuccess={(newId) => {
          setFormData(prev => ({ ...prev, size_guide_id: String(newId) }));
        }}
      />

      {/* Create Product Type Modal */}
      {isProductTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border/80 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Create Product Type</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Add a new category classification (e.g. Activewear, Streetwear)</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsProductTypeModalOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateProductType} id="productTypeForm" className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Product Type Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Streetwear, Loungewear, Activewear"
                  value={newProductTypeName}
                  onChange={e => setNewProductTypeName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none text-xs font-bold"
                />
              </div>
            </form>
            
            <div className="p-6 border-t border-border bg-muted/30 flex justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsProductTypeModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-colors cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="productTypeForm"
                disabled={createProductTypeMutation.isPending}
                className="px-5 py-2.5 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
              >
                {createProductTypeMutation.isPending ? 'Creating...' : 'Create Type'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
