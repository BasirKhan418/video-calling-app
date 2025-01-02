import React, { useState} from 'react';
import { useNavigate } from 'react-router-dom';
const Home = () => {
    const router = useNavigate()
    const [streamCode, setStreamCode] = useState('')

    const createStream=()=>{
        const streamid = Math.floor(Math.random() * 1000000)+"DSWBKAS";
        router(`/send?id=${streamid}`)
    }
    const joinStream=()=>{
        router(`/recieve?id=${streamCode}`)
    }
    
  return (
    <>
    <div className='flex justify-center items-center flex-col'>
        <h1 className='text-red-600 text-4xl font-bold'>Home</h1>
        <p className='text-blue-600 font-semibold mt-6'>Welcome to the basir's peer to peer video calling app.</p>
        <p className='text-blue-400 font-light'>Implemente in pure webrtc(Web Real Time Communication).</p>
    </div>
    <div className='flex justify-center items-center  mt-6 flex-col'>
        <input type="text" className='border-2 border-green-600 p-2 rounded-lg lg:w-72' placeholder='Enter a Stream Code To Join' onChange={(e)=>setStreamCode(e.target.value)}/>
        <div className='flex justify-center items-center flex-col md:flex-row lg:flex-row mt-4'>
        <button className='bg-blue-600 text-white px-4 py-2 rounded-md mx-2 my-2' onClick={joinStream}>Join a Stream</button>
        <button className='bg-red-600 text-white px-4 py-2 rounded-md mx-2 my-2' onClick={createStream}>Create a Stream</button>
        </div>
        
    </div>
    </>

  )
}

export default Home
