import Avator from './Avator'
import { MessageSquareIcon, ShareIcon, ThumbsUpIcon } from 'lucide-react'
import ExpandableText from './ExpandableText'
import ActionButton from '../Button/ActionButton'

type FeedPostProps = {
  ownerName?: string
  time?: string
  content?: string
  imageUrl?: string
  likes?: number
  comments?: number
  shares?: number
}

const FeedPost = ({
  ownerName = 'Post Owner Name',
  time = '1w',
  content = '',
  imageUrl = '',
  likes = 123,
  comments = 123,
  shares = 123,
}: FeedPostProps) => {
  return (
    <div className='border border-gray-300 rounded-xl overflow-hidden bg-white'>
      <div className='p-4'>
        <div className='flex justify-between'>
          <div className='flex gap-2 items-center'>
            <Avator />
            <div>
              <h5 className='text-md font-semibold'>{ownerName}</h5>
              <p className='text-xs text-gray-400'>{time}</p>
            </div>
          </div>
          <button type='button' className='text-indigo-500 font-semibold'>
            + Add
          </button>
        </div>

        <ExpandableText text={content} lines={3} />
      </div>

      {imageUrl && <img src={imageUrl} alt='post image' className='w-full object-cover' />}

      <div className='flex gap-2 py-1'>
        <ActionButton icon={<ThumbsUpIcon />} count={likes} />
        <ActionButton icon={<MessageSquareIcon />} count={comments} />
        <ActionButton icon={<ShareIcon />} count={shares} />
      </div>
    </div>
  )
}

export default FeedPost