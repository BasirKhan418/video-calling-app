// Sender.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client';
import { FaRegCopy } from "react-icons/fa";
import { useSearchParams } from 'react-router-dom';

const Sender = () => {
    const [iscopy, setIscopy] = React.useState(false);
    const socket = useMemo(() => io('https://video.deploylite.tech'), [])
    const [pc, setPC] = useState<RTCPeerConnection | null>(null);
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const videoRef = useRef<HTMLVideoElement>(null)
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [startedStream, setStartedStream] = useState(false);

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



    

    const createOfferAndStream = async () => {
        if (!pc) return;
        
        try {
            setStartedStream(true);
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
            <div className='bg-green-400 p-4 flex justify-center items-center flex-col relative'>
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
                    {!startedStream?"Waiting for the other person to join the stream...":"Stream started. You can now take the session."}
                    <button className='bg-red-600 text-white px-4 py-2 rounded-md mx-2 my-2 hover:bg-red-800 disabled:bg-red-400'
                        onClick={createOfferAndStream} disabled={startedStream}>
                        {startedStream?"Stream Started...":"Start Stream"}
                    </button>
                  
                </h1>
            </div>
            <div className='flex justify-center items-center flex-col gap-4'>
                <div className='p-4 bg-gray-100 rounded m-1'>
                    <h2 className='text-lg font-semibold mb-2'>Camera Feed</h2>
                    <video id='local-video' autoPlay ref={videoRef}></video>
                </div>
                
            </div>
        </>
    );
};

export default Sender;