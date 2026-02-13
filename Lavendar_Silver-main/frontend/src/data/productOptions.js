// Product options data for jewelry management
export const jewelryOptions = {
    sizes: ['4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13', '13.5', '14', '14.5', '15', '15.5', '16', '16.5', '17', '17.5', '18', '18.5', '19', '19.5', '20', '20.5', '21', '21.5', '22', '22.5', '23', '23.5', '24', '24.5', '25', '25.5', '26', '26.5', '27', '27.5', '28', '28.5', '29', '29.5', '30'],
    weights: ['0.5g', '1g', '1.5g', '2g', '2.5g', '3g', '3.5g', '4g', '4.5g', '5g', '5.5g', '6g', '6.5g', '7g', '7.5g', '8g', '8.5g', '9g', '9.5g', '10g', '10.5g', '11g', '11.5g', '12g', '12.5g', '13g', '13.5g', '14g', '14.5g', '15g', '15.5g', '16g', '16.5g', '17g', '17.5g', '18g', '18.5g', '19g', '19.5g', '20g', '20.5g', '21g', '21.5g', '22g', '22.5g', '23g', '23.5g', '24g', '24.5g', '25g', '25.5g', '26g', '26.5g', '27g', '27.5g', '28g', '28.5g', '29g', '29.5g', '30g'],
    qualities: ['SI1', 'SI2', 'VS1', 'VS2', 'VVS1', 'VVS2', 'IF', 'FL', 'I1', 'I2', 'I3'],
    colors: ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    clarities: ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3', 'Eye Clean', 'Slightly Included', 'Moderately Included', 'Heavily Included'],
    cuts: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
    metalTypes: ['Gold', 'Platinum', 'Silver', 'Palladium', 'Rose Gold', 'White Gold', 'Yellow Gold'],
    metalPurities: ['18K', '22K', '24K', '14K', '10K', '950', '900', '850', '800', '750', '585', '375'],
    dimensions: ['10mm x 8mm', '12mm x 10mm', '14mm x 12mm', '16mm x 14mm', '18mm x 16mm', '20mm x 18mm', '22mm x 20mm', '24mm x 22mm', '26mm x 24mm', '28mm x 26mm', '30mm x 28mm']
};

// New comprehensive options
export const productTypeOptions = [
    { value: 'ring', label: 'Ring' },
    { value: 'necklace', label: 'Necklace' },
    { value: 'earrings', label: 'Earrings' },
    { value: 'pendant', label: 'Pendant' },
    { value: 'bracelet', label: 'Bracelet' },
    { value: 'anklet', label: 'Anklet' },
    { value: 'chain', label: 'Chain' },
    { value: 'bangles', label: 'Bangles' },
    { value: 'mangalsutra', label: 'Mangalsutra' },
    { value: 'nosepin', label: 'Nose Pin' },
    { value: 'toe_ring', label: 'Toe Ring' },
    { value: 'waist_chain', label: 'Waist Chain' }
];

export const metalColorOptions = [
    { value: 'yellow', label: 'Yellow' },
    { value: 'white', label: 'White' },
    { value: 'rose', label: 'Rose' },
    { value: 'green', label: 'Green' },
    { value: 'black', label: 'Black' },
    { value: 'mixed', label: 'Mixed' }
];

export const stoneTypeOptions = [
    { value: 'diamond', label: 'Diamond' },
    { value: 'emerald', label: 'Emerald' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'sapphire', label: 'Sapphire' },
    { value: 'pearl', label: 'Pearl' },
    { value: 'cz', label: 'CZ (Cubic Zirconia)' },
    { value: 'opal', label: 'Opal' },
    { value: 'garnet', label: 'Garnet' },
    { value: 'topaz', label: 'Topaz' },
    { value: 'amethyst', label: 'Amethyst' },
    { value: 'citrine', label: 'Citrine' },
    { value: 'peridot', label: 'Peridot' },
    { value: 'aquamarine', label: 'Aquamarine' },
    { value: 'tanzanite', label: 'Tanzanite' },
    { value: 'tourmaline', label: 'Tourmaline' },
    { value: 'zircon', label: 'Zircon' },
    { value: 'spinel', label: 'Spinel' },
    { value: 'alexandrite', label: 'Alexandrite' },
    { value: 'moonstone', label: 'Moonstone' },
    { value: 'lapis_lazuli', label: 'Lapis Lazuli' },
    { value: 'turquoise', label: 'Turquoise' },
    { value: 'jade', label: 'Jade' },
    { value: 'onyx', label: 'Onyx' },
    { value: 'agate', label: 'Agate' },
    { value: 'coral', label: 'Coral' },
    { value: 'amber', label: 'Amber' }
];

