// Centralized mock data for the SocialMeet frontend demo.
// In the real app these shapes come from the API; here they're static so the UI is fully interactive.

export type ReactionType = 'like' | 'love' | 'laugh' | 'sad';

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  role: string;
  bio: string;
  verified?: boolean;
  online?: boolean;
  followers: number;
  following: number;
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string; // relative label
  likes: number;
}

export interface Post {
  id: string;
  authorId: string;
  text: string;
  images: string[];
  visibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
  createdAt: string;
  reactions: Record<ReactionType, number>;
  reactionByMe: ReactionType | null;
  commentCount: number;
  comments: Comment[];
  shareCount: number;
  meetingInvite?: { slug: string; title: string; startsIn: string };
}

export interface Meeting {
  id: string;
  title: string;
  slug: string;
  hostId: string;
  scheduledAt: string; // relative label
  startsInLabel: string;
  status: 'live' | 'upcoming' | 'scheduled' | 'ended';
  participants: number;
  capacity: number;
  waitingRoom: boolean;
  recording: boolean;
  invitees: number;
  tags: string[];
}

export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  isGroup: boolean;
  lastMessage: string;
  lastSender?: string;
  unread: number;
  online: boolean;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
  mine: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

export interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'mention' | 'meeting' | 'recording' | 'message';
  actorId: string;
  text: string;
  createdAt: string;
  read: boolean;
  href?: string;
}

export const users: Record<string, User> = {
  me: {
    id: 'me',
    name: 'Alex Rivera',
    username: 'alexrivera',
    avatar:
      'https://images.pexels.com/photos/5308640/pexels-photo-5308640.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    role: 'Product Designer',
    bio: 'Designing calmer software. Coffee, trails, and the occasional side project.',
    verified: true,
    online: true,
    followers: 1284,
    following: 312,
  },
  u1: {
    id: 'u1',
    name: 'Maya Chen',
    username: 'mayachen',
    avatar:
      'https://images.pexels.com/photos/7717254/pexels-photo-7717254.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    role: 'Frontend Engineer',
    bio: 'Building delightful UIs. React + TypeScript enthusiast.',
    verified: true,
    online: true,
    followers: 4820,
    following: 540,
  },
  u2: {
    id: 'u2',
    name: 'Jordan Pierce',
    username: 'jordanp',
    avatar:
      'https://images.pexels.com/photos/14950779/pexels-photo-14950779.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    role: 'Founder, Northwind',
    bio: 'Working on the boring infrastructure that makes exciting products possible.',
    online: false,
    followers: 11300,
    following: 210,
  },
  u3: {
    id: 'u3',
    name: 'Sam Okafor',
    username: 'samokafor',
    avatar:
      'https://images.pexels.com/photos/35681211/pexels-photo-35681211.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    role: 'DevRel',
    bio: 'Helping developers ship. Talks about WebRTC and realtime.',
    online: true,
    followers: 2960,
    following: 480,
  },
  u4: {
    id: 'u4',
    name: 'Riley Voss',
    username: 'rileyv',
    avatar:
      'https://images.pexels.com/photos/35490803/pexels-photo-35490803.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    role: 'Backend Engineer',
    bio: 'Postgres maximalist. Probably reviewing a migration right now.',
    online: false,
    followers: 870,
    following: 195,
  },
  u5: {
    id: 'u5',
    name: 'Theo Nakamura',
    username: 'theonakamura',
    avatar:
      'https://images.pexels.com/photos/6102841/pexels-photo-6102841.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
    role: 'Photographer',
    bio: 'Light, frames, and long walks at sunrise.',
    verified: true,
    online: true,
    followers: 22100,
    following: 88,
  },
};

