"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

// 1. Define the props the component will accept
interface FilterSidebarProps {
    sortOption: string;
    onSortChange: (value: string) => void;
    priceRange: number[];
    onPriceChange: (value: number[]) => void;
    category: string;
    onCategoryChange: (value: string) => void;
    onClearFilters: () => void;
}

export function FilterSidebar({
    sortOption,
    onSortChange,
    priceRange,
    onPriceChange,
    category,
    onCategoryChange,
    onClearFilters
}: FilterSidebarProps) {
  return (
    // THE FIX: Changed 'hidden lg:flex' to 'flex' to make it always visible.
    // It will now appear as a column on all screen sizes.
    <aside className="w-full flex-col gap-8 md:w-64 md:flex">
      {/* Sort By Filter */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Sort By</h3>
        {/* 2. Connect the Select component to the state */}
        <Select value={sortOption} onValueChange={onSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Range Filter */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Price Range</h3>
        {/* 3. Connect the Slider component to the state */}
        <Slider
          value={priceRange}
          onValueChange={onPriceChange}
          max={10000}
          step={100}
          className="my-6"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
            <span>₹0</span>
            <span>₹{priceRange[0].toLocaleString()}{priceRange[0] === 10000 ? '+' : ''}</span>
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Category</h3>
        {/* 4. Connect the RadioGroup to the state */}
        <RadioGroup value={category} onValueChange={onCategoryChange} className="space-y-2">
            <div>
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="ml-2 cursor-pointer">All</Label>
            </div>
            <div>
                <RadioGroupItem value="pottery" id="pottery" />
                <Label htmlFor="pottery" className="ml-2 cursor-pointer">Pottery</Label>
            </div>
             <div>
                <RadioGroupItem value="textiles" id="textiles" />
                <Label htmlFor="textiles" className="ml-2 cursor-pointer">Textiles</Label>
            </div>
             <div>
                <RadioGroupItem value="woodwork" id="woodwork" />
                <Label htmlFor="woodwork" className="ml-2 cursor-pointer">Woodwork</Label>
            </div>
        </RadioGroup>
      </div>
      
      {/* 5. Connect the Clear button */}
      <Button variant="outline" onClick={onClearFilters}>Clear Filters</Button>
    </aside>
  );
}

