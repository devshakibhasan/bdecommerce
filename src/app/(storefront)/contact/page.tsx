'use client';

import { useState } from 'react';
import { useLocaleStore } from '@/lib/store';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const { locale } = useLocaleStore();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success(locale === 'bn' ? 'আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে!' : 'Message sent successfully! Our customer team will contact you shortly.');
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center mb-12 space-y-2">
        <div className="w-14 h-14 neu-flat rounded-2xl flex items-center justify-center text-primary mx-auto text-2xl mb-3">
          💬
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
          {locale === 'bn' ? 'যোগাযোগ ও সাপোর্ট' : 'Contact Customer Support'}
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground max-w-lg mx-auto">
          {locale === 'bn' 
            ? 'পণ্য বা অর্ডার সংক্রান্ত যেকোনো তথ্যের জন্য আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন।' 
            : 'Have questions about your delivery or return? Our dedicated support team is available 24/7.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Info Cards */}
        <div className="space-y-4">
          <div className="neu-flat rounded-3xl p-6">
            <div className="w-10 h-10 neu-inset rounded-xl text-primary flex items-center justify-center mb-3">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground mb-1">{locale === 'bn' ? 'টেলিফোন হেল্পলাইন' : 'Phone Helpline'}</h3>
            <p className="text-xs text-muted-foreground mb-2">9:00 AM - 10:00 PM (Daily • WhatsApp)</p>
            <a href="tel:01410737290" className="text-primary font-mono font-bold text-sm hover:underline">01410737290</a>
          </div>

          <div className="neu-flat rounded-3xl p-6">
            <div className="w-10 h-10 neu-inset rounded-xl text-green-600 flex items-center justify-center mb-3">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground mb-1">{locale === 'bn' ? 'ইমেইল সাপোর্ট' : 'Email Desk'}</h3>
            <p className="text-xs text-muted-foreground mb-2">Fast response within 2 hours</p>
            <a href="mailto:support@bdecommerce.com" className="text-primary font-bold text-xs hover:underline">support@bdecommerce.com</a>
          </div>

          <div className="neu-flat rounded-3xl p-6">
            <div className="w-10 h-10 neu-inset rounded-xl text-amber-600 flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground mb-1">{locale === 'bn' ? 'অফিস ঠিকানা' : 'Corporate Office'}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Level 6, Navana Tower, Gulshan-1, Dhaka-1212, Bangladesh</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2 neu-raised rounded-3xl p-8">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 neu-inset rounded-full flex items-center justify-center mx-auto text-green-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-foreground">
                {locale === 'bn' ? 'বার্তা প্রাপ্ত হয়েছে!' : 'Thank You! Message Received.'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                We have received your message and our team will get back to you via SMS or email shortly.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="neu-btn px-6 py-2.5 rounded-xl text-xs font-bold text-primary"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-black text-foreground border-b pb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span>Send Us a Direct Message</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1.5 uppercase tracking-wider">Your Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 neu-input rounded-2xl text-xs font-medium"
                    placeholder="e.g. Mahfuzur Rahman"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1.5 uppercase tracking-wider">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-3 neu-input rounded-2xl text-xs font-mono font-bold"
                    placeholder="017XXXXXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-foreground mb-1.5 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 neu-input rounded-2xl text-xs font-medium"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-foreground mb-1.5 uppercase tracking-wider">Message or Inquiry *</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-3 neu-input rounded-2xl text-xs font-medium"
                  placeholder="Write your order query, product question, or feedback..."
                />
              </div>

              <button
                type="submit"
                className="neu-btn-primary px-8 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>Send Message</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}