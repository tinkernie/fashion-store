"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("لطفاً فیلدهای ضروری را پر کنید.");
      return;
    }
    
    // Simulate API call
    toast.success("پیام شما با موفقیت ارسال شد. به زودی با شما تماس خواهیم گرفت.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <main className="min-h-screen pt-32 pb-24 px-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black text-white mb-4"
        >
          تماس با ما
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400"
        >
          نظرات، پیشنهادات و سوالات خود را با ما در میان بگذارید.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        
        {/* Contact Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-10"
        >
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-white mb-6">اطلاعات ارتباطی</h2>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">آدرس دفتر مرکزی</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  تهران، خیابان ولیعصر، بالاتر از میدان ونک، مجتمع تجاری فشن استور، طبقه پنجم، واحد ۵۰۲
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">شماره تماس</h3>
                <p className="text-gray-400 text-sm dir-ltr text-right">
                  ۰۲۱ - ۸۸۸۸ ۸۸۸۸
                </p>
                <p className="text-gray-500 text-xs mt-1">پاسخگویی: شنبه تا چهارشنبه، ۹ صبح تا ۱۷ عصر</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">پست الکترونیک</h3>
                <p className="text-gray-400 text-sm font-sans">
                  support@fashionstore.com
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <form onSubmit={handleSubmit} className="bg-[#111111] border border-white/5 rounded-3xl p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">ارسال پیام</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">نام و نام خانوادگی <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all"
                  placeholder="علی محمدی"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">ایمیل <span className="text-red-500">*</span></label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3 text-white font-sans placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all text-left"
                  placeholder="example@mail.com"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">موضوع پیام</label>
              <input 
                type="text" 
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all"
                placeholder="پیگیری سفارش، پیشنهاد همکاری و..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">متن پیام <span className="text-red-500">*</span></label>
              <textarea 
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30 min-h-[150px] resize-none transition-all"
                placeholder="پیام خود را اینجا بنویسید..."
              />
            </div>

            <Button type="submit" className="w-full h-14 rounded-xl bg-white text-black hover:bg-gray-200 font-bold transition-all gap-2 text-lg">
              <Send className="w-5 h-5" />
              ارسال پیام
            </Button>
          </form>
        </motion.div>

      </div>
    </main>
  );
}