export const stoneShapeOptions = [
    { value: 'round', label: 'Round' },
    { value: 'oval', label: 'Oval' },
    { value: 'princess', label: 'Princess' },
    { value: 'marquise', label: 'Marquise' },
    { value: 'pear', label: 'Pear' },
    { value: 'emerald_cut', label: 'Emerald Cut' },
    { value: 'asscher', label: 'Asscher' },
    { value: 'radiant', label: 'Radiant' },
    { value: 'cushion', label: 'Cushion' },
    { value: 'heart', label: 'Heart' },
    { value: 'trillion', label: 'Trillion' },
    { value: 'baguette', label: 'Baguette' },
    { value: 'square', label: 'Square' },
    { value: 'rectangle', label: 'Rectangle' },
    { value: 'triangle', label: 'Triangle' },
    { value: 'hexagon', label: 'Hexagon' },
    { value: 'octagon', label: 'Octagon' },
    { value: 'pentagon', label: 'Pentagon' },
    { value: 'star', label: 'Star' },
    { value: 'cross', label: 'Cross' },
    { value: 'flower', label: 'Flower' },
    { value: 'butterfly', label: 'Butterfly' },
    { value: 'leaf', label: 'Leaf' },
    { value: 'animal', label: 'Animal' }
];

export const stoneColorGradeOptions = [
    { value: 'D', label: 'D - Colorless' },
    { value: 'E', label: 'E - Colorless' },
    { value: 'F', label: 'F - Colorless' },
    { value: 'G', label: 'G - Near Colorless' },
    { value: 'H', label: 'H - Near Colorless' },
    { value: 'I', label: 'I - Near Colorless' },
    { value: 'J', label: 'J - Near Colorless' },
    { value: 'K', label: 'K - Faint Yellow' },
    { value: 'L', label: 'L - Faint Yellow' },
    { value: 'M', label: 'M - Very Light Yellow' },
    { value: 'N', label: 'N - Very Light Yellow' },
    { value: 'O', label: 'O - Light Yellow' },
    { value: 'P', label: 'P - Light Yellow' },
    { value: 'Q', label: 'Q - Light Yellow' },
    { value: 'R', label: 'R - Light Yellow' },
    { value: 'S', label: 'S - Light Yellow' },
    { value: 'T', label: 'T - Light Yellow' },
    { value: 'U', label: 'U - Light Yellow' },
    { value: 'V', label: 'V - Light Yellow' },
    { value: 'W', label: 'W - Light Yellow' },
    { value: 'X', label: 'X - Light Yellow' },
    { value: 'Y', label: 'Y - Light Yellow' },
    { value: 'Z', label: 'Z - Light Yellow' },
    { value: 'fancy_yellow', label: 'Fancy Yellow' },
    { value: 'fancy_pink', label: 'Fancy Pink' },
    { value: 'fancy_blue', label: 'Fancy Blue' },
    { value: 'fancy_green', label: 'Fancy Green' },
    { value: 'fancy_purple', label: 'Fancy Purple' },
    { value: 'fancy_orange', label: 'Fancy Orange' },
    { value: 'fancy_brown', label: 'Fancy Brown' },
    { value: 'fancy_gray', label: 'Fancy Gray' },
    { value: 'fancy_black', label: 'Fancy Black' }
];

export const stoneClarityGradeOptions = [
    { value: 'FL', label: 'FL - Flawless' },
    { value: 'IF', label: 'IF - Internally Flawless' },
    { value: 'VVS1', label: 'VVS1 - Very Very Slightly Included 1' },
    { value: 'VVS2', label: 'VVS2 - Very Very Slightly Included 2' },
    { value: 'VS1', label: 'VS1 - Very Slightly Included 1' },
    { value: 'VS2', label: 'VS2 - Very Slightly Included 2' },
    { value: 'SI1', label: 'SI1 - Slightly Included 1' },
    { value: 'SI2', label: 'SI2 - Slightly Included 2' },
    { value: 'I1', label: 'I1 - Included 1' },
    { value: 'I2', label: 'I2 - Included 2' },
    { value: 'I3', label: 'I3 - Included 3' },
    { value: 'eye_clean', label: 'Eye Clean' },
    { value: 'slightly_included', label: 'Slightly Included' },
    { value: 'moderately_included', label: 'Moderately Included' },
    { value: 'heavily_included', label: 'Heavily Included' }
];

export const settingTypeOptions = [
    { value: 'prong', label: 'Prong Setting' },
    { value: 'bezel', label: 'Bezel Setting' },
    { value: 'channel', label: 'Channel Setting' },
    { value: 'pave', label: 'Pave Setting' },
    { value: 'flush', label: 'Flush Setting' },
    { value: 'tension', label: 'Tension Setting' },
    { value: 'invisible', label: 'Invisible Setting' },
    { value: 'bar', label: 'Bar Setting' },
    { value: 'cluster', label: 'Cluster Setting' },
    { value: 'halo', label: 'Halo Setting' },
    { value: 'three_stone', label: 'Three Stone Setting' },
    { value: 'eternity', label: 'Eternity Setting' },
    { value: 'gypsy', label: 'Gypsy Setting' },
    { value: 'rub_over', label: 'Rub Over Setting' },
    { value: 'illusion', label: 'Illusion Setting' }
];

