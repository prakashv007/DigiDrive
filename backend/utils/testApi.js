const testGetMe = async () => {
    try {
        console.log('Testing Login...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                empId: 'FORCED001',
                password: 'Employee@123'
            })
        });

        const loginData = await loginRes.json();

        if (!loginData.success) {
            console.error('Login Failed:', loginData.message);
            return;
        }

        console.log('Login Response Data:', loginData.data);
        if (loginData.data.requirePasswordChange !== undefined) {
            console.log('✅ LOGIN SUCCESS: requirePasswordChange is present.');
            console.log('Value:', loginData.data.requirePasswordChange);
        } else {
            console.log('❌ LOGIN FAILURE: requirePasswordChange is MISSING.');
        }

        const token = loginData.token;
        console.log('Login successful. Token obtained.');

        // 2. Call getMe
        console.log('Testing getMe...');
        const meRes = await fetch('http://localhost:5000/api/auth/me', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const meData = await meRes.json();
        console.log('getMe Response Data:', meData.data);

        if (meData.data.requirePasswordChange !== undefined) {
            console.log('✅ GETME SUCCESS: requirePasswordChange is present.');
            console.log('Value:', meData.data.requirePasswordChange);
        } else {
            console.log('❌ GETME FAILURE: requirePasswordChange is MISSING.');
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
};

testGetMe();
