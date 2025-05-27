'use client'
import React from 'react'
import {Canvas} from '@react-three/fiber'
import Model from './Model'
import { Environment } from '@react-three/drei'
function Experince() {
  return (
<>
<Canvas style={{height:"100vh"}}>
  <Model/>
  <Environment preset='apartment'/>

</Canvas>
</>

  )
}

export default Experince