export const certificationOptions = [
    { value: 'IGI', label: 'IGI (International Gemological Institute)' },
    { value: 'GIA', label: 'GIA (Gemological Institute of America)' },
    { value: 'SGL', label: 'SGL (Solitaire Gem Labs)' },
    { value: 'GII', label: 'GII (Gemological Institute of India)' },
    { value: 'IGI_India', label: 'IGI India' },
    { value: 'HRD', label: 'HRD (Hoge Raad voor Diamant)' },
    { value: 'AGS', label: 'AGS (American Gem Society)' },
    { value: 'EGL', label: 'EGL (European Gemological Laboratory)' },
    { value: 'DCLA', label: 'DCLA (Diamond Certification Laboratory of Australia)' },
    { value: 'none', label: 'No Certification' }
];

export const designTypeOptions = [
    { value: 'traditional', label: 'Traditional' },
    { value: 'contemporary', label: 'Contemporary' },
    { value: 'antique', label: 'Antique' },
    { value: 'vintage', label: 'Vintage' },
    { value: 'modern', label: 'Modern' },
    { value: 'classic', label: 'Classic' },
    { value: 'art_deco', label: 'Art Deco' },
    { value: 'victorian', label: 'Victorian' },
    { value: 'edwardian', label: 'Edwardian' },
    { value: 'georgian', label: 'Georgian' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'bohemian', label: 'Bohemian' },
    { value: 'ethnic', label: 'Ethnic' },
    { value: 'western', label: 'Western' },
    { value: 'fusion', label: 'Fusion' }
];

export const manufacturingTypeOptions = [
    { value: 'handmade', label: 'Handmade' },
    { value: 'cad', label: 'CAD (Computer Aided Design)' },
    { value: 'casting', label: 'Casting' },
    { value: 'forging', label: 'Forging' },
    { value: 'stamping', label: 'Stamping' },
    { value: 'laser_cutting', label: 'Laser Cutting' },
    { value: '3d_printing', label: '3D Printing' },
    { value: 'machine_made', label: 'Machine Made' },
    { value: 'semi_handmade', label: 'Semi Handmade' }
];

export const occasionOptions = [
    { value: 'wedding', label: 'Wedding' },
    { value: 'engagement', label: 'Engagement' },
    { value: 'anniversary', label: 'Anniversary' },
    { value: 'birthday', label: 'Birthday' },
    { value: 'valentine', label: 'Valentine\'s Day' },
    { value: 'mothers_day', label: 'Mother\'s Day' },
    { value: 'fathers_day', label: 'Father\'s Day' },
    { value: 'christmas', label: 'Christmas' },
    { value: 'diwali', label: 'Diwali' },
    { value: 'rakhi', label: 'Rakhi' },
    { value: 'karva_chauth', label: 'Karva Chauth' },
    { value: 'office_wear', label: 'Office Wear' },
    { value: 'party_wear', label: 'Party Wear' },
    { value: 'casual_wear', label: 'Casual Wear' },
    { value: 'formal_wear', label: 'Formal Wear' },
    { value: 'daily_wear', label: 'Daily Wear' },
    { value: 'festival', label: 'Festival' },
    { value: 'ceremony', label: 'Ceremony' },
    { value: 'graduation', label: 'Graduation' },
    { value: 'promotion', label: 'Promotion' },
    { value: 'achievement', label: 'Achievement' },
    { value: 'self_gift', label: 'Self Gift' },
    { value: 'other', label: 'Other' }
];

export const genderOptions = [
    { value: 'men', label: 'Men' },
    { value: 'women', label: 'Women' },
    { value: 'unisex', label: 'Unisex' },
    { value: 'kids', label: 'Kids' },
    { value: 'teen', label: 'Teen' }
];

export const idealForOptions = [
    { value: 'gifting', label: 'Gifting' },
    { value: 'personal', label: 'Personal' },
    { value: 'couple', label: 'Couple' },
    { value: 'family', label: 'Family' },
    { value: 'investment', label: 'Investment' },
    { value: 'collection', label: 'Collection' },
    { value: 'heirloom', label: 'Heirloom' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'traditional', label: 'Traditional' },
    { value: 'modern', label: 'Modern' },
    { value: 'luxury', label: 'Luxury' },
    { value: 'budget', label: 'Budget' }
];

export const gstTaxRateOptions = [
    { value: '0', label: '0%' },
    { value: '3', label: '3%' },
    { value: '5', label: '5%' },
    { value: '12', label: '12%' },
    { value: '18', label: '18%' },
    { value: '28', label: '28%' }
];

