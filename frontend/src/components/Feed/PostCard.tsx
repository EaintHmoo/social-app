import { Camera, SquarePlay, SquareText } from 'lucide-react'
import Avator from './Avator'
import CreatePostDialog from './CreatePostDialog'
import { useState } from 'react'

const PostCard = () => {
  const [open, setOpen] = useState(false)
  return (
    <>
    <div className=' border border-gray-300 rounded-xl overflow-hidden bg-white p-4'>

        <div className='flex gap-2'>
            <Avator/>

            <div className='w-full'>
                <button
                    onClick={() => setOpen(true)}
                    type="button"
                    className="rounded-full w-full bg-white px-2.5 py-2.5 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50"
                >
                    Start a post
                </button>
            </div>
        </div>
            
        <div className='flex gap-2'>
            <button className='w-full flex gap-1 rounded-full px-1.5 py-2 text-sm items-center font-semibold text-gray-900 shadow-xs hover:bg-gray-50 justify-center align-middle'>
                <SquarePlay />
                 Video
            </button>
            <button  className='w-full flex gap-1 rounded-full px-1.5 py-2 text-sm items-center font-semibold text-gray-900 shadow-xs hover:bg-gray-50 justify-center align-middle'>
                <Camera/>
                Photo
            </button>
            <button  className='w-full flex gap-1 rounded-full px-1.5 py-2 text-sm items-center font-semibold text-gray-900 shadow-xs hover:bg-gray-50 justify-center align-middle'>
                <SquareText/>
                Write Article
            </button>
        </div>
    </div>
    <CreatePostDialog open={open} setOpen={setOpen}/>
    </>
  )
}

export default PostCard