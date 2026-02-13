import React, { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { GENDER_OPTIONS, OCCASION_OPTIONS, DISCOUNT_OPTIONS, MATERIAL_OPTIONS } from "../constants";

const FilterSidebar = ({
    filters,
    categories,
    subcategories,
    subSubcategories,
    priceRanges,
    discounts,
    priceRangeCounts,
    genderCounts,
    occasionCounts,
    onClose,
    isMobile = false,
}) => {
    const [dropdownStates, setDropdownStates] = useState({
        categories: false,
        subcategories: false,
        subSubcategories: false,
        material: false,
        price: false,
        discount: false,
        gender: false,
        occasion: false,
        gemstone: false,
    });

    useEffect(() => {
        setDropdownStates((prev) => ({
            ...prev,
            categories: filters.selectedCategories.length > 0,
            subcategories: filters.selectedSubcategories.length > 0,
            subSubcategories: filters.selectedSubSubcategories.length > 0,
            material: Boolean(filters.itemNameFilter && filters.itemNameFilter.trim()),
            price: filters.selectedPriceRanges.length > 0,
            discount: filters.selectedDiscounts.length > 0,
            gender: filters.selectedGenders.length > 0,
            occasion: filters.selectedOccasions.length > 0,
            gemstone: filters.selectedGemstoneTypes.length > 0,
        }));
    }, [
        filters.selectedCategories,
        filters.selectedSubcategories,
        filters.selectedSubSubcategories,
        filters.selectedPriceRanges,
        filters.selectedDiscounts,
        filters.selectedGenders,
        filters.selectedOccasions,
        filters.selectedGemstoneTypes,
    ]);

    const toggleDropdown = (filterType) => {
        setDropdownStates((prev) => ({
            ...prev,
            [filterType]: !prev[filterType],
        }));
    };

    const hasActiveFilters =
        filters.selectedCategories.length > 0 ||
        filters.selectedSubcategories.length > 0 ||
        filters.selectedSubSubcategories.length > 0 ||
        filters.selectedPriceRanges.length > 0 ||
        filters.customPriceRange.min !== null ||
        filters.customPriceRange.max !== null ||
        filters.selectedDiscounts.length > 0 ||
        filters.selectedGenders.length > 0 ||
        filters.selectedOccasions.length > 0 ||
        filters.selectedGemstoneTypes.length > 0 ||
        filters.itemNameFilter;

    return (
        <div
            className={`shop-filter-sidebar${isMobile ? " shop-filter-sidebar-mobile-open" : ""
                }`}
        >
            <div className="shop-filter-content">
                <div className="shop-filter-header">
                    {isMobile && (
                        <button
                            className="shop-mobile-filter-close"
                            onClick={onClose}
                        >
                            &times;
                        </button>
                    )}
                    <h2 className="shop-filter-title">FILTERS</h2>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            className="shop-filter-clear-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (filters && filters.clearAllFilters) {
                                    filters.clearAllFilters();
                                }
                            }}
                        >
                            Clear All
                        </button>
                    )}
                </div>

                <div className="shop-filter-section">
                    <h3
                        className="shop-filter-section-title"
                        onClick={() => toggleDropdown("categories")}
                        style={{
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        Categories ({categories.length})
                        {dropdownStates.categories ? <Minus size={20} /> : <Plus size={20} />}
                    </h3>
                    {dropdownStates.categories && (
                        <div
                            className="shop-filter-options"
                            style={{ maxHeight: "200px", overflowY: "auto" }}
                        >
                            {categories.length > 0
                                ? categories.map((category) => (
                                    <label key={category.id} className="shop-filter-label">
                                        <input
                                            type="checkbox"
                                            checked={filters.selectedCategories.includes(category.name)}
                                            onChange={() => filters.handleCategoryChange(category.name)}
                                            className="shop-filter-checkbox"
                                        />
                                        <span className="shop-filter-label-text">
                                            {category.name}
                                        </span>
                                    </label>
                                ))
                                : ["Rings", "Pendants", "Bracelets", "Necklaces"].map(
                                    (category) => (
                                        <label key={category} className="shop-filter-label">
                                            <input
                                                type="checkbox"
                                                checked={filters.selectedCategories.includes(category)}
                                                onChange={() => filters.handleCategoryChange(category)}
                                                className="shop-filter-checkbox"
                                            />
                                            <span className="shop-filter-label-text">
                                                {category}
                                            </span>
                                        </label>
                                    )
                                )}
                        </div>
                    )}
                </div>

                <div className="shop-filter-section">
                    <h3
                        className="shop-filter-section-title"
                        onClick={() => toggleDropdown("subcategories")}
                        style={{
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        Subcategories ({filters.getFilteredSubcategories?.length || 0})
                        {dropdownStates.subcategories ? (
                            <Minus size={20} />
                        ) : (
                            <Plus size={20} />
                        )}
                    </h3>
                    {dropdownStates.subcategories && (
                        <div
                            className="shop-filter-options"
                            style={{ maxHeight: "200px", overflowY: "auto" }}
                        >
                            {filters.getFilteredSubcategories && filters.getFilteredSubcategories.length > 0 ? (
                                filters.getFilteredSubcategories.map((subcategory) => (
                                    <label key={subcategory.id} className="shop-filter-label">
                                        <input
                                            type="checkbox"
                                            checked={filters.selectedSubcategories.includes(
                                                subcategory.name
                                            )}
                                            onChange={() =>
                                                filters.handleSubcategoryChange(subcategory.name)
                                            }
                                            className="shop-filter-checkbox"
                                        />
                                        <span className="shop-filter-label-text">
                                            {subcategory.name}
                                        </span>
                                    </label>
                                ))
                            ) : (
                                <div
                                    style={{
                                        padding: "0.5rem",
                                        color: "#666",
                                        fontStyle: "italic",
                                    }}
                                >
                                    {filters.selectedCategories.length === 0
                                        ? "Select a category to see subcategories"
                                        : "No subcategories found for selected categories"}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="shop-filter-section">
                    <h3
                        className="shop-filter-section-title"
                        onClick={() => toggleDropdown("subSubcategories")}
                        style={{
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        Sub-Subcategories ({filters.getFilteredSubSubcategories?.length || 0})
                        {dropdownStates.subSubcategories ? (
                            <Minus size={20} />
                        ) : (
                            <Plus size={20} />
                        )}
                    </h3>
                    {dropdownStates.subSubcategories && (
                        <div
                            className="shop-filter-options"
                            style={{ maxHeight: "200px", overflowY: "auto" }}
                        >
                            {filters.getFilteredSubSubcategories && filters.getFilteredSubSubcategories.length > 0 ? (
                                filters.getFilteredSubSubcategories.map((subSubcategory) => (
                                    <label
                                        key={subSubcategory.id}
                                        className="shop-filter-label"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={filters.selectedSubSubcategories.includes(
                                                subSubcategory.name
                                            )}
                                            onChange={() =>
                                                filters.handleSubSubcategoryChange(subSubcategory.name)
                                            }
                                            className="shop-filter-checkbox"
                                        />
                                        <span className="shop-filter-label-text">
                                            {subSubcategory.name}
                                        </span>
                                    </label>
                                ))
                            ) : (
                                <div
                                    style={{
                                        padding: "0.5rem",
                                        color: "#666",
                                        fontStyle: "italic",
                                    }}
                                >
                                    {filters.selectedSubcategories.length === 0
                                        ? "Select a subcategory to see sub-subcategories"
                                        : "No sub-subcategories found for selected subcategories"}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="shop-filter-section">
                    <h3
                        className="shop-filter-section-title"
                        onClick={() => toggleDropdown("material")}
                        style={{
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        Material / Type
                        {dropdownStates.material ? <Minus size={20} /> : <Plus size={20} />}
                    </h3>
                    {dropdownStates.material && (
                        <div
                            className="shop-filter-options"
                            style={{ maxHeight: "200px", overflowY: "auto" }}
                        >
                            {MATERIAL_OPTIONS.map(({ value, label }) => (
                                <label key={value} className="shop-filter-label">
                                    <input
                                        type="radio"
                                        name="material"
                                        checked={(filters.itemNameFilter || "").toLowerCase() === value.toLowerCase()}
                                        onChange={() => filters.handleItemNameChange ? filters.handleItemNameChange(value) : null}
                                        className="shop-filter-checkbox"
                                    />
                                    <span className="shop-filter-label-text">
                                        {label}
                                    </span>
                                </label>
                            ))}
                            {(filters.itemNameFilter || "").trim() && (
                                <button
                                    type="button"
                                    className="shop-filter-clear-all"
                                    style={{ marginTop: "8px", fontSize: "0.85rem" }}
                                    onClick={() => filters.handleItemNameChange && filters.handleItemNameChange("")}
                                >
                                    Clear Material
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="shop-filter-section">
                    <h3
                        className="shop-filter-section-title"
                        onClick={() => toggleDropdown("price")}
                        style={{
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        Price
                        {dropdownStates.price ? <Minus size={20} /> : <Plus size={20} />}
                    </h3>
                    {dropdownStates.price && (
                        <div
                            className="shop-filter-options"
                            style={{ maxHeight: "200px", overflowY: "auto" }}
                        >
                            {priceRanges.filter(
                                ({ label }) => priceRangeCounts[label] > 0
                            ).length > 0 ? (
                                priceRanges
                                    .filter(({ label }) => priceRangeCounts[label] > 0)
                                    .map(({ label }) => (
                                        <label key={label} className="shop-filter-label">
                                            <input
                                                type="checkbox"
                                                checked={filters.selectedPriceRanges.includes(label)}
                                                onChange={() => filters.handlePriceRangeChange(label)}
                                                className="shop-filter-checkbox"
                                            />
                                            <span className="shop-filter-label-text">
                                                {label} ({priceRangeCounts[label]})
                                            </span>
                                        </label>
                                    ))
                            ) : (
                                <div
                                    style={{
                                        color: "#666",
                                        fontSize: "0.9rem",
                                        fontStyle: "italic",
                                        textAlign: "center",
                                        padding: "1rem 0",
                                    }}
                                >
                                    No price ranges available
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="shop-filter-section">
                    <h3
                        className="shop-filter-section-title"
                        onClick={() => toggleDropdown("gender")}
                        style={{
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        Gender
                        {dropdownStates.gender ? <Minus size={20} /> : <Plus size={20} />}
                    </h3>
                    {dropdownStates.gender && (
                        <div
                            className="shop-filter-options"
                            style={{ maxHeight: "200px", overflowY: "auto" }}
                        >
                            {GENDER_OPTIONS.filter(({ value }) => genderCounts[value] > 0)
                                .length > 0 ? (
                                GENDER_OPTIONS.filter(({ value }) => genderCounts[value] > 0).map(
                                    ({ value, label }) => (
                                        <label key={value} className="shop-filter-label">
                                            <input
                                                type="checkbox"
                                                checked={filters.selectedGenders.includes(value)}
                                                onChange={() => filters.handleGenderChange(value)}
                                                className="shop-filter-checkbox"
                                            />
                                            <span className="shop-filter-label-text">
                                                {label} ({genderCounts[value]})
                                            </span>
                                        </label>
                                    )
                                )
                            ) : (
                                <div
                                    style={{
                                        color: "#666",
                                        fontSize: "0.9rem",
                                        fontStyle: "italic",
                                        textAlign: "center",
                                        padding: "1rem 0",
                                    }}
                                >
                                    No gender options available
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="shop-filter-section">
                    <h3
                        className="shop-filter-section-title"
                        onClick={() => toggleDropdown("occasion")}
                        style={{
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        Occasion
                        {dropdownStates.occasion ? <Minus size={20} /> : <Plus size={20} />}
                    </h3>
                    {dropdownStates.occasion && (
                        <div
                            className="shop-filter-options"
                            style={{ maxHeight: "200px", overflowY: "auto" }}
                        >
                            {OCCASION_OPTIONS.filter(
                                ({ value }) => occasionCounts[value] > 0
                            ).length > 0 ? (
                                OCCASION_OPTIONS.filter(
                                    ({ value }) => occasionCounts[value] > 0
                                ).map(({ value, label }) => (
                                    <label key={value} className="shop-filter-label">
                                        <input
                                            type="checkbox"
                                            checked={filters.selectedOccasions.includes(value)}
                                            onChange={() => filters.handleOccasionChange(value)}
                                            className="shop-filter-checkbox"
                                        />
                                        <span className="shop-filter-label-text">
                                            {label} ({occasionCounts[value]})
                                        </span>
                                    </label>
                                ))
                            ) : (
                                <div
                                    style={{
                                        color: "#666",
                                        fontSize: "0.9rem",
                                        fontStyle: "italic",
                                        textAlign: "center",
                                        padding: "1rem 0",
                                    }}
                                >
                                    No occasion options available
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="shop-filter-section">
                    <h3
                        className="shop-filter-section-title"
                        onClick={() => toggleDropdown("gemstone")}
                        style={{
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        Gemstone Type
                        {dropdownStates.gemstone ? <Minus size={20} /> : <Plus size={20} />}
                    </h3>
                    {dropdownStates.gemstone && (
                        <div
                            className="shop-filter-options"
                            style={{ maxHeight: "200px", overflowY: "auto" }}
                        >
                            <label className="shop-filter-label">
                                <input
                                    type="checkbox"
                                    checked={filters.selectedGemstoneTypes.includes("diamond")}
                                    onChange={() => filters.handleGemstoneTypeChange("diamond")}
                                    className="shop-filter-checkbox"
                                />
                                <span className="shop-filter-label-text">Diamond</span>
                            </label>
                            <label className="shop-filter-label">
                                <input
                                    type="checkbox"
                                    checked={filters.selectedGemstoneTypes.includes("stone")}
                                    onChange={() => filters.handleGemstoneTypeChange("stone")}
                                    className="shop-filter-checkbox"
                                />
                                <span className="shop-filter-label-text">Stone</span>
                            </label>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilterSidebar;

