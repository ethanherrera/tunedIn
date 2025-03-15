import React from 'react';
import { SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function SearchBar({
  placeholder = "Search...",
  value = "",
  onChange,
  className,
}: SearchBarProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className={cn(
      "flex h-9 w-[200px] items-center gap-2 rounded-md border px-3 shadow-sm",
      className
    )}>
      <SearchIcon className="h-4 w-4 shrink-0 opacity-50" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="flex h-8 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
} 