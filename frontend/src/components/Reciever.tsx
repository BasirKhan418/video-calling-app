import React, { useEffect, useMemo, useState, useRef } from 'react'
import { io } from 'socket.io-client';
import { FaRegCopy } from "react-icons/fa";
import { useSearchParams } from 'react-router-dom';

const Receiver = () => {
    const [iscopy, setIscopy] = React.useState(false);
    const [pc, setPC] = useState<RTCPeerConnection | null>(null);
    const [hasTrack, setHasTrack] = useState(false);
    const socket = useMemo(() => io('https://video.deploylite.tech'), []);
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream>(new MediaStream());

    const playVideo = async () => {
        try {
            if (videoRef.current) {
                videoRef.current.muted = false;
                await videoRef.current.play();
            }
        } catch (error) {
            console.error('Error playing video:', error);
        }
    };

    useEffect(() => {
        console.log('Receiver id:', id, pc);
        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
            ],
        });

        // Set initial stream
        if (videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }

        peerConnection.ontrack = (e) => {
            if (videoRef.current) {
                setHasTrack(true);
                // Add the track to our existing stream
                streamRef.current.addTrack(e.track);
                // Ensure the video element is using the stream
                videoRef.current.srcObject = streamRef.current;
                videoRef.current.muted = false;
            }
        };

        peerConnection.onicecandidate = (e) => {
            if (e.candidate) {
                socket.emit('send-icecandidate-admin', id, e.candidate);
            }
        };

        setPC(peerConnection);

        socket.on('connect', () => {
            if (id) {
                socket.emit('join-room', id);
            }
        });

        socket.on('recieve-offer', async (offer) => {
            try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socket.emit('send-answer', id, answer);
            } catch (error) {
                console.error('Error handling offer:', error);
            }
        });

        socket.on('recieve-icecandidate', async (icecandidate) => {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(icecandidate));
            } catch (error) {
                console.error('Error adding ICE candidate:', error);
            }
        });

        const handleBeforeunload = () => {
            streamRef.current.getTracks().forEach(track => track.stop());
            socket.disconnect();
        };

        window.addEventListener("beforeunload", handleBeforeunload);

        return () => {
            handleBeforeunload();
            window.removeEventListener("beforeunload", handleBeforeunload);
            peerConnection.close();
        };
    }, [id]);

    return (
        <>
            <div className='bg-blue-400 p-4 flex justify-center items-center flex-col relative'>
                <h1 className='text-xl font-extrabold'>Receiver</h1>
                {iscopy && <p className='text-black bg-white p-2 rounded-xl absolute'>Copied..</p>}
                <h3 className='font-semibold flex justify-center items-center'>
                    Stream ID: <span className='font-bold text-gray-900'>{id}</span>
                    <FaRegCopy className='mx-2 text-green-800 cursor-pointer'
                        onClick={() => {
                            setIscopy(true);
                            setTimeout(() => {
                                setIscopy(false);
                            }, 1000);
                            if (id) {
                                navigator.clipboard.writeText(id);
                            }
                        }}
                    />
                </h3>
                <p className='text-gray-600'>Share this stream id with other person you want to join the stream.</p>
            </div>
            <div className='flex justify-center items-center p-4 bg-gray-100 rounded m-1'>
                <h1 className='text-lg font-light'>
                    {!hasTrack ? "Wait for the admin to start the stream." : "Admin has started the stream. Click on play video to start the stream."}
                </h1>
            </div>
            <div className='flex justify-center items-center flex-col gap-4'>
                <div className='p-4 bg-gray-100 rounded m-1'>
                    <h2 className='text-lg font-semibold mb-2'>Camera Feed</h2>
                    <video 
                        ref={videoRef}
                        className="w-full max-w-2xl"
                        style={{ backgroundColor: '#000' }}
                        controls
                        playsInline
                    />
                </div>
                
                {hasTrack && <button
                    onClick={playVideo}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Play Video
                </button>}
            </div>
        </>
    );
};

export default Receiver;