import { useState, useEffect } from 'react';

const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Mock login function
    const login = async (username, password) => {
        setLoading(true);
        // Simulate an API call
        setTimeout(() => {
            setUser({ username }); // Set user state
            setLoading(false);
        }, 1000);
    };

    // Mock logout function
    const logout = () => {
        setUser(null);
    };

    // Use effect to simulate fetching user session
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
    }, [user]);

    return { user, loading, login, logout };
};

export default useAuth;