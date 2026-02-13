/**
 * Shop Page Constants
 * Centralized constants for filter options, sort options, and other static data
 */

export const FILTER_BUTTONS = [
    { label: "All", value: "" },
    { label: "New In", value: "new" },
    { label: "Bestseller", value: "bestseller" },
];

export const SORT_OPTIONS = [
    { label: "Sort by: Featured", value: "Sort by: Featured" },
    { label: "Price: Low to High", value: "priceLow" },
    { label: "Price: High to Low", value: "priceHigh" },
    { label: "Name: A-Z", value: "nameAZ" },
    { label: "Name: Z-A", value: "nameZA" },
];

/** Material / Type filter (itemName in URL) - used for Gold, Diamond, Stone */
export const MATERIAL_OPTIONS = [
    { value: "gold", label: "Gold" },
    { value: "diamond", label: "Diamond" },
    { value: "stone", label: "Stone" },
];

export const DISCOUNT_OPTIONS = [
    { label: "Flat 15% Off On Making Charges", key: "15" },
    { label: "Flat 5% Off On Making Charges", key: "5" },
];

export const GENDER_OPTIONS = [
    { value: "men", label: "Men" },
    { value: "women", label: "Women" },
    { value: "unisex", label: "Unisex" },
    { value: "kids", label: "Kids" },
    { value: "teen", label: "Teen" },
];

export const OCCASION_OPTIONS = [
    { value: "wedding", label: "Wedding" },
    { value: "engagement", label: "Engagement" },
    { value: "anniversary", label: "Anniversary" },
    { value: "birthday", label: "Birthday" },
    { value: "valentine", label: "Valentine's Day" },
    { value: "mothers_day", label: "Mother's Day" },
    { value: "fathers_day", label: "Father's Day" },
    { value: "christmas", label: "Christmas" },
    { value: "diwali", label: "Diwali" },
    { value: "rakhi", label: "Rakhi" },
    { value: "karva_chauth", label: "Karva Chauth" },
    { value: "office_wear", label: "Office Wear" },
    { value: "party_wear", label: "Party Wear" },
    { value: "casual_wear", label: "Casual Wear" },
    { value: "formal_wear", label: "Formal Wear" },
    { value: "daily_wear", label: "Daily Wear" },
    { value: "festival", label: "Festival" },
    { value: "ceremony", label: "Ceremony" },
    { value: "graduation", label: "Graduation" },
    { value: "promotion", label: "Promotion" },
    { value: "achievement", label: "Achievement" },
    { value: "self_gift", label: "Self Gift" },
    { value: "other", label: "Other" },
];

