export const filterProducts = (
  products,
  filters,
  categories,
  subcategories,
  subSubcategories,
  priceRanges,
  discounts,
  gemstoneCatalog
) => {
  return products.filter((product) => {
    let categoryMatch =
      filters.selectedCategories.length === 0 ||
      filters.selectedCategories.some((cat) => {
        if (product.category_id) {
          const foundCategory = categories.find(
            (c) => c.name === cat || c.slug === cat
          );
          if (foundCategory && foundCategory.id === product.category_id) {
            return true;
          }
        }
        return product.categories?.some((productCat) => {
          if (typeof productCat === "string") {
            return productCat.toLowerCase() === cat.toLowerCase();
          } else if (productCat && typeof productCat === "object") {
            return (
              productCat.name.toLowerCase() === cat.toLowerCase() ||
              productCat.id === cat ||
              productCat.slug === cat
            );
          }
          return false;
        });
      });

    let subcategoryMatch =
      filters.selectedSubcategories.length === 0 ||
      filters.selectedSubcategories.some((subcat) => {
        if (product.subcategory_id) {
          const foundSubcat = subcategories.find(
            (s) => s.name === subcat || s.slug === subcat
          );
          if (foundSubcat && foundSubcat.id === product.subcategory_id) {
            return true;
          }
        }
        return product.subcategories?.some((productSubcat) => {
          if (typeof productSubcat === "string") {
            return productSubcat.toLowerCase() === subcat.toLowerCase();
          } else if (productSubcat && typeof productSubcat === "object") {
            return (
              productSubcat.name.toLowerCase() === subcat.toLowerCase() ||
              productSubcat.id === subcat ||
              productSubcat.slug === subcat
            );
          }
          return false;
        });
      });

    let subSubcategoryMatch =
      filters.selectedSubSubcategories.length === 0 ||
      (product.sub_subcategory_id &&
        filters.selectedSubSubcategories.some((subSubcat) => {
          const foundSubSubcat = subSubcategories.find(
            (s) => s.name === subSubcat || s.slug === subSubcat
          );
          return (
            foundSubSubcat && foundSubSubcat.id === product.sub_subcategory_id
          );
        }));

    let priceMatch = (() => {
      if (filters.customPriceRange.min !== null || filters.customPriceRange.max !== null) {
        let sellPrice = product.product_options?.[0]?.sell_price;
        if (!sellPrice) return false;
        const productPrice = parseFloat(sellPrice);
        const min = filters.customPriceRange.min !== null ? filters.customPriceRange.min : 0;
        const max =
          filters.customPriceRange.max !== null ? filters.customPriceRange.max : Infinity;
        return productPrice >= min && productPrice <= max;
      }

      if (filters.selectedPriceRanges.length === 0) return true;

      return filters.selectedPriceRanges.some((rangeLabel) => {
        const priceRange = priceRanges.find((range) => range.label === rangeLabel);
        if (!priceRange) return false;

        let sellPrice = product.product_options?.[0]?.sell_price;
        if (!sellPrice) return false;

        const productPrice = parseFloat(sellPrice);
        return productPrice >= priceRange.min && productPrice <= priceRange.max;
      });
    })();

    let discountMatch =
      filters.selectedDiscounts.length === 0 ||
      filters.selectedDiscounts.some((discountLabel) => {
        if (discounts.length > 0) {
          let discount = discounts.find(
            (d) => (d.name || d.title || `Discount ${d.id}`) === discountLabel
          );
          if (discount) {
            const productDiscount =
              product.discount || product.product_options?.[0]?.discount;
            return productDiscount && productDiscount > 0;
          }
        }
        return false;
      });

    let genderMatch =
      filters.selectedGenders.length === 0 ||
      filters.selectedGenders.some((selectedGender) => {
        if (product.product_options && Array.isArray(product.product_options)) {
          return product.product_options.some((option) => {
            if (option.gender) {
              const genders = option.gender
                .split(",")
                .map((g) => g.trim().toLowerCase());
              return genders.includes(selectedGender.toLowerCase());
            }
            return false;
          });
        }
        return false;
      });

    let occasionMatch =
      filters.selectedOccasions.length === 0 ||
      filters.selectedOccasions.some((selectedOccasion) => {
        if (product.product_options && Array.isArray(product.product_options)) {
          return product.product_options.some((option) => {
            if (option.occasion) {
              const occasions = option.occasion
                .split(",")
                .map((o) => o.trim().toLowerCase());
              return occasions.includes(selectedOccasion.toLowerCase());
            }
            return false;
          });
        }
        return false;
      });

    let gemstoneMatch =
      filters.selectedGemstoneTypes.length === 0 ||
      filters.selectedGemstoneTypes.some((gemstoneType) => {
        if (product.gemstone_type) {
          return (
            product.gemstone_type.toLowerCase() === gemstoneType.toLowerCase()
          );
        }
        const gemstonesOfType = gemstoneCatalog.filter((g) => g.type === gemstoneType);
        if (gemstonesOfType.length > 0) {
          const productName = (product.item_name || product.name || "").toLowerCase();
          const productDesc = (product.description || "").toLowerCase();
          return gemstonesOfType.some(
            (gem) =>
              productName.includes(gem.name.toLowerCase()) ||
              productDesc.includes(gem.name.toLowerCase())
          );
        }
        return false;
      });

    let itemNameMatch =
      !filters.itemNameFilter ||
      (product.item_name &&
        product.item_name.toLowerCase().includes(filters.itemNameFilter.toLowerCase()));

    return (
      categoryMatch &&
      subcategoryMatch &&
      subSubcategoryMatch &&
      priceMatch &&
      discountMatch &&
      genderMatch &&
      occasionMatch &&
      gemstoneMatch &&
      itemNameMatch
    );
  });
};

