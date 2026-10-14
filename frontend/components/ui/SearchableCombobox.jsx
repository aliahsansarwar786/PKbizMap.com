'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';

export default function SearchableCombobox({
  id,
  name,
  value = '',
  onChange,
  options = [],
  placeholder = 'Search...',
  disabled = false,
  disabledPlaceholder = 'Select country first...',
  error = false,
  emptyMessage = 'No city found',
  className = '',
  ariaLabel = 'Searchable select',
  maxDisplay = 60,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Sync internal query whenever external value changes
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // If disabled, ensure dropdown is closed and query matches value
  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }, [disabled]);

  // Filter options based on typed query
  const filteredOptions = useMemo(() => {
    if (!options || options.length === 0) return [];
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return options.slice(0, maxDisplay);
    }
    // If the query exactly matches the current value, show all options starting with or containing
    const matches = options.filter((opt) =>
      opt.toLowerCase().includes(trimmed)
    );
    return matches.slice(0, maxDisplay);
  }, [options, query, maxDisplay]);

  // Click outside to close and validate
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        handleCloseAndValidate();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [options, query, value]);

  // Auto scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-combobox-item]');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleCloseAndValidate = () => {
    setIsOpen(false);
    setHighlightedIndex(-1);

    if (disabled) return;

    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      if (value) onChange?.('');
      setQuery('');
      return;
    }

    // Check if the typed query matches an option exactly (case-insensitive)
    const exactMatch = options.find((opt) => opt.toLowerCase() === trimmed);
    if (exactMatch) {
      if (exactMatch !== value) {
        onChange?.(exactMatch);
      }
      setQuery(exactMatch);
    } else {
      // Revert to valid value if any, or clear
      if (value && options.some((opt) => opt.toLowerCase() === value.toLowerCase())) {
        setQuery(value);
      } else {
        onChange?.('');
        setQuery('');
      }
    }
  };

  const handleSelect = (option) => {
    onChange?.(option);
    setQuery(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.('');
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(filteredOptions.length - 1);
      } else {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
      }
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
        e.preventDefault();
        handleSelect(filteredOptions[highlightedIndex]);
      } else if (isOpen && filteredOptions.length === 1) {
        e.preventDefault();
        handleSelect(filteredOptions[0]);
      } else if (isOpen) {
        e.preventDefault();
        handleCloseAndValidate();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCloseAndValidate();
    } else if (e.key === 'Tab') {
      handleCloseAndValidate();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ minWidth: 140 }}
    >
      {/* Hidden input to support native form submissions */}
      {name && <input type="hidden" name={name} value={value || ''} />}

      <div
        className={`relative flex items-center w-full transition-all rounded-xl border ${
          disabled
            ? 'bg-gray-100/80 border-gray-200 cursor-not-allowed opacity-75'
            : error
            ? 'bg-white border-red-500 ring-2 ring-red-500/10'
            : isOpen
            ? 'bg-white border-blue-600 ring-2 ring-blue-500/20'
            : 'bg-gray-50/70 hover:bg-white border-gray-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20'
        }`}
      >
        <div className="pl-3 pr-1 text-gray-400 pointer-events-none flex items-center">
          <Search size={15} />
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={disabled ? '' : query}
          onChange={(e) => {
            if (disabled) return;
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? disabledPlaceholder : placeholder}
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          autoComplete="off"
          className="w-full h-11 bg-transparent px-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none border-none disabled:cursor-not-allowed"
        />

        <div className="pr-2 flex items-center gap-1">
          {!disabled && (value || query) && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Clear selection"
            >
              <X size={14} />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                if (isOpen) {
                  handleCloseAndValidate();
                } else {
                  setIsOpen(true);
                  inputRef.current?.focus();
                }
              }
            }}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-not-allowed"
            aria-label="Toggle dropdown"
            tabIndex={-1}
          >
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Floating Dropdown List */}
      {isOpen && !disabled && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-100 py-1 animate-in fade-in zoom-in-95 duration-100"
          style={{
            boxShadow:
              '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          }}
        >
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-500 text-center font-medium">
              {emptyMessage}
            </div>
          ) : (
            <>
              {filteredOptions.map((option, index) => {
                const isSelected =
                  value && option.toLowerCase() === value.toLowerCase();
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={option}
                    type="button"
                    data-combobox-item
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full text-left px-3.5 py-2 text-sm flex items-center justify-between transition-colors ${
                      isHighlighted
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : isSelected
                        ? 'bg-blue-50/50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate">{option}</span>
                    {isSelected && (
                      <Check size={14} className="text-blue-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}

              {options.length > maxDisplay && query.trim() === '' && (
                <div className="px-3.5 py-1.5 text-[11px] text-gray-400 bg-gray-50/50 border-t border-gray-100 text-center font-normal">
                  Type to filter from {options.length} cities...
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
