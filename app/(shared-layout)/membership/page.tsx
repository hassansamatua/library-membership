// app/membership04/page.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FiCheckCircle, FiCreditCard, FiShield, FiUsers, FiAward, FiArrowRight } from 'react-icons/fi';

export default function MembershipPage() {
  const { user, isAuthenticated } = useAuth();

  const membershipPlans = [
    {
      name: 'Basic',
      price: '49',
      period: '/year',
      description: 'Perfect for individuals getting started',
      features: [
        'Access to basic resources',
        'Community forum access',
        'Email support',
        'Basic analytics'
      ],
      buttonText: 'Get Started',
      popular: false
    },
    {
      name: 'Professional',
      price: '99',
      period: '/year',
      description: 'For professionals who need more',
      features: [
        'Everything in Basic',
        'Advanced analytics',
        'Priority support',
        'Exclusive webinars',
        'Early access to new features'
      ],
      buttonText: 'Upgrade Now',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For organizations with custom needs',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'Custom integrations',
        'SLA 99.9% uptime',
        'Training & onboarding'
      ],
      buttonText: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Choose Your</span>
            <span className="block text-green-600">Membership Plan</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Select the perfect plan for your needs. All plans include a 30-day money-back guarantee.
          </p>
        </div>

        {/* Pricing Plans */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-8">
          {membershipPlans.map((plan, index) => (
            <div 
              key={index}
              className={`relative bg-white rounded-2xl shadow-sm border-2 ${
                plan.popular ? 'border-green-500' : 'border-transparent'
              } overflow-hidden`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                  Most Popular
                </div>
              )}
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="ml-1 text-xl font-medium text-gray-500">
                    {plan.period}
                  </span>
                </div>
                <p className="mt-2 text-gray-500">{plan.description}</p>
                
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <FiCheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="ml-3 text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-8">
                  <Link
                    href={plan.name === 'Enterprise' ? '/contact' : isAuthenticated ? '/dashboard/subscribe' : '/auth/register'}
                    className={`block w-full px-6 py-3 text-center rounded-md font-medium ${
                      plan.popular 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-white text-green-700 border border-green-600 hover:bg-green-50'
                    }`}
                  >
                    {plan.buttonText}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="mt-16">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Everything you need to succeed</h2>
            <p className="mt-2 text-lg text-gray-500">
              All plans include these amazing features
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: 'Secure Payments',
                icon: FiShield,
                description: 'Your payment information is processed securely with 256-bit encryption'
              },
              {
                name: '24/7 Support',
                icon: FiUsers,
                description: 'Our support team is available around the clock to assist you'
              },
              {
                name: 'Flexible Billing',
                icon: FiCreditCard,
                description: 'Choose between monthly or annual billing cycles'
              },
              {
                name: 'Certificate',
                icon: FiAward,
                description: 'Earn a certificate upon completion of membership requirements'
              }
            ].map((feature, index) => (
              <div key={index} className="flex">
                <div className="shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-100 text-green-600">
                    <feature.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{feature.name}</h3>
                  <p className="mt-1 text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Frequently asked questions</h2>
            <p className="mt-2 text-lg text-gray-500">
              Can't find the answer you're looking for? Contact our support team.
            </p>
          </div>

          <div className="mt-12 max-w-3xl mx-auto">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-12">
              {[
                {
                  question: 'Can I change plans later?',
                  answer: 'Yes, you can upgrade or downgrade your plan at any time. Your billing will be prorated accordingly.'
                },
                {
                  question: 'Is there a free trial available?',
                  answer: 'Yes, we offer a 14-day free trial for new members. No credit card required.'
                },
                {
                  question: 'What payment methods do you accept?',
                  answer: 'We accept all major credit cards, PayPal, and bank transfers for annual plans.'
                },
                {
                  question: 'How do I cancel my subscription?',
                  answer: 'You can cancel your subscription at any time from your account settings.'
                }
              ].map((faq, index) => (
                <div key={index} className="space-y-2">
                  <dt className="text-lg font-medium text-gray-900">{faq.question}</dt>
                  <dd className="text-base text-gray-500">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Ready to get started?</h2>
          <p className="mt-2 text-lg text-gray-600">
            Join thousands of satisfied members today.
          </p>
          <div className="mt-6">
            <Link
              href={isAuthenticated ? '/dashboard' : '/auth/register'}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Create your account'}
              <FiArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}