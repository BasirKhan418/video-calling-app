
import React, { useEffect, useMemo ,useRef,useState} from 'react'
import { io } from 'socket.io-client';
import { FaRegCopy } from "react-icons/fa";
import { useSearchParams } from 'react-router-dom';
const Sender = () => {
    const [iscopy, setIscopy] = React.useState(false);
    const socket = useMemo(() => io('http://localhost:3000'), [])
       const [pc, setPC] = useState<RTCPeerConnection | null>(null);
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const ref =useRef<HTMLVideoElement>(null);
    //acess camera
    const mediaStream =async(con)=>{
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then((stream) => {
    ref.current!.srcObject = stream;
    stream.getTracks().forEach(track => con.addTrack(track, stream));
  })
  .catch((error) => {
    console.error('Error accessing media devices:', error);
  });

    }
    //creating offer
      const createOfferAndStream=async()=>{
        console.log(socket,socket.id)
        const con = new RTCPeerConnection({
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' }, // Public STUN server
            ],
          });
        console.log('Creating offer',con);
       
       con.onicecandidate=(e)=>{
    
                console.log('Ice candidate',e.candidate);
                socket.emit('send-icecandidate',id,e.candidate);
        
       }
       con.oniceconnectionstatechange = () => {
        console.log('ICE Connection State:', con.iceConnectionState);
    };
    await mediaStream(con);
       setPC(con);
        const offer =await con.createOffer();
        await con.setLocalDescription(offer);
        console.log('Offer created',offer);
        socket.emit('send-offer',id,offer);
        
      }
    useEffect(()=>{
  socket.on('connect',()=>{
    if(id){
        socket.emit('join-room',id);
    }
    //recieve answer from the reciever
    socket.on('recieve-answer',(answer)=>{
        console.log('Answer recieved from user',answer);
        pc?.setRemoteDescription(answer);
    })
    socket.on('recieve-icecandidate-admin',(icecandidate)=>{
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
      <div className='container bg-green-400 p-4 flex justify-center items-center flex-col relative'>
        <h1 className='text-xl font-extrabold '>Sender</h1>
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
        <p className='text-gray-600'>Share this stream id with the person you want to connect with.</p>
      </div>
      <div className='flex justify-center items-center p-4 bg-gray-100 rounded m-1'>
      <h1 className='text-lg font-light r'>
        Waiting for the other person to join the stream. 
        <button className='bg-red-600 text-white px-4 py-2 rounded-md mx-2 my-2 hover:bg-red-800' onClick={()=>{
            createOfferAndStream();
        }}>Start the Stream</button>
      </h1>
      </div>
      <div className='flex justify-center items-center p-4 bg-gray-100 rounded m-1 '>
        <video id='local-video' autoPlay ref={ref}></video>
      </div>
    </>
  )
}

export default Sender
