import React from 'react';
import Home from './components/Home';
import Reciever from './components/Reciever';
import Sender from './components/Sender';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
export default function App() {
  return (
    <>
    <BrowserRouter>
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/send' element={<Sender/>}/>
      <Route path='/recieve' element={<Reciever/>}/>
    </Routes>
    </BrowserRouter>
    </>
  )
}