// Less weight popup datalist options
export const lessWeightOptions = {
    items: ['Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Pearl', 'Opal', 'Garnet', 'Topaz', 'Amethyst', 'Citrine', 'Peridot', 'Aquamarine', 'Tanzanite', 'Tourmaline', 'Zircon', 'Spinel', 'Alexandrite', 'Moonstone', 'Lapis Lazuli', 'Turquoise', 'Jade', 'Onyx', 'Agate', 'Coral', 'Amber'],
    stamps: ['925', '900', '850', '800', '750', '585', '375', '333', '250', '100', '916', '875', '833', '792', '750', '708', '667', '625', '583', '542', '500', '458', '417', '375', '333'],
    clarities: ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3', 'Eye Clean', 'Slightly Included', 'Moderately Included', 'Heavily Included'],
    colors: ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Colorless', 'Near Colorless', 'Faint Yellow', 'Very Light Yellow', 'Light Yellow', 'Fancy Yellow', 'Fancy Pink', 'Fancy Blue', 'Fancy Green', 'Fancy Purple', 'Fancy Orange', 'Fancy Brown', 'Fancy Gray', 'Fancy Black'],
    cuts: ['Round Brilliant', 'Princess', 'Oval', 'Marquise', 'Pear', 'Emerald', 'Asscher', 'Radiant', 'Cushion', 'Heart', 'Trillion', 'Baguette', 'Step Cut', 'Mixed Cut', 'Rose Cut', 'Old Mine Cut', 'Old European Cut', 'Single Cut', 'Eight Cut', 'Swiss Cut'],
    shapes: ['Round', 'Princess', 'Oval', 'Marquise', 'Pear', 'Emerald', 'Asscher', 'Radiant', 'Cushion', 'Heart', 'Trillion', 'Baguette', 'Square', 'Rectangle', 'Triangle', 'Hexagon', 'Octagon', 'Pentagon', 'Diamond', 'Star', 'Cross', 'Flower', 'Butterfly', 'Leaf', 'Animal']
};

// Comprehensive datalist options for less weight popup
export const lessWeightDatalistOptions = {
    // Stamp options for less weight items
    stamps: [
        'Diamond', 'Stone', 'CZ', 'Cubic Zirconia', 'Ruby', 'Sapphire', 'Emerald', 'Pearl', 'Opal', 'Garnet',
        'Amethyst', 'Topaz', 'Aquamarine', 'Citrine', 'Peridot', 'Tanzanite', 'Tourmaline', 'Zircon', 'Spinel',
        'Alexandrite', 'Moonstone', 'Labradorite', 'Onyx', 'Jade', 'Coral', 'Turquoise', 'Lapis', 'Malachite',
        'Agate', 'Jasper', 'Carnelian', 'Tiger Eye', 'Obsidian', 'Hematite', 'Pyrite', 'Quartz', 'Crystal',
        'Semi Precious', 'Precious Stone', 'Birthstone'
    ],

    // Clarity options for diamonds and stones
    clarities: [
        // Diamond Clarity Grades
        'FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3',
        // Stone Clarity Grades
        'Eye Clean', 'Slightly Included', 'Moderately Included', 'Heavily Included'
    ],

    // Color options for diamonds and stones
    colors: [
        // Diamond Color Grades
        'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        // Stone Color Descriptions
        'Colorless', 'Near Colorless', 'Faint Yellow', 'Very Light Yellow', 'Light Yellow', 'Fancy Yellow',
        'Fancy Pink', 'Fancy Blue', 'Fancy Green', 'Fancy Purple', 'Fancy Orange', 'Fancy Brown', 'Fancy Gray', 'Fancy Black'
    ],

    // Cut options for diamonds
    cuts: [
        'Round Brilliant', 'Princess', 'Oval', 'Marquise', 'Pear', 'Emerald', 'Asscher', 'Radiant', 'Cushion',
        'Heart', 'Trillion', 'Baguette', 'Step Cut', 'Mixed Cut', 'Rose Cut', 'Old Mine Cut', 'Old European Cut',
        'Single Cut', 'Eight Cut', 'Swiss Cut'
    ],

    // Shape options for stones
    shapes: [
        'Round', 'Princess', 'Oval', 'Marquise', 'Pear', 'Emerald', 'Asscher', 'Radiant', 'Cushion', 'Heart',
        'Trillion', 'Baguette', 'Square', 'Rectangle', 'Triangle', 'Hexagon', 'Octagon', 'Pentagon', 'Diamond',
        'Star', 'Cross', 'Flower', 'Butterfly', 'Leaf', 'Animal'
    ]
};



