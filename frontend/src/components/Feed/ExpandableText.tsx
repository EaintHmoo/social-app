import { useLayoutEffect, useRef, useState } from 'react'

const ExpandableText = ({ text, lines = 3 }: { text: string; lines?: number }) => {
  const ref = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const check = () => {
      if (!expanded) setIsTruncated(el.scrollHeight > el.clientHeight + 1)
    }
    check()

    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [text, expanded])

  const toggleClass =
    'font-semibold text-gray-500 hover:text-indigo-600 hover:underline'

  return (
    <div className='relative mt-3 text-sm text-gray-800'>
      <p
        ref={ref}
        className='whitespace-pre-line break-words'
        style={
          expanded
            ? undefined
            : {
                display: '-webkit-box',
                WebkitLineClamp: lines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }
        }
      >
        {text}
        {/* "...less" inline at the end of the full text */}
        {expanded && (
          <>
            {' '}
            <button
              type='button'
              onClick={() => setExpanded(false)}
              aria-expanded={true}
              className={toggleClass}
            >
              …less
            </button>
          </>
        )}
      </p>

      {/* "...more" sits on the last visible line, fading out the text under it */}
      {!expanded && isTruncated && (
        <button
          type='button'
          onClick={() => setExpanded(true)}
          aria-expanded={false}
          className={`absolute bottom-0 right-0 bg-white pl-8 bg-gradient-to-r from-transparent via-white to-white ${toggleClass}`}
          style={{ lineHeight: 'inherit' }}
        >
          …more
        </button>
      )}
    </div>
  )
}

export default ExpandableText