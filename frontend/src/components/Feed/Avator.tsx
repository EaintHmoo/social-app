import React from 'react'

const Avator = ({
  imgUrl='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSX_pQzOmRPmHvFM8604-vApD8VHe3CX4BVRDLCew2qLA&s'
}: {imgUrl?: string}) => {
  return (
    <div className="rounded-full w-[50px] h-[50px] overflow-hidden">
        <img src={imgUrl}></img>
    </div>
  )
}

export default Avator