// components/CookieBanner.tsx - Updated with Accept/Decline model

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Helper function to set a cookie
const setCookie = (name: string, value: string, days: number) => {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

// Helper function to get a cookie
const getCookie = (name: string) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

export default function CookieBanner() {
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Show the banner only if no consent cookie has been set yet
        if (getCookie('cookie_consent') === null) {
            setShowBanner(true);
        }
    }, []);

    const handleAccept = () => {
        setCookie('cookie_consent', 'true', 365);
        setShowBanner(false);
    };

    const handleDecline = () => {
        setCookie('cookie_consent', 'false', 365);
        setShowBanner(false);
    };

    if (!showBanner) {
        return null; // Don't render if consent has already been given (true or false)
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm p-4 z-50 border-t border-slate-700/50">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-300 text-center md:text-left">
                    We use essential cookies to manage your login session and remember your preferences.
                    Please note that declining cookies may prevent admin functionality from working.
                    <Link href="/privacy-policy" className="underline hover:text-orange-400 ml-1 whitespace-nowrap">
                        Learn more.
                    </Link>
                </p>
                <div className="flex items-center gap-4 flex-shrink-0">
                    <button
                        onClick={handleDecline}
                        className="bg-transparent border border-slate-600 hover:bg-slate-800 text-gray-300 font-medium py-2 px-6 rounded-lg transition-colors"
                    >
                        Decline
                    </button>
                    <button
                        onClick={handleAccept}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
}