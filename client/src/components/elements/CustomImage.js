import React from 'react';
import { Box } from '@mui/material';

const CustomImage = ({ src, alt }) => (
    <Box
        component="img"
        src={src}
        alt={alt}
        sx={{
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
            margin: '0 auto',
        }}
    />
);

export default CustomImage;
