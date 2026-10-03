'use client';

import { useState } from 'react';
import { useLocaleStore } from '@/lib/store';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q_en: 'How long does delivery take inside and outside Dhaka?',
    q_bn: 'ঢাকা ও ঢাকার বাইরে ডেলিভারি পেতে কত দিন সময় লাগে?',
    a_en: 'Inside Dhaka orders are typically delivered within 24 hours. For Dhaka suburbs (Gazipur, Savar, Narayanganj), delivery takes 24-48 hours. For all other 63 districts, delivery takes 48-72 hours via Steadfast, Pathao, or RedX.',
    a_bn: 'ঢাকার ভিতরে সাধারণত ২৪ ঘণ্টার মধ্যে ডেলিভারি সম্পন্ন হয়। ঢাকার পার্শ্ববর্তী এলাকায় ২৪-৪৮ ঘণ্টা এবং ঢাকার বাইরে ৪৮-৭২ ঘণ্টার মধ্যে ডেলিভারি করা হয়।',
  },
  {
    q_en: 'Can I pay with Cash on Delivery (COD)?',
    q_bn: 'আমি কি ক্যাশ অন ডেলিভারিতে (COD) মূল্য পরিশোধ করতে পারি?',
    a_en: 'Yes, 100% of our products support Cash on Delivery. You only pay when you inspect the parcel seal at your doorstep.',
    a_bn: 'হ্যাঁ, আমাদের প্রতিটি পণ্যে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে। পার্সেল হাতে পেয়ে মূল্য পরিশোধ করতে পারবেন।',
  },
  {
    q_en: 'How do I pay with bKash or Nagad?',
    q_bn: 'বিকাশ বা নগদে কিভাবে পেমেন্ট করবো?',
    a_en: 'Select bKash or Nagad during checkout. You will be redirected to the secure gateway or prompt to complete seamless instant payment without any extra charge.',
    a_bn: 'চেকআউট করার সময় বিকাশ বা নগদ সিলেক্ট করুন এবং সরাসরি পিন দিয়ে পেমেন্ট সম্পন্ন করতে পারবেন। কোনো বাড়তি চার্জ নেই।',
  },
  {
    q_en: 'What is the replacement or refund process?',
    q_bn: 'পণ্য পরিবর্তন বা রিফান্ডের নিয়ম কি?',
    a_en: 'We provide a 7-day hassle-free replacement guarantee. If the product has any manufacturing defect or arrives damaged, contact our WhatsApp helpline at 01410737290 to initiate immediate pickup.',
    a_bn: 'পণ্য হাতে পাওয়ার ৭ দিনের মধ্যে যেকোনো ত্রুটির ক্ষেত্রে হেল্পলাইনে যোগাযোগ করে সরাসরি রিপ্লেসমেন্ট বা রিফান্ড নিতে পারবেন।',
  },
];

export default function FAQPage() {
  const { locale } = useLocaleStore();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-10">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 neu-flat rounded-2xl flex items-center justify-center text-primary mx-auto text-2xl">
          ❓
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
          {locale === 'bn' ? 'সাধারণ জিজ্ঞাসা (FAQ)' : 'Frequently Asked Questions'}
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Find instant answers to common questions about orders, delivery, and payments.
        </p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          const q = locale === 'bn' ? faq.q_bn : faq.q_en;
          const a = locale === 'bn' ? faq.a_bn : faq.a_en;

          return (
            <div key={idx} className="neu-flat rounded-3xl overflow-hidden transition-all">
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-6 text-left font-bold text-sm text-foreground flex items-center justify-between gap-4 cursor-pointer"
              >
                <span>{q}</span>
                <ChevronDown className={`w-4 h-4 text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/40 neu-inset mx-4 mb-4 rounded-2xl p-4">
                  {a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}