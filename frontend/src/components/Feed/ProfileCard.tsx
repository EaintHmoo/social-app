
const ProfileCard = () => {
  return (
    <div className=' border border-gray-300 rounded-xl overflow-hidden bg-white'>
      <div className='cover-image'>
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROBdkVK3l3Lgj1Dc2Qi0dwMVzHR0_bhVF9OT5CtmLg8a_dCBi8TuuMp0c&s=10"/>
      </div>
      <div className="relative">
          <div className="absolute top-[-5rem] left-5">
            <div className="rounded-full w-[100px] h-[100px] overflow-hidden border border-gray-700">
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSX_pQzOmRPmHvFM8604-vApD8VHe3CX4BVRDLCew2qLA&s"></img>
            </div>
          </div>
          <div className='p-4 mt-5'>
            <div className="mt-2 flex flex-col gap-1">
              <h3 className='font-bold text-2xl'>Account Name</h3>
              <p className='text-sm'>Description</p>
              <p className='text-sm text-gray-500'>Location</p>
            </div>
          </div>
      </div>
    </div>
  )
}

export default ProfileCard