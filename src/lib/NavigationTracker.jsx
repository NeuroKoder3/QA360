import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { pagesConfig } from '@/pages.config';

export default function NavigationTracker() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const { Pages, mainPage } = pagesConfig;
    const mainPageKey = mainPage ?? Object.keys(Pages)[0];

    // Log user activity when navigating to a page (offline mode - no logging needed)
    useEffect(() => {
        // In offline mode, we don't need to log navigation
        // This is a no-op to maintain the component structure
    }, [location, isAuthenticated, Pages, mainPageKey]);

    return null;
}