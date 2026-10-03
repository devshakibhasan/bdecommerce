import { toBengaliNumerals } from '../utils/currency';

type Translations = Record<string, Record<string, string>>;

const translations: Translations = {
  nav: {
    home: 'Home',
    home_bn: 'হোম',
    products: 'Products',
    products_bn: 'পণ্য',
    categories: 'Categories',
    categories_bn: 'ক্যাটাগরি',
    cart: 'Cart',
    cart_bn: 'কার্ট',
    checkout: 'Checkout',
    checkout_bn: 'চেকআউট',
    track_order: 'Track Order',
    track_order_bn: 'অর্ডার ট্র্যাক করুন',
    login: 'Login',
    login_bn: 'লগইন',
    register: 'Register',
    register_bn: 'রেজিস্টার',
    account: 'Account',
    account_bn: 'অ্যাকাউন্ট',
    logout: 'Logout',
    logout_bn: 'লগআউট',
    admin: 'Admin',
    admin_bn: 'অ্যাডমিন',
  },
  product: {
    add_to_cart: 'Add to Cart',
    add_to_cart_bn: 'কার্টে যোগ করুন',
    buy_now: 'Buy Now',
    buy_now_bn: 'এখন কিনুন',
    out_of_stock: 'Out of Stock',
    out_of_stock_bn: 'স্টকে নেই',
    in_stock: 'In Stock',
    in_stock_bn: 'স্টকে আছে',
    price: 'Price',
    price_bn: 'মূল্য',
    compare_price: 'Compare Price',
    compare_price_bn: 'পূর্বের মূল্য',
    description: 'Description',
    description_bn: 'বিবরণ',
    reviews: 'Reviews',
    reviews_bn: 'রিভিউ',
  },
  checkout: {
    your_cart: 'Your Cart',
    your_cart_bn: 'আপনার কার্ট',
    checkout: 'Checkout',
    checkout_bn: 'চেকআউট',
    customer_info: 'Customer Information',
    customer_info_bn: 'গ্রাহকের তথ্য',
    shipping_info: 'Shipping Information',
    shipping_info_bn: 'শিপিং তথ্য',
    payment_method: 'Payment Method',
    payment_method_bn: 'পেমেন্ট মেথড',
    place_order: 'Place Order',
    place_order_bn: 'অর্ডার করুন',
    name: 'Name',
    name_bn: 'নাম',
    phone: 'Phone Number',
    phone_bn: 'ফোন নম্বর',
    email: 'Email (Optional)',
    email_bn: 'ইমেইল (ঐচ্ছিক)',
    address: 'Full Address',
    address_bn: 'পূর্ণ ঠিকানা',
    area: 'Area',
    area_bn: 'এলাকা',
    zone: 'Shipping Zone',
    zone_bn: 'শিপিং জোন',
    inside_dhaka: 'Inside Dhaka',
    inside_dhaka_bn: 'ঢাকার ভিতরে',
    dhaka_suburb: 'Dhaka Suburb',
    dhaka_suburb_bn: 'ঢাকার আশেপাশে',
    outside_dhaka: 'Outside Dhaka',
    outside_dhaka_bn: 'ঢাকার বাইরে',
    cod: 'Cash on Delivery',
    cod_bn: 'ক্যাশ অন ডেলিভারি',
    bkash: 'bKash',
    bkash_bn: 'বিকাশ',
    nagad: 'Nagad',
    nagad_bn: 'নগদ',
    online_payment: 'Online Payment',
    online_payment_bn: 'অনলাইন পেমেন্ট',
    delivery_fee: 'Delivery Fee',
    delivery_fee_bn: 'ডেলিভারি চার্জ',
    advance_required: 'Advance Required',
    advance_required_bn: 'অগ্রিম প্রয়োজন',
    subtotal: 'Subtotal',
    subtotal_bn: 'সাবটোটাল',
    discount: 'Discount',
    discount_bn: 'ডিসকাউন্ট',
    total: 'Total',
    total_bn: 'মোট',
    coupon_code: 'Coupon Code',
    coupon_code_bn: 'কুপন কোড',
    apply: 'Apply',
    apply_bn: 'প্রয়োগ করুন',
    order_success: 'Order placed successfully!',
    order_success_bn: 'অর্ডার সফলভাবে সম্পন্ন হয়েছে!',
    order_failed: 'Failed to place order',
    order_failed_bn: 'অর্ডার করতে ব্যর্থ হয়েছে',
  },
  common: {
    search: 'Search...',
    search_bn: 'অনুসন্ধান করুন...',
    loading: 'Loading...',
    loading_bn: 'লোড হচ্ছে...',
    no_results: 'No results found',
    no_results_bn: 'কোন ফলাফল পাওয়া যায়নি',
    view_all: 'View All',
    view_all_bn: 'সব দেখুন',
    save: 'Save',
    save_bn: 'সংরক্ষণ করুন',
    cancel: 'Cancel',
    cancel_bn: 'বাতিল করুন',
    delete: 'Delete',
    delete_bn: 'মুছুন',
    edit: 'Edit',
    edit_bn: 'সম্পাদনা করুন',
    close: 'Close',
    close_bn: 'বন্ধ করুন',
    back: 'Back',
    back_bn: 'ফিরে যান',
    next: 'Next',
    next_bn: 'পরবর্তী',
    previous: 'Previous',
    previous_bn: 'পূর্ববর্তী',
    submit: 'Submit',
    submit_bn: 'জমা দিন',
    confirm: 'Confirm',
    confirm_bn: 'নিশ্চিত করুন',
    required_field: 'This field is required',
    required_field_bn: 'এই ঘরটি পূরণ করা আবশ্যক',
    invalid_phone: 'Invalid phone number',
    invalid_phone_bn: 'ভুল ফোন নম্বর',
  },
  admin: {
    dashboard: 'Dashboard',
    dashboard_bn: 'ড্যাশবোর্ড',
    orders: 'Orders',
    orders_bn: 'অর্ডার',
    products: 'Products',
    products_bn: 'পণ্য',
    categories: 'Categories',
    categories_bn: 'ক্যাটাগরি',
    pages: 'Pages',
    pages_bn: 'পেজ',
    coupons: 'Coupons',
    coupons_bn: 'কুপন',
    flash_sales: 'Flash Sales',
    flash_sales_bn: 'ফ্ল্যাশ সেল',
    settlements: 'Settlements',
    settlements_bn: 'সেটেলমেন্ট',
    risk_profiles: 'Risk Profiles',
    risk_profiles_bn: 'রিস্ক প্রোফাইল',
    settings: 'Settings',
    settings_bn: 'সেটিংস',
    total_orders: 'Total Orders',
    total_orders_bn: 'মোট অর্ডার',
    revenue: 'Revenue',
    revenue_bn: 'আয়',
    pending: 'Pending',
    pending_bn: 'অপেক্ষমাণ',
    processing: 'Processing',
    processing_bn: 'প্রক্রিয়াকরণ চলছে',
    delivered: 'Delivered',
    delivered_bn: 'ডেলিভারি হয়েছে',
  },
  tracking: {
    track_order: 'Track Order',
    track_order_bn: 'অর্ডার ট্র্যাক করুন',
    enter_order_number: 'Enter Order Number',
    enter_order_number_bn: 'অর্ডার নম্বর লিখুন',
    enter_phone: 'Enter Phone Number',
    enter_phone_bn: 'ফোন নম্বর লিখুন',
    track: 'Track',
    track_bn: 'ট্র্যাক',
    order_status: 'Order Status',
    order_status_bn: 'অর্ডার স্ট্যাটাস',
    estimated_delivery: 'Estimated Delivery',
    estimated_delivery_bn: 'সম্ভাব্য ডেলিভারি',
  }
};

export const t = (key: string, locale: 'en' | 'bn'): string => {
  const parts = key.split('.');
  let current: any = translations;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return key;
    }
  }
  
  if (locale === 'bn' && typeof current === 'object' && `${parts[parts.length-1]}_bn` in current) {
      return current[`${parts[parts.length-1]}_bn`];
  } else if (locale === 'bn' && typeof current === 'string') {
      const bnKey = parts[parts.length-1] + "_bn";
      // This logic is slightly flawed for nested but works for our structure
      const parent = translations[parts[0]];
      if(parent && parent[bnKey]) return parent[bnKey];
  }

  return current && typeof current === 'string' ? current : key;
};

export const toBengaliNum = (n: number | string): string => {
  return toBengaliNumerals(n.toString());
};

export const formatCurrency = (amount: number, locale: 'en' | 'bn'): string => {
  if (locale === 'bn') {
    return `৳ ${toBengaliNum(amount.toLocaleString('en-US'))}`;
  }
  return `৳ ${amount.toLocaleString('en-US')}`;
};
