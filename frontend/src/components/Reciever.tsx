
import React, { useEffect, useMemo, useState,useRef } from 'react'
import { io } from 'socket.io-client';
import { FaRegCopy } from "react-icons/fa";
import { useSearchParams } from 'react-router-dom';
const Reciever = () => {
    const [iscopy, setIscopy] = React.useState(false);
    const [pc, setPC] = useState<RTCPeerConnection | null>(null);
    const socket = useMemo(() => io('http://localhost:3000'), [])
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const ref = useRef<HTMLVideoElement>(null);
    useEffect(()=>{
  socket.on('connect',()=>{
    if(id){
        socket.emit('join-room',id);
    }
    socket.on('recieve-offer',(offer)=>{
        console.log('Offer recieved',offer);
        const pc = new RTCPeerConnection({
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' }, // Public STUN server
            ],
          });
        pc.ontrack = (e) => {
            console.log('Received stream:', e);
            if (ref.current) {
              const stream = ref.current.srcObject || new MediaStream();
              stream.addTrack(e.track);
              ref.current.srcObject = stream;
              ref.current.play();
            }
          };
        setPC(pc);
        pc.onicecandidate=(e)=>{
            if(e.candidate){
                console.log('Ice candidate',e.candidate);
                socket.emit('send-icecandidate-admin',id,e.candidate);
            }
        }
        pc.setRemoteDescription(offer).then(()=>{
            pc.createAnswer().then((answer)=>{
                console.log('Answer created',answer);
                pc.setLocalDescription(answer);
                socket.emit('send-answer',id,answer);
            })
        })
    })
    //recieve ice candidate from the admin
    socket.on('recieve-icecandidate',(icecandidate)=>{
        pc?.addIceCandidate(icecandidate);
    })
console.log('Connected to server');
  })

  //disconnect from the server when the user leaves the page
  const handleBeforeunload=()=>{
    socket.disconnect();
  }
  window.addEventListener("beforeunload",handleBeforeunload);
    return ()=>{
      socket.disconnect();
      window.addEventListener("beforeunload",handleBeforeunload);
    }
    },[])

  return (
    <>
      <div className='container bg-blue-400 p-4 flex justify-center items-center flex-col relative'>
        <h1 className='text-xl font-extrabold '>Reciever</h1>
        {iscopy&&<p className='text-black bg-white p-2 rounded-xl absolute '>Copied..</p>}
        <h3 className='font-semibold flex justify-center items-center'>Stream ID: <span className='font-bold text-gray-900'>{id}</span> <FaRegCopy className='mx-2 text-green-800'
        onClick={()=>{
            setIscopy(true);
            setTimeout(()=>{
                setIscopy(false);
            },1000)
            if (id) {
                navigator.clipboard.writeText(id);
            }
        }}
        /></h3>
        <p className='text-gray-600'>Share this stream id with other person you want to join the stream.</p>
      </div>
      <div className='flex justify-center items-center p-4 bg-gray-100 rounded m-1'>
      <h1 className='text-lg font-light r'>
        Wait for the admin to start the stream.
       
      </h1>
      </div>
      <div className='flex justify-center items-center p-4 bg-gray-100 rounded m-1'>
        <video id='video' autoPlay ref={ref}></video>
      </div>
    </>
  )
}

export default Reciever