// Comprehensive datalist options for product options
export const productOptionsDatalistOptions = {
    // Size options for product options
    sizes: ['4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13', '13.5', '14', '14.5', '15', '15.5', '16', '16.5', '17', '17.5', '18', '18.5', '19', '19.5', '20', '20.5', '21', '21.5', '22', '22.5', '23', '23.5', '24', '24.5', '25', '25.5', '26', '26.5', '27', '27.5', '28', '28.5', '29', '29.5', '30'],

    // Weight options for product options
    weights: ['0.5g', '1g', '1.5g', '2g', '2.5g', '3g', '3.5g', '4g', '4.5g', '5g', '5.5g', '6g', '6.5g', '7g', '7.5g', '8g', '8.5g', '9g', '9.5g', '10g', '10.5g', '11g', '11.5g', '12g', '12.5g', '13g', '13.5g', '14g', '14.5g', '15g', '15.5g', '16g', '16.5g', '17g', '17.5g', '18g', '18.5g', '19g', '19.5g', '20g', '20.5g', '21g', '21.5g', '22g', '22.5g', '23g', '23.5g', '24g', '24.5g', '25g', '25.5g', '26g', '26.5g', '27g', '27.5g', '28g', '28.5g', '29g', '29.5g', '30g'],

    // Value options for product options
    values: ['100', '200', '300', '400', '500', '600', '700', '800', '900', '1000', '1100', '1200', '1300', '1400', '1500', '1600', '1700', '1800', '1900', '2000', '2100', '2200', '2300', '2400', '2500', '2600', '2700', '2800', '2900', '3000', '3100', '3200', '3300', '3400', '3500', '3600', '3700', '3800', '3900', '4000', '4100', '4200', '4300', '4400', '4500', '4600', '4700', '4800', '4900', '5000', '5100', '5200', '5300', '5400', '5500', '5600', '5700', '5800', '5900', '6000', '6100', '6200', '6300', '6400', '6500', '6600', '6700', '6800', '6900', '7000', '7100', '7200', '7300', '7400', '7500', '7600', '7700', '7800', '7900', '8000', '8100', '8200', '8300', '8400', '8500', '8600', '8700', '8800', '8900', '9000', '9100', '9200', '9300', '9400', '9500', '9600', '9700', '9800', '9900', '10000'],

    // Sell price options for product options
    sellPrices: ['100', '200', '300', '400', '500', '600', '700', '800', '900', '1000', '1100', '1200', '1300', '1400', '1500', '1600', '1700', '1800', '1900', '2000', '2100', '2200', '2300', '2400', '2500', '2600', '2700', '2800', '2900', '3000', '3100', '3200', '3300', '3400', '3500', '3600', '3700', '3800', '3900', '4000', '4100', '4200', '4300', '4400', '4500', '4600', '4700', '4800', '4900', '5000', '5100', '5200', '5300', '5400', '5500', '5600', '5700', '5800', '5900', '6000', '6100', '6200', '6300', '6400', '6500', '6600', '6700', '6800', '6900', '7000', '7100', '7200', '7300', '7400', '7500', '7600', '7700', '7800', '7900', '8000', '8100', '8200', '8300', '8400', '8500', '8600', '8700', '8800', '8900', '9000', '9100', '9200', '9300', '9400', '9500', '9600', '9700', '9800', '9900', '10000']
};

// Product sections options
export const productSections = [
    { value: 'latest_luxury', label: 'Latest Luxury' },
    { value: 'similar_products', label: 'Similar Products' },
    { value: 'you_may_also_like', label: 'You May Also Like' },
    { value: 'signature_pieces', label: 'Signature Pieces' }
];

// Gemstone types
export const gemstoneTypes = [
    { value: 'diamond', label: 'Diamond' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'emerald', label: 'Emerald' },
    { value: 'sapphire', label: 'Sapphire' },
    { value: 'pearl', label: 'Pearl' },
    { value: 'other', label: 'Other' }
];

// Status options
export const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
];

// Units options
export const unitsOptions = [
    { value: 'carat', label: 'Carat' },
    { value: 'gram', label: 'Gram' },
    { value: 'cent', label: 'Cent' },
    { value: 'pc', label: 'PC' },
    { value: 'kg', label: 'KG' },
    { value: 'ratti', label: 'Ratti' }
];

