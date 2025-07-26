const mongoose = require('mongoose');
require('dotenv').config();

async function testMongoDBConnection() {
    console.log('🔍 Comprehensive MongoDB Connection Test');
    console.log('==========================================');
    
    // Check environment variables
    console.log('\n📋 Environment Check:');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');
    
    if (!process.env.MONGODB_URI) {
        console.error('\n❌ MONGODB_URI is not configured!');
        console.log('Please add MONGODB_URI to your .env file');
        return;
    }
    
    // Parse and display connection info (safely)
    const uri = process.env.MONGODB_URI;
    console.log('\n🔗 Connection String Analysis:');
    
    try {
        const url = new URL(uri);
        console.log('Protocol:', url.protocol);
        console.log('Hostname:', url.hostname);
        console.log('Port:', url.port);
        console.log('Database:', url.pathname.substring(1) || 'default');
        console.log('Username:', url.username ? '✅ Set' : '❌ Not set');
        console.log('Password:', url.password ? '✅ Set' : '❌ Not set');
        
        // Check if it's a local or remote connection
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
            console.log('📍 Connection Type: Local MongoDB');
        } else if (url.hostname.includes('mongodb.net')) {
            console.log('📍 Connection Type: MongoDB Atlas (Cloud)');
        } else if (url.hostname.includes('docker') || url.hostname.includes('-')) {
            console.log('📍 Connection Type: Docker/Container');
        } else {
            console.log('📍 Connection Type: Remote Server');
        }
        
    } catch (error) {
        console.log('❌ Invalid connection string format');
        console.log('Error:', error.message);
        return;
    }
    
    // Test DNS resolution
    console.log('\n🌐 DNS Resolution Test:');
    const dns = require('dns');
    const url = new URL(uri);
    
    try {
        const addresses = await dns.promises.resolve4(url.hostname);
        console.log('✅ DNS resolution successful');
        console.log('IP addresses:', addresses.join(', '));
    } catch (error) {
        console.log('❌ DNS resolution failed');
        console.log('Error:', error.message);
        console.log('\n💡 This might be a Docker container hostname that\'s not accessible from your machine');
        console.log('   - If testing locally, use localhost or 127.0.0.1');
        console.log('   - If testing on VPS, ensure the hostname is correct');
        console.log('   - If using Docker, ensure containers are on the same network');
    }
    
    // Test connection
    console.log('\n🔄 Connection Test:');
    try {
        console.log('Attempting to connect...');
        
        const connection = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000, // 5 second timeout
            socketTimeoutMS: 5000,
        });
        
        console.log('✅ Successfully connected to MongoDB!');
        console.log('📊 Database:', connection.connection.db.databaseName);
        console.log('🌐 Host:', connection.connection.host);
        console.log('🔌 Port:', connection.connection.port);
        
        // Test operations
        console.log('\n🧪 Database Operations Test:');
        
        // List collections
        const collections = await connection.connection.db.listCollections().toArray();
        console.log('📁 Collections found:', collections.length);
        collections.forEach(col => {
            console.log(`   - ${col.name}`);
        });
        
        // Test a simple query
        if (collections.length > 0) {
            const firstCollection = collections[0].name;
            const count = await connection.connection.db.collection(firstCollection).countDocuments();
            console.log(`📈 Document count in ${firstCollection}: ${count}`);
        }
        
        // Test server status
        try {
            const adminDb = connection.connection.db.admin();
            const serverStatus = await adminDb.serverStatus();
            console.log('💚 Server status: Healthy');
            console.log('🕒 Uptime:', Math.floor(serverStatus.uptime / 3600), 'hours');
        } catch (error) {
            console.log('⚠️ Could not get server status (may not have admin privileges)');
        }
        
        console.log('\n🎉 All tests passed! MongoDB connection is working perfectly.');
        
    } catch (error) {
        console.error('❌ MongoDB connection failed!');
        console.error('Error:', error.message);
        
        // Provide specific solutions based on error type
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Solutions for ECONNREFUSED:');
            console.log('   - MongoDB server is not running');
            console.log('   - Wrong port number');
            console.log('   - Firewall blocking the connection');
        } else if (error.message.includes('Authentication failed')) {
            console.log('\n💡 Solutions for Authentication failed:');
            console.log('   - Check username and password');
            console.log('   - Verify database user exists and has permissions');
            console.log('   - Ensure password is URL-encoded if it contains special characters');
        } else if (error.message.includes('ENOTFOUND')) {
            console.log('\n💡 Solutions for ENOTFOUND:');
            console.log('   - Hostname is incorrect');
            console.log('   - DNS resolution failed');
            console.log('   - Network connectivity issues');
        } else if (error.message.includes('timeout')) {
            console.log('\n💡 Solutions for timeout:');
            console.log('   - Network is slow');
            console.log('   - MongoDB server is overloaded');
            console.log('   - Firewall blocking the connection');
        }
        
    } finally {
        // Close connection
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