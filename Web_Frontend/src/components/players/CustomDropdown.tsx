import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  thumbImg?: string;
}

interface CustomDropdownProps<T extends string> {
  label: string;
  leadingIcon: React.ReactNode;
  value: T;
  onChange: (val: T) => void;
  options: DropdownOption<T>[];
  activeFilter?: boolean;
}

export function CustomDropdown<T extends string>({
  label,
  leadingIcon,
  value,
  onChange,
  options,
  activeFilter = false
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`c-dropdown-container ${activeFilter ? 'is-active' : ''} ${isOpen ? 'is-open' : ''}`}
    >
      <button
        type="button"
        className="c-dropdown-trigger"
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="c-dropdown-leading-icon">{leadingIcon}</span>

        <div className="c-dropdown-text-group">
          <span className="c-dropdown-caption">{label}</span>
          <div className="c-dropdown-selected-val">
            {selectedOption?.thumbImg && (
              <img
                src={selectedOption.thumbImg}
                alt=""
                className="c-dropdown-inline-thumb"
              />
            )}
            {selectedOption?.icon && (
              <span className="c-dropdown-inline-icon">{selectedOption.icon}</span>
            )}
            <span className="c-dropdown-label-text">{selectedOption?.label}</span>
          </div>
        </div>

        <ChevronDown
          size={15}
          className={`c-dropdown-chevron ${isOpen ? 'chevron-rotated' : ''}`}
        />
      </button>

      {isOpen && (
        <ul className="c-dropdown-menu" role="listbox">
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                className={`c-dropdown-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <div className="c-dropdown-item-left">
                  {opt.thumbImg && (
                    <img
                      src={opt.thumbImg}
                      alt=""
                      className="c-dropdown-item-thumb"
                    />
                  )}
                  {opt.icon && (
                    <span className="c-dropdown-item-icon">{opt.icon}</span>
                  )}
                  <span className="c-dropdown-item-title">{opt.label}</span>
                </div>
                {isSelected && (
                  <Check size={14} className="c-dropdown-check-icon" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

