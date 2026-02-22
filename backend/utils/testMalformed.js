const testMalformed = async () => {
    try {
        console.log('Testing Malformed Token...');
        const res = await fetch('http://localhost:5000/api/auth/me', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer undefined' }
        });

        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Body:', data);

    } catch (err) {
        console.error('Error:', err.message);
    }
};

testMalformed();
