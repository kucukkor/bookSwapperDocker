import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookStore } from '../../store';
import { apiService } from '../../services/api';

export const CreateListing: React.FC = () => {
  const navigate = useNavigate();
  const { createListing, isLoading } = useBookStore();
  
  const [formData, setFormData] = useState({
    bookTitle: '',
    author: '',
    isbn: '',
    category: '',
    condition: 'iyi' as const,
    description: '',
    publisher: '',
    publishedYear: '',
    language: 'Türkçe',
    notes: '',
    city: '',
    district: '',
    shippingAvailable: false,
  });
  
  const [wantedCategories, setWantedCategories] = useState<string[]>([]);
  const [wantedAuthors, setWantedAuthors] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    'Roman', 'Bilim Kurgu', 'Fantastik', 'Tarih', 'Biyografi', 
    'Felsefe', 'Psikoloji', 'Sanat', 'Bilim', 'Çocuk Kitapları'
  ];

  const conditions = [
    { value: 'yeni', label: 'Yeni' },
    { value: 'çok_iyi', label: 'Çok İyi' },
    { value: 'iyi', label: 'İyi' },
    { value: 'orta', label: 'Orta' },
    { value: 'kötü', label: 'Kötü' }
  ];

  const cities = [
    'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 
    'Adana', 'Konya', 'Gaziantep', 'Mersin', 'Diyarbakır'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      alert('You can upload maximum 5 images');
      return;
    }

    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);

    // Create preview URLs using FileReader
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addWantedCategory = (category: string) => {
    if (!wantedCategories.includes(category)) {
      setWantedCategories(prev => [...prev, category]);
    }
  };

  const removeWantedCategory = (category: string) => {
    setWantedCategories(prev => prev.filter(c => c !== category));
  };

  const addWantedAuthor = () => {
    const input = document.getElementById('wantedAuthor') as HTMLInputElement;
    const author = input.value.trim();
    
    if (author && !wantedAuthors.includes(author)) {
      setWantedAuthors(prev => [...prev, author]);
      input.value = '';
    }
  };

  const removeWantedAuthor = (author: string) => {
    setWantedAuthors(prev => prev.filter(a => a !== author));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.bookTitle.trim()) {
      newErrors.bookTitle = 'Book title is required';
    }
    
    if (!formData.author.trim()) {
      newErrors.author = 'Author is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.city) {
      newErrors.city = 'City is required';
    }
    
    if (images.length === 0) {
      newErrors.images = 'At least one image is required';
    }
    
    if (formData.publishedYear && (isNaN(Number(formData.publishedYear)) || Number(formData.publishedYear) < 1000 || Number(formData.publishedYear) > new Date().getFullYear())) {
      newErrors.publishedYear = 'Please enter a valid year';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (selectedFiles.length === 0) {
      alert('Please select at least one image');
      return;
    }

    try {
      // First upload images
      setIsUploading(true);
      const uploadPromises = selectedFiles.map(file => 
        apiService.uploadSingle(file)
      );
      
      const responses = await Promise.all(uploadPromises);
      
      // Get uploaded image URLs
      const uploadedImageUrls = responses.map(response => {
        const imageUrl = response.imageUrl;
        return imageUrl.startsWith('http') ? imageUrl : `http://167.99.210.227:3000${imageUrl}`;
      }).filter(Boolean);
      
      setIsUploading(false);

      // Then create listing with uploaded URLs
      await createListing({
        bookTitle: formData.bookTitle.trim(),
        author: formData.author.trim(),
        isbn: formData.isbn.trim() || undefined,
        category: formData.category,
        condition: formData.condition,
        images: uploadedImageUrls,
        description: formData.description.trim(),
        publisher: formData.publisher.trim() || undefined,
        publishedYear: formData.publishedYear ? Number(formData.publishedYear) : undefined,
        language: formData.language,
        wantedCategories: wantedCategories.length > 0 ? wantedCategories : undefined,
        wantedAuthors: wantedAuthors.length > 0 ? wantedAuthors : undefined,
        notes: formData.notes.trim() || undefined,
        location: {
          city: formData.city,
          district: formData.district.trim() || undefined,
        },
        shippingAvailable: formData.shippingAvailable,
      });
      
      // Add a small delay to ensure the backend has processed the request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      navigate('/my-listings');
    } catch (error) {
      console.error('Failed to create listing:', error);
      alert('Failed to create listing. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Add New Book</h1>
          <p className="text-blue-100 mt-2">Share your book with the community</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          {/* Book Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Book Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Book Title *
                </label>
                <input
                  type="text"
                  name="bookTitle"
                  value={formData.bookTitle}
                  onChange={handleInputChange}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.bookTitle ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter book title"
                />
                {errors.bookTitle && (
                  <p className="mt-1 text-sm text-red-600">{errors.bookTitle}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author *
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.author ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter author name"
                />
                {errors.author && (
                  <p className="mt-1 text-sm text-red-600">{errors.author}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition *
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {conditions.map(condition => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ISBN (Optional)
                </label>
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter ISBN"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publisher (Optional)
                </label>
                <input
                  type="text"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter publisher"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Published Year (Optional)
                </label>
                <input
                  type="number"
                  name="publishedYear"
                  value={formData.publishedYear}
                  onChange={handleInputChange}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.publishedYear ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g. 2020"
                  min="1000"
                  max={new Date().getFullYear()}
                />
                {errors.publishedYear && (
                  <p className="mt-1 text-sm text-red-600">{errors.publishedYear}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Türkçe">Türkçe</option>
                  <option value="English">English</option>
                  <option value="Français">Français</option>
                  <option value="Deutsch">Deutsch</option>
                  <option value="Español">Español</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe the book condition, any notes, or special features..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Images */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Book Images</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={isUploading || images.length >= 5}
              />
              <label
                htmlFor="image-upload"
                className={`cursor-pointer ${isUploading || images.length >= 5 ? 'opacity-50' : ''}`}
              >
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-lg text-gray-600 mb-2">
                  {isUploading ? 'Uploading...' : 'Click to upload images or drag and drop'}
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, GIF up to 5MB each (Maximum 5 images) - Upload happens when you submit
                </p>
              </label>
            </div>

            {errors.images && (
              <p className="mt-2 text-sm text-red-600">{errors.images}</p>
            )}

            {/* Image Preview */}
            {images.length > 0 && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Book ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Location</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.city ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select city</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District (Optional)
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter district"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="shippingAvailable"
                  checked={formData.shippingAvailable}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  I can ship this book to other cities
                </span>
              </label>
            </div>
          </div>

          {/* What I'm Looking For */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">What I'm Looking For (Optional)</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wanted Categories
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {categories.map(category => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => addWantedCategory(category)}
                      disabled={wantedCategories.includes(category)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        wantedCategories.includes(category)
                          ? 'bg-purple-100 text-purple-800 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                
                {wantedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {wantedCategories.map(category => (
                      <span
                        key={category}
                        className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {category}
                        <button
                          type="button"
                          onClick={() => removeWantedCategory(category)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wanted Authors
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    id="wantedAuthor"
                    placeholder="Enter author name"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addWantedAuthor())}
                  />
                  <button
                    type="button"
                    onClick={addWantedAuthor}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Add
                  </button>
                </div>
                
                {wantedAuthors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {wantedAuthors.map(author => (
                      <span
                        key={author}
                        className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {author}
                        <button
                          type="button"
                          onClick={() => removeWantedAuthor(author)}
                          className="text-orange-600 hover:text-orange-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Notes (Optional)</h2>
            
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional information about the book or exchange preferences..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Uploading Images...
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Listing...
                </div>
              ) : (
                'Create Listing'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 