import React, { useImperativeHandle, forwardRef, useRef } from 'react';
import ReactPlayer from 'react-player';

const GCloudVideoPlayer = forwardRef(({ videoLink, onPlayerReady, onVideoChange }, ref) => {
    const playerRef = useRef(null); // Ref to the ReactPlayer instance

    useImperativeHandle(ref, () => ({
        // Expose methods to parent component
        getCurrentTime: () => {
            return playerRef.current ? playerRef.current.getCurrentTime() : 0; // Return current time
        },
        seekTo: (seconds) => {
            if (playerRef.current) {
                playerRef.current.seekTo(seconds, 'seconds'); // Seek to the specified time
            }
        },
        getDuration: () => {
            return playerRef.current ? playerRef.current.getDuration() : 0; // Return video duration
        },
    }));

    return (
        <div>
            <ReactPlayer
                ref={playerRef}
                url={videoLink}
                width="100%"
                height="auto"
                controls
                onReady={onPlayerReady} // Triggered when the player is ready
                onProgress={({ playedSeconds }) => {
                    if (onVideoChange) {
                        onVideoChange(playedSeconds); // Send current time to parent if defined
                    }
                }} // Send current time to parent
                onDuration={(duration) => {
                    // Handle video duration if needed
                    console.log('Video Duration:', duration);
                }}
                onError={(e) => {
                    console.error('Error occurred while playing the video:', e);
                }} // Optional: Handle video playback errors
            />
        </div>
    );
});

export default GCloudVideoPlayer;
