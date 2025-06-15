// MongoDB initialization script
db = db.getSiblingDB('bookswap');

// Create application user
db.createUser({
  user: 'bookswap_user',
  pwd: 'bookswap_password_2024',  // Docker için güvenli şifre
  roles: [
    {
      role: 'readWrite',
      db: 'bookswap'
    }
  ]
});

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.listings.createIndex({ "status": 1 });
db.listings.createIndex({ "owner": 1 });
db.listings.createIndex({ "category": 1 });
db.listings.createIndex({ "location.city": 1 });
db.tradeoffers.createIndex({ "fromUser": 1 });
db.tradeoffers.createIndex({ "toUser": 1 });
db.tradeoffers.createIndex({ "targetListing": 1 });
db.tradeoffers.createIndex({ "status": 1 });
db.conversations.createIndex({ "participants": 1 });
db.messages.createIndex({ "conversation": 1 });
db.messages.createIndex({ "createdAt": 1 });
db.reviews.createIndex({ "reviewer": 1 });
db.reviews.createIndex({ "reviewee": 1 });
db.reviews.createIndex({ "tradeOffer": 1 });
db.notifications.createIndex({ "user": 1 });
db.notifications.createIndex({ "isRead": 1 });
db.notifications.createIndex({ "createdAt": 1 });

print('Database initialized successfully!'); 