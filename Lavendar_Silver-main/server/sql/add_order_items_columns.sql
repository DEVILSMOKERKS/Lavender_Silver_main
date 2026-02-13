UPDATE `order_items` oi
INNER JOIN `products` p ON oi.product_id = p.id
LEFT JOIN (
    SELECT
        product_id,
        item,
        weight,
        sale_value
    FROM
        product_less_weight
    WHERE
        id IN (
            SELECT
                MIN(id)
            FROM
                product_less_weight
            GROUP BY
                product_id
        )
) plw ON p.id = plw.product_id
LEFT JOIN `metal_types` mt ON p.metal_id = mt.id
SET
    oi.item_name = COALESCE(NULLIF(oi.item_name, ''), p.item_name),
    oi.rate = COALESCE(NULLIF(oi.rate, 0), p.rate),
    oi.labour = COALESCE(NULLIF(oi.labour, 0), p.labour),
    oi.labour_on = COALESCE(NULLIF(oi.labour_on, ''), p.labour_on, 'Wt'),
    oi.less_weight_item_name = COALESCE(NULLIF(oi.less_weight_item_name, ''), plw.item),
    oi.less_weight_weight = COALESCE(NULLIF(oi.less_weight_weight, 0), plw.weight),
    oi.less_weight_sale_value = COALESCE(
        NULLIF(oi.less_weight_sale_value, 0),
        plw.sale_value
    ),
    oi.discount = COALESCE(NULLIF(oi.discount, 0), p.discount),
    oi.tunch = COALESCE(NULLIF(oi.tunch, 0), p.tunch, 100.00),
    oi.additional_weight = COALESCE(
        NULLIF(oi.additional_weight, 0),
        p.additional_weight
    ),
    oi.wastage_percentage = COALESCE(
        NULLIF(oi.wastage_percentage, 0),
        p.wastage_percentage
    ),
    oi.diamond_weight = COALESCE(NULLIF(oi.diamond_weight, 0), p.diamond_weight),
    oi.stone_weight = COALESCE(NULLIF(oi.stone_weight, 0), p.stone_weight),
    oi.other = COALESCE(NULLIF(oi.other, 0), p.other),
    oi.metal_type = COALESCE(NULLIF(oi.metal_type, ''), mt.name)
WHERE
    oi.product_id IS NOT NULL
    AND p.id IS NOT NULL;

-- Step 9: Remove diamond_quality column (if exists)
-- Note: If column doesn't exist, comment out this line
ALTER TABLE `order_items`
DROP COLUMN `diamond_quality`;

-- Step 10: Remove sell_price, final_price, total_rs columns (if they exist)
-- Note: Uncomment these lines only if these columns exist and you want to remove them
-- ALTER TABLE `order_items` DROP COLUMN `sell_price`;
-- ALTER TABLE `order_items` DROP COLUMN `final_price`;
-- ALTER TABLE `order_items` DROP COLUMN `total_rs`;