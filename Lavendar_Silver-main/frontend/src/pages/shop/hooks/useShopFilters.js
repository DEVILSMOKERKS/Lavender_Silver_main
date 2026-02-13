import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";

export const useShopFilters = ({
  categories = [],
  subcategories = [],
  subSubcategories = [],
  priceRanges = [],
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [selectedSubSubcategories, setSelectedSubSubcategories] = useState([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [customPriceRange, setCustomPriceRange] = useState({ min: null, max: null });
  const [selectedDiscounts, setSelectedDiscounts] = useState([]);
  const [selectedGenders, setSelectedGenders] = useState([]);
  const [selectedOccasions, setSelectedOccasions] = useState([]);
  const [selectedGemstoneTypes, setSelectedGemstoneTypes] = useState([]);
  const [itemNameFilter, setItemNameFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [clearFiltersTrigger, setClearFiltersTrigger] = useState(0);

  const filtersFromUrlRef = useRef(null);
  const isUpdatingFromUrlRef = useRef(false);
  const isInitialMountRef = useRef(true);

  const syncFiltersToUrl = useCallback(
    (updates = {}) => {
      if (isUpdatingFromUrlRef.current) {
        return;
      }

      const safeCategories = Array.isArray(categories) ? categories : [];
      const safeSubcategories = Array.isArray(subcategories) ? subcategories : [];
      const safeSubSubcategories = Array.isArray(subSubcategories) ? subSubcategories : [];
      const safePriceRanges = Array.isArray(priceRanges) ? priceRanges : [];

      try {
        setSearchParams((prevParams) => {
          const newParams = new URLSearchParams(prevParams);

          if ("categories" in updates) {
            if (
              updates.categories &&
              Array.isArray(updates.categories) &&
              updates.categories.length > 0 &&
              safeCategories.length > 0
            ) {
              const category = safeCategories.find(
                (cat) => cat && cat.name === updates.categories[0]
              );
              if (category) {
                newParams.set(
                  "category",
                  category.slug || category.name.toLowerCase().replace(/\s+/g, "-")
                );
              }
            } else {
              newParams.delete("category");
            }
          } else if (selectedCategories.length > 0 && safeCategories.length > 0) {
            const category = safeCategories.find(
              (cat) => cat && cat.name === selectedCategories[0]
            );
            if (category) {
              newParams.set(
                "category",
                category.slug || category.name.toLowerCase().replace(/\s+/g, "-")
              );
            }
          } else {
            newParams.delete("category");
          }

          // Handle subcategory
          if ("subcategories" in updates) {
            if (
              updates.subcategories &&
              Array.isArray(updates.subcategories) &&
              updates.subcategories.length > 0 &&
              safeSubcategories.length > 0
            ) {
              const subcategory = safeSubcategories.find(
                (subcat) => subcat && subcat.name === updates.subcategories[0]
              );
              if (subcategory) {
                newParams.set(
                  "subcategory",
                  subcategory.slug || subcategory.name.toLowerCase().replace(/\s+/g, "-")
                );
              }
            } else {
              newParams.delete("subcategory");
            }
          } else if (selectedSubcategories.length > 0 && safeSubcategories.length > 0) {
            const subcategory = safeSubcategories.find(
              (subcat) => subcat && subcat.name === selectedSubcategories[0]
            );
            if (subcategory) {
              newParams.set(
                "subcategory",
                subcategory.slug || subcategory.name.toLowerCase().replace(/\s+/g, "-")
              );
            }
          } else {
            newParams.delete("subcategory");
          }

          // Handle sub-subcategory
          if ("subSubcategories" in updates) {
            if (
              updates.subSubcategories &&
              Array.isArray(updates.subSubcategories) &&
              updates.subSubcategories.length > 0 &&
              safeSubSubcategories.length > 0
            ) {
              const subSubcategory = safeSubSubcategories.find(
                (subSubcat) => subSubcat && subSubcat.name === updates.subSubcategories[0]
              );
              if (subSubcategory) {
                newParams.set(
                  "subSubcategory",
                  subSubcategory.slug || subSubcategory.name.toLowerCase().replace(/\s+/g, "-")
                );
              }
            } else {
              newParams.delete("subSubcategory");
            }
          } else if (selectedSubSubcategories.length > 0 && safeSubSubcategories.length > 0) {
            const subSubcategory = safeSubSubcategories.find(
              (subSubcat) => subSubcat && subSubcat.name === selectedSubSubcategories[0]
            );
            if (subSubcategory) {
              newParams.set(
                "subSubcategory",
                subSubcategory.slug || subSubcategory.name.toLowerCase().replace(/\s+/g, "-")
              );
            }
          } else {
            newParams.delete("subSubcategory");
          }

          // Handle price range
          if ("priceRanges" in updates || "customPriceRange" in updates) {
            const priceRangesToUse = "priceRanges" in updates ? updates.priceRanges : selectedPriceRanges;
            const customRangeToUse = "customPriceRange" in updates ? updates.customPriceRange : customPriceRange;

            if (customRangeToUse.min !== null || customRangeToUse.max !== null) {
              if (customRangeToUse.min !== null && customRangeToUse.min !== 0) {
                newParams.set("minPrice", customRangeToUse.min.toString());
              } else {
                newParams.delete("minPrice");
              }
              if (customRangeToUse.max !== null && customRangeToUse.max !== Infinity) {
                newParams.set("maxPrice", customRangeToUse.max.toString());
              } else {
                newParams.delete("maxPrice");
              }
            } else if (Array.isArray(priceRangesToUse) && priceRangesToUse.length > 0 && safePriceRanges.length > 0) {
              const range = safePriceRanges.find((r) => r && r.label === priceRangesToUse[0]);
              if (range) {
                if (range.min !== undefined && range.min !== null && range.min !== 0) {
                  newParams.set("minPrice", range.min.toString());
                } else {
                  newParams.delete("minPrice");
                }
                if (range.max !== undefined && range.max !== null && range.max !== Infinity) {
                  newParams.set("maxPrice", range.max.toString());
                } else {
                  newParams.delete("maxPrice");
                }
              } else {
                newParams.delete("minPrice");
                newParams.delete("maxPrice");
              }
            } else {
              newParams.delete("minPrice");
              newParams.delete("maxPrice");
            }
          }

          // Handle gender
          if ("genders" in updates) {
            if (updates.genders && Array.isArray(updates.genders) && updates.genders.length > 0 && updates.genders[0]) {
              newParams.set("gender", String(updates.genders[0]));
            } else {
              newParams.delete("gender");
            }
          } else if (selectedGenders.length > 0 && selectedGenders[0]) {
            newParams.set("gender", String(selectedGenders[0]));
          } else {
            newParams.delete("gender");
          }

          // Handle occasion
          if ("occasions" in updates) {
            if (updates.occasions && Array.isArray(updates.occasions) && updates.occasions.length > 0 && updates.occasions[0]) {
              newParams.set("occasion", String(updates.occasions[0]));
            } else {
              newParams.delete("occasion");
            }
          } else if (selectedOccasions.length > 0 && selectedOccasions[0]) {
            newParams.set("occasion", String(selectedOccasions[0]));
          } else {
            newParams.delete("occasion");
          }

          // Handle gemstone type
          if ("gemstoneTypes" in updates) {
            if (updates.gemstoneTypes && Array.isArray(updates.gemstoneTypes) && updates.gemstoneTypes.length > 0 && updates.gemstoneTypes[0]) {
              newParams.set("gemstoneType", String(updates.gemstoneTypes[0]));
            } else {
              newParams.delete("gemstoneType");
            }
          } else if (selectedGemstoneTypes.length > 0 && selectedGemstoneTypes[0]) {
            newParams.set("gemstoneType", String(selectedGemstoneTypes[0]));
          } else {
            newParams.delete("gemstoneType");
          }

          // Handle item name filter
          if ("itemName" in updates) {
            if (updates.itemName && String(updates.itemName).trim()) {
              newParams.set("itemName", String(updates.itemName).trim());
            } else {
              newParams.delete("itemName");
            }
          } else if (itemNameFilter && String(itemNameFilter).trim()) {
            newParams.set("itemName", String(itemNameFilter).trim());
          } else {
            newParams.delete("itemName");
          }

          // Handle active filter (All, New In, Bestseller)
          if ("activeFilter" in updates) {
            if (updates.activeFilter && String(updates.activeFilter).trim()) {
              newParams.set("filter", String(updates.activeFilter).trim());
            } else {
              newParams.delete("filter");
            }
          } else if (activeFilter && String(activeFilter).trim()) {
            newParams.set("filter", String(activeFilter).trim());
          } else {
            newParams.delete("filter");
          }

          // Handle sort
          if ("sortBy" in updates) {
            let sortValue = updates.sortBy;
            if (sortValue && String(sortValue).trim() && sortValue !== "featured" && sortValue !== "Sort by: Featured") {
              newParams.set("sort", String(sortValue).trim());
            } else {
              newParams.delete("sort");
            }
          } else if (sortBy && String(sortBy).trim() && sortBy !== "featured" && sortBy !== "Sort by: Featured") {
            newParams.set("sort", String(sortBy).trim());
          } else {
            newParams.delete("sort");
          }

          return newParams;
        });
      } catch (error) {
        console.error("Error syncing filters to URL:", error);
      }
    },
    [
      selectedCategories,
      selectedSubcategories,
      selectedSubSubcategories,
      selectedPriceRanges,
      customPriceRange,
      selectedGenders,
      selectedOccasions,
      selectedGemstoneTypes,
      itemNameFilter,
      activeFilter,
      sortBy,
      categories,
      subcategories,
      subSubcategories,
      priceRanges,
      setSearchParams,
    ]
  );

  useEffect(() => {
    if (isUpdatingFromUrlRef.current) {
      return;
    }

    const filter = searchParams.get("filter");
    let currentUrl = window.location.pathname + window.location.search;

    let shouldProcess =
      isInitialMountRef.current ||
      filtersFromUrlRef.current === null ||
      filtersFromUrlRef.current !== currentUrl;

    if (shouldProcess) {
      if (filter && (filter === "bestseller" || filter === "new")) {
        isUpdatingFromUrlRef.current = true;
        setActiveFilter(filter);
        requestAnimationFrame(() => {
          setTimeout(() => {
            isUpdatingFromUrlRef.current = false;
          }, 150);
        });
      } else if (!filter && activeFilter !== "") {
        isUpdatingFromUrlRef.current = true;
        setActiveFilter("");
        requestAnimationFrame(() => {
          setTimeout(() => {
            isUpdatingFromUrlRef.current = false;
          }, 150);
        });
      }
    }
  }, [searchParams, activeFilter]);

  useEffect(() => {
    let minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    let occasion = searchParams.get("occasion");
    let gender = searchParams.get("gender");
    let search = searchParams.get("search");
    const gemstoneType = searchParams.get("gemstoneType");
    const subSubcategory = searchParams.get("subSubcategory");
    let itemName = searchParams.get("itemName");
    const filter = searchParams.get("filter");
    const sort = searchParams.get("sort");

    let hasUrlParams =
      minPrice ||
      maxPrice ||
      category ||
      subcategory ||
      occasion ||
      gender ||
      gemstoneType ||
      subSubcategory ||
      itemName ||
      search ||
      filter ||
      sort;

    if (hasUrlParams) {
      let currentUrl = window.location.pathname + window.location.search;
      let shouldProcess =
        !isUpdatingFromUrlRef.current &&
        (isInitialMountRef.current ||
          filtersFromUrlRef.current === null ||
          filtersFromUrlRef.current !== currentUrl ||
          (filtersFromUrlRef.current === currentUrl &&
            ((category && selectedCategories.length === 0) ||
              (subcategory && selectedSubcategories.length === 0) ||
              (subSubcategory && selectedSubSubcategories.length === 0) ||
              ((minPrice || maxPrice) &&
                selectedPriceRanges.length === 0 &&
                customPriceRange.min === null &&
                customPriceRange.max === null) ||
              (gender && selectedGenders.length === 0) ||
              (occasion && selectedOccasions.length === 0) ||
              (gemstoneType && selectedGemstoneTypes.length === 0) ||
              ((itemName || search) && !itemNameFilter) ||
              (filter && activeFilter !== filter) ||
              (sort && sortBy !== sort))));

      if (shouldProcess) {
        if (isInitialMountRef.current) {
          isInitialMountRef.current = false;
        }
        if (filtersFromUrlRef.current === null || filtersFromUrlRef.current !== currentUrl) {
          filtersFromUrlRef.current = currentUrl;
        }
        isUpdatingFromUrlRef.current = true;

        // Clear all filters when URL changes
        setSelectedCategories([]);
        setSelectedSubcategories([]);
        setSelectedSubSubcategories([]);
        setSelectedPriceRanges([]);
        setCustomPriceRange({ min: null, max: null });
        setSelectedDiscounts([]);
        setSelectedGenders([]);
        setSelectedOccasions([]);
        setSelectedGemstoneTypes([]);
        setItemNameFilter("");
        setActiveFilter(filter || "");

        // Handle price range from URL
        if (minPrice || maxPrice) {
          const min = minPrice ? parseFloat(minPrice) : 0;
          const max = maxPrice ? parseFloat(maxPrice) : Infinity;

          if (priceRanges.length > 0) {
            const matchingRange = priceRanges.find((range) => range.min === min && range.max === max);
            if (matchingRange) {
              setSelectedPriceRanges([matchingRange.label]);
              setCustomPriceRange({ min: null, max: null });
            } else {
              setSelectedPriceRanges([]);
              setCustomPriceRange({ min, max });
            }
          } else {
            setSelectedPriceRanges([]);
            setCustomPriceRange({ min, max });
          }
        }

        // Handle category from URL
        if (category && categories.length > 0) {
          const foundCategory = categories.find(
            (cat) =>
              (cat.slug && cat.slug.toLowerCase() === category.toLowerCase()) ||
              cat.name.toLowerCase() === category.toLowerCase()
          );
          if (foundCategory) {
            setSelectedCategories([foundCategory.name]);
          }
        }

        // Handle subcategory from URL
        if (subcategory && subcategories.length > 0) {
          const foundSubcategory = subcategories.find(
            (subcat) =>
              (subcat.slug && subcat.slug.toLowerCase() === subcategory.toLowerCase()) ||
              subcat.name.toLowerCase() === subcategory.toLowerCase()
          );
          if (foundSubcategory) {
            setSelectedSubcategories([foundSubcategory.name]);
          }
        }

        // Handle sub-subcategory from URL
        if (subSubcategory && subSubcategories.length > 0) {
          const foundSubSubcategory = subSubcategories.find(
            (subSubcat) =>
              (subSubcat.slug && subSubcat.slug.toLowerCase() === subSubcategory.toLowerCase()) ||
              subSubcat.name.toLowerCase() === subSubcategory.toLowerCase()
          );
          if (foundSubSubcategory) {
            setSelectedSubSubcategories([foundSubSubcategory.name]);
          }
        }

        // Handle gender from URL
        if (gender) {
          setSelectedGenders([gender]);
        }

        // Handle occasion from URL
        if (occasion) {
          setSelectedOccasions([occasion]);
        }

        // Handle gemstone type from URL
        if (gemstoneType) {
          setSelectedGemstoneTypes([gemstoneType]);
        }

        // Handle item name filter from URL
        if (itemName || search) {
          setItemNameFilter(itemName || search || "");
        }

        // Handle sort from URL
        if (sort) {
          setSortBy(sort);
        }

        // Reset the flag after processing
        requestAnimationFrame(() => {
          setTimeout(() => {
            isUpdatingFromUrlRef.current = false;
          }, 150);
        });
      }
    }
  }, [
    categories,
    subcategories,
    subSubcategories,
    priceRanges,
    searchParams,
    selectedCategories,
    selectedSubcategories,
    selectedSubSubcategories,
    selectedPriceRanges,
    customPriceRange,
    selectedGenders,
    selectedOccasions,
    selectedGemstoneTypes,
    itemNameFilter,
    activeFilter,
    sortBy,
  ]);

  useEffect(() => {
    if (location.state) {
      if (location.state.clearFilters) {
        setSelectedCategories([]);
        setSelectedSubcategories([]);
        setSelectedSubSubcategories([]);
        setSelectedPriceRanges([]);
        setCustomPriceRange({ min: null, max: null });
        setSelectedDiscounts([]);
        setSelectedGenders([]);
        setSelectedOccasions([]);
        setSelectedGemstoneTypes([]);
        setItemNameFilter("");
        navigate("/shop", { replace: true, state: {} });
      } else if (location.state.category) {
        if (location.state.category !== "") {
          setSelectedCategories([location.state.category]);
        }
      }
    }
  }, [location.state, navigate]);

  const handleCategoryChange = useCallback((category) => {
    if (!category) return;
    isUpdatingFromUrlRef.current = true;
    setSelectedCategories((prev) => {
      const newCategories = prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [category];
      const currentUrl = window.location.pathname + window.location.search;
      filtersFromUrlRef.current = currentUrl;
      setTimeout(() => {
        syncFiltersToUrl({ categories: newCategories });
        isUpdatingFromUrlRef.current = false;
      }, 0);
      return newCategories;
    });
  }, [syncFiltersToUrl]);

  const handleSubcategoryChange = useCallback((subcategory) => {
    if (!subcategory) return;
    isUpdatingFromUrlRef.current = true;
    setSelectedSubcategories((prev) => {
      const newSubcategories = prev.includes(subcategory)
        ? prev.filter((s) => s !== subcategory)
        : [subcategory];
      const currentUrl = window.location.pathname + window.location.search;
      filtersFromUrlRef.current = currentUrl;
      setTimeout(() => {
        syncFiltersToUrl({ subcategories: newSubcategories });
        isUpdatingFromUrlRef.current = false;
      }, 0);
      return newSubcategories;
    });
  }, [syncFiltersToUrl]);

  const handleSubSubcategoryChange = useCallback((subSubcategory) => {
    if (!subSubcategory) return;
    isUpdatingFromUrlRef.current = true;
    setSelectedSubSubcategories((prev) => {
      const newSubSubcategories = prev.includes(subSubcategory)
        ? prev.filter((s) => s !== subSubcategory)
        : [subSubcategory];
      const currentUrl = window.location.pathname + window.location.search;
      filtersFromUrlRef.current = currentUrl;
      setTimeout(() => {
        syncFiltersToUrl({ subSubcategories: newSubSubcategories });
        isUpdatingFromUrlRef.current = false;
      }, 0);
      return newSubSubcategories;
    });
  }, [syncFiltersToUrl]);

  const handlePriceRangeChange = useCallback((range) => {
    if (!range) return;
    isUpdatingFromUrlRef.current = true;
    setSelectedPriceRanges((prev) => {
      const newRanges = prev.includes(range)
        ? prev.filter((r) => r !== range)
        : [range];
      const currentUrl = window.location.pathname + window.location.search;
      filtersFromUrlRef.current = currentUrl;
      setTimeout(() => {
        syncFiltersToUrl({
          priceRanges: newRanges,
          customPriceRange: { min: null, max: null },
        });
        isUpdatingFromUrlRef.current = false;
      }, 0);
      return newRanges;
    });
  }, [syncFiltersToUrl]);

  const handleGenderChange = useCallback((gender) => {
    if (!gender) return;
    isUpdatingFromUrlRef.current = true;
    setSelectedGenders((prev) => {
      const newGenders = prev.includes(gender)
        ? prev.filter((g) => g !== gender)
        : [gender];
      const currentUrl = window.location.pathname + window.location.search;
      filtersFromUrlRef.current = currentUrl;
      setTimeout(() => {
        syncFiltersToUrl({ genders: newGenders });
        isUpdatingFromUrlRef.current = false;
      }, 0);
      return newGenders;
    });
  }, [syncFiltersToUrl]);

  const handleOccasionChange = useCallback((occasion) => {
    if (!occasion) return;
    isUpdatingFromUrlRef.current = true;
    setSelectedOccasions((prev) => {
      const newOccasions = prev.includes(occasion)
        ? prev.filter((o) => o !== occasion)
        : [occasion];
      const currentUrl = window.location.pathname + window.location.search;
      filtersFromUrlRef.current = currentUrl;
      setTimeout(() => {
        syncFiltersToUrl({ occasions: newOccasions });
        isUpdatingFromUrlRef.current = false;
      }, 0);
      return newOccasions;
    });
  }, [syncFiltersToUrl]);

  const handleGemstoneTypeChange = useCallback((gemstoneType) => {
    if (!gemstoneType) return;
    isUpdatingFromUrlRef.current = true;
    setSelectedGemstoneTypes((prev) => {
      const newGemstoneTypes = prev.includes(gemstoneType)
        ? prev.filter((g) => g !== gemstoneType)
        : [gemstoneType];
      const currentUrl = window.location.pathname + window.location.search;
      filtersFromUrlRef.current = currentUrl;
      setTimeout(() => {
        syncFiltersToUrl({ gemstoneTypes: newGemstoneTypes });
        isUpdatingFromUrlRef.current = false;
      }, 0);
      return newGemstoneTypes;
    });
  }, [syncFiltersToUrl]);

  const handleDiscountChange = useCallback((discount) => {
    if (!discount) return;
    try {
      setSelectedDiscounts((prev) => {
        return prev.includes(discount)
          ? prev.filter((d) => d !== discount)
          : [...prev, discount];
      });
    } catch (error) {
      console.error("Error handling discount change:", error);
    }
  }, []);

  const handleItemNameChange = useCallback((itemName) => {
    isUpdatingFromUrlRef.current = true;
    setItemNameFilter(itemName);
    const currentUrl = window.location.pathname + window.location.search;
    filtersFromUrlRef.current = currentUrl;
    setTimeout(() => {
      syncFiltersToUrl({ itemName });
      isUpdatingFromUrlRef.current = false;
    }, 0);
  }, [syncFiltersToUrl]);

  const handleActiveFilterChange = useCallback((filter) => {
    isUpdatingFromUrlRef.current = true;
    setActiveFilter(filter);
    const currentUrl = window.location.pathname + window.location.search;
    filtersFromUrlRef.current = currentUrl;
    setTimeout(() => {
      syncFiltersToUrl({ activeFilter: filter });
      isUpdatingFromUrlRef.current = false;
    }, 0);
  }, [syncFiltersToUrl]);

  const handleSortChange = useCallback((sort) => {
    isUpdatingFromUrlRef.current = true;
    setSortBy(sort);
    const currentUrl = window.location.pathname + window.location.search;
    filtersFromUrlRef.current = currentUrl;
    setTimeout(() => {
      syncFiltersToUrl({ sortBy: sort });
      isUpdatingFromUrlRef.current = false;
    }, 0);
  }, [syncFiltersToUrl]);

  const clearAllFilters = useCallback(() => {
    const cleanUrl = window.location.pathname;

    isUpdatingFromUrlRef.current = true;
    filtersFromUrlRef.current = cleanUrl;
    isInitialMountRef.current = false;

    setActiveFilter("");
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectedSubSubcategories([]);
    setSelectedPriceRanges([]);
    setCustomPriceRange({ min: null, max: null });
    setSelectedDiscounts([]);
    setSelectedGenders([]);
    setSelectedOccasions([]);
    setSelectedGemstoneTypes([]);
    setItemNameFilter("");
    setSortBy("featured");

    setSearchParams(new URLSearchParams(), { replace: true });
    setClearFiltersTrigger(prev => prev + 1);

    setTimeout(() => {
      isUpdatingFromUrlRef.current = false;
    }, 150);
  }, [setSearchParams]);

  const getFilteredSubcategories = useMemo(() => {
    if (selectedCategories.length === 0) {
      return subcategories;
    }
    return subcategories.filter((subcategory) => {
      const category = categories.find((cat) => cat.id === subcategory.category_id);
      return (
        category &&
        selectedCategories.some(
          (selectedCat) => selectedCat.toLowerCase() === category.name.toLowerCase()
        )
      );
    });
  }, [selectedCategories, subcategories, categories]);

  const getFilteredSubSubcategories = useMemo(() => {
    if (selectedSubcategories.length === 0) {
      return subSubcategories;
    }
    let filtered = subSubcategories.filter((subSubcategory) => {
      const subcategory = subcategories.find(
        (subcat) => subcat.id === subSubcategory.subcategory_id
      );
      return (
        subcategory &&
        selectedSubcategories.some(
          (selectedSubcat) => selectedSubcat.toLowerCase() === subcategory.name.toLowerCase()
        )
      );
    });

    // Remove duplicates
    const uniqueNames = new Set();
    return filtered.filter((subSubcategory) => {
      let nameLower = subSubcategory.name.toLowerCase();
      if (uniqueNames.has(nameLower)) {
        return false;
      }
      uniqueNames.add(nameLower);
      return true;
    });
  }, [selectedSubcategories, subSubcategories, subcategories]);

  return {
    selectedCategories,
    selectedSubcategories,
    selectedSubSubcategories,
    selectedPriceRanges,
    customPriceRange,
    selectedDiscounts,
    selectedGenders,
    selectedOccasions,
    selectedGemstoneTypes,
    itemNameFilter,
    activeFilter,
    sortBy,
    handleCategoryChange,
    handleSubcategoryChange,
    handleSubSubcategoryChange,
    handlePriceRangeChange,
    handleGenderChange,
    handleOccasionChange,
    handleGemstoneTypeChange,
    handleDiscountChange,
    handleItemNameChange,
    handleActiveFilterChange,
    handleSortChange,
    clearAllFilters,
    getFilteredSubcategories,
    getFilteredSubSubcategories,
    clearFiltersTrigger,
    isUpdatingFromUrlRef,
  };
};