// Additional comprehensive options for jewelry
export const jewelryAdditionalOptions = {
    // Ring sizes with international standards
    ringSizes: {
        us: ['3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13', '13.5', '14', '14.5', '15', '15.5', '16', '16.5', '17', '17.5', '18', '18.5', '19', '19.5', '20', '20.5', '21', '21.5', '22', '22.5', '23', '23.5', '24', '24.5', '25', '25.5', '26', '26.5', '27', '27.5', '28', '28.5', '29', '29.5', '30'],
        uk: ['F', 'F.5', 'G', 'G.5', 'H', 'H.5', 'I', 'I.5', 'J', 'J.5', 'K', 'K.5', 'L', 'L.5', 'M', 'M.5', 'N', 'N.5', 'O', 'O.5', 'P', 'P.5', 'Q', 'Q.5', 'R', 'R.5', 'S', 'S.5', 'T', 'T.5', 'U', 'U.5', 'V', 'V.5', 'W', 'W.5', 'X', 'X.5', 'Y', 'Y.5', 'Z', 'Z.5', 'Z1', 'Z1.5', 'Z2', 'Z2.5', 'Z3', 'Z3.5', 'Z4', 'Z4.5', 'Z5', 'Z5.5', 'Z6', 'Z6.5', 'Z7', 'Z7.5', 'Z8', 'Z8.5', 'Z9', 'Z9.5', 'Z10'],
        eu: ['44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '100', '101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '112', '113', '114', '115', '116', '117', '118', '119', '120']
    },

    // Common jewelry dimensions
    dimensions: {
        widths: ['1mm', '1.5mm', '2mm', '2.5mm', '3mm', '3.5mm', '4mm', '4.5mm', '5mm', '5.5mm', '6mm', '6.5mm', '7mm', '7.5mm', '8mm', '8.5mm', '9mm', '9.5mm', '10mm', '10.5mm', '11mm', '11.5mm', '12mm', '12.5mm', '13mm', '13.5mm', '14mm', '14.5mm', '15mm', '15.5mm', '16mm', '16.5mm', '17mm', '17.5mm', '18mm', '18.5mm', '19mm', '19.5mm', '20mm'],
        heights: ['1mm', '1.5mm', '2mm', '2.5mm', '3mm', '3.5mm', '4mm', '4.5mm', '5mm', '5.5mm', '6mm', '6.5mm', '7mm', '7.5mm', '8mm', '8.5mm', '9mm', '9.5mm', '10mm', '10.5mm', '11mm', '11.5mm', '12mm', '12.5mm', '13mm', '13.5mm', '14mm', '14.5mm', '15mm', '15.5mm', '16mm', '16.5mm', '17mm', '17.5mm', '18mm', '18.5mm', '19mm', '19.5mm', '20mm'],
        thicknesses: ['0.5mm', '0.8mm', '1mm', '1.2mm', '1.5mm', '1.8mm', '2mm', '2.2mm', '2.5mm', '2.8mm', '3mm', '3.2mm', '3.5mm', '3.8mm', '4mm', '4.2mm', '4.5mm', '4.8mm', '5mm', '5.2mm', '5.5mm', '5.8mm', '6mm', '6.2mm', '6.5mm', '6.8mm', '7mm', '7.2mm', '7.5mm', '7.8mm', '8mm', '8.2mm', '8.5mm', '8.8mm', '9mm', '9.2mm', '9.5mm', '9.8mm', '10mm']
    },

    // Common jewelry weights in grams
    commonWeights: ['0.1g', '0.2g', '0.3g', '0.4g', '0.5g', '0.6g', '0.7g', '0.8g', '0.9g', '1.0g', '1.1g', '1.2g', '1.3g', '1.4g', '1.5g', '1.6g', '1.7g', '1.8g', '1.9g', '2.0g', '2.1g', '2.2g', '2.3g', '2.4g', '2.5g', '2.6g', '2.7g', '2.8g', '2.9g', '3.0g', '3.1g', '3.2g', '3.3g', '3.4g', '3.5g', '3.6g', '3.7g', '3.8g', '3.9g', '4.0g', '4.1g', '4.2g', '4.3g', '4.4g', '4.5g', '4.6g', '4.7g', '4.8g', '4.9g', '5.0g'],

    // Common jewelry prices in INR
    commonPrices: ['100', '200', '300', '400', '500', '600', '700', '800', '900', '1000', '1100', '1200', '1300', '1400', '1500', '1600', '1700', '1800', '1900', '2000', '2100', '2200', '2300', '2400', '2500', '2600', '2700', '2800', '2900', '3000', '3100', '3200', '3300', '3400', '3500', '3600', '3700', '3800', '3900', '4000', '4100', '4200', '4300', '4400', '4500', '4600', '4700', '4800', '4900', '5000', '5100', '5200', '5300', '5400', '5500', '5600', '5700', '5800', '5900', '6000', '6100', '6200', '6300', '6400', '6500', '6600', '6700', '6800', '6900', '7000', '7100', '7200', '7300', '7400', '7500', '7600', '7700', '7800', '7900', '8000', '8100', '8200', '8300', '8400', '8500', '8600', '8700', '8800', '8900', '9000', '9100', '9200', '9300', '9400', '9500', '9600', '9700', '9800', '9900', '10000'],

    // Common jewelry costs
    commonCosts: ['50', '100', '150', '200', '250', '300', '350', '400', '450', '500', '550', '600', '650', '700', '750', '800', '850', '900', '950', '1000', '1100', '1200', '1300', '1400', '1500', '1600', '1700', '1800', '1900', '2000', '2100', '2200', '2300', '2400', '2500', '2600', '2700', '2800', '2900', '3000', '3100', '3200', '3300', '3400', '3500', '3600', '3700', '3800', '3900', '4000', '4100', '4200', '4300', '4400', '4500', '4600', '4700', '4800', '4900', '5000'],

    // Common markup percentages
    markupPercentages: ['5', '10', '11', '12', '15', '20', '25', '30', '35', '40', '45', '50', '55', '60', '65', '70', '75', '80', '85', '90', '95', '100', '110', '120', '130', '140', '150', '160', '170', '180', '190', '200'],

    // Common labour rates
    labourRates: ['25', '50', '75', '100', '125', '150', '175', '200', '225', '250', '275', '300', '325', '350', '375', '400', '425', '450', '475', '500', '550', '600', '650', '700', '750', '800', '850', '900', '950', '1000', '1100', '1200', '1300', '1400', '1500', '1600', '1700', '1800', '1900', '2000', '2100', '2200', '2300', '2400', '2500', '2600', '2700', '2800', '2900', '3000', '3100', '3200', '3300', '3400', '3500', '3600', '3700', '3800', '3900', '4000', '4100', '4200', '4300', '4400', '4500', '4600', '4700', '4800', '4900', '5000'],

    // Common supplier rates
    supplierRates: ['20', '40', '60', '80', '100', '120', '140', '160', '180', '200', '220', '240', '260', '280', '300', '320', '340', '360', '380', '400', '420', '440', '460', '480', '500', '520', '540', '560', '580', '600', '620', '640', '660', '680', '700', '720', '740', '760', '780', '800', '820', '840', '860', '880', '900', '920', '940', '960', '980', '1000'],

    // Common other charges
    otherCharges: ['10', '20', '30', '40', '50', '60', '70', '80', '90', '100', '110', '120', '130', '140', '150', '160', '170', '180', '190', '200', '220', '240', '260', '280', '300', '320', '340', '360', '380', '400', '420', '440', '460', '480', '500'],

    // Common fine values
    fineValues: ['0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9', '2.0', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8', '2.9', '3.0', '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8', '3.9', '4.0', '4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9', '5.0'],

    // Common total values
    totalValues: ['100', '200', '300', '400', '500', '600', '700', '800', '900', '1000', '1100', '1200', '1300', '1400', '1500', '1600', '1700', '1800', '1900', '2000', '2100', '2200', '2300', '2400', '2500', '2600', '2700', '2800', '2900', '3000', '3100', '3200', '3300', '3400', '3500', '3600', '3700', '3800', '3900', '4000', '4100', '4200', '4300', '4400', '4500', '4600', '4700', '4800', '4900', '5000', '5100', '5200', '5300', '5400', '5500', '5600', '5700', '5800', '5900', '6000', '6100', '6200', '6300', '6400', '6500', '6600', '6700', '6800', '6900', '7000', '7100', '7200', '7300', '7400', '7500', '7600', '7700', '7800', '7900', '8000', '8100', '8200', '8300', '8400', '8500', '8600', '8700', '8800', '8900', '9000', '9100', '9200', '9300', '9400', '9500', '9600', '9700', '9800', '9900', '10000']
};

// Common jewelry suppliers
export const supplierOptions = [
    { value: 'supplier_1', label: 'Supplier 1' },
    { value: 'supplier_2', label: 'Supplier 2' },
    { value: 'supplier_3', label: 'Supplier 3' },
    { value: 'supplier_4', label: 'Supplier 4' },
    { value: 'supplier_5', label: 'Supplier 5' },
    { value: 'local_vendor', label: 'Local Vendor' },
    { value: 'wholesale_market', label: 'Wholesale Market' },
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'distributor', label: 'Distributor' },
    { value: 'online_supplier', label: 'Online Supplier' }
];