export const sortProducts = (products, sortBy) => {
  let sorted = [...products];

  switch (sortBy) {
    case "priceLow":
      sorted.sort((a, b) => {
        let priceA = a.product_options?.[0]?.sell_price
          ? parseFloat(a.product_options[0].sell_price)
          : parseFloat(a.price || 0);
        let priceB = b.product_options?.[0]?.sell_price
          ? parseFloat(b.product_options[0].sell_price)
          : parseFloat(b.price || 0);
        return priceA - priceB;
      });
      break;
    case "priceHigh":
      sorted.sort((a, b) => {
        let priceA = a.product_options?.[0]?.sell_price
          ? parseFloat(a.product_options[0].sell_price)
          : parseFloat(a.price || 0);
        let priceB = b.product_options?.[0]?.sell_price
          ? parseFloat(b.product_options[0].sell_price)
          : parseFloat(b.price || 0);
        return priceB - priceA;
      });
      break;
    case "nameAZ":
      sorted.sort((a, b) => (a.item_name || a.name || "").localeCompare(b.item_name || b.name || ""));
      break;
    case "nameZA":
      sorted.sort((a, b) => (b.item_name || b.name || "").localeCompare(a.item_name || a.name || ""));
      break;
    default:
      break;
  }

  return sorted;
};

export const generatePriceRanges = (products) => {
  if (products.length === 0) {
    return [
      { label: "₹0 - 10,000", min: 0, max: 10000 },
      { label: "₹10,000 - 20,000", min: 10000, max: 20000 },
      { label: "₹20,000 - 30,000", min: 20000, max: 30000 },
      { label: "₹30,000 - 40,000", min: 30000, max: 40000 },
      { label: "₹40,000 - 50,000", min: 40000, max: 50000 },
      { label: "₹50,000+", min: 50000, max: Infinity },
    ];
  }

  const prices = products
    .map((product) => {
      return product.product_options?.[0]?.sell_price
        ? parseFloat(product.product_options[0].sell_price)
        : parseFloat(product.price || 0);
    })
    .filter((price) => price > 0);

  if (prices.length === 0) {
    return [
      { label: "₹0 - 10,000", min: 0, max: 10000 },
      { label: "₹10,000 - 20,000", min: 10000, max: 20000 },
      { label: "₹20,000 - 30,000", min: 20000, max: 30000 },
      { label: "₹30,000 - 40,000", min: 30000, max: 40000 },
      { label: "₹40,000 - 50,000", min: 40000, max: 50000 },
      { label: "₹50,000+", min: 50000, max: Infinity },
    ];
  }

  let minPrice = Math.floor(Math.min(...prices) / 10000) * 10000;
  const maxPrice = Math.ceil(Math.max(...prices) / 10000) * 10000;

  const ranges = [];
  let gap = 10000;

  for (let i = minPrice; i < maxPrice; i += gap) {
    const rangeMin = i;
    const rangeMax = i + gap;

    let label;
    if (rangeMin === 0) {
      label = `₹0 - ${rangeMax.toLocaleString()}`;
    } else {
      label = `₹${rangeMin.toLocaleString()} - ${rangeMax.toLocaleString()}`;
    }

    ranges.push({
      label,
      min: rangeMin,
      max: rangeMax,
    });
  }

  if (ranges.length > 0) {
    const lastRange = ranges[ranges.length - 1];
    if (lastRange.max < maxPrice) {
      ranges.push({
        label: `₹${maxPrice.toLocaleString()}+`,
        min: maxPrice,
        max: Infinity,
      });
    }
  }

  return ranges;
};

