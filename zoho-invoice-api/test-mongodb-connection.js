const mongoose = require('mongoose');
require('dotenv').config();

async function testMongoDBConnection() {
    console.log('🔍 Testing MongoDB Connection...');
    console.log('=====================================');
    
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI environment variable is not set!');
        console.log('Please check your .env file and ensure MONGODB_URI is configured.');
        return;
    }
    
    console.log('✅ MONGODB_URI is configured');
    console.log('🔗 Connection string (masked):', process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    try {
        // Connect to MongoDB
        console.log('🔄 Attempting to connect to MongoDB...');
        
        const connection = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ Successfully connected to MongoDB!');
        console.log('📊 Database:', connection.connection.db.databaseName);
        console.log('🌐 Host:', connection.connection.host);
        console.log('🔌 Port:', connection.connection.port);
        
        // Test basic operations
        console.log('\n🧪 Testing basic database operations...');
        
        // List collections
        const collections = await connection.connection.db.listCollections().toArray();
        console.log('📁 Collections found:', collections.length);
        collections.forEach(col => {
            console.log(`   - ${col.name}`);
        });
        
        // Test a simple query (if collections exist)
        if (collections.length > 0) {
            const firstCollection = collections[0].name;
            const count = await connection.connection.db.collection(firstCollection).countDocuments();
            console.log(`📈 Document count in ${firstCollection}: ${count}`);
        }
        
        // Test connection health
        const adminDb = connection.connection.db.admin();
        const serverStatus = await adminDb.serverStatus();
        console.log('💚 Server status: Healthy');
        console.log('🕒 Uptime:', Math.floor(serverStatus.uptime / 3600), 'hours');
        
        console.log('\n🎉 MongoDB connection test completed successfully!');
        
    } catch (error) {
        console.error('❌ MongoDB connection failed!');
        console.error('Error details:', error.message);
        
        // Provide helpful error messages
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Possible solutions:');
            console.log('   - Check if MongoDB server is running');
            console.log('   - Verify the connection string is correct');
            console.log('   - Check if the IP address is whitelisted (for MongoDB Atlas)');
        } else if (error.message.includes('Authentication failed')) {
            console.log('\n💡 Possible solutions:');
            console.log('   - Check username and password in connection string');
            console.log('   - Verify database user has proper permissions');
        } else if (error.message.includes('ENOTFOUND')) {
            console.log('\n💡 Possible solutions:');
            console.log('   - Check if the hostname is correct');
            console.log('   - Verify DNS resolution');
        }
        
    } finally {
        // Close the connection
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('🔌 Connection closed');
        }
    }
}

// Run the test
testMongoDBConnection()
    .then(() => {
        console.log('\n✅ Test completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }); 