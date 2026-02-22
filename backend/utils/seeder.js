const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        // Check if admin already exists
        const existing = await User.findOne({ empId: 'ADMIN001' });
        if (existing) {
            console.log('✅ Admin already exists: ADMIN001 / Admin@123');
            await mongoose.disconnect();
            return;
        }

        await User.create({
            empId: 'ADMIN001',
            name: 'System Administrator',
            email: 'admin@sentineldrive.com',
            password: 'Admin@123',
            role: 'admin',
            department: 'IT Administration',
            isActive: true,
            quota: 50 * 1024 * 1024 * 1024, // 50GB for admin
        });

        console.log('✅ Admin seeded successfully!');
        console.log('   EmpID: ADMIN001');
        console.log('   Password: Admin@123');
        console.log('   Email: admin@sentineldrive.com');

        // Create a demo employee
        await User.create({
            empId: 'EMP001',
            name: 'John Employee',
            email: 'john@sentineldrive.com',
            password: 'Employee@123',
            role: 'employee',
            department: 'Engineering',
            isActive: true,
        });

        console.log('✅ Demo employee seeded!');
        console.log('   EmpID: EMP001');
        console.log('   Password: Employee@123');

        await mongoose.disconnect();
        console.log('Done. Disconnected from MongoDB.');
    } catch (err) {
        console.error('Seeder error:', err.message);
        process.exit(1);
    }
};

seedAdmin();
