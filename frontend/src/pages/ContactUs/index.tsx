import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks';

export const ContactUs: React.FC = () => {
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

  const contactMethods = [
    {
      icon: '📞',
      title: 'Customer service',
      value: '+91 78006 40780',
      link: 'tel:+917800640780'
    },
    {
      icon: '📱',
      title: 'WhatsApp',
      value: '+91 78006 40780',
      link: 'https://wa.me/917800640780'
    },
    {
      icon: '🌐',
      title: 'Website',
      value: 'www.bookswap.ling',
      link: 'https://www.bookswap.ling'
    },
    {
      icon: '📘',
      title: 'Facebook',
      value: 'https://facebook.com/ling',
      link: 'https://facebook.com/ling'
    },
    {
      icon: '🐦',
      title: 'Twitter',
      value: 'https://twitter.com/ling',
      link: 'https://twitter.com/ling'
    },
    {
      icon: '📷',
      title: 'Instagram',
      value: 'https://www.instagram.com/ling',
      link: 'https://www.instagram.com/ling'
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
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">Contact Us</h1>
                  <button className="text-red-600 hover:text-red-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Contact Methods Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {contactMethods.map((method, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                            <span className="text-lg">{method.icon}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{method.title}</h3>
                            <a
                              href={method.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              {method.value}
                            </a>
                          </div>
                        </div>
                        <button className="text-red-600 hover:text-red-700">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Information */}
                <div className="mt-12 bg-gray-50 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Get in Touch</h2>
                  <div className="space-y-4 text-gray-700">
                    <p>
                      We're here to help! Whether you have questions about book exchanges, 
                      need technical support, or want to provide feedback, don't hesitate to reach out.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Business Hours</h3>
                        <ul className="space-y-1 text-sm">
                          <li>Monday - Friday: 9:00 AM - 6:00 PM</li>
                          <li>Saturday: 10:00 AM - 4:00 PM</li>
                          <li>Sunday: Closed</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Response Time</h3>
                        <ul className="space-y-1 text-sm">
                          <li>Email: Within 24 hours</li>
                          <li>WhatsApp: Within 2 hours</li>
                          <li>Phone: Immediate during business hours</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    to="/profile/help"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Visit Help Center
                  </Link>
                  
                  <a
                    href="mailto:support@bookswap.ling"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Email
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 