// Common jewelry remarks
export const remarkOptions = [
    'New Arrival',
    'Best Seller',
    'Limited Edition',
    'Exclusive Design',
    'Premium Quality',
    'Handcrafted',
    'Certified',
    'Hallmarked',
    'Trending',
    'Popular',
    'Classic',
    'Modern',
    'Traditional',
    'Contemporary',
    'Luxury',
    'Budget Friendly',
    'Investment Piece',
    'Gift Item',
    'Wedding Collection',
    'Party Wear',
    'Daily Wear',
    'Office Wear',
    'Casual Wear',
    'Formal Wear',
    'Festival Collection',
    'Seasonal',
    'Custom Made',
    'Ready Stock',
    'Pre Order',
    'Sale Item',
    'Clearance'
];

// Common jewelry tags
export const tagOptions = [
    'TAG001', 'TAG002', 'TAG003', 'TAG004', 'TAG005',
    'TAG006', 'TAG007', 'TAG008', 'TAG009', 'TAG010',
    'TAG011', 'TAG012', 'TAG013', 'TAG014', 'TAG015',
    'TAG016', 'TAG017', 'TAG018', 'TAG019', 'TAG020',
    'TAG021', 'TAG022', 'TAG023', 'TAG024', 'TAG025',
    'TAG026', 'TAG027', 'TAG028', 'TAG029', 'TAG030',
    'TAG031', 'TAG032', 'TAG033', 'TAG034', 'TAG035',
    'TAG036', 'TAG037', 'TAG038', 'TAG039', 'TAG040',
    'TAG041', 'TAG042', 'TAG043', 'TAG044', 'TAG045',
    'TAG046', 'TAG047', 'TAG048', 'TAG049', 'TAG050'
];

