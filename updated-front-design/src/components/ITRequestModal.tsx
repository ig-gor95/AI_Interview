import { X, Send, Mail, ArrowRight, Phone } from 'lucide-react';
import { useState } from 'react';
import { useAtom } from 'jotai';
import { languageAtom, useTranslation } from '@/lib/i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ITRequestModal({ isOpen, onClose }: Props) {
  const [language] = useAtom(languageAtom);
  const t = useTranslation(language);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl relative transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              CEO
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {t.contact.title}
              </h3>
              <p className="text-sm text-gray-500">
                {t.organizerDashboard.supportSubtitle}
              </p>
            </div>
          </div>
          <p className="text-gray-600">
            {t.organizerDashboard.chooseContact}
          </p>
        </div>

        {/* Contact Options */}
        <div className="p-6 space-y-3">
          {/* Telegram */}
          <a
            href="https://t.me/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            className="block group bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-400 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {t.organizerDashboard.telegram}
                </h4>
                <p className="text-sm text-gray-600">
                  {t.organizerDashboard.telegramDesc}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>

          {/* Phone */}
          <a
            href="tel:+79999999999"
            className="block group bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 hover:shadow-lg hover:border-purple-400 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {t.organizerDashboard.callPhone}
                </h4>
                <p className="text-sm text-gray-600">
                  +7 (999) 999-99-99
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>

          {/* Email/Contact Form */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {t.organizerDashboard.leaveContact}
                </h4>
                <p className="text-sm text-gray-600">
                  {t.organizerDashboard.leaveContactDesc}
                </p>
              </div>
            </div>

            <form 
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                alert(t.organizerDashboard.thankYouMessage);
                onClose();
              }}
            >
              <input
                type="text"
                placeholder={t.organizerDashboard.yourName}
                required
                className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
              />
              <input
                type="tel"
                placeholder={t.organizerDashboard.phone}
                required
                className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
              />
              <input
                type="email"
                placeholder={t.organizerDashboard.emailOptional}
                className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
              />
              <button
                type="submit"
                className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm"
              >
                {t.organizerDashboard.send}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}