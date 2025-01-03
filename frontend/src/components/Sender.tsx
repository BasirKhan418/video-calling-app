// Sender.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client';
import { FaRegCopy } from "react-icons/fa";
import { useSearchParams } from 'react-router-dom';

const Sender = () => {
    const [iscopy, setIscopy] = React.useState(false);
    const socket = useMemo(() => io('http://localhost:3000'), [])
    const [pc, setPC] = useState<RTCPeerConnection | null>(null);
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const videoRef = useRef<HTMLVideoElement>(null);
    const screenRef = useRef<HTMLVideoElement>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const mediaStream = async (peerConnection: RTCPeerConnection) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            
            stream.getTracks().forEach(track => {
                peerConnection.addTrack(track, stream);
            });
            
            setLocalStream(stream);
        } catch (error) {
            console.error('Error accessing media devices:', error);
        }
    };

    const startScreenShare = async () => {
        if (!pc) return;
        
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ 
                video: true,
                audio: true 
            });
            
            if (screenRef.current) {
                screenRef.current.srcObject = stream;
            }
            
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
                track.onended = () => {
                    stopScreenShare();
                };
            });
            
            setScreenStream(stream);
            setIsScreenSharing(true);
            
            // Notify receiver about screen sharing start
            socket.emit('screen-share-started', id);
        } catch (error) {
            console.error('Error starting screen share:', error);
        }
    };

    const stopScreenShare = () => {
        if (screenStream) {
            screenStream.getTracks().forEach(track => {
                track.stop();
                if (pc) {
                    const senders = pc.getSenders();
                    const sender = senders.find(s => s.track === track);
                    if (sender) {
                        pc.removeTrack(sender);
                    }
                }
            });
            setScreenStream(null);
            setIsScreenSharing(false);
            
            // Notify receiver about screen sharing stop
            socket.emit('screen-share-stopped', id);
        }
    };

    const createOfferAndStream = async () => {
        if (!pc) return;
        
        try {
            await mediaStream(pc);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('send-offer', id, offer);
        } catch (error) {
            console.error('Error creating offer:', error);
        }
    };

    useEffect(() => {
        const peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
            ],
        });

        peerConnection.oniceconnectionstatechange = () => {
            console.log('ICE Connection State:', peerConnection.iceConnectionState);
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('send-icecandidate', id, event.candidate);
            }
        };

        setPC(peerConnection);

        socket.on('connect', () => {
            if (id) {
                socket.emit('join-room', id);
            }
        });

        socket.on('recieve-answer', async (answer) => {
            try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (error) {
                console.error('Error setting remote description:', error);
            }
        });

        socket.on('recieve-icecandidate-admin', async (icecandidate) => {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(icecandidate));
            } catch (error) {
                console.error('Error adding ICE candidate:', error);
            }
        });

        const handleBeforeunload = () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
            }
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
            <div className='container bg-green-400 p-4 flex justify-center items-center flex-col relative'>
                <h1 className='text-xl font-extrabold'>Sender</h1>
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
                <p className='text-gray-600'>Share this stream id with the person you want to connect with.</p>
            </div>
            <div className='flex justify-center items-center p-4 bg-gray-100 rounded m-1'>
                <h1 className='text-lg font-light'>
                    Waiting for the other person to join the stream.
                    <button className='bg-red-600 text-white px-4 py-2 rounded-md mx-2 my-2 hover:bg-red-800'
                        onClick={createOfferAndStream}>
                        Start the Stream
                    </button>
                    <button 
                        className={`${isScreenSharing ? 'bg-red-600' : 'bg-blue-600'} text-white px-4 py-2 rounded-md mx-2 my-2 hover:opacity-80`}
                        onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                    >
                        {isScreenSharing ? 'Stop Screen Share' : 'Start Screen Share'}
                    </button>
                </h1>
            </div>
            <div className='flex justify-center items-center flex-col gap-4'>
                <div className='p-4 bg-gray-100 rounded m-1'>
                    <h2 className='text-lg font-semibold mb-2'>Camera Feed</h2>
                    <video id='local-video' autoPlay ref={videoRef}></video>
                </div>
                {isScreenSharing && (
                    <div className='p-4 bg-gray-100 rounded m-1'>
                        <h2 className='text-lg font-semibold mb-2'>Screen Share</h2>
                        <video id='screen-video' autoPlay ref={screenRef}></video>
                    </div>
                )}
            </div>
        </>
    );
};

export default Sender;