// Common jewelry batches
export const batchOptions = [
    'BATCH-A', 'BATCH-B', 'BATCH-C', 'BATCH-D', 'BATCH-E',
    'BATCH-F', 'BATCH-G', 'BATCH-H', 'BATCH-I', 'BATCH-J',
    'BATCH-K', 'BATCH-L', 'BATCH-M', 'BATCH-N', 'BATCH-O',
    'BATCH-P', 'BATCH-Q', 'BATCH-R', 'BATCH-S', 'BATCH-T',
    'BATCH-U', 'BATCH-V', 'BATCH-W', 'BATCH-X', 'BATCH-Y',
    'BATCH-Z', 'BATCH-AA', 'BATCH-AB', 'BATCH-AC', 'BATCH-AD',
    'BATCH-AE', 'BATCH-AF', 'BATCH-AG', 'BATCH-AH', 'BATCH-AI',
    'BATCH-AJ', 'BATCH-AK', 'BATCH-AL', 'BATCH-AM', 'BATCH-AN',
    'BATCH-AO', 'BATCH-AP', 'BATCH-AQ', 'BATCH-AR', 'BATCH-AS',
    'BATCH-AT', 'BATCH-AU', 'BATCH-AV', 'BATCH-AW', 'BATCH-AX'
];

// Common certificate numbers
export const certificateNumberOptions = [
    'CERT001', 'CERT002', 'CERT003', 'CERT004', 'CERT005',
    'CERT006', 'CERT007', 'CERT008', 'CERT009', 'CERT010',
    'IGI001', 'IGI002', 'IGI003', 'IGI004', 'IGI005',
    'IGI006', 'IGI007', 'IGI008', 'IGI009', 'IGI010',
    'GIA001', 'GIA002', 'GIA003', 'GIA004', 'GIA005',
    'GIA006', 'GIA007', 'GIA008', 'GIA009', 'GIA010',
    'SGL001', 'SGL002', 'SGL003', 'SGL004', 'SGL005',
    'SGL006', 'SGL007', 'SGL008', 'SGL009', 'SGL010',
    'GII001', 'GII002', 'GII003', 'GII004', 'GII005',
    'GII006', 'GII007', 'GII008', 'GII009', 'GII010'
];

// Stamp options for jewelry
export const stampOptions = [
    // Standard Gold Purity Marks (Karat/Purity format)
    { value: '24K / 999', label: '24K / 999' },
    { value: '22K / 916', label: '22K / 916' },
    { value: '18K / 750', label: '18K / 750' },
    { value: '14K / 585', label: '14K / 585' },
    { value: '10K / 417', label: '10K / 417' },
    { value: '9K / 375', label: '9K / 375' },
    { value: '8K / 333', label: '8K / 333' },

    // Standard Silver Purity Marks
    { value: '925', label: '925' },
    { value: '900', label: '900' },
    { value: '875', label: '875' },
    { value: '800', label: '800' },
    { value: '750', label: '750' },

    // Platinum Purity Marks
    { value: '950', label: '950' },
    { value: '900', label: '900' },
    { value: '850', label: '850' },

    // Individual Karat Values
    { value: '24K', label: '24K' },
    { value: '22K', label: '22K' },
    { value: '18K', label: '18K' },
    { value: '14K', label: '14K' },
    { value: '10K', label: '10K' },
    { value: '9K', label: '9K' },
    { value: '8K', label: '8K' }
];

// Unit options for product data entry
export const unitOptions = [
    { value: 'Gm', label: 'Gm' },
    { value: 'Kg', label: 'Kg' },
    { value: 'Pc', label: 'Pc' }
];

// Labour type options
export const labourTypeOptions = [
    { value: 'Wt', label: 'Weight' },
    { value: 'Pc', label: 'Percentage' },
    { value: 'Fl', label: 'Flat' }
];

// Yes/No options
export const yesNoOptions = [
    { value: false, label: 'No' },
    { value: true, label: 'Yes' }
];
