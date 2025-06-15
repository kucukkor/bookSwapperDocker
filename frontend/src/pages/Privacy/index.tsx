import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks';

export const Privacy: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      icon: '👤',
      title: 'Account Settings',
      items: [
        { name: 'Profile Information', path: '/profile' },
        { name: 'Manage Address', path: '/profile/address' }
      ]
    },
    {
      icon: '🔒',
      title: 'Privacy',
      path: '/profile/privacy'
    },
    {
      icon: '❓',
      title: 'Help center',
      path: '/profile/help'
    },
    {
      icon: '📧',
      title: 'Contact Us',
      path: '/profile/contact'
    },
    {
      icon: '🚪',
      title: 'Logout',
      action: logout
    }
  ];

  const faqItems = [
    {
      question: "Why is my Card being saved on Flipkart?",
      answer: "It's quicker. You can save the hassle of typing in the complete card information every time you shop at Flipkart by selecting the 'saved card' of your choice. It's also very secure."
    },
    {
      question: "Is it safe to save my cards on Flipkart?",
      answer: "Absolutely. Your card information is 100 percent safe with us. We use world class encryption technologies and comply with the highest security standards. We have passed stringent security compliance checks like PCI DSS (Payment Card Industry Data Security Standards) to ensure that your card information remains confidential at all times."
    },
    {
      question: "What all card information does Flipkart store?",
      answer: "Flipkart only stores card information when the customer selects the option. We only store your card number, cardholder name and card expiry date. We do not store your card's CVV number or the 3D Secure password."
    },
    {
      question: "Can I delete my saved cards?",
      answer: "Yes, you can delete your saved cards at any given time."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex">
            {/* Sidebar */}
            <div className="w-80 border-r border-gray-200 p-6">
              {/* User Info */}
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                  <span className="text-gray-600 font-medium text-lg">
                    {user?.username?.charAt(0).toUpperCase() || 'R'}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Hello</div>
                  <div className="font-semibold text-gray-900">{user?.username || 'Rohit Kandam'}</div>
                </div>
              </div>

              {/* Menu Items */}
              <nav className="space-y-2">
                {menuItems.map((item, index) => (
                  <div key={index}>
                    {item.items ? (
                      <div>
                        <div className="flex items-center px-3 py-2 text-gray-700 font-medium">
                          <span className="mr-3">{item.icon}</span>
                          {item.title}
                        </div>
                        <div className="ml-6 space-y-1">
                          {item.items.map((subItem, subIndex) => (
                            <Link
                              key={subIndex}
                              to={subItem.path}
                              className={`block px-3 py-2 text-sm rounded-lg ${
                                location.pathname === subItem.path
                                  ? 'bg-blue-100 text-blue-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        {item.action ? (
                          <button
                            onClick={item.action}
                            className="w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                          >
                            <span className="mr-3">{item.icon}</span>
                            {item.title}
                          </button>
                        ) : (
                          <Link
                            to={item.path!}
                            className={`flex items-center px-3 py-2 rounded-lg ${
                              location.pathname === item.path
                                ? 'bg-blue-100 text-blue-700 font-medium'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <span className="mr-3">{item.icon}</span>
                            {item.title}
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8">
              <div className="max-w-4xl">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

                <div className="space-y-8">
                  {/* FAQs Section */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">FAQs</h2>
                    <div className="space-y-6">
                      {faqItems.map((item, index) => (
                        <div key={index} className="border-b border-gray-200 pb-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-3">
                            {item.question}
                          </h3>
                          <p className="text-gray-700 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Privacy Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Data Protection & Privacy
                    </h2>
                    <div className="space-y-4 text-gray-700">
                      <p>
                        At BookSwap, we are committed to protecting your privacy and ensuring the security 
                        of your personal information. This privacy policy explains how we collect, use, 
                        and safeguard your data when you use our book exchange platform.
                      </p>
                      
                      <h3 className="font-semibold text-gray-900">Information We Collect</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Personal information (name, email, phone number)</li>
                        <li>Book listing information and preferences</li>
                        <li>Communication data between users</li>
                        <li>Usage data and analytics</li>
                      </ul>

                      <h3 className="font-semibold text-gray-900">How We Use Your Information</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>To facilitate book exchanges between users</li>
                        <li>To improve our platform and user experience</li>
                        <li>To send important notifications about your account</li>
                        <li>To provide customer support</li>
                      </ul>

                      <h3 className="font-semibold text-gray-900">Data Security</h3>
                      <p>
                        We implement industry-standard security measures to protect your personal 
                        information from unauthorized access, disclosure, alteration, or destruction. 
                        Your data is encrypted and stored securely on our servers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 