
import React, { useEffect, useMemo } from 'react'
import { io } from 'socket.io-client';
import { FaRegCopy } from "react-icons/fa";
import { useSearchParams } from 'react-router-dom';
const Reciever = () => {
    const [iscopy, setIscopy] = React.useState(false);
    const socket = useMemo(() => io('http://localhost:3000'), [])
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    useEffect(()=>{
  socket.on('connect',()=>{
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
    </>
  )
}

export default Reciever