export const posts: Post[] = [
  {
    id: 'p1',
    authorId: 'u5',
    text: "First light over the ridge this morning. Set up at 5am, hiked in the dark, and the valley opened up exactly when the forecast promised. Worth every cold finger.",
    images: [
      'https://images.pexels.com/photos/1105654/pexels-photo-1105654.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/19273401/pexels-photo-19273401.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    visibility: 'PUBLIC',
    createdAt: '2h',
    reactions: { like: 184, love: 92, laugh: 4, sad: 0 },
    reactionByMe: 'love',
    commentCount: 3,
    comments: [
      { id: 'c1', authorId: 'me', text: 'This is unreal. Where was this taken?', createdAt: '1h', likes: 2 },
      { id: 'c2', authorId: 'u1', text: 'Saving this as my wallpaper, hope you don\'t mind.', createdAt: '52m', likes: 5 },
    ],
    shareCount: 18,
  },
  {
    id: 'p2',
    authorId: 'u1',
    text: "Just shipped the new realtime presence indicator at work — heartbeat TTL in Redis, broadcast only to followers + conversation members. Tiny detail, but the whole app feels more alive now. A short thread on what I learned. 🧵",
    images: [],
    visibility: 'PUBLIC',
    createdAt: '4h',
    reactions: { like: 240, love: 31, laugh: 8, sad: 0 },
    reactionByMe: 'like',
    commentCount: 2,
    comments: [
      { id: 'c3', authorId: 'u3', text: 'The TTL approach is so much simpler than I expected. Wrote it up?', createdAt: '3h', likes: 12 },
    ],
    shareCount: 41,
  },
  {
    id: 'p3',
    authorId: 'u3',
    text: "Hosting a live workshop on WebRTC fundamentals this Thursday — we'll build a 1:1 call from scratch with RTCPeerConnection before moving to LiveKit. Drop a reaction if you want the invite link.",
    images: [],
    visibility: 'PUBLIC',
    createdAt: '6h',
    reactions: { like: 96, love: 22, laugh: 2, sad: 0 },
    reactionByMe: null,
    commentCount: 1,
    comments: [
      { id: 'c4', authorId: 'u2', text: 'Count me in. Will share with the team.', createdAt: '5h', likes: 3 },
    ],
    shareCount: 14,
    meetingInvite: { slug: 'webrtc-fundamentals', title: 'WebRTC Fundamentals Workshop', startsIn: 'in 2 days' },
  },
  {
    id: 'p4',
    authorId: 'u2',
    text: "Reminder for anyone building real products: the boring infrastructure is where the leverage is. Postgres, Redis, S3, a queue. Get these four right and most 'scaling' problems never show up.",
    images: [
      'https://images.pexels.com/photos/5793947/pexels-photo-5793947.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    visibility: 'PUBLIC',
    createdAt: '9h',
    reactions: { like: 512, love: 64, laugh: 6, sad: 0 },
    reactionByMe: 'like',
    commentCount: 2,
    comments: [
      { id: 'c5', authorId: 'u4', text: 'Add a well-tuned index and you\'re basically unstoppable.', createdAt: '8h', likes: 28 },
      { id: 'c6', authorId: 'me', text: 'Preaching to the choir. We just went through this exact exercise.', createdAt: '7h', likes: 9 },
    ],
    shareCount: 73,
  },
  {
    id: 'p5',
    authorId: 'u5',
    text: "Quick set from a walk through the old quarter. The light between buildings only lasts about twenty minutes — you learn to move fast and not overthink the composition.",
    images: [
      'https://images.pexels.com/photos/15848630/pexels-photo-15848630.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/30926243/pexels-photo-30926243.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    visibility: 'PUBLIC',
    createdAt: '1d',
    reactions: { like: 320, love: 48, laugh: 2, sad: 0 },
    reactionByMe: null,
    commentCount: 0,
    comments: [],
    shareCount: 22,
  },
];

export const meetings: Meeting[] = [
  {
    id: 'm1',
    title: 'Design Review — Mobile Composer',
    slug: 'design-review-mobile',
    hostId: 'me',
    scheduledAt: 'Started 12 min ago',
    startsInLabel: 'Live now',
    status: 'live',
    participants: 6,
    capacity: 50,
    waitingRoom: true,
    recording: true,
    invitees: 12,
    tags: ['Design', 'Mobile'],
  },
  {
    id: 'm2',
    title: 'WebRTC Fundamentals Workshop',
    slug: 'webrtc-fundamentals',
    hostId: 'u3',
    scheduledAt: 'Thu, Oct 29 · 4:00 PM',
    startsInLabel: 'in 2 days',
    status: 'scheduled',
    participants: 0,
    capacity: 100,
    waitingRoom: false,
    recording: false,
    invitees: 84,
    tags: ['Workshop', 'Engineering'],
  },
  {
    id: 'm3',
    title: 'Weekly Standup',
    slug: 'weekly-standup',
    hostId: 'u2',
    scheduledAt: 'Tomorrow · 9:30 AM',
    startsInLabel: 'in 16 hours',
    status: 'upcoming',
    participants: 0,
    capacity: 25,
    waitingRoom: false,
    recording: false,
    invitees: 9,
    tags: ['Team'],
  },
  {
    id: 'm4',
    title: '1:1 with Maya',
    slug: 'one-on-one-maya',
    hostId: 'me',
    scheduledAt: 'Fri, Oct 30 · 11:00 AM',
    startsInLabel: 'in 3 days',
    status: 'scheduled',
    participants: 0,
    capacity: 2,
    waitingRoom: false,
    recording: false,
    invitees: 2,
    tags: ['1:1'],
  },
  {
    id: 'm5',
    title: 'Quarterly Planning',
    slug: 'quarterly-planning',
    hostId: 'u2',
    scheduledAt: 'Mon, Nov 2 · 2:00 PM',
    startsInLabel: 'in 6 days',
    status: 'scheduled',
    participants: 0,
    capacity: 40,
    waitingRoom: true,
    recording: false,
    invitees: 28,
    tags: ['Planning', 'All-hands'],
  },
];

export const conversations: Conversation[] = [
  {
    id: 'conv1',
    name: 'Maya Chen',
    avatar: users.u1.avatar,
    isGroup: false,
    lastMessage: 'Pushed the presence fix — can you review before merge?',
    lastSender: 'Maya',
    unread: 2,
    online: true,
    messages: [
      { id: 'msg1', authorId: 'u1', text: 'Hey! Got a sec to look at the presence PR?', createdAt: '10:42', mine: false, status: 'read' },
      { id: 'msg2', authorId: 'me', text: 'Yeah, pulling it now. Give me 5 min.', createdAt: '10:43', mine: true, status: 'read' },
      { id: 'msg3', authorId: 'u1', text: 'No rush. The TTL logic is the part I\'m least sure about.', createdAt: '10:44', mine: false, status: 'read' },
      { id: 'msg4', authorId: 'u1', text: 'Pushed the presence fix — can you review before merge?', createdAt: '10:51', mine: false, status: 'delivered' },
    ],
  },
  {
    id: 'conv2',
    name: 'Engineering Team',
    avatar: users.u2.avatar,
    isGroup: true,
    lastMessage: "Jordan: Let's move the infra sync to Thursday.",
    lastSender: 'Jordan',
    unread: 5,
    online: true,
    messages: [
      { id: 'msg5', authorId: 'u2', text: 'Morning team — quick heads up on the deploy window.', createdAt: '09:12', mine: false, status: 'read' },
      { id: 'msg6', authorId: 'u4', text: 'Heard. I\'ll hold the migration until after.', createdAt: '09:14', mine: false, status: 'read' },
      { id: 'msg7', authorId: 'u2', text: 'Let\'s move the infra sync to Thursday.', createdAt: '09:16', mine: false, status: 'delivered' },
    ],
  },
  {
    id: 'conv3',
    name: 'Sam Okafor',
    avatar: users.u3.avatar,
    isGroup: false,
    lastMessage: 'Here\'s the workshop deck — lmk if anything looks off.',
    lastSender: 'Sam',
    unread: 0,
    online: true,
    messages: [
      { id: 'msg8', authorId: 'u3', text: 'Here\'s the workshop deck — lmk if anything looks off.', createdAt: 'Yesterday', mine: false, status: 'read' },
      { id: 'msg9', authorId: 'me', text: 'Looks great. Slide 12 is the star.', createdAt: 'Yesterday', mine: true, status: 'read' },
    ],
  },
  {
    id: 'conv4',
    name: 'Theo Nakamura',
    avatar: users.u5.avatar,
    isGroup: false,
    lastMessage: 'Sending over the sunrise set shortly.',
    lastSender: 'Theo',
    unread: 0,
    online: true,
    messages: [
      { id: 'msg10', authorId: 'u5', text: 'Sending over the sunrise set shortly.', createdAt: '2d', mine: false, status: 'read' },
    ],
  },
];

export const notifications: Notification[] = [
  {
    id: 'n1',
    type: 'meeting',
    actorId: 'u3',
    text: 'invited you to "WebRTC Fundamentals Workshop" — starts in 2 days',
    createdAt: '5m',
    read: false,
  },
  {
    id: 'n2',
    type: 'like',
    actorId: 'u1',
    text: 'and 23 others liked your post about the presence indicator',
    createdAt: '38m',
    read: false,
  },
  {
    id: 'n3',
    type: 'comment',
    actorId: 'u4',
    text: 'commented on your post: "Add a well-tuned index and..."',
    createdAt: '1h',
    read: false,
  },
  {
    id: 'n4',
    type: 'follow',
    actorId: 'u5',
    text: 'started following you',
    createdAt: '3h',
    read: true,
  },
  {
    id: 'n5',
    type: 'message',
    actorId: 'u1',
    text: 'sent you a message: "Pushed the presence fix..."',
    createdAt: '4h',
    read: true,
  },
  {
    id: 'n6',
    type: 'recording',
    actorId: 'me',
    text: 'Recording from "Design Review — Mobile Composer" is ready to share',
    createdAt: '6h',
    read: true,
  },
];

export const suggestedUsers: { id: string; reason: string }[] = [
  { id: 'u3', reason: 'Followed by Maya Chen' },
  { id: 'u2', reason: 'Popular in your network' },
  { id: 'u4', reason: 'Posts about Postgres' },
];
