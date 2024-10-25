import { useState, useEffect } from 'react';

export default function useExitIntent(onExitIntent) {
    useEffect(() => {
        const handleMouseMove = (event) => {
            // Check if the mouse is moving towards the top of the screen
            if (event.clientY < 50) {
                onExitIntent();
            }
        };

        // Add mousemove event listener
        document.addEventListener('mousemove', handleMouseMove);

        // Cleanup listener on component unmount
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, [onExitIntent]);
}
