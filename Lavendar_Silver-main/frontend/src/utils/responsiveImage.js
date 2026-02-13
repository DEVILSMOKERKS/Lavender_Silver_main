export function getResponsiveImage(imagePath, options = {}) {
    const {
        thumbnail = 300,
        card = 600,
        full = 1900,
        quality = 80,
        format = 'webp'
    } = options;

    if (typeof imagePath === 'string' && (
        imagePath.includes('backend.pvjewellers.in') ||
        imagePath.startsWith('/products') ||
        imagePath.startsWith('/categories') ||
        imagePath.startsWith('/featured-category') ||
        imagePath.startsWith('/gallery') ||
        (imagePath.startsWith('/') && !imagePath.startsWith('/assets'))
    )) {
        let baseUrl = imagePath.split('?')[0];
        let separator = imagePath.includes('?') ? '&' : '?';

        return {
            src: `${baseUrl}${separator}w=${card}&format=${format}&q=${quality}`,
            srcSet: [
                `${baseUrl}${separator}w=${thumbnail}&format=${format}&q=${quality} ${thumbnail}w`,
                `${baseUrl}${separator}w=${card}&format=${format}&q=${quality} ${card}w`,
                `${baseUrl}${separator}w=${full}&format=${format}&q=${quality} ${full}w`
            ].join(', '),
            sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 1200px'
        };
    }

    if (typeof imagePath === 'string' &&
        (imagePath.includes('?w=') || imagePath.includes('&w='))) {
        return {
            src: imagePath,
            srcSet: undefined, // ✅ important
            sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 1200px'
        };
    }

    return {
        src: imagePath,
        srcSet: undefined, // ✅ important
        sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 1200px'
    };
}

export function getThumbnailImage(imagePath, quality = 70) {
  return getResponsiveImage(imagePath, {
    thumbnail: 150,
    card: 300,
    full: 300,
    quality,
  });
}

export function getCardImage(imagePath, quality = 75) {
  return getResponsiveImage(imagePath, {
    thumbnail: 300,
    card: 600,
    full: 600,
    quality,
  });
}

export function getFullImage(imagePath, quality = 85) {
  return getResponsiveImage(imagePath, {
    thumbnail: 600,
    card: 1200,
    full: 1900,
    quality,
  });
}

export function importResponsiveImage(imagePath) {
  return imagePath;
}
