import React from "react";
import FilterSidebar from "./FilterSidebar";

const MobileFilterDrawer = ({
    isOpen,
    onClose,
    filters,
    categories,
    subcategories,
    subSubcategories,
    priceRanges,
    discounts,
    priceRangeCounts,
    genderCounts,
    occasionCounts,
}) => {
    if (!isOpen) return null;

    return (
        <>
            <div
                className="shop-mobile-filter-backdrop"
                onClick={onClose}
            />
            <FilterSidebar
                filters={filters}
                categories={categories}
                subcategories={subcategories}
                subSubcategories={subSubcategories}
                priceRanges={priceRanges}
                discounts={discounts}
                priceRangeCounts={priceRangeCounts}
                genderCounts={genderCounts}
                occasionCounts={occasionCounts}
                onClose={onClose}
                isMobile={true}
            />
        </>
    );
};

export default MobileFilterDrawer;

