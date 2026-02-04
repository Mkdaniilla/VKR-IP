import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface Option {
    value: string | number;
    label: string;
}

interface OptGroup {
    label: string;
    options: Option[];
}

interface CustomSelectProps {
    value: any;
    onChange: (value: any) => void;
    options?: (Option | OptGroup)[];
    placeholder?: string;
    disabled?: boolean;
}

export default function CustomSelect({ value, onChange, options = [], placeholder = "Select...", disabled }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const updateCoords = useCallback(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, []);

    const toggleOpen = () => {
        if (!disabled) {
            updateCoords();
            setIsOpen(!isOpen);
        }
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            window.addEventListener('scroll', updateCoords, true);
            window.addEventListener('resize', updateCoords);

            const handleClickOutside = (event: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(event.target as Node) &&
                    dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener("mousedown", handleClickOutside);

            return () => {
                window.removeEventListener('scroll', updateCoords, true);
                window.removeEventListener('resize', updateCoords);
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [isOpen, updateCoords]);

    const selectedOption = options.flatMap(o => 'options' in o ? o.options : [o]).find(o => String(o.value) === String(value));

    const dropdownContent = (
        <div
            ref={dropdownRef}
            className="fixed z-[999999] custom-select-dropdown animate-in fade-in zoom-in-95 duration-200 ease-out"
            style={{
                top: `${coords.top - (typeof window !== 'undefined' ? window.scrollY : 0) + 8}px`,
                left: `${coords.left - (typeof window !== 'undefined' ? window.scrollX : 0)}px`,
                minWidth: `${coords.width}px`,
                width: 'max-content',
                maxWidth: '90vw'
            }}
        >
            <div className="max-h-[300px] overflow-y-auto px-1 py-1 custom-scrollbar">
                <div className="space-y-1">
                    {options.map((item, idx) => {
                        if ('options' in item) {
                            return (
                                <div key={idx} className="mb-2 last:mb-0">
                                    <div className="px-4 py-2 mt-1 text-[9px] font-black text-white/30 uppercase tracking-[0.25em] select-none">
                                        {item.label}
                                    </div>
                                    <div className="space-y-1">
                                        {item.options.map(opt => (
                                            <div
                                                key={opt.value}
                                                onClick={() => {
                                                    onChange(opt.value);
                                                    setIsOpen(false);
                                                }}
                                                className={`custom-select-option rounded-[1.25rem] cursor-pointer transition-all flex items-center justify-between ${String(value) === String(opt.value)
                                                    ? 'bg-cyan-500/30 text-white shadow-[inset_0_0_20px_rgba(34,211,238,0.2)]'
                                                    : 'hover:bg-white/10'
                                                    }`}
                                            >
                                                <span className="whitespace-nowrap pr-8">{opt.label}</span>
                                                {String(value) === String(opt.value) && (
                                                    <div className="flex-shrink-0 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee] animate-pulse"></div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        }
                        return (
                            <div
                                key={item.value}
                                onClick={() => {
                                    onChange(item.value);
                                    setIsOpen(false);
                                }}
                                className={`custom-select-option rounded-[1.25rem] cursor-pointer transition-all flex items-center justify-between ${String(value) === String(item.value)
                                    ? 'bg-cyan-500/30 text-white shadow-[inset_0_0_20px_rgba(34,211,238,0.2)]'
                                    : 'hover:bg-white/10'
                                    }`}
                            >
                                <span className="whitespace-nowrap pr-8">{item.label}</span>
                                {String(value) === String(item.value) && (
                                    <div className="flex-shrink-0 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee] animate-pulse"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    return (
        <div className="relative w-full" ref={containerRef}>
            <div
                onClick={toggleOpen}
                className={`glass-input flex items-center justify-between cursor-pointer transition-all h-[64px] px-6 ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20 active:scale-[0.98] border-white/30 shadow-lg'
                    }`}
            >
                <span className={`text-[15px] select-none leading-none ${value ? "text-white font-black" : "text-white/30"}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div className="flex-shrink-0 flex items-center ml-2">
                    <svg
                        className={`w-3.5 h-3.5 text-white/40 transition-transform duration-500 ${isOpen ? 'rotate-180 text-cyan-400' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {isOpen && mounted && typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
        </div>
    );
}
