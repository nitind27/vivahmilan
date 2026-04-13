'use client';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function LegalPage({ title, subtitle, icon: Icon, iconBg, lastUpdated, sections, relatedLinks }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="text-center mb-12">
          <div className={`w-16 h-16 ${iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            {Icon && <Icon className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{title}</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">{subtitle}</p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-3">Last updated: {lastUpdated}</p>
          )}
        </div>

        <div className="space-y-6">
          {sections?.map((section, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 gradient-bg rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                {section.title}
              </h2>
              <div>{section.content}</div>
            </div>
          ))}
        </div>

        {relatedLinks?.length > 0 && (
          <div className="mt-10 p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Related Policies</h3>
            <div className="flex flex-wrap gap-2">
              {relatedLinks.map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="flex items-center gap-1 text-sm text-pink-500 hover:text-pink-600 transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
