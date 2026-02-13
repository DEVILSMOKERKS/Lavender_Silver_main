import React from 'react';
import { getResponsiveImage, getThumbnailImage, getCardImage, getFullImage } from '../../utils/responsiveImage';

const ResponsiveImage = ({
  src,
  type = 'responsive',
  alt = '',
  className = '',
  style = {},
  loading = 'lazy',
  ...props
}) => {
  let imageConfig;

  switch (type) {
    case 'thumbnail':
      imageConfig = getThumbnailImage(src);
      break;
    case 'card':
      imageConfig = getCardImage(src);
      break;
    case 'full':
      imageConfig = getFullImage(src);
      break;
    case 'responsive':
    default:
      imageConfig = getResponsiveImage(src);
      break;
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
      {...props}
    />
  );
};

export default ResponsiveImage;
