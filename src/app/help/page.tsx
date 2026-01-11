'use client'

import { Search, MessageCircle, Book, Mail, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const faqs = [
  {
    question: 'How do I upload a video?',
    answer: 'Currently, videos are imported from YouTube channels. Direct video uploads are not yet supported. Contact an admin to import videos from a YouTube channel.',
  },
  {
    question: 'How do I delete my account?',
    answer: 'Go to Settings > Danger Zone and click "Delete Account". This action is permanent and cannot be undone.',
  },
  {
    question: 'Can I monetize my videos?',
    answer: 'Monetization features are not currently available on this platform.',
  },
  {
    question: 'How do I change my channel name?',
    answer: 'Go to Settings and update your Display Name in the Profile section.',
  },
  {
    question: 'What video formats are supported?',
    answer: 'Currently, only YouTube video links are supported as videos are imported from YouTube.',
  },
  {
    question: 'How do I report inappropriate content?',
    answer: 'Content reporting features will be added in a future update. Please contact the site administrator directly.',
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <HelpCircle className="w-16 h-16 mx-auto mb-4 text-[var(--accent)]" />
        <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="pl-12"
            />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4 mb-12">
        <a
          href="#faq"
          className="bg-[var(--bg-secondary)] rounded-xl p-6 hover:bg-[var(--bg-hover)] transition-colors text-center"
        >
          <Book className="w-8 h-8 mx-auto mb-3 text-[var(--accent)]" />
          <h3 className="font-semibold mb-1">FAQ</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Find answers to common questions
          </p>
        </a>
        <a
          href="mailto:support@growthtube.com"
          className="bg-[var(--bg-secondary)] rounded-xl p-6 hover:bg-[var(--bg-hover)] transition-colors text-center"
        >
          <Mail className="w-8 h-8 mx-auto mb-3 text-[var(--accent)]" />
          <h3 className="font-semibold mb-1">Contact Us</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Get in touch with support
          </p>
        </a>
        <a
          href="#community"
          className="bg-[var(--bg-secondary)] rounded-xl p-6 hover:bg-[var(--bg-hover)] transition-colors text-center"
        >
          <MessageCircle className="w-8 h-8 mx-auto mb-3 text-[var(--accent)]" />
          <h3 className="font-semibold mb-1">Community</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Join our community forum
          </p>
        </a>
      </div>

      {/* FAQ Section */}
      <section id="faq">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <details
                key={index}
                className="bg-[var(--bg-secondary)] rounded-xl p-6 group"
              >
                <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                  {faq.question}
                  <span className="ml-4 text-[var(--text-secondary)] group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <p className="mt-4 text-[var(--text-secondary)] leading-relaxed">
                  {faq.answer}
                </p>
              </details>
            ))
          ) : (
            <div className="text-center py-8 text-[var(--text-secondary)]">
              No results found for &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      </section>

      {/* Contact Support */}
      <section className="mt-12 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
        <p className="text-[var(--text-secondary)] mb-6">
          Can&apos;t find what you&apos;re looking for? Our support team is here to help.
        </p>
        <Button leftIcon={<Mail className="w-5 h-5" />}>
          Contact Support
        </Button>
      </section>
    </div>
  )
}
