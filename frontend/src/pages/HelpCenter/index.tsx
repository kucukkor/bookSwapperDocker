import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks';

export const HelpCenter: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');

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

  const categories = [
    'General', 'Account', 'Service', 'Payment', 'Payment', 'Payment', 'Payment', 'Payment'
  ];

  const helpTopics = [
    {
      category: 'General',
      question: 'What is Ling?',
      answer: 'Flipkart is an e-commerce website that is a way to get people like goods, no occupation, place of origin, optimise, optimise, adapting, and non physical.',
      expanded: false
    },
    {
      category: 'General',
      question: 'How to use Ling ?',
      answer: 'You can browse our platform, create listings for books you want to exchange, and connect with other users.',
      expanded: false
    },
    {
      category: 'Account',
      question: 'How to use Ling ?',
      answer: 'Create an account, verify your email, and start listing your books for exchange.',
      expanded: false
    },
    {
      category: 'Service',
      question: 'How to use Ling ?',
      answer: 'Our service allows you to exchange books with other users in your area.',
      expanded: false
    },
    {
      category: 'Payment',
      question: 'How to use Ling ?',
      answer: 'Currently, our platform focuses on book exchanges rather than monetary transactions.',
      expanded: false
    }
  ];

  const [expandedTopics, setExpandedTopics] = useState<{ [key: number]: boolean }>({});

  const toggleTopic = (index: number) => {
    setExpandedTopics(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const filteredTopics = helpTopics.filter(topic => 
    topic.category === selectedCategory &&
    (topic.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
     topic.answer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Help Center</h1>

                {/* Search Bar */}
                <div className="relative mb-8">
                  <input
                    type="text"
                    placeholder="Search for help topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {categories.map((category, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        selectedCategory === category
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Help Topics */}
                <div className="space-y-4">
                  {filteredTopics.map((topic, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleTopic(index)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
                      >
                        <span className="font-medium text-gray-900">{topic.question}</span>
                        <svg
                          className={`w-5 h-5 text-gray-500 transform transition-transform ${
                            expandedTopics[index] ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedTopics[index] && (
                        <div className="px-6 pb-4 text-gray-700">
                          {topic.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {filteredTopics.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No help topics found</h3>
                    <p className="text-gray-500">Try adjusting your search or selecting a different category.</p>
                  </div>
                )}

                {/* Contact Support */}
                <div className="mt-12 bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Still need help?</h3>
                  <p className="text-gray-600 mb-4">
                    Can't find what you're looking for? Our support team is here to help.
                  </p>
                  <Link
                    to="/profile/contact"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    Contact Support
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 