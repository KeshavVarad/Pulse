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
        <div style={{
            width: '768px',
            position: 'relative',
            paddingTop: '56.25%' // 16:9 aspect ratio (9/16 = 0.5625)
        }}>
            <ReactPlayer
                ref={playerRef}
                url={videoLink}
                width="100%"
                height="100%"
                style={{ position: 'absolute', top: 0, left: 0 }}
                controls
                onReady={onPlayerReady} // Triggered when the player is ready
                onProgress={({ playedSeconds }) => {
                    if (onVideoChange) {
                        onVideoChange(playedSeconds); // Send current time to parent if defined
                    }
                }} // Send current time to parent
                onDuration={(duration) => {
                    // Handle video duration if needed
                }}
                onError={(e) => {
                    console.error('Error occurred while playing the video:', e);
                }} // Optional: Handle video playback errors
            />
        </div>
    );
});

export default GCloudVideoPlayer;
