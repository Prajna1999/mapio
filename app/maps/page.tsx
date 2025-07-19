'use client'

import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <p>Loading map...</p>
})

export default function MapsPage() {
  return (
    <div>
      {/* <h1 className="text-2xl font-bold p-4">Maps</h1> */}
      {/* <div className="h-[calc(100vh-80px)] w-full"> */}
      <MapComponent />

    </div>
  )
}