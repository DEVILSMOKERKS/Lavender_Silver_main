import React, { useMemo } from 'react';

const ResponsiveImage = ({
    src,
    alt = '',
    className = '',
    style = {},
    loading = 'lazy',
    decoding = 'async',
    type = 'responsive',
    sizes = null,
    width = null,
    height = null,
    quality = 75,
    format = 'webp',
    usePicture = false,
    ...props
}) => {
    const imageConfig = useMemo(() => {
        const presets = {
            thumbnail: { widths: [150, 300], sizes: '(max-width: 640px) 150px, 300px', maxWidth: 300 },
            card: { widths: [300, 600], sizes: '(max-width: 768px) 300px, 600px', maxWidth: 600 },
            full: { widths: [600, 1200, 1900], sizes: '(max-width: 1200px) 100vw, 1200px', maxWidth: 1900 },
            responsive: { widths: [300, 600, 1200, 1900], sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 1200px', maxWidth: 1900 }
        };

        const preset = presets[type] || presets.responsive;

        const isBackendImage = typeof src === 'string' && (
            src.includes('backend.pvjewellers.in') ||
            src.includes('/products') ||
            src.includes('/categories') ||
            src.includes('/featured-category') ||
            src.includes('/gallery') ||
            (src.startsWith('/') && !src.startsWith('/assets'))
        );

        if (isBackendImage) {
            const baseUrl = src.split('?')[0];
            const separator = src.includes('?') ? '&' : '?';

            const srcset = preset.widths.map(w =>
                `${baseUrl}${separator}w=${w}&format=${format}&q=${quality} ${w}w`
            ).join(', ');

            return {
                src: `${baseUrl}${separator}w=${preset.maxWidth}&format=${format}&q=${quality}`,
                srcSet: srcset,
                sizes: sizes || preset.sizes
            };
        }

        if (typeof src === 'string' && (src.includes('?w=') || src.includes('&w='))) {
            return {
                src: src,
                srcSet: src,
                sizes: sizes || preset.sizes
            };
        }

        return {
            src: src,
            srcSet: undefined,
            sizes: sizes || preset.sizes
        };
    }, [src, type, quality, format, sizes]);

    if (usePicture && imageConfig.srcSet) {
        const isBackendImage = typeof src === 'string' && (
            src.includes('backend.pvjewellers.in') ||
            (src.startsWith('/') && !src.startsWith('/assets'))
        );

        if (isBackendImage) {
            const baseUrl = typeof src === 'string' ? src.split('?')[0] : src;
            const separator = typeof src === 'string' && src.includes('?') ? '&' : '?';
            const preset = type === 'thumbnail' ? { widths: [150, 300], maxWidth: 300 } :
                type === 'card' ? { widths: [300, 600], maxWidth: 600 } :
                    type === 'full' ? { widths: [600, 1200, 1900], maxWidth: 1900 } :
                        { widths: [300, 600, 1200, 1900], maxWidth: 1900 };

            const webpSrcset = preset.widths.map(w =>
                `${baseUrl}${separator}w=${w}&format=webp&q=${quality} ${w}w`
            ).join(', ');

            const jpgSrcset = preset.widths.map(w =>
                `${baseUrl}${separator}w=${w}&format=jpg&q=${quality} ${w}w`
            ).join(', ');

            return (
                <picture>
                    <source
                        srcSet={webpSrcset}
                        sizes={imageConfig.sizes}
                        type="image/webp"
                    />
                    <source
                        srcSet={jpgSrcset}
                        sizes={imageConfig.sizes}
                        type="image/jpeg"
                    />
                    <img
                        src={`${baseUrl}${separator}w=${preset.maxWidth}&format=jpg&q=${quality}`}
                        srcSet={jpgSrcset}
                        sizes={imageConfig.sizes}
                        alt={alt}
                        className={className}
                        style={style}
                        loading={loading}
                        decoding={decoding}
                        width={width}
                        height={height}
                        {...props}
                    />
                </picture>
            );
        }
    }

    return (
        <img
            src={imageConfig.src}
            srcSet={imageConfig.srcSet}
            sizes={imageConfig.sizes}
            alt={alt}
            className={className}
            style={style}
            loading={loading}
            decoding={decoding}
            width={width}
            height={height}
            {...props}
        />
    );
};

export default ResponsiveImage;

export const useResponsiveImage = (src, type = 'responsive', options = {}) => {
    return useMemo(() => {
        const { quality = 75, format = 'webp' } = options;
        const preset = {
            thumbnail: { widths: [150, 300], maxWidth: 300 },
            card: { widths: [300, 600], maxWidth: 600 },
            full: { widths: [600, 1200, 1900], maxWidth: 1900 },
            responsive: { widths: [300, 600, 1200, 1900], maxWidth: 1900 }
        }[type] || { widths: [300, 600, 1200, 1900], maxWidth: 1900 };

        const isBackendImage = typeof src === 'string' && (
            src.includes('backend.pvjewellers.in') ||
            (src.startsWith('/') && !src.startsWith('/assets'))
        );

        if (isBackendImage) {
            const baseUrl = src.split('?')[0];
            const separator = src.includes('?') ? '&' : '?';
            return {
                src: `${baseUrl}${separator}w=${preset.maxWidth}&format=${format}&q=${quality}`,
                srcSet: preset.widths.map(w =>
                    `${baseUrl}${separator}w=${w}&format=${format}&q=${quality} ${w}w`
                ).join(', ')
            };
        }

        return { src, srcSet: undefined };
    }, [src, type, quality, format]);
};

