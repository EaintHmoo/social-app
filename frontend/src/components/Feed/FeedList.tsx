import FeedPost from './FeedPost'

const DEFAULT_CONTENT = `Full-stack Development:
• Design, develop, and maintain both front-end and back-end components of web applications.
• Work with technologies such as HTML, CSS, JavaScript, and a variety of back-end languages (e.g., Node.js, Python, Java).
Database Management:
• Work with Database Administrator to design and implement database schemas, write queries, and ensure efficient data storage and retrieval.
API Development and Integration:
• Develop and maintain RESTful APIs to enable seamless communication between front-end and back-end components.`
 
type Post = {
  id: number;
  ownerName: string;
  time: string;
  content: string;
  imageUrl: string;
  likes: number;
  comments: number;
  shares: number;
};

const IMAGE_URL =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgI3fF6_ebdidZr1lnTEvKusZLVuw2ZKsrhm_Xtxn6ZdQlOo9PBRq1v2VW&s=10';

const POSTS: Post[] = [
  { id: 1, ownerName: 'Aye Aye', time: '1w', content: DEFAULT_CONTENT, imageUrl: IMAGE_URL, likes: 123, comments: 123, shares: 123 },
  { id: 2, ownerName: 'Aye Aye', time: '1w', content: 'Hello Hi',      imageUrl: IMAGE_URL, likes: 123, comments: 123, shares: 123 },
];

type FeedListProps = {
  posts?: Post[];
  className?: string;
};

const FeedList = ({ posts = POSTS, className = '' }: FeedListProps) => {
  return (
    <div className={`min-h-0 flex-1 overflow-y-auto ${className}`}>
      <div className="flex flex-col gap-2">
        {posts.map(({ id, ...post }) => (
          <FeedPost key={id} {...post} />
        ))}
      </div>
    </div>
  );
};

export default FeedList