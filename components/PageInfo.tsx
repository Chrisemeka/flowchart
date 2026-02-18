'use client';

import { useState, useRef, useEffect } from 'react';
import { Info, X } from 'lucide-react';

interface PageInfoProps {
    content: string;
}

export default function PageInfo({ content }: PageInfoProps) {
    const [isOpen, setIsOpen] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    // Close on click outside (for desktop mainly, mobile uses backdrop)
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-block ml-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                aria-label="Page Information"
            >
                <Info size={20} />
            </button>

            {isOpen && (
                <>
                    {/* Mobile Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 sm:hidden"
                        onClick={() => setIsOpen(false)}
                        aria-hidden="true"
                    />

                    {/* Popup Content */}
                    <div
                        ref={popupRef}
                        className="
                            z-50 bg-white p-5 border border-border shadow-lg rounded-xl
                            animate-in fade-in zoom-in-95 duration-200
                            
                            /* Mobile: Fixed Centered Modal */
                            fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm
                            
                            /* Desktop: Absolute Popover */
                            sm:absolute sm:top-full sm:left-0 sm:mt-2 sm:transform-none sm:w-80
                        "
                    >
                        <div className="flex justify-between items-start mb-3">
                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Info size={16} className="text-primary" />
                                About this page
                            </h4>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-full transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